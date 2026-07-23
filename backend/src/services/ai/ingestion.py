"""
Ingestion Service — ingests documents from all trading data sources into the RAG pipeline.
"""
import hashlib
import json
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from src.models.trade import Trade
from src.models.learning import LearningEvent
from src.models.strategy import Strategy
from src.models.replay import ReplaySession
from src.models.research import ResearchSession, ResearchReport
from src.models.planning import TradingPlan, DailyReview
from src.models.risk import RiskSnapshot
from src.models.market_intelligence import EconomicEvent
from src.models.obsidian import ObsidianNote
from src.models.rag_copilot import AIDocumentIngestion, AIDocumentChunk


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:32]


def _now() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


CHUNK_SIZE = 1024
CHUNK_OVERLAP = 64


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks of roughly equal size."""
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break
        sep = text.rfind(" ", start, end)
        if sep > start:
            end = sep
        chunks.append(text[start:end])
        start = end - overlap if end - overlap > start else end
    return chunks


def _format_tags(obj) -> list[str]:
    tags = getattr(obj, "tags", None) or getattr(obj, "frontmatter", None)
    if isinstance(tags, list):
        return [str(t) for t in tags if t]
    if isinstance(tags, dict):
        return [str(v) for v in tags.values() if v]
    return []


def _entity_type(obj) -> str | None:
    return getattr(obj, "entity_type", None)


class IngestionService:
    """Ingest documents from every trading data source into the RAG pipeline."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── trades ──────────────────────────────────────────────────────────

    def ingest_trades(self, project_id: UUID) -> int:
        """Ingest all closed trades for a project. Returns number of new documents."""
        trades = (
            self.db.query(Trade)
            .filter(Trade.project_id == project_id, Trade.status == "closed")
            .all()
        )
        count = 0
        for t in trades:
            if self._already_ingested("trade", t.id, t.notes or t.pair or ""):
                continue
            title = f"Trade {t.pair or '?'} {t.direction or ''} PnL:{t.pnl or '?'}"
            lines = [
                f"Pair: {t.pair or ''}",
                f"Direction: {t.direction or ''}",
                f"Entry: {t.entry_price or ''}  Exit: {t.exit_price or ''}",
                f"Stop Loss: {t.stop_loss or ''}  Take Profit: {t.take_profit or ''}",
                f"Position Size: {t.position_size or ''}  Risk%: {t.risk_percent or ''}",
                f"R:R: {t.rr or ''}  PnL: {t.pnl or ''}  Result: {t.result or ''}",
                f"Weekly Bias: {t.weekly_bias or ''}  Daily Bias: {t.daily_bias or ''}  H4 Bias: {t.h4_bias or ''}",
                f"Liquidity Sweep: {t.liquidity_sweep or ''}  BOS: {t.bos or ''}  MSS: {t.mss or ''}",
                f"Order Block: {t.order_block or ''}  FVG: {t.fvg or ''}",
                f"Asian: {t.asian_session or ''}  London: {t.london_session or ''}  NY: {t.newyork_session or ''}",
                f"DXY: {t.dxy or ''}  US10Y: {t.us10y or ''}  US02Y: {t.us02y or ''}",
                f"News: {t.news_event or ''}  Emotion: {t.emotion or ''}",
            ]
            if t.notes:
                lines.append(f"Notes: {t.notes}")
            body = "\n".join(lines)
            created_date = t.created_at.strftime("%Y-%m-%d") if t.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="trade",
                source_id=t.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=[],
                entity_type="trade",
            )
            count += 1
        self.db.commit()
        return count

    # ── journal / learning ─────────────────────────────────────────────

    def ingest_journal(self, project_id: UUID) -> int:
        """Ingest learning/journal entries."""
        events = (
            self.db.query(LearningEvent)
            .filter(LearningEvent.project_id == project_id)
            .all()
        )
        count = 0
        for e in events:
            if self._already_ingested("journal", e.id, e.summary or e.event_type):
                continue
            title = f"Learning: {e.event_type} ({e.status})"
            lines = [
                f"Event Type: {e.event_type}",
                f"Status: {e.status}",
                f"Duration (ms): {e.duration_ms or ''}",
            ]
            if e.summary:
                lines.append(f"Summary: {e.summary}")
            if e.metadata_json:
                lines.append(f"Metadata: {json.dumps(e.metadata_json, default=str)}")
            body = "\n".join(lines)
            created_date = e.created_at.strftime("%Y-%m-%d") if e.created_at else _now()
            tags = [e.event_type] if e.event_type else []
            if e.entity_type:
                tags.append(e.entity_type)
            self._create_document(
                project_id=project_id,
                source_type="journal",
                source_id=e.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=tags,
                entity_type=e.entity_type,
            )
            count += 1
        self.db.commit()
        return count

    # ── strategies ─────────────────────────────────────────────────────

    def ingest_strategies(self, project_id: UUID) -> int:
        """Ingest strategy documents."""
        strategies = (
            self.db.query(Strategy)
            .filter(Strategy.project_id == project_id)
            .all()
        )
        count = 0
        for s in strategies:
            if self._already_ingested("strategy", s.id, s.name or s.description or ""):
                continue
            title = f"Strategy: {s.name or 'Untitled'} v{s.version or '1.0.0'}"
            lines = [
                f"Name: {s.name or ''}",
                f"Category: {s.category or ''}",
                f"Market: {s.market or ''}",
                f"Status: {s.status or ''}",
                f"Description: {s.description or ''}",
                f"Market Bias: {s.market_bias or ''}",
                f"Entry Conditions: {json.dumps(s.entry_conditions, default=str) if s.entry_conditions else ''}",
                f"Confirmation Rules: {json.dumps(s.confirmation_rules, default=str) if s.confirmation_rules else ''}",
                f"Invalidation Rules: {json.dumps(s.invalidation_rules, default=str) if s.invalidation_rules else ''}",
                f"Exit Rules: {json.dumps(s.exit_rules, default=str) if s.exit_rules else ''}",
                f"Risk Rules: {json.dumps(s.risk_rules, default=str) if s.risk_rules else ''}",
                f"Entry Model: {s.entry_model or ''}",
                f"Stop Loss Model: {s.stop_loss_model or ''}",
                f"Take Profit Model: {s.take_profit_model or ''}",
                f"Preferred Sessions: {json.dumps(s.preferred_sessions, default=str) if s.preferred_sessions else ''}",
                f"Preferred Market Conditions: {s.preferred_market_conditions or ''}",
                f"Volatility Requirements: {s.volatility_requirements or ''}",
                f"News Restrictions: {s.news_restrictions or ''}",
                f"Required Mindset: {s.required_mindset or ''}",
                f"Common Mistakes: {json.dumps(s.common_mistakes, default=str) if s.common_mistakes else ''}",
                f"Things to Avoid: {json.dumps(s.things_to_avoid, default=str) if s.things_to_avoid else ''}",
                f"Documentation: {s.documentation or ''}",
            ]
            body = "\n".join(lines)
            created_date = s.created_at.strftime("%Y-%m-%d") if s.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="strategy",
                source_id=s.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=_format_tags(s),
                entity_type="strategy",
            )
            count += 1
        self.db.commit()
        return count

    # ── replay notes ───────────────────────────────────────────────────

    def ingest_replay_notes(self, project_id: UUID) -> int:
        """Ingest replay session notes and reviews."""
        sessions = (
            self.db.query(ReplaySession)
            .filter(ReplaySession.project_id == project_id)
            .all()
        )
        count = 0
        for rs in sessions:
            lines = [
                f"Pair: {rs.pair}  Timeframe: {rs.timeframe}",
                f"Period: {rs.start_date.strftime('%Y-%m-%d') if rs.start_date else ''} to {rs.end_date.strftime('%Y-%m-%d') if rs.end_date else ''}",
                f"Status: {rs.status}  Candles: {rs.current_candle}/{rs.total_candles}",
            ]
            if rs.notes:
                lines.append(f"Session Notes: {rs.notes}")
            if rs.review:
                rv = rs.review
                lines.append("--- Review ---")
                if rv.went_well:
                    lines.append(f"Went Well: {rv.went_well}")
                if rv.went_wrong:
                    lines.append(f"Went Wrong: {rv.went_wrong}")
                if rv.rule_violations:
                    lines.append(f"Rule Violations: {rv.rule_violations}")
                if rv.execution_quality:
                    lines.append(f"Execution Quality: {rv.execution_quality}")
                if rv.risk_management:
                    lines.append(f"Risk Management: {rv.risk_management}")
                if rv.psychology:
                    lines.append(f"Psychology: {rv.psychology}")
                if rv.trade_grade:
                    lines.append(f"Trade Grade: {rv.trade_grade}")
                if rv.discipline_score is not None:
                    lines.append(f"Discipline Score: {rv.discipline_score}")
                if rv.confidence_score is not None:
                    lines.append(f"Confidence: {rv.confidence_score}")
                if rv.rule_compliance is not None:
                    lines.append(f"Rule Compliance: {rv.rule_compliance}")
            if rs.mistakes:
                lines.append("--- Mistakes ---")
                for m in rs.mistakes:
                    lines.append(f"  [{m.severity or 'info'}] {m.mistake_type or ''}: {m.description or ''}")
                    if m.recommendation:
                        lines.append(f"    Recommendation: {m.recommendation}")
            labels = [f"Replay {rs.pair} ({rs.timeframe})"]
            if rs.status:
                labels.append(rs.status)
            title = " | ".join(labels)
            body = "\n".join(lines)
            if self._already_ingested("replay", rs.id, body):
                continue
            created_date = rs.created_at.strftime("%Y-%m-%d") if rs.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="replay",
                source_id=rs.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=[rs.pair, rs.timeframe],
                entity_type="replay_session",
            )
            count += 1
        self.db.commit()
        return count

    # ── research ───────────────────────────────────────────────────────

    def ingest_research(self, project_id: UUID) -> int:
        """Ingest research sessions and their reports."""
        sessions = (
            self.db.query(ResearchSession)
            .filter(ResearchSession.project_id == project_id)
            .all()
        )
        count = 0
        for r in sessions:
            report = r.report
            lines = [
                f"Question: {r.question}",
                f"Status: {r.status}",
            ]
            if report:
                lines.append(f"--- Report ---")
                lines.append(f"Summary: {report.summary}")
                if report.findings:
                    lines.append(f"Findings: {json.dumps(report.findings, default=str)}")
                if report.recommendations:
                    lines.append(f"Recommendations: {json.dumps(report.recommendations, default=str)}")
                if report.limitations:
                    lines.append(f"Limitations: {json.dumps(report.limitations, default=str)}")
                if report.confidence is not None:
                    lines.append(f"Confidence: {report.confidence}")
            body = "\n".join(lines)
            title = f"Research: {r.question[:120]}"
            if self._already_ingested("research", r.id, body):
                continue
            created_date = r.created_at.strftime("%Y-%m-%d") if r.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="research",
                source_id=r.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=[],
                entity_type="research_session",
            )
            count += 1
            if report:
                report_body = report.summary
                if report.findings:
                    report_body += "\n\n" + json.dumps(report.findings, default=str)
                if report.recommendations:
                    report_body += "\n\n" + json.dumps(report.recommendations, default=str)
                if self._already_ingested("research", report.id, report_body):
                    continue
                self._create_document(
                    project_id=project_id,
                    source_type="research",
                    source_id=report.id,
                    title=f"Research Report: {r.question[:100]}",
                    body=report_body,
                    created_date=created_date,
                    tags=["report"],
                    entity_type="research_report",
                )
                count += 1
        self.db.commit()
        return count

    # ── planning ───────────────────────────────────────────────────────

    def ingest_planning(self, project_id: UUID) -> int:
        """Ingest trading plans and daily reviews."""
        count = 0
        plans = (
            self.db.query(TradingPlan)
            .filter(TradingPlan.project_id == project_id)
            .all()
        )
        for p in plans:
            lines = [
                f"Plan Date: {p.plan_date}  Type: {p.plan_type}",
                f"Market Bias: {p.market_bias or ''}",
                f"Watchlist: {json.dumps(p.watchlist, default=str) if p.watchlist else ''}",
                f"Pairs to Avoid: {json.dumps(p.pairs_to_avoid, default=str) if p.pairs_to_avoid else ''}",
                f"Key Levels: {json.dumps(p.key_levels, default=str) if p.key_levels else ''}",
                f"Liquidity Areas: {json.dumps(p.liquidity_areas, default=str) if p.liquidity_areas else ''}",
                f"Expected Scenarios: {json.dumps(p.expected_scenarios, default=str) if p.expected_scenarios else ''}",
                f"Invalidation Levels: {json.dumps(p.invalidation_levels, default=str) if p.invalidation_levels else ''}",
                f"Session Goals: {json.dumps(p.session_goals, default=str) if p.session_goals else ''}",
                f"Risk Allocation: {json.dumps(p.risk_allocation, default=str) if p.risk_allocation else ''}",
                f"Status: {p.status}  Completed: {p.is_completed}",
            ]
            if p.notes:
                lines.append(f"Notes: {p.notes}")
            body = "\n".join(lines)
            title = f"Plan {p.plan_type} {p.plan_date}"
            if self._already_ingested("planning", p.id, body):
                continue
            created_date = p.created_at.strftime("%Y-%m-%d") if p.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="planning",
                source_id=p.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=[p.plan_type, p.status],
                entity_type="trading_plan",
            )
            count += 1
        reviews = (
            self.db.query(DailyReview)
            .filter(DailyReview.project_id == project_id)
            .all()
        )
        for r in reviews:
            lines = [
                f"Review Date: {r.review_date}",
                f"Daily Summary: {r.daily_summary or ''}",
                f"Best Trade: {r.best_trade or ''}",
                f"Worst Trade: {r.worst_trade or ''}",
                f"Mistakes: {json.dumps(r.mistakes, default=str) if r.mistakes else ''}",
                f"Lessons: {json.dumps(r.lessons, default=str) if r.lessons else ''}",
                f"Next Improvements: {json.dumps(r.next_improvements, default=str) if r.next_improvements else ''}",
                f"Discipline: {r.discipline_score or ''}  Adherence: {r.adherence_to_plan or ''}",
                f"Psychology: {r.psychology_rating or ''}  Overall: {r.overall_rating or ''}",
            ]
            body = "\n".join(lines)
            title = f"Daily Review {r.review_date}"
            if self._already_ingested("planning", r.id, body):
                continue
            created_date = r.created_at.strftime("%Y-%m-%d") if r.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="planning",
                source_id=r.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=["daily_review"],
                entity_type="daily_review",
            )
            count += 1
        self.db.commit()
        return count

    # ── risk reports ───────────────────────────────────────────────────

    def ingest_risk_reports(self, project_id: UUID) -> int:
        """Ingest risk snapshots as reports."""
        snapshots = (
            self.db.query(RiskSnapshot)
            .filter(RiskSnapshot.project_id == project_id)
            .all()
        )
        count = 0
        for r in snapshots:
            lines = [
                f"Account Balance: {r.account_balance}",
                f"Equity: {r.equity}",
                f"Daily PnL: {r.daily_pnl}  Weekly PnL: {r.weekly_pnl}  Monthly PnL: {r.monthly_pnl}",
                f"Current Risk%: {r.current_risk_percent}",
                f"Open Risk: {r.open_risk}  Closed Risk: {r.closed_risk}",
                f"Available Risk: {r.available_risk}  Daily Risk Remaining: {r.daily_risk_remaining}",
                f"Max Drawdown: {r.max_drawdown}  Current Drawdown: {r.current_drawdown}",
                f"Recovery Progress: {r.recovery_progress}",
                f"Open Positions: {r.open_positions}  Total Exposure: {r.total_exposure}",
            ]
            if r.exposure_json:
                lines.append(f"Exposure Breakdown: {json.dumps(r.exposure_json, default=str)}")
            body = "\n".join(lines)
            title = f"Risk Snapshot {r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else ''}"
            if self._already_ingested("risk_report", r.id, body):
                continue
            created_date = r.created_at.strftime("%Y-%m-%d") if r.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="risk_report",
                source_id=r.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=["risk_snapshot"],
                entity_type="risk_snapshot",
            )
            count += 1
        self.db.commit()
        return count

    # ── market reports (economic events) ───────────────────────────────

    def ingest_market_reports(self, project_id: UUID) -> int:
        """Ingest economic calendar events as market intelligence."""
        events = (
            self.db.query(EconomicEvent)
            .filter(EconomicEvent.project_id == project_id)
            .all()
        )
        count = 0
        for e in events:
            lines = [
                f"Event: {e.event_name}",
                f"Date: {e.event_date}  Time: {e.event_time or ''}",
                f"Country: {e.country}  Currency: {e.currency}",
                f"Impact: {e.impact}  Category: {e.category or ''}",
                f"Previous: {e.previous_value or ''}  Forecast: {e.forecast_value or ''}  Actual: {e.actual_value or ''}",
            ]
            if e.description:
                lines.append(f"Description: {e.description}")
            body = "\n".join(lines)
            title = f"Economic: {e.event_name} ({e.country})"
            if self._already_ingested("market_report", e.id, body):
                continue
            created_date = e.event_date
            self._create_document(
                project_id=project_id,
                source_type="market_report",
                source_id=e.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=[e.impact, e.country, e.category or ""],
                entity_type="economic_event",
            )
            count += 1
        self.db.commit()
        return count

    # ── obsidian notes ─────────────────────────────────────────────────

    def ingest_obsidian(self, project_id: UUID) -> int:
        """Ingest Obsidian notes."""
        notes = (
            self.db.query(ObsidianNote)
            .filter(ObsidianNote.project_id == project_id, ObsidianNote.is_deleted == False)
            .all()
        )
        count = 0
        for n in notes:
            body_parts = []
            if n.content:
                body_parts.append(n.content)
            if n.frontmatter:
                body_parts.append(f"Frontmatter: {json.dumps(n.frontmatter, default=str)}")
            if n.headings:
                body_parts.append(f"Headings: {json.dumps([h.get('text') for h in n.headings if isinstance(h, dict)], default=str)}")
            if n.keywords:
                body_parts.append(f"Keywords: {', '.join(str(k) for k in n.keywords)}")
            if n.concepts:
                body_parts.append(f"Concepts: {', '.join(str(c) for c in n.concepts)}")
            if n.referenced_entities:
                body_parts.append(f"Referenced Entities: {json.dumps(n.referenced_entities, default=str)}")
            body = "\n\n".join(body_parts) if body_parts else ""
            if not body:
                continue
            title = n.title or n.file_name
            if self._already_ingested("obsidian", n.id, body):
                continue
            created_date = n.created_at.strftime("%Y-%m-%d") if n.created_at else _now()
            self._create_document(
                project_id=project_id,
                source_type="obsidian",
                source_id=n.id,
                title=title,
                body=body,
                created_date=created_date,
                tags=(n.tags if n.tags else []) + ([n.note_type] if n.note_type else []),
                entity_type=n.note_type or "obsidian_note",
            )
            count += 1
        self.db.commit()
        return count

    # ── ingest all ─────────────────────────────────────────────────────

    def ingest_all(self, project_id: UUID) -> dict[str, int]:
        """Ingest everything. Returns dict of source_type -> count."""
        results: dict[str, int] = {}
        results["trades"] = self.ingest_trades(project_id)
        results["journal"] = self.ingest_journal(project_id)
        results["strategies"] = self.ingest_strategies(project_id)
        results["replay_notes"] = self.ingest_replay_notes(project_id)
        results["research"] = self.ingest_research(project_id)
        results["planning"] = self.ingest_planning(project_id)
        results["risk_reports"] = self.ingest_risk_reports(project_id)
        results["market_reports"] = self.ingest_market_reports(project_id)
        results["obsidian"] = self.ingest_obsidian(project_id)
        return results

    # ── internal helpers ───────────────────────────────────────────────

    def _already_ingested(self, source_type: str, source_id: UUID, content: str) -> bool:
        """Return True if a document with this source_type, source_id, and content_hash exists."""
        h = _content_hash(content)
        return bool(
            self.db.query(AIDocumentIngestion.id)
            .filter(
                AIDocumentIngestion.source_type == source_type,
                AIDocumentIngestion.source_id == source_id,
                AIDocumentIngestion.content_hash == h,
            )
            .first()
        )

    def _create_document(
        self,
        *,
        project_id: UUID,
        source_type: str,
        source_id: UUID,
        title: str,
        body: str,
        created_date: str,
        tags: list[str],
        entity_type: str | None,
    ) -> None:
        """Create an AIDocumentIngestion and its AIDocumentChunk children."""
        h = _content_hash(body)
        chunks = chunk_text(body)
        ingestion = AIDocumentIngestion(
            project_id=project_id,
            source_type=source_type,
            source_id=source_id,
            title=title,
            content_hash=h,
            chunk_count=len(chunks),
            status="completed",
            metadata_json={
                "created_date": created_date,
                "tags": tags,
                "entity_type": entity_type,
                "ingested_at": _now(),
            },
        )
        self.db.add(ingestion)
        self.db.flush()
        for idx, chunk_text_content in enumerate(chunks):
            chunk = AIDocumentChunk(
                project_id=project_id,
                ingestion_id=ingestion.id,
                source_type=source_type,
                source_id=source_id,
                chunk_index=idx,
                content=chunk_text_content,
                content_tokens=len(chunk_text_content.split()),
                document_title=title,
                created_date=created_date,
                tags=tags,
                entity_type=entity_type,
                entity_id=str(source_id),
            )
            self.db.add(chunk)

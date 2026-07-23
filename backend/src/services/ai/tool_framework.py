"""Extensible tool-calling framework for the trading copilot.

Each tool is a self-contained capability that the AI agents can invoke
to query data, run analytics, or generate content. New tools are added
by subclassing BaseTool and registering with the ToolRegistry singleton.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.orm import Session

from src.models.trade import Trade
from src.models.learning import LearningEvent
from src.models.research import ResearchSession, ResearchReport
from src.models.obsidian import ObsidianNote
from src.models.knowledge_graph import KnowledgeNode, KnowledgeEdge
from src.services.ai.context_builder import build_context as build_rag_context
from src.services.statistics import get_statistics_overview

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Base Tool
# ---------------------------------------------------------------------------

class BaseTool(ABC):
    """Abstract base for all tools callable by the AI agent."""

    name: str
    description: str
    parameters: dict

    @abstractmethod
    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        """Execute the tool with the given parameters and return a result dict.

        Implementations MUST catch all exceptions and return
        ``{"error": "<message>"}`` on failure.
        """
        ...


# ---------------------------------------------------------------------------
# Tool Registry (Singleton)
# ---------------------------------------------------------------------------

class ToolRegistry:
    """Singleton registry that maps tool names to tool instances."""

    _instance: ToolRegistry | None = None
    _tools: dict[str, BaseTool] = {}

    def __new__(cls) -> ToolRegistry:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._tools = {}
        return cls._instance

    @classmethod
    def register(cls, tool: BaseTool) -> None:
        """Register a tool instance by its ``.name``."""
        if not tool.name:
            raise ValueError("Tool must have a non-empty name")
        cls._instance._tools[tool.name] = tool
        logger.info("Tool registered: %s", tool.name)

    @classmethod
    def get(cls, name: str) -> BaseTool:
        """Retrieve a tool by name, or raise ``KeyError``."""
        if name not in cls._instance._tools:
            raise KeyError(f"Unknown tool '{name}'. Available: {sorted(cls._instance._tools)}")
        return cls._instance._tools[name]

    @classmethod
    def list_tools(cls) -> list[dict[str, Any]]:
        """Return metadata for every registered tool."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
            for tool in cls._instance._tools.values()
        ]

    @classmethod
    async def execute(
        cls,
        name: str,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        """Look up and execute a tool by name."""
        tool = cls.get(name)
        return await tool.execute(project_id, params, db)


# ---------------------------------------------------------------------------
# Concrete Tools
# ---------------------------------------------------------------------------

class SearchTrades(BaseTool):
    """Search trades by optional filters (pair, date range, result, direction)."""

    name = "search_trades"
    description = "Search trades with optional filters: pair, date range, result, direction."
    parameters: dict = {
        "type": "object",
        "properties": {
            "pair": {"type": "string", "description": "Currency pair filter (e.g. EURUSD)"},
            "result": {"type": "string", "enum": ["WIN", "LOSS", "BE", None], "description": "Trade result filter"},
            "direction": {"type": "string", "enum": ["LONG", "SHORT", None], "description": "Trade direction"},
            "start_date": {"type": "string", "format": "date-time", "description": "ISO 8601 start date"},
            "end_date": {"type": "string", "format": "date-time", "description": "ISO 8601 end date"},
            "limit": {"type": "integer", "default": 50, "description": "Max results to return"},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            stmt = select(Trade).where(Trade.project_id == project_id)

            if pair := params.get("pair"):
                stmt = stmt.where(Trade.pair.ilike(f"%{pair}%"))
            if result := params.get("result"):
                stmt = stmt.where(Trade.result == result.upper())
            if direction := params.get("direction"):
                stmt = stmt.where(Trade.direction == direction.upper())
            if start := params.get("start_date"):
                stmt = stmt.where(Trade.created_at >= datetime.fromisoformat(start))
            if end := params.get("end_date"):
                stmt = stmt.where(Trade.created_at <= datetime.fromisoformat(end))

            limit = params.get("limit", 50)
            stmt = stmt.order_by(Trade.created_at.desc()).limit(limit)

            trades = db.scalars(stmt).all()
            return {
                "tool": self.name,
                "count": len(trades),
                "trades": [
                    {
                        "id": str(t.id),
                        "pair": t.pair,
                        "direction": t.direction,
                        "entry_price": t.entry_price,
                        "exit_price": t.exit_price,
                        "pnl": t.pnl,
                        "rr": t.rr,
                        "result": t.result,
                        "status": t.status,
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in trades
                ],
            }
        except Exception as exc:
            logger.exception("SearchTrades failed")
            return {"error": str(exc)}


class SearchJournal(BaseTool):
    """Search learning / journal entries (LearningEvent model)."""

    name = "search_journal"
    description = "Search journal / learning events by event type, status, or date range."
    parameters: dict = {
        "type": "object",
        "properties": {
            "event_type": {"type": "string", "description": "Filter by event type (e.g. trade_review, pattern_analysis)"},
            "status": {"type": "string", "description": "Filter by event status (e.g. SUCCESS, FAILED)"},
            "start_date": {"type": "string", "format": "date-time"},
            "end_date": {"type": "string", "format": "date-time"},
            "limit": {"type": "integer", "default": 50},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            stmt = select(LearningEvent).where(LearningEvent.project_id == project_id)

            if event_type := params.get("event_type"):
                stmt = stmt.where(LearningEvent.event_type == event_type)
            if status := params.get("status"):
                stmt = stmt.where(LearningEvent.status == status.upper())
            if start := params.get("start_date"):
                stmt = stmt.where(LearningEvent.created_at >= datetime.fromisoformat(start))
            if end := params.get("end_date"):
                stmt = stmt.where(LearningEvent.created_at <= datetime.fromisoformat(end))

            limit = params.get("limit", 50)
            stmt = stmt.order_by(LearningEvent.created_at.desc()).limit(limit)

            events = db.scalars(stmt).all()
            return {
                "tool": self.name,
                "count": len(events),
                "events": [
                    {
                        "id": str(e.id),
                        "event_type": e.event_type,
                        "entity_type": e.entity_type,
                        "status": e.status,
                        "summary": e.summary,
                        "duration_ms": e.duration_ms,
                        "created_at": e.created_at.isoformat() if e.created_at else None,
                    }
                    for e in events
                ],
            }
        except Exception as exc:
            logger.exception("SearchJournal failed")
            return {"error": str(exc)}


class SearchResearch(BaseTool):
    """Search research sessions and reports."""

    name = "search_research"
    description = "Search research sessions and reports by question, status, or date."
    parameters: dict = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Full-text search against the research question"},
            "status": {"type": "string", "description": "Filter by session status"},
            "start_date": {"type": "string", "format": "date-time"},
            "end_date": {"type": "string", "format": "date-time"},
            "limit": {"type": "integer", "default": 20},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            stmt = select(ResearchSession).where(ResearchSession.project_id == project_id)

            if query := params.get("query"):
                stmt = stmt.where(ResearchSession.question.ilike(f"%{query}%"))
            if status := params.get("status"):
                stmt = stmt.where(ResearchSession.status == status)
            if start := params.get("start_date"):
                stmt = stmt.where(ResearchSession.created_at >= datetime.fromisoformat(start))
            if end := params.get("end_date"):
                stmt = stmt.where(ResearchSession.created_at <= datetime.fromisoformat(end))

            limit = params.get("limit", 20)
            stmt = stmt.order_by(ResearchSession.created_at.desc()).limit(limit)

            sessions = db.scalars(stmt).all()
            results = []
            for s in sessions:
                report = None
                if s.report:
                    report = {
                        "summary": s.report.summary,
                        "confidence": s.report.confidence,
                        "findings": s.report.findings,
                        "recommendations": s.report.recommendations,
                    }
                results.append({
                    "id": str(s.id),
                    "question": s.question,
                    "status": s.status,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                    "report": report,
                })

            return {"tool": self.name, "count": len(results), "sessions": results}
        except Exception as exc:
            logger.exception("SearchResearch failed")
            return {"error": str(exc)}


class SearchObsidian(BaseTool):
    """Search Obsidian notes by title, content, or tags."""

    name = "search_obsidian"
    description = "Search Obsidian notes by title, content, tags, or file path."
    parameters: dict = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search term for title or content"},
            "tag": {"type": "string", "description": "Filter by tag"},
            "note_type": {"type": "string", "description": "Filter by note type (e.g. trade_review, journal)"},
            "limit": {"type": "integer", "default": 20},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            stmt = select(ObsidianNote).where(ObsidianNote.project_id == project_id)

            if query := params.get("query"):
                stmt = stmt.where(
                    ObsidianNote.title.ilike(f"%{query}%")
                    | ObsidianNote.content.ilike(f"%{query}%")
                )
            if tag := params.get("tag"):
                stmt = stmt.where(ObsidianNote.tags.any(tag))
            if note_type := params.get("note_type"):
                stmt = stmt.where(ObsidianNote.note_type == note_type)

            limit = params.get("limit", 20)
            stmt = stmt.order_by(ObsidianNote.updated_at.desc()).limit(limit)

            notes = db.scalars(stmt).all()
            return {
                "tool": self.name,
                "count": len(notes),
                "notes": [
                    {
                        "id": str(n.id),
                        "title": n.title,
                        "file_path": n.file_path,
                        "note_type": n.note_type,
                        "tags": n.tags,
                        "synced_at": n.updated_at.isoformat() if n.updated_at else None,
                    }
                    for n in notes
                ],
            }
        except Exception as exc:
            logger.exception("SearchObsidian failed")
            return {"error": str(exc)}


class RunAnalytics(BaseTool):
    """Run analytical queries — win rate, P&L, risk metrics, etc."""

    name = "run_analytics"
    description = "Compute trading analytics: win rate, P&L, risk metrics, and breakdowns by pair/direction."
    parameters: dict = {
        "type": "object",
        "properties": {
            "metric": {
                "type": "string",
                "enum": ["overview", "by_pair", "by_direction", "by_result", "equity_curve", "risk"],
                "default": "overview",
                "description": "Which analytics metric to compute",
            },
            "start_date": {"type": "string", "format": "date-time"},
            "end_date": {"type": "string", "format": "date-time"},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            start_date = None
            end_date = None
            if s := params.get("start_date"):
                start_date = datetime.fromisoformat(s)
            if e := params.get("end_date"):
                end_date = datetime.fromisoformat(e)

            stats = get_statistics_overview(db, project_id, start_date, end_date)

            metric = params.get("metric", "overview")
            overview = stats.get("overview", {})

            if metric == "overview":
                return {"tool": self.name, "metric": "overview", "data": overview}
            elif metric == "by_pair":
                return {"tool": self.name, "metric": "by_pair", "data": stats.get("by_pair", [])}
            elif metric == "by_direction":
                return {"tool": self.name, "metric": "by_direction", "data": stats.get("by_direction", [])}
            elif metric == "by_result":
                return {"tool": self.name, "metric": "by_result", "data": stats.get("by_result", {})}
            elif metric == "equity_curve":
                return {"tool": self.name, "metric": "equity_curve", "data": stats.get("equity_curve", [])}
            elif metric == "risk":
                return {"tool": self.name, "metric": "risk", "data": stats.get("risk", {})}
            else:
                return {"tool": self.name, "error": f"Unknown metric '{metric}'"}
        except Exception as exc:
            logger.exception("RunAnalytics failed")
            return {"error": str(exc)}


class GenerateReport(BaseTool):
    """Generate a text report from structured data — used for summarization."""

    name = "generate_report"
    description = "Generate a plain-text summary report from structured trading data."
    parameters: dict = {
        "type": "object",
        "properties": {
            "report_type": {
                "type": "string",
                "enum": ["performance_summary", "risk_review", "learning_review", "market_brief"],
                "description": "Type of report to generate",
            },
            "start_date": {"type": "string", "format": "date-time"},
            "end_date": {"type": "string", "format": "date-time"},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            start_date = None
            end_date = None
            if s := params.get("start_date"):
                start_date = datetime.fromisoformat(s)
            if e := params.get("end_date"):
                end_date = datetime.fromisoformat(e)

            stats = get_statistics_overview(db, project_id, start_date, end_date)
            overview = stats.get("overview", {})
            risk = stats.get("risk", {})
            report_type = params.get("report_type", "performance_summary")

            lines: list[str] = []
            if report_type == "performance_summary":
                lines.append("=== Performance Summary ===")
                lines.append(f"Period: {start_date or 'N/A'} to {end_date or 'N/A'}")
                lines.append(f"Total Trades: {overview.get('total_trades', 0)}")
                lines.append(f"Closed Trades: {overview.get('closed_count', 0)}")
                lines.append(f"Win Rate: {overview.get('win_rate', 0):.1f}%")
                lines.append(f"Avg R:R: {overview.get('avg_rr', 0):.2f}")
                lines.append(f"Total P&L: {overview.get('total_pnl', 0):.2f}")
                lines.append(f"Expectancy: {overview.get('expectancy', 0):.2f}")
                lines.append(f"Profit Factor: {risk.get('profit_factor', 0):.2f}")
                lines.append(f"Max Drawdown: {risk.get('max_drawdown', 0):.2f}")

            elif report_type == "risk_review":
                lines.append("=== Risk Review ===")
                lines.append(f"Max Drawdown: {risk.get('max_drawdown', 0):.2f}")
                lines.append(f"Sharpe Ratio: {risk.get('sharpe_ratio', 0):.2f}")
                lines.append(f"Recovery Factor: {risk.get('recovery_factor', 0):.2f}")
                lines.append(f"Profit Factor: {risk.get('profit_factor', 0):.2f}")
                lines.append(f"Open Positions: {overview.get('open_count', 0)}")

            elif report_type == "learning_review":
                events = db.scalars(
                    select(LearningEvent)
                    .where(LearningEvent.project_id == project_id)
                    .order_by(LearningEvent.created_at.desc())
                    .limit(20)
                ).all()
                lines.append("=== Learning Review ===")
                for e in events:
                    lines.append(f"  [{e.status}] {e.event_type}: {e.summary or 'N/A'}")

            elif report_type == "market_brief":
                lines.append("=== Market Brief ===")
                lines.append("Market brief generation requires macro data integration.")

            return {
                "tool": self.name,
                "report_type": report_type,
                "report": "\n".join(lines),
            }
        except Exception as exc:
            logger.exception("GenerateReport failed")
            return {"error": str(exc)}


class GetContext(BaseTool):
    """Gather full trading context and build a structured prompt for the LLM."""

    name = "get_context"
    description = "Gather full trading context (trades, stats, patterns, knowledge) for the LLM prompt."
    parameters: dict = {
        "type": "object",
        "properties": {
            "question": {"type": "string", "description": "The user's question to contextualize against"},
            "include_stats": {"type": "boolean", "default": True},
            "include_learning": {"type": "boolean", "default": True},
            "include_knowledge_graph": {"type": "boolean", "default": True},
            "trade_limit": {"type": "integer", "default": 10},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            question = params.get("question", "")
            evidence: dict[str, Any] = {}

            if params.get("include_stats", True):
                stats = get_statistics_overview(db, project_id)
                evidence["statistics"] = stats

            if params.get("include_learning", True):
                events = db.scalars(
                    select(LearningEvent)
                    .where(LearningEvent.project_id == project_id)
                    .order_by(LearningEvent.created_at.desc())
                    .limit(20)
                ).all()
                evidence["learning"] = {
                    "events": [
                        {
                            "event_type": e.event_type,
                            "status": e.status,
                            "summary": e.summary,
                        }
                        for e in events
                    ],
                }

            if params.get("include_knowledge_graph", True):
                node_count = db.scalar(
                    select(func.count(KnowledgeNode.id)).where(KnowledgeNode.project_id == project_id)
                )
                edge_count = db.scalar(
                    select(func.count(KnowledgeEdge.id)).where(KnowledgeEdge.project_id == project_id)
                )
                evidence["knowledge_graph"] = {
                    "total_nodes": node_count or 0,
                    "total_edges": edge_count or 0,
                }

            trade_limit = params.get("trade_limit", 10)
            recent_trades = db.scalars(
                select(Trade)
                .where(Trade.project_id == project_id)
                .order_by(Trade.created_at.desc())
                .limit(trade_limit)
            ).all()
            evidence["recent_trades"] = [
                {
                    "id": str(t.id),
                    "pair": t.pair,
                    "direction": t.direction,
                    "pnl": t.pnl,
                    "rr": t.rr,
                    "result": t.result,
                    "status": t.status,
                }
                for t in recent_trades
            ]

            context = build_rag_context(evidence, question)
            return {
                "tool": self.name,
                "context": context,
                "evidence_sources": list(evidence.keys()),
            }
        except Exception as exc:
            logger.exception("GetContext failed")
            return {"error": str(exc)}


class SearchKnowledge(BaseTool):
    """Search the knowledge graph (nodes and edges) by name, type, or relationship."""

    name = "search_knowledge"
    description = "Search knowledge graph nodes and edges by name, type, category, or relationship."
    parameters: dict = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search term for node name"},
            "type": {"type": "string", "description": "Filter by node type (e.g. concept, strategy, pattern)"},
            "category": {"type": "string", "description": "Filter by node category"},
            "relationship": {"type": "string", "description": "Filter edges by relationship type"},
            "limit": {"type": "integer", "default": 30},
        },
    }

    async def execute(
        self,
        project_id: UUID,
        params: dict[str, Any],
        db: Session,
    ) -> dict[str, Any]:
        try:
            node_stmt = select(KnowledgeNode).where(KnowledgeNode.project_id == project_id)

            if query := params.get("query"):
                node_stmt = node_stmt.where(KnowledgeNode.name.ilike(f"%{query}%"))
            if node_type := params.get("type"):
                node_stmt = node_stmt.where(KnowledgeNode.type == node_type)
            if category := params.get("category"):
                node_stmt = node_stmt.where(KnowledgeNode.category == category)

            limit = params.get("limit", 30)
            node_stmt = node_stmt.order_by(KnowledgeNode.occurrences.desc()).limit(limit)
            nodes = db.scalars(node_stmt).all()

            edge_stmt = select(KnowledgeEdge).where(KnowledgeEdge.project_id == project_id)
            if rel := params.get("relationship"):
                edge_stmt = edge_stmt.where(KnowledgeEdge.relationship == rel)
            edge_stmt = edge_stmt.order_by(KnowledgeEdge.strength.desc().nullslast()).limit(limit)
            edges = db.scalars(edge_stmt).all()

            return {
                "tool": self.name,
                "nodes": [
                    {
                        "id": str(n.id),
                        "name": n.name,
                        "type": n.type,
                        "category": n.category,
                        "weight": n.weight,
                        "occurrences": n.occurrences,
                    }
                    for n in nodes
                ],
                "edges": [
                    {
                        "id": str(e.id),
                        "source_node_id": str(e.source_node_id),
                        "target_node_id": str(e.target_node_id),
                        "relationship": e.relationship,
                        "strength": e.strength,
                        "confidence": e.confidence,
                    }
                    for e in edges
                ],
            }
        except Exception as exc:
            logger.exception("SearchKnowledge failed")
            return {"error": str(exc)}


# ---------------------------------------------------------------------------
# Auto-register all concrete tools on import
# ---------------------------------------------------------------------------

_registry = ToolRegistry()
_registry.register(SearchTrades())
_registry.register(SearchJournal())
_registry.register(SearchResearch())
_registry.register(SearchObsidian())
_registry.register(RunAnalytics())
_registry.register(GenerateReport())
_registry.register(GetContext())
_registry.register(SearchKnowledge())

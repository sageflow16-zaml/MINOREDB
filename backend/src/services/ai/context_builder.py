"""Enhanced context builder — assembles comprehensive trading copilot context from all data sources."""

from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.models.trade import Trade
from src.models.strategy import Strategy
from src.models.planning import TradingPlan, Goal
from src.models.risk import RiskRule, RiskSnapshot
from src.models.learning import LearningEvent, KnowledgeSnapshot
from src.models.trader_intelligence import (
    TradeDebrief, PersonalPattern, PersonalRule, TraderProfile,
)
from src.models.trade_memory import TradeMemory
from src.models.knowledge_graph import KnowledgeNode, KnowledgeEdge, KnowledgeGraphSnapshot
from src.models.knowledge import KnowledgeConcept
from src.models.market_intelligence import (
    MarketRegime, EconomicEvent, MarketAlert, MarketTimeline,
)
from src.models.concept import Concept
from src.models.ai_foundation import AIProfile, DetectedPattern
from src.services.ai_foundation import build_context, get_patterns


class ContextBuilder:
    """Aggregates context from all data sources for the AI trading copilot."""

    def __init__(self, db: Session):
        self.db = db

    # ──────────────────────────────────────────────
    # PUBLIC: build_full_context
    # ──────────────────────────────────────────────

    def build_full_context(self, project_id: UUID, options: dict | None = None) -> dict:
        opts = {
            "include_trades": True,
            "include_journal": True,
            "include_strategies": True,
            "include_risk": True,
            "include_planning": True,
            "include_market": True,
            "include_knowledge": True,
            "include_psychology": True,
            "max_recent_trades": 20,
            "days_back": 7,
            **(options or {}),
        }
        ctx = {"project_id": str(project_id), "generated_at": datetime.utcnow().isoformat()}

        if opts.get("include_trades"):
            ctx["trading"] = self.build_trading_context(project_id, opts.get("days_back", 7))
        if opts.get("include_journal"):
            ctx["journal"] = self.build_journal_context(project_id, opts.get("days_back", 7))
        if opts.get("include_strategies"):
            ctx["strategies"] = self.build_strategy_context(project_id)
        if opts.get("include_risk"):
            ctx["risk"] = self.build_risk_context(project_id)
        if opts.get("include_planning"):
            ctx["planning"] = self.build_planning_context(project_id)
        if opts.get("include_market"):
            ctx["market"] = self.build_market_context(project_id)
        if opts.get("include_knowledge"):
            ctx["knowledge"] = self.build_knowledge_context(project_id)
        if opts.get("include_psychology"):
            ctx["psychology"] = self.build_psychology_context(project_id)
        if opts.get("include_performance", True):
            ctx["performance"] = self.build_performance_context(project_id)

        ctx["summary"] = self._generate_summary(ctx)
        return ctx

    # ──────────────────────────────────────────────
    # DOMAIN BUILDERS
    # ──────────────────────────────────────────────

    def build_trading_context(self, project_id: UUID, days: int = 7) -> dict:
        since = datetime.utcnow() - timedelta(days=days)
        trades = (
            self.db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.created_at >= since,
                Trade.status.in_(["closed", "win", "loss", "breakeven"]),
            )
            .order_by(Trade.created_at.desc())
            .limit(100)
            .all()
        )
        if not trades:
            return {"message": "No recent trading activity", "trades": [], "metrics": {}}

        total = len(trades)
        wins = [t for t in trades if (t.pnl or 0) > 0]
        losses = [t for t in trades if (t.pnl or 0) < 0]
        total_pnl = sum(t.pnl or 0 for t in trades)

        return {
            "period_days": days,
            "total_trades": total,
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": round(len(wins) / total * 100, 1) if total else 0,
            "total_pnl": round(total_pnl, 2),
            "avg_pnl": round(total_pnl / total, 2) if total else 0,
            "avg_rr": round(sum(t.rr or 0 for t in trades) / total, 2) if total else 0,
            "best_trade": round(max((t.pnl or 0) for t in trades), 2) if trades else 0,
            "worst_trade": round(min((t.pnl or 0) for t in trades), 2) if trades else 0,
            "avg_risk_percent": round(sum(abs(t.risk_percent or 0) for t in trades) / total, 2) if total else 0,
            "pairs_traded": list({t.pair for t in trades if t.pair}),
            "recent_trades": [
                {
                    "id": str(t.id),
                    "pair": t.pair,
                    "direction": t.direction,
                    "entry": t.entry_price,
                    "exit": t.exit_price,
                    "pnl": t.pnl,
                    "rr": t.rr,
                    "result": t.result,
                    "emotion": t.emotion,
                    "risk_percent": t.risk_percent,
                    "date": t.created_at.isoformat() if t.created_at else None,
                }
                for t in trades[:20]
            ],
        }

    def build_performance_context(self, project_id: UUID) -> dict:
        trades = (
            self.db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.status.in_(["closed", "win", "loss", "breakeven"]),
            )
            .order_by(Trade.created_at.desc())
            .limit(500)
            .all()
        )
        if not trades:
            return {"message": "No performance data available"}

        total = len(trades)
        wins = [t for t in trades if (t.pnl or 0) > 0]
        losses = [t for t in trades if (t.pnl or 0) < 0]
        total_pnl = sum(t.pnl or 0 for t in trades)

        running = 0
        peak = 0
        max_drawdown = 0
        for t in reversed(trades):
            running += t.pnl or 0
            peak = max(peak, running)
            dd = (peak - running) / peak * 100 if peak > 0 else 0
            max_drawdown = max(max_drawdown, dd)

        win_rates = []
        monthly_pnl = {}
        pair_pnl = {}
        session_pnl = {"london": 0, "newyork": 0, "asian": 0}
        session_wins = {"london": 0, "newyork": 0, "asian": 0}
        session_counts = {"london": 0, "newyork": 0, "asian": 0}
        emotion_pnl = {}

        for t in trades:
            month_key = t.created_at.strftime("%Y-%m") if t.created_at else "unknown"
            monthly_pnl[month_key] = monthly_pnl.get(month_key, 0) + (t.pnl or 0)
            pair = t.pair or "unknown"
            pair_pnl[pair] = pair_pnl.get(pair, 0) + (t.pnl or 0)
            emotion = t.emotion or "unknown"
            emotion_pnl[emotion] = emotion_pnl.get(emotion, 0) + (t.pnl or 0)

            for sess in ["london", "newyork", "asian"]:
                val = getattr(t, f"{sess}_session", None)
                if val and str(val).lower() in ("yes", "true", "1", "active"):
                    session_counts[sess] += 1
                    session_pnl[sess] += t.pnl or 0
                    if (t.pnl or 0) > 0:
                        session_wins[sess] += 1

        # Rolling win rate (last 50)
        for i in range(0, total, 10):
            batch = trades[i : i + 50]
            if len(batch) >= 10:
                batch_wins = sum(1 for t in batch if (t.pnl or 0) > 0)
                win_rates.append(round(batch_wins / len(batch) * 100, 1))

        session_metrics = {}
        for sess in ["london", "newyork", "asian"]:
            if session_counts[sess] >= 3:
                session_metrics[sess] = {
                    "trades": session_counts[sess],
                    "pnl": round(session_pnl[sess], 2),
                    "win_rate": round(session_wins[sess] / session_counts[sess] * 100, 1) if session_counts[sess] else 0,
                }

        return {
            "total_trades": total,
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": round(len(wins) / total * 100, 1) if total else 0,
            "total_pnl": round(total_pnl, 2),
            "avg_pnl": round(total_pnl / total, 2) if total else 0,
            "avg_rr": round(sum(t.rr or 0 for t in trades) / total, 2) if total else 0,
            "max_drawdown_pct": round(max_drawdown, 2),
            "profit_factor": round(abs(sum(t.pnl or 0 for t in wins if t.pnl)) / max(abs(sum(t.pnl or 0 for t in losses if t.pnl or 0)), 0.01), 2) if wins else 0,
            "expectancy": round((sum(t.pnl or 0 for t in trades) / total), 2) if total else 0,
            "avg_win": round(sum(t.pnl or 0 for t in wins) / len(wins), 2) if wins else 0,
            "avg_loss": round(sum(t.pnl or 0 for t in losses) / len(losses), 2) if losses else 0,
            "best_trade": round(max((t.pnl or 0) for t in trades), 2) if trades else 0,
            "worst_trade": round(min((t.pnl or 0) for t in trades), 2) if trades else 0,
            "consecutive_wins": self._max_consecutive(trades, lambda t: (t.pnl or 0) > 0),
            "consecutive_losses": self._max_consecutive(trades, lambda t: (t.pnl or 0) < 0),
            "monthly_pnl": {k: round(v, 2) for k, v in sorted(monthly_pnl.items())},
            "pair_pnl": {k: round(v, 2) for k, v in sorted(pair_pnl.items(), key=lambda x: abs(x[1]), reverse=True)[:10]},
            "session_metrics": session_metrics,
            "emotion_pnl": {k: round(v, 2) for k, v in sorted(emotion_pnl.items(), key=lambda x: abs(x[1]), reverse=True)},
            "rolling_win_rates": win_rates[-10:],
        }

    def build_strategy_context(self, project_id: UUID) -> dict:
        strategies = (
            self.db.query(Strategy)
            .filter(Strategy.project_id == project_id)
            .all()
        )
        if not strategies:
            return {"message": "No strategies defined", "strategies": []}

        result = []
        for s in strategies:
            trades = (
                self.db.query(Trade)
                .filter(
                    Trade.project_id == project_id,
                    Trade.strategy_id == s.id,
                    Trade.status.in_(["closed", "win", "loss", "breakeven"]),
                )
                .all()
            )
            total = len(trades)
            wins = [t for t in trades if (t.pnl or 0) > 0]
            result.append({
                "id": str(s.id),
                "name": s.name,
                "category": s.category,
                "status": s.status,
                "version": s.version,
                "market_bias": s.market_bias,
                "total_trades": total,
                "wins": len(wins),
                "win_rate": round(len(wins) / total * 100, 1) if total else 0,
                "total_pnl": round(sum(t.pnl or 0 for t in trades), 2),
                "avg_rr": round(sum(t.rr or 0 for t in trades) / total, 2) if total else 0,
            })

        active = [s for s in result if s["status"] and s["status"].lower() == "active"]
        best = max(result, key=lambda s: s["win_rate"]) if result and max(s["win_rate"] for s in result) > 0 else None

        return {
            "total_strategies": len(strategies),
            "active_strategies": len(active),
            "strategies": result,
            "best_performing": best,
            "recommended_strategy": best["name"] if best else None,
        }

    def build_risk_context(self, project_id: UUID) -> dict:
        rules = (
            self.db.query(RiskRule)
            .filter(RiskRule.project_id == project_id, RiskRule.is_active == True)
            .all()
        )
        latest_snapshot = (
            self.db.query(RiskSnapshot)
            .filter(RiskSnapshot.project_id == project_id)
            .order_by(RiskSnapshot.created_at.desc())
            .first()
        )

        result = {}
        if rules:
            result["rules"] = [
                {
                    "name": r.name,
                    "rule_type": r.rule_type,
                    "limit_value": r.limit_value,
                    "current_value": r.current_value,
                    "severity": r.severity,
                    "violation_count": r.violation_count,
                    "is_active": r.is_active,
                }
                for r in rules
            ]
            result["active_rule_count"] = len(rules)
            result["violations"] = sum(r.violation_count for r in rules)
            breached = [r for r in rules if r.current_value > r.limit_value]
            result["breached_rules"] = [
                {"name": r.name, "current": r.current_value, "limit": r.limit_value} for r in breached
            ]
        else:
            result["rules"] = []
            result["active_rule_count"] = 0
            result["message"] = "No risk rules configured"

        if latest_snapshot:
            result["snapshot"] = {
                "account_balance": latest_snapshot.account_balance,
                "equity": latest_snapshot.equity,
                "daily_pnl": latest_snapshot.daily_pnl,
                "weekly_pnl": latest_snapshot.weekly_pnl,
                "monthly_pnl": latest_snapshot.monthly_pnl,
                "current_risk_percent": latest_snapshot.current_risk_percent,
                "open_risk": latest_snapshot.open_risk,
                "available_risk": latest_snapshot.available_risk,
                "max_drawdown": latest_snapshot.max_drawdown,
                "current_drawdown": latest_snapshot.current_drawdown,
                "recovery_progress": latest_snapshot.recovery_progress,
                "open_positions": latest_snapshot.open_positions,
                "total_exposure": latest_snapshot.total_exposure,
                "taken_at": latest_snapshot.created_at.isoformat() if latest_snapshot.created_at else None,
            }
        else:
            result["snapshot"] = None

        return result

    def build_planning_context(self, project_id: UUID, date: str | None = None) -> dict:
        target_date = date or datetime.utcnow().strftime("%Y-%m-%d")
        plan = (
            self.db.query(TradingPlan)
            .filter(
                TradingPlan.project_id == project_id,
                TradingPlan.plan_date == target_date,
            )
            .first()
        )
        goals = (
            self.db.query(Goal)
            .filter(Goal.project_id == project_id, Goal.status == "active")
            .all()
        )

        result = {"date": target_date}

        if plan:
            result["plan"] = {
                "market_bias": plan.market_bias,
                "watchlist": plan.watchlist,
                "pairs_to_avoid": plan.pairs_to_avoid,
                "key_levels": plan.key_levels,
                "liquidity_areas": plan.liquidity_areas,
                "expected_scenarios": plan.expected_scenarios,
                "invalidation_levels": plan.invalidation_levels,
                "session_goals": plan.session_goals,
                "risk_allocation": plan.risk_allocation,
                "notes": plan.notes,
                "status": plan.status,
                "is_completed": plan.is_completed,
            }
        else:
            result["plan"] = None
            result["message"] = "No trading plan for today"

        if goals:
            result["goals"] = [
                {
                    "title": g.title,
                    "goal_type": g.goal_type,
                    "target": g.target_value,
                    "current": g.current_value,
                    "unit": g.unit,
                    "priority": g.priority,
                    "status": g.status,
                    "progress_pct": round((g.current_value or 0) / max(g.target_value or 1, 1) * 100, 1) if g.target_value else None,
                }
                for g in goals
            ]
        else:
            result["goals"] = []

        return result

    def build_journal_context(self, project_id: UUID, days: int = 7) -> dict:
        since = datetime.utcnow() - timedelta(days=days)

        events = (
            self.db.query(LearningEvent)
            .filter(
                LearningEvent.project_id == project_id,
                LearningEvent.created_at >= since,
            )
            .order_by(LearningEvent.created_at.desc())
            .limit(50)
            .all()
        )
        snapshots = (
            self.db.query(KnowledgeSnapshot)
            .filter(
                KnowledgeSnapshot.project_id == project_id,
                KnowledgeSnapshot.created_at >= since,
            )
            .order_by(KnowledgeSnapshot.created_at.desc())
            .limit(10)
            .all()
        )

        result = {"period_days": days}

        if events:
            result["learning_events"] = [
                {
                    "event_type": e.event_type,
                    "entity_type": e.entity_type,
                    "status": e.status,
                    "summary": e.summary,
                    "date": e.created_at.isoformat() if e.created_at else None,
                }
                for e in events
            ]
            event_types = {}
            for e in events:
                event_types[e.event_type] = event_types.get(e.event_type, 0) + 1
            result["event_summary"] = event_types
        else:
            result["learning_events"] = []
            result["message"] = "No recent journal entries"

        if snapshots:
            result["snapshots"] = [
                {
                    "total_trades": s.total_trades,
                    "total_patterns": s.total_patterns,
                    "total_claims": s.total_claims,
                    "total_concepts": s.total_concepts,
                    "total_sources": s.total_sources,
                    "win_rate": s.win_rate,
                    "avg_rr": s.avg_rr,
                    "expectancy": s.expectancy,
                    "knowledge_growth": s.knowledge_growth,
                    "date": s.created_at.isoformat() if s.created_at else None,
                }
                for s in snapshots
            ]
            if snapshots:
                latest = snapshots[0]
                result["latest_snapshot"] = {
                    "total_trades": latest.total_trades,
                    "win_rate": latest.win_rate,
                    "avg_rr": latest.avg_rr,
                    "knowledge_growth": latest.knowledge_growth,
                }
        else:
            result["snapshots"] = []

        return result

    def build_market_context(self, project_id: UUID) -> dict:
        active_regimes = (
            self.db.query(MarketRegime)
            .filter(
                MarketRegime.project_id == project_id,
                MarketRegime.is_active == True,
            )
            .all()
        )
        today = datetime.utcnow().strftime("%Y-%m-%d")
        today_events = (
            self.db.query(EconomicEvent)
            .filter(
                EconomicEvent.project_id == project_id,
                EconomicEvent.event_date == today,
            )
            .order_by(EconomicEvent.impact.desc())
            .limit(20)
            .all()
        )
        active_alerts = (
            self.db.query(MarketAlert)
            .filter(
                MarketAlert.project_id == project_id,
                MarketAlert.is_dismissed == False,
            )
            .order_by(MarketAlert.created_at.desc())
            .limit(20)
            .all()
        )

        result = {}

        if active_regimes:
            result["regimes"] = [
                {
                    "regime_type": r.regime_type,
                    "regime_value": r.regime_value,
                    "symbol": r.symbol,
                    "timeframe": r.timeframe,
                    "confidence": r.confidence,
                    "description": r.description,
                }
                for r in active_regimes
            ]
        else:
            result["regimes"] = []

        if today_events:
            result["today_events"] = [
                {
                    "event_name": e.event_name,
                    "country": e.country,
                    "currency": e.currency,
                    "impact": e.impact,
                    "category": e.category,
                    "event_time": e.event_time,
                    "actual": e.actual_value,
                    "forecast": e.forecast_value,
                    "previous": e.previous_value,
                }
                for e in today_events
            ]
            high_impact = [e for e in today_events if e.impact == "high"]
            result["high_impact_count"] = len(high_impact)
        else:
            result["today_events"] = []
            result["message"] = "No economic events today"

        if active_alerts:
            result["alerts"] = [
                {
                    "alert_type": a.alert_type,
                    "title": a.title,
                    "message": a.message,
                    "symbol": a.symbol,
                    "severity": a.severity,
                }
                for a in active_alerts
            ]
        else:
            result["alerts"] = []

        return result

    def build_knowledge_context(self, project_id: UUID) -> dict:
        nodes = (
            self.db.query(KnowledgeNode)
            .filter(KnowledgeNode.project_id == project_id)
            .count()
        )
        edges = (
            self.db.query(KnowledgeEdge)
            .filter(KnowledgeEdge.project_id == project_id)
            .count()
        )
        latest_snapshot = (
            self.db.query(KnowledgeGraphSnapshot)
            .filter(KnowledgeGraphSnapshot.project_id == project_id)
            .order_by(KnowledgeGraphSnapshot.created_at.desc())
            .first()
        )
        concepts = (
            self.db.query(KnowledgeConcept)
            .count()
        )
        top_nodes = (
            self.db.query(KnowledgeNode)
            .filter(KnowledgeNode.project_id == project_id)
            .order_by(KnowledgeNode.occurrences.desc())
            .limit(10)
            .all()
        )
        patterns = (
            self.db.query(DetectedPattern)
            .filter(
                DetectedPattern.project_id == project_id,
                DetectedPattern.is_active == True,
            )
            .order_by(DetectedPattern.confidence.desc())
            .limit(10)
            .all()
        )

        result = {
            "graph": {
                "total_nodes": nodes,
                "total_edges": edges,
                "density": round(edges / max(nodes, 1), 4),
            },
            "top_nodes": [
                {"name": n.name, "type": n.type, "category": n.category, "occurrences": n.occurrences}
                for n in top_nodes
            ],
        }

        if latest_snapshot:
            result["graph"]["latest_snapshot"] = {
                "total_nodes": latest_snapshot.total_nodes,
                "total_edges": latest_snapshot.total_edges,
                "most_connected_type": latest_snapshot.most_connected_type,
                "summary": latest_snapshot.summary,
            }

        if concepts:
            result["total_concepts"] = concepts

        if patterns:
            result["detected_patterns"] = [
                {
                    "pattern_type": p.pattern_type,
                    "pattern_key": p.pattern_key,
                    "pattern_value": p.pattern_value,
                    "confidence": p.confidence,
                    "sample_size": p.sample_size,
                    "win_rate": p.win_rate,
                    "description": p.description,
                    "is_positive": p.is_positive,
                }
                for p in patterns
            ]

        if not nodes and not edges and not patterns:
            result["message"] = "No knowledge graph data available"

        return result

    def build_psychology_context(self, project_id: UUID) -> dict:
        profile = (
            self.db.query(AIProfile)
            .filter(AIProfile.project_id == project_id)
            .first()
        )
        trader_profile = (
            self.db.query(TraderProfile)
            .filter(TraderProfile.project_id == project_id)
            .first()
        )

        result = {}

        if profile:
            result["ai_profile"] = {
                "style": profile.trading_style,
                "preferred_sessions": profile.preferred_sessions,
                "preferred_timeframes": profile.preferred_timeframes,
                "preferred_pairs": profile.preferred_pairs,
                "risk_profile": profile.risk_profile,
                "avg_rr": profile.avg_rr,
                "avg_risk_per_trade": profile.avg_risk_per_trade,
                "max_drawdown_pct": profile.max_drawdown_pct,
                "overall_score": profile.overall_score,
                "psychological_patterns": profile.psychological_patterns,
                "most_common_mistakes": profile.most_common_mistakes,
                "most_successful_behaviors": profile.most_successful_behaviors,
                "best_conditions": profile.best_conditions,
                "worst_conditions": profile.worst_conditions,
                "learning_progress": profile.learning_progress,
            }

        if trader_profile:
            result["trader_profile"] = {
                "strengths": trader_profile.strengths,
                "weaknesses": trader_profile.weaknesses,
                "discipline_score": trader_profile.discipline_score,
                "rule_adherence": trader_profile.rule_adherence,
                "performance_trends": trader_profile.performance_trends,
                "total_trades_analyzed": trader_profile.total_trades_analyzed,
                "total_debriefs": trader_profile.total_debriefs,
                "active_patterns": trader_profile.active_patterns,
                "approved_rules": trader_profile.approved_rules,
                "improvement_suggestions": trader_profile.improvement_suggestions,
            }

        if not profile and not trader_profile:
            return {"message": "No psychology profile available"}

        return result

    # ──────────────────────────────────────────────
    # FORMATTER
    # ──────────────────────────────────────────────

    def format_context_for_prompt(self, context: dict, max_tokens: int = 3000) -> str:
        sections = []
        char_budget = max_tokens * 4

        sections.append("# Trading Context")
        sections.append(f"Generated: {context.get('generated_at', 'now')}")
        sections.append("")

        remaining = char_budget

        def add_section(title: str, content: str) -> bool:
            nonlocal remaining
            block = f"## {title}\n\n{content}\n"
            if len(block) > remaining:
                return False
            sections.append(block)
            remaining -= len(block)
            return True

        # Performance
        perf = context.get("performance") or context.get("trading", {})
        if perf and "message" not in perf:
            lines = []
            if perf.get("total_trades"):
                lines.append(
                    f"Trades: {perf.get('total_trades', 0)} | "
                    f"Win Rate: {perf.get('win_rate', 0)}% | "
                    f"P&L: ${perf.get('total_pnl', 0):.2f} | "
                    f"Avg R:R: {perf.get('avg_rr', 0):.2f}"
                )
            if perf.get("max_drawdown_pct") is not None:
                lines.append(
                    f"Max Drawdown: {perf.get('max_drawdown_pct', 0)}% | "
                    f"Profit Factor: {perf.get('profit_factor', 0):.2f} | "
                    f"Expectancy: ${perf.get('expectancy', 0):.2f}"
                )
            if perf.get("consecutive_wins"):
                lines.append(
                    f"Best Streak: {perf.get('consecutive_wins', 0)} wins | "
                    f"Worst Streak: {perf.get('consecutive_losses', 0)} losses"
                )
            if perf.get("avg_pnl") is not None:
                lines.append(
                    f"Avg Win: ${perf.get('avg_win', 0):.2f} | "
                    f"Avg Loss: ${perf.get('avg_loss', 0):.2f}"
                )
            if lines:
                add_section("Recent Performance", "\n".join(lines))

        # Trading
        trading = context.get("trading", {})
        if trading and "message" not in trading and trading is not perf:
            lines = [
                f"Period: {trading.get('period_days', 7)} days | "
                f"Trades: {trading.get('total_trades', 0)} | "
                f"Wins: {trading.get('wins', 0)} / Losses: {trading.get('losses', 0)}",
                f"Win Rate: {trading.get('win_rate', 0)}% | "
                f"Total P&L: ${trading.get('total_pnl', 0):.2f} | "
                f"Avg R:R: {trading.get('avg_rr', 0):.2f}",
            ]
            if trading.get("recent_trades"):
                lines.append("Recent trades:")
                for t in trading["recent_trades"][:5]:
                    lines.append(
                        f"  {t.get('pair','?')} {t.get('direction','?')} | "
                        f"P&L: ${t.get('pnl',0):.2f} | R:R: {t.get('rr','?')} | "
                        f"{t.get('result','?')} | Emotion: {t.get('emotion','?')}"
                    )
            add_section("Recent Trading", "\n".join(lines))

        # Strategies
        strats = context.get("strategies", {})
        if strats and "message" not in strats:
            lines = [
                f"Total: {strats.get('total_strategies', 0)} | "
                f"Active: {strats.get('active_strategies', 0)}"
            ]
            if strats.get("best_performing"):
                lines.append(f"Best: {strats['best_performing'].get('name','?')} "
                             f"({strats['best_performing'].get('win_rate',0)}% WR)")
            if strats.get("strategies"):
                for s in strats["strategies"][:5]:
                    lines.append(
                        f"  {s.get('name','?')} [{s.get('status','?')}] | "
                        f"{s.get('total_trades',0)} trades | "
                        f"{s.get('win_rate',0)}% WR | "
                        f"${s.get('total_pnl',0):.2f}"
                    )
            add_section("Strategies", "\n".join(lines))

        # Risk
        risk = context.get("risk", {})
        if risk and "message" not in risk:
            lines = []
            snap = risk.get("snapshot")
            if snap:
                lines.append(
                    f"Balance: ${snap.get('account_balance',0):.2f} | "
                    f"Equity: ${snap.get('equity',0):.2f} | "
                    f"Daily P&L: ${snap.get('daily_pnl',0):.2f}"
                )
                lines.append(
                    f"Drawdown: {snap.get('current_drawdown',0)}% | "
                    f"Max DD: {snap.get('max_drawdown',0)}% | "
                    f"Open: {snap.get('open_positions',0)} | "
                    f"Risk: {snap.get('current_risk_percent',0)}%"
                )
            if risk.get("breached_rules"):
                for br in risk["breached_rules"]:
                    lines.append(f"BREACH: {br.get('name','?')} "
                                 f"(current={br.get('current',0)}, limit={br.get('limit',0)})")
            if risk.get("active_rule_count", 0) > 0:
                lines.append(f"Active rules: {risk['active_rule_count']} | "
                             f"Total violations: {risk.get('violations',0)}")
            if lines:
                add_section("Risk Status", "\n".join(lines))

        # Planning
        planning = context.get("planning", {})
        if planning and ("plan" in planning or "goals" in planning):
            lines = []
            plan = planning.get("plan")
            if plan:
                lines.append(f"Date: {planning.get('date','?')}")
                lines.append(f"Bias: {plan.get('market_bias','none')} | "
                             f"Status: {plan.get('status','?')}")
                if plan.get("watchlist"):
                    lines.append(f"Watchlist: {', '.join(str(w) for w in plan['watchlist'][:5])}")
                if plan.get("key_levels"):
                    lines.append(f"Key levels: {', '.join(str(k) for k in plan['key_levels'][:5])}")
            goals = planning.get("goals", [])
            if goals:
                for g in goals[:3]:
                    pct = g.get("progress_pct", 0)
                    lines.append(f"Goal: {g.get('title','?')} — "
                                 f"{g.get('current','0')}/{g.get('target','?')} {g.get('unit','')} "
                                 f"({pct}%)")
            add_section("Today's Plan", "\n".join(lines))

        # Journal
        journal = context.get("journal", {})
        if journal and "message" not in journal:
            lines = []
            snap = journal.get("latest_snapshot")
            if snap:
                lines.append(
                    f"Trades: {snap.get('total_trades',0)} | "
                    f"WR: {snap.get('win_rate',0)}% | "
                    f"Growth: {snap.get('knowledge_growth',0)}"
                )
            events = journal.get("learning_events", [])
            if events:
                for e in events[:3]:
                    lines.append(f"  [{e.get('event_type','?')}] {e.get('summary','?')} — {e.get('status','?')}")
            if lines:
                add_section("Journal / Learning", "\n".join(lines))

        # Market
        market = context.get("market", {})
        if market and "message" not in market:
            lines = []
            regimes = market.get("regimes", [])
            if regimes:
                for r in regimes[:3]:
                    lines.append(f"  {r.get('regime_type','?')}: {r.get('regime_value','?')} "
                                 f"(confidence={r.get('confidence',0):.2f})")
            events = market.get("today_events", [])
            if events:
                high = [e for e in events if e.get("impact") == "high"]
                lines.append(f"Today's events: {len(events)} total, "
                             f"{len(high)} high impact")
                for e in events[:3]:
                    lines.append(f"  {e.get('event_name','?')} ({e.get('country','?')}) — "
                                 f"impact={e.get('impact','?')}, forecast={e.get('forecast','?')}")
            if lines:
                add_section("Market Intelligence", "\n".join(lines))

        # Knowledge
        knowledge = context.get("knowledge", {})
        if knowledge and "message" not in knowledge:
            lines = []
            graph = knowledge.get("graph", {})
            if graph:
                lines.append(f"Graph: {graph.get('total_nodes',0)} nodes, "
                             f"{graph.get('total_edges',0)} edges")
            top = knowledge.get("top_nodes", [])
            if top:
                lines.append("Top concepts:")
                for n in top[:5]:
                    lines.append(f"  {n.get('name','?')} ({n.get('type','?')}) — "
                                 f"{n.get('occurrences',0)} occurrences")
            total_concepts = knowledge.get("total_concepts", 0)
            if total_concepts:
                lines.append(f"Knowledge concepts: {total_concepts}")
            patterns = knowledge.get("detected_patterns", [])
            if patterns:
                lines.append("Detected patterns:")
                for p in patterns[:3]:
                    lines.append(f"  {p.get('description','?')} "
                                 f"(confidence={p.get('confidence',0):.2f})")
            if lines:
                add_section("Knowledge Graph", "\n".join(lines))

        # Psychology
        psych = context.get("psychology", {})
        if psych and "message" not in psych:
            lines = []
            ai_p = psych.get("ai_profile", {})
            if ai_p:
                lines.append(
                    f"Style: {ai_p.get('style','?')} | "
                    f"Risk: {ai_p.get('risk_profile','?')} | "
                    f"Score: {ai_p.get('overall_score','?')}"
                )
                if ai_p.get("preferred_sessions"):
                    lines.append(f"Sessions: {', '.join(ai_p['preferred_sessions'])}")
            tp = psych.get("trader_profile", {})
            if tp:
                if tp.get("strengths"):
                    lines.append(f"Strengths: {', '.join(tp['strengths'][:3])}")
                if tp.get("weaknesses"):
                    lines.append(f"Weaknesses: {', '.join(tp['weaknesses'][:3])}")
                if tp.get("discipline_score") is not None:
                    lines.append(f"Discipline: {tp['discipline_score']:.1f}/100")
                if tp.get("improvement_suggestions"):
                    for s in tp["improvement_suggestions"][:2]:
                        lines.append(f"  Suggestion: {s}")
            if lines:
                add_section("Psychology Profile", "\n".join(lines))

        # Summary
        summary = context.get("summary", "")
        if summary and remaining > 200:
            add_section("Summary", summary)

        return "\n".join(sections)

    # ──────────────────────────────────────────────
    # INTERNAL HELPERS
    # ──────────────────────────────────────────────

    @staticmethod
    def _max_consecutive(trades: list, predicate) -> int:
        best = 0
        curr = 0
        for t in sorted(trades, key=lambda x: x.created_at or datetime.min):
            if predicate(t):
                curr += 1
                best = max(best, curr)
            else:
                curr = 0
        return best

    @staticmethod
    def _generate_summary(ctx: dict) -> str:
        parts = []
        perf = ctx.get("performance") or ctx.get("trading", {})
        if perf and perf.get("total_trades"):
            parts.append(
                f"{perf['total_trades']} trades, {perf.get('win_rate',0)}% WR, "
                f"${perf.get('total_pnl',0):.2f} P&L"
            )
        risk = ctx.get("risk", {})
        snap = risk.get("snapshot") if risk else None
        if snap:
            parts.append(
                f"DD: {snap.get('current_drawdown',0)}%, "
                f"Risk: {snap.get('current_risk_percent',0)}%"
            )
        planning = ctx.get("planning", {})
        plan = planning.get("plan") if planning else None
        if plan:
            parts.append(f"Bias: {plan.get('market_bias','?')}")
        market = ctx.get("market", {})
        if market and market.get("high_impact_count"):
            parts.append(f"{market['high_impact_count']} high-impact events today")
        knowledge = ctx.get("knowledge", {})
        graph = knowledge.get("graph", {}) if knowledge else {}
        if graph:
            parts.append(f"KG: {graph.get('total_nodes',0)}N/{graph.get('total_edges',0)}E")
        return " | ".join(parts) if parts else "No summary data available"

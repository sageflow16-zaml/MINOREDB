from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.trade import Trade


class MarketWatcherAgent(BaseAgent):
    """Monitors market conditions, active trades, and risk levels."""

    agent_name = "watcher"
    display_name = "Market Watcher"
    description = "Monitors market conditions, active trades, and risk exposure"
    capabilities = [
        "active_trade_monitoring",
        "risk_exposure_analysis",
        "market_condition_snapshot",
        "alert_condition_check",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        discoveries = []
        evidence = []
        sources = []

        # Active/open trades
        open_trades = (
            db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.status.in_(["open", "active"]),
            )
            .all()
        )
        sources.append(f"open_trades:{len(open_trades)}")

        # Recent closed trades
        recent_closed = (
            db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.status.in_(["closed", "completed"]),
                Trade.pnl.isnot(None),
            )
            .order_by(Trade.entry_date.desc())
            .limit(20)
            .all()
        )
        sources.append(f"recent_closed:{len(recent_closed)}")

        if open_trades:
            total_risk = sum(abs(t.pnl or 0) for t in open_trades if t.pnl is not None and t.pnl < 0)
            open_pnl = sum(t.pnl or 0 for t in open_trades if t.pnl is not None)
            discoveries.append({
                "type": "open_positions",
                "value": len(open_trades),
                "detail": f"{len(open_trades)} open positions (floating P&L: {round(open_pnl, 2)})",
            })
            if total_risk > 0:
                discoveries.append({
                    "type": "open_risk",
                    "value": round(total_risk, 2),
                    "detail": f"Total risk exposure from open trades: {round(total_risk, 2)}",
                })
            evidence.append({
                "source": "watcher",
                "open_trades": len(open_trades),
                "floating_pnl": round(open_pnl, 2),
            })
        else:
            discoveries.append({
                "type": "no_open_positions",
                "value": True,
                "detail": "No open positions — market exposure is zero",
            })

        if recent_closed:
            recent_pnl = sum(t.pnl for t in recent_closed if t.pnl is not None)
            recent_win = [t for t in recent_closed if t.pnl is not None and t.pnl > 0]
            recent_wr = len(recent_win) / max(len(recent_closed), 1) * 100
            discoveries.append({
                "type": "recent_performance",
                "value": round(recent_pnl, 2),
                "detail": f"Last {len(recent_closed)} closed trades: {round(recent_pnl, 2)} P&L, {round(recent_wr, 1)}% WR",
            })

        reasoning = (
            f"Market watch complete. "
            f"{len(open_trades)} open positions, {len(recent_closed)} recent closes analyzed."
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.6 + (len(open_trades) > 0) * 0.2, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"{len(open_trades)} open positions, {len(recent_closed)} recent trades",
            output_data={
                "open_trades": len(open_trades),
                "recent_closed": len(recent_closed),
                "open_positions": [
                    {"id": t.id, "pair": t.pair, "direction": t.direction, "pnl": t.pnl}
                    for t in open_trades
                ] if open_trades else [],
            },
            sources_consulted=sources,
        )

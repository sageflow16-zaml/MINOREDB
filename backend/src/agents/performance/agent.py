from sqlalchemy.orm import Session
from sqlalchemy import func
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.trade import Trade


class PerformanceMonitorAgent(BaseAgent):
    """Monitors and analyzes trading performance metrics."""

    agent_name = "performance_monitor"
    display_name = "Performance Monitor"
    description = "Monitors trading performance, P&L trends, win rate, and risk metrics"
    capabilities = [
        "pnl_analysis",
        "win_rate_tracking",
        "risk_metric_calculation",
        "performance_trend_detection",
        "drawdown_analysis",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        input_data = task.input_data or {}
        analysis_type = task.task_type

        discoveries = []
        evidence = []
        sources = []

        # Base query — closed trades with P&L
        trades = (
            db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.pnl.isnot(None),
            )
            .order_by(Trade.entry_date.desc())
            .all()
        )

        if not trades:
            return AgentResult(
                reasoning="No trades with P&L data found for performance analysis",
                confidence=0.3,
                discoveries=[{"type": "no_data", "value": True, "detail": "No closed trades found"}],
                output_summary="No performance data available",
                sources_consulted=["trades:0 closed trades"],
            )

        sources.append(f"trades:{len(trades)} closed trades")
        total_pnl = sum(t.pnl for t in trades if t.pnl is not None)
        winning = [t for t in trades if t.pnl is not None and t.pnl > 0]
        losing = [t for t in trades if t.pnl is not None and t.pnl < 0]
        win_rate = len(winning) / max(len(trades), 1) * 100

        avg_win = sum(t.pnl for t in winning) / max(len(winning), 1) if winning else 0
        avg_loss = abs(sum(t.pnl for t in losing)) / max(len(losing), 1) if losing else 0
        profit_factor = abs(sum(t.pnl for t in winning) / max(sum(abs(t.pnl) for t in losing), 0.01))

        discoveries.append({
            "type": "total_pnl",
            "value": round(total_pnl, 2),
            "detail": f"Total P&L: {round(total_pnl, 2)}",
        })
        discoveries.append({
            "type": "win_rate",
            "value": round(win_rate, 1),
            "detail": f"Win Rate: {round(win_rate, 1)}% ({len(winning)}/{len(trades)})",
        })
        discoveries.append({
            "type": "profit_factor",
            "value": round(profit_factor, 2),
            "detail": f"Profit Factor: {round(profit_factor, 2)}",
        })
        discoveries.append({
            "type": "avg_win_loss",
            "value": round(avg_win / max(avg_loss, 0.01), 2),
            "detail": f"Avg Win: {round(avg_win, 2)}, Avg Loss: {round(avg_loss, 2)} (ratio {round(avg_win / max(avg_loss, 0.01), 2)})",
        })

        evidence.append({
            "source": "performance",
            "total_trades": len(trades),
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate, 1),
            "profit_factor": round(profit_factor, 2),
        })

        # Trend analysis
        if len(trades) >= 10:
            recent = trades[:10]
            recent_pnl = sum(t.pnl for t in recent if t.pnl is not None)
            older = trades[10:20] if len(trades) >= 20 else trades[10:]
            older_pnl = sum(t.pnl for t in older if t.pnl is not None)
            if older and older_pnl != 0:
                trend_pct = ((recent_pnl - older_pnl) / abs(older_pnl)) * 100
                discoveries.append({
                    "type": "performance_trend",
                    "value": round(trend_pct, 1),
                    "detail": f"Performance trend (last 10 vs prior): {round(trend_pct, 1)}%",
                })

        reasoning = (
            f"Analyzed {len(trades)} trades. "
            f"Total P&L: {round(total_pnl, 2)}, Win Rate: {round(win_rate, 1)}%, "
            f"Profit Factor: {round(profit_factor, 2)}"
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.6 + (len(trades) / 100) * 0.3, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Performance analysis: {round(win_rate, 1)}% win rate, {round(total_pnl, 2)} total P&L",
            output_data={
                "total_pnl": round(total_pnl, 2),
                "win_rate": round(win_rate, 1),
                "profit_factor": round(profit_factor, 2),
                "avg_win": round(avg_win, 2),
                "avg_loss": round(avg_loss, 2),
                "total_trades": len(trades),
                "winning_trades": len(winning),
                "losing_trades": len(losing),
            },
            sources_consulted=sources,
        )

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.trade import Trade


class PatternLearnerAgent(BaseAgent):
    """Learns and identifies trading patterns from historical performance."""

    agent_name = "learner"
    display_name = "Pattern Learner"
    description = "Learns trading patterns from historical data to identify what works and what doesn't"
    capabilities = [
        "pattern_learning",
        "strategy_effectiveness",
        "session_performance_analysis",
        "pair_performance_analysis",
        "behavioral_pattern_detection",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        discoveries = []
        evidence = []
        sources = []

        # Fetch all trades with P&L
        trades = (
            db.query(Trade)
            .filter(Trade.project_id == project_id, Trade.pnl.isnot(None))
            .all()
        )
        sources.append(f"trades:{len(trades)} records")

        if len(trades) < 5:
            return AgentResult(
                reasoning="Insufficient trade data for pattern learning (need at least 5 trades)",
                confidence=0.3,
                discoveries=[{"type": "insufficient_data", "value": True, "detail": f"Only {len(trades)} trades available"}],
                output_summary="Not enough data for pattern learning",
                sources_consulted=sources,
            )

        # Session performance
        session_pnl = {}
        for t in trades:
            sesh = t.session or "unknown"
            if sesh not in session_pnl:
                session_pnl[sesh] = {"pnl": 0, "count": 0, "wins": 0}
            session_pnl[sesh]["pnl"] += t.pnl or 0
            session_pnl[sesh]["count"] += 1
            if (t.pnl or 0) > 0:
                session_pnl[sesh]["wins"] += 1

        best_session = max(session_pnl, key=lambda s: session_pnl[s]["pnl"]) if session_pnl else None
        if best_session:
            s = session_pnl[best_session]
            discoveries.append({
                "type": "best_session",
                "value": best_session,
                "detail": f"Best session: {best_session} ({s['pnl']:.2f} P&L, {s['wins']}/{s['count']} wins)",
            })
            evidence.append({"source": "session_analysis", "sessions": {k: v["pnl"] for k, v in session_pnl.items()}})

        # Direction performance
        dir_pnl = {}
        for t in trades:
            d = t.direction or "unknown"
            if d not in dir_pnl:
                dir_pnl[d] = {"pnl": 0, "count": 0, "wins": 0}
            dir_pnl[d]["pnl"] += t.pnl or 0
            dir_pnl[d]["count"] += 1
            if (t.pnl or 0) > 0:
                dir_pnl[d]["wins"] += 1

        best_dir = max(dir_pnl, key=lambda d: dir_pnl[d]["pnl"]) if dir_pnl else None
        if best_dir:
            d = dir_pnl[best_dir]
            discoveries.append({
                "type": "best_direction",
                "value": best_dir,
                "detail": f"Best direction: {best_dir} ({d['pnl']:.2f} P&L, {d['wins']}/{d['count']} wins)",
            })

        # Consecutive loss streak detection
        sorted_trades = sorted(trades, key=lambda t: t.entry_date or datetime.min)
        max_loss_streak = 0
        current_streak = 0
        for t in sorted_trades:
            if (t.pnl or 0) < 0:
                current_streak += 1
                max_loss_streak = max(max_loss_streak, current_streak)
            else:
                current_streak = 0
        if max_loss_streak >= 3:
            discoveries.append({
                "type": "loss_streak",
                "value": max_loss_streak,
                "detail": f"Max consecutive losses: {max_loss_streak} — review risk management during drawdowns",
            })

        # Win rate by month
        monthly_stats = {}
        for t in sorted_trades:
            if t.entry_date:
                month_key = t.entry_date.strftime("%Y-%m")
                if month_key not in monthly_stats:
                    monthly_stats[month_key] = {"count": 0, "wins": 0}
                monthly_stats[month_key]["count"] += 1
                if (t.pnl or 0) > 0:
                    monthly_stats[month_key]["wins"] += 1

        improving = False
        months = sorted(monthly_stats.keys())
        if len(months) >= 2:
            recent_mo = months[-1]
            prev_mo = months[-2]
            recent_wr = monthly_stats[recent_mo]["wins"] / max(monthly_stats[recent_mo]["count"], 1) * 100
            prev_wr = monthly_stats[prev_mo]["wins"] / max(monthly_stats[prev_mo]["count"], 1) * 100
            if recent_wr > prev_wr:
                improving = True
                discoveries.append({
                    "type": "improving_trend",
                    "value": round(recent_wr - prev_wr, 1),
                    "detail": f"Win rate improving: {prev_wr:.0f}% -> {recent_wr:.0f}% ({round(recent_wr - prev_wr, 1)}% change)",
                })

        reasoning = (
            f"Pattern learning complete from {len(trades)} trades. "
            f"Best session: {best_session}, Best direction: {best_dir}. "
            f"{'Improving trend detected' if improving else 'Stable or declining trend'}."
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.5 + min(len(trades), 200) * 0.002, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Learned {len(discoveries)} patterns from {len(trades)} trades",
            output_data={
                "best_session": best_session,
                "best_direction": best_dir,
                "max_loss_streak": max_loss_streak,
                "improving": improving,
                "session_stats": {k: v["pnl"] for k, v in session_pnl.items()},
                "direction_stats": {k: v["pnl"] for k, v in dir_pnl.items()},
            },
            sources_consulted=sources,
        )

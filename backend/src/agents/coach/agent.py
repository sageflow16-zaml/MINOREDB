from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.trade import Trade
from src.brain.models import BrainCoaching


class CoachAgent(BaseAgent):
    """Generates automated coaching sessions based on performance data."""

    agent_name = "coach"
    display_name = "Trading Coach"
    description = "Generates automated coaching sessions with personalized feedback and action items"
    capabilities = [
        "coaching_generation",
        "weakness_identification",
        "strength_highlighting",
        "action_item_generation",
        "progress_tracking",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        input_data = task.input_data or {}
        coaching_type = input_data.get("coaching_type", "daily")

        discoveries = []
        evidence = []
        sources = []

        # Fetch recent trades
        trades = (
            db.query(Trade)
            .filter(Trade.project_id == project_id, Trade.pnl.isnot(None))
            .order_by(Trade.entry_date.desc())
            .limit(50)
            .all()
        )
        sources.append(f"trades:{len(trades)} records")

        if not trades:
            return AgentResult(
                reasoning="No trade data available for coaching",
                confidence=0.3,
                discoveries=[{"type": "no_data", "value": True, "detail": "No trades found for coaching"}],
                output_summary="Insufficient data for coaching",
                sources_consulted=sources,
            )

        total_pnl = sum(t.pnl for t in trades if t.pnl is not None)
        winning = [t for t in trades if t.pnl is not None and t.pnl > 0]
        losing = [t for t in trades if t.pnl is not None and t.pnl < 0]
        win_rate = len(winning) / max(len(trades), 1) * 100

        # Weaknesses
        weaknesses = []
        if win_rate < 40:
            weaknesses.append({"area": "win_rate", "detail": "Win rate is below 40%, needs improvement in trade selection"})
        if len(losing) > 0:
            avg_loss = abs(sum(t.pnl for t in losing)) / len(losing)
            max_loss = max(abs(t.pnl) for t in losing)
            if max_loss > avg_loss * 3:
                weaknesses.append({"area": "risk_management", "detail": "Some losses significantly exceed average — review position sizing"})

        # Strengths
        strengths = []
        if win_rate > 60:
            strengths.append({"area": "trade_selection", "detail": "Strong win rate indicates good trade selection"})
        if total_pnl > 0:
            strengths.append({"area": "profitability", "detail": "Overall profitable trader"})

        # Action items
        action_items = []
        if weaknesses:
            for w in weaknesses:
                action_items.append(f"Focus on improving {w['area']}: {w['detail']}")
        action_items.append("Continue documenting every trade in the journal")
        action_items.append("Review top 3 winning and losing trades weekly")

        discoveries.append({
            "type": "coaching_generated",
            "value": coaching_type,
            "detail": f"Generated {coaching_type} coaching with {len(strengths)} strengths, {len(weaknesses)} weaknesses, {len(action_items)} actions",
        })
        evidence.append({
            "source": "coaching",
            "strengths": len(strengths),
            "weaknesses": len(weaknesses),
            "action_items": len(action_items),
            "win_rate": round(win_rate, 1),
        })

        reasoning = (
            f"Generated {coaching_type} coaching session. "
            f"Identified {len(strengths)} strengths and {len(weaknesses)} weaknesses. "
            f"Win rate: {round(win_rate, 1)}%"
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.5 + min(len(trades), 50) * 0.008, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"{coaching_type.capitalize()} coaching: {len(strengths)} strengths, {len(weaknesses)} weaknesses",
            output_data={
                "coaching_type": coaching_type,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "action_items": action_items,
                "metrics": {
                    "win_rate": round(win_rate, 1),
                    "total_pnl": round(total_pnl, 2),
                    "total_trades": len(trades),
                },
            },
            sources_consulted=sources,
        )

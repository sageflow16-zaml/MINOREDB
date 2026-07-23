from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.agents.core.base import BaseAgent, AgentResult
from src.agents.models import AgentTask
from src.models.trade import Trade


class JournalReviewAgent(BaseAgent):
    """Reviews trade journal entries to extract lessons and patterns."""

    agent_name = "journal_review"
    display_name = "Journal Reviewer"
    description = "Reviews trade journal entries to extract lessons, mistakes, and behavioral patterns"
    capabilities = [
        "trade_review",
        "mistake_detection",
        "behavioral_analysis",
        "lesson_extraction",
        "pattern_identification",
    ]

    def execute(self, db: Session, project_id: str, task: AgentTask) -> AgentResult:
        input_data = task.input_data or {}
        limit = input_data.get("limit", 50)

        # Fetch recent trades with notes
        trades = (
            db.query(Trade)
            .filter(
                Trade.project_id == project_id,
                Trade.notes.isnot(None),
                Trade.notes != "",
            )
            .order_by(Trade.entry_date.desc())
            .limit(limit)
            .all()
        )

        discoveries = []
        evidence = []

        if not trades:
            return AgentResult(
                reasoning="No trade journal entries found to review",
                confidence=0.3,
                discoveries=[{"type": "no_data", "value": True, "detail": "No trades with journal notes found"}],
                output_summary="No journal entries available for review",
                sources_consulted=["trades:0 records"],
            )

        # Analyze notes for patterns
        mistake_keywords = ["mistake", "error", "fomo", "revenge", "overtrade", "impulsive", "should have", "regret"]
        lesson_keywords = ["lesson", "learned", "next time", "remember", "will do", "improve"]
        emotion_keywords = ["frustrated", "angry", "anxious", "confident", "fear", "greed", "excited", "disappointed"]

        trade_with_mistakes = 0
        trade_with_lessons = 0
        trade_with_emotions = 0
        emotional_mentions = {}
        good_trades = 0
        bad_trades = 0

        for t in trades:
            notes = (t.notes or "").lower()
            if any(kw in notes for kw in mistake_keywords):
                trade_with_mistakes += 1
            if any(kw in notes for kw in lesson_keywords):
                trade_with_lessons += 1
            for ek in emotion_keywords:
                if ek in notes:
                    emotional_mentions[ek] = emotional_mentions.get(ek, 0) + 1
            if emotional_mentions:
                trade_with_emotions += 1
            if t.pnl is not None:
                if t.pnl > 0:
                    good_trades += 1
                elif t.pnl < 0:
                    bad_trades += 1

        total = len(trades)
        if trade_with_mistakes > 0:
            discoveries.append({
                "type": "mistake_rate",
                "value": round(trade_with_mistakes / total, 2),
                "detail": f"{trade_with_mistakes}/{total} trades mention mistakes",
            })
        if trade_with_lessons > 0:
            discoveries.append({
                "type": "lesson_rate",
                "value": round(trade_with_lessons / total, 2),
                "detail": f"{trade_with_lessons}/{total} trades document lessons learned",
            })
        if emotional_mentions:
            top_emotion = max(emotional_mentions, key=emotional_mentions.get)
            discoveries.append({
                "type": "emotional_pattern",
                "value": top_emotion,
                "detail": f"Most mentioned emotion: {top_emotion} ({emotional_mentions[top_emotion]}x)",
            })
            evidence.append({"source": "journal_emotions", "counts": emotional_mentions})

        if good_trades > 0 and bad_trades > 0:
            ratio = round(good_trades / max(bad_trades, 1), 2)
            discoveries.append({
                "type": "win_loss_journal_ratio",
                "value": ratio,
                "detail": f"Good trades: {good_trades}, Bad trades: {bad_trades} (ratio {ratio})",
            })

        reasoning = (
            f"Reviewed {total} journal entries. "
            f"Found {trade_with_mistakes} with mistakes, {trade_with_lessons} with lessons, "
            f"{trade_with_emotions} with emotional content."
        )

        return AgentResult(
            reasoning=reasoning,
            confidence=round(0.5 + (total / max(limit, 1)) * 0.3, 2),
            discoveries=discoveries,
            evidence=evidence,
            output_summary=f"Journal review complete: {total} entries, {len(discoveries)} findings",
            output_data={
                "total_reviewed": total,
                "mistake_rate": round(trade_with_mistakes / max(total, 1), 2),
                "lesson_rate": round(trade_with_lessons / max(total, 1), 2),
                "emotional_trades": trade_with_emotions,
                "good_trades": good_trades,
                "bad_trades": bad_trades,
            },
            sources_consulted=[f"trades:{total} records with notes"],
        )

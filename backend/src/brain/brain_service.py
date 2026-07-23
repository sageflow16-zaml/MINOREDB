from uuid import UUID
from sqlalchemy.orm import Session
from src.brain.dna_engine import build_or_update_dna, get_dna
from src.brain.memory_engine import (
    store_memory, get_memory, search_memories,
    delete_memory, get_memory_summary, get_relevant_memories,
)
from src.brain.decision_engine import ask, get_decision_history, get_decision, track_outcome
from src.brain.similarity_engine import search_similar, find_similar_for_trade
from src.brain.learning_engine import detect_observations, dismiss_observation
from src.brain.coaching_engine import generate_coaching, get_coaching_history, get_latest_coaching
from src.brain.insights_engine import generate_insights, get_insights, dismiss_insight


def get_brain_dashboard(db: Session, project_id: UUID) -> dict:
    dna = get_dna(db, project_id)
    recent_decisions = get_decision_history(db, project_id, limit=10)
    top_insights = get_insights(db, project_id, limit=10)
    active_obs = detect_observations(db, project_id)
    latest_coaching = get_latest_coaching(db, project_id)
    memory_summary = get_memory_summary(db, project_id)

    return {
        "dna": dna,
        "recent_decisions": recent_decisions[:10],
        "top_insights": top_insights[:10],
        "active_observations": active_obs[:10],
        "latest_coaching": latest_coaching,
        "memory_summary": memory_summary,
        "today_intelligence": _build_today_intelligence(dna),
    }


def _build_today_intelligence(dna: dict | None) -> dict:
    if not dna:
        return {}
    dna_summary = dna.get("dna_summary", {})
    return {
        "style": dna.get("trading_style"),
        "best_session": dna.get("preferred_session"),
        "overall_score": dna.get("discipline_score", 0),
        "psychology_score": dna.get("psychology_score", 0),
        "risk_behavior": dna.get("risk_behavior"),
        "insights": dna.get("raw_insights", []),
    }

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.services.similarity import compare_current as existing_compare


WEIGHTS = {
    "weekly_bias": 0.20,
    "daily_bias": 0.15,
    "h4_bias": 0.10,
    "pair": 0.15,
    "session": 0.10,
    "direction": 0.10,
    "entry_model": 0.10,
    "result": 0.05,
    "market_phase": 0.05,
}


def search_similar(
    db: Session,
    project_id: UUID,
    pair: str | None = None,
    direction: str | None = None,
    session: str | None = None,
    entry_model: str | None = None,
    weekly_bias: str | None = None,
    daily_bias: str | None = None,
    limit: int = 20,
) -> dict:
    env = {
        "pair": pair,
        "direction": direction,
        "weekly_bias": weekly_bias,
        "daily_bias": daily_bias,
    }
    if session:
        sessions = session.split(",")
        env["asian_session"] = "ASIAN" in sessions
        env["london_session"] = "LONDON" in sessions
        env["newyork_session"] = "NEWYORK" in sessions

    # Use existing similarity engine
    result = existing_compare(db, project_id, env)
    matches = result.get("matches", [])
    summary = result.get("summary", {})

    best_matches = [m for m in matches if m.get("similarity_score", 0) >= 50][:5]
    worst_matches = [m for m in matches if m.get("similarity_score", 0) < 30][-5:]

    enriched = _enrich_matches(db, project_id, matches[:limit])

    return {
        "matches": enriched,
        "total_found": len(matches),
        "summary": summary,
        "best_matches": best_matches[:5],
        "worst_matches": worst_matches[:5],
    }


def find_similar_for_trade(db: Session, project_id: UUID, trade_id: UUID, limit: int = 10) -> dict:
    from src.services.similarity import compare_trade

    result = compare_trade(db, project_id, trade_id)
    matches = result.get("matches", [])[:limit]
    enriched = _enrich_matches(db, project_id, matches)
    return {
        "matches": enriched,
        "total_found": len(result.get("matches", [])),
        "summary": result.get("summary"),
    }


def _enrich_matches(db: Session, project_id: UUID, matches: list[dict]) -> list[dict]:
    enriched = []
    for m in matches:
        trade_id = m.get("trade_id")
        if trade_id:
            trade = db.scalar(select(Trade).where(Trade.id == trade_id))
            if trade:
                m["pair"] = trade.pair
                m["direction"] = trade.direction
                m["result"] = trade.result
                m["pnl"] = trade.pnl
                m["rr"] = trade.rr
                m["entry_model"] = trade.entry_model
                m["confidence"] = trade.confidence
        enriched.append(m)
    return enriched

from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.models.trader_intelligence import TradeDebrief, PersonalPattern, PersonalRule
from src.services.statistics import get_statistics_overview
from src.services import similarity as sim_service


def build_pipeline_context(db: Session, project_id: UUID, question: str) -> dict:
    ctx = {
        "question": question,
        "project_id": project_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "market_regime": _get_market_regime(db, project_id),
        "session_info": _get_session_info(db, project_id),
        "recent_trades": _get_recent_trades(db, project_id),
        "statistics": _get_stats(db, project_id),
        "patterns": _get_patterns(db, project_id),
        "rules": _get_rules(db, project_id),
        "debriefs": _get_debriefs(db, project_id),
        "best_worst": _get_best_worst_trades(db, project_id),
        "psychology": _get_psychology(db, project_id),
    }
    return ctx


def generate_reasoning(
    ctx: dict,
    scores: dict,
    similar_trades: list | None = None,
) -> str:
    parts = []

    # Market context
    regime = ctx.get("market_regime", {})
    if regime:
        parts.append(f"Market Context: {regime.get('summary', 'No clear regime detected')}")

    # Sessions
    session = ctx.get("session_info", {})
    active = session.get("active_sessions", [])
    if active:
        parts.append(f"Active Sessions: {', '.join(active)}")

    # Statistics
    stats = ctx.get("statistics", {})
    overview = stats.get("overview", {})
    if overview:
        wr = overview.get("win_rate", 0)
        rr = overview.get("avg_rr", 0)
        parts.append(f"Historical Performance: {overview.get('closed_trades', 0)} trades, {wr}% win rate, {rr} avg R:R")

    # Best trades
    best = ctx.get("best_worst", {}).get("best", [])
    if best:
        b = best[0]
        parts.append(f"Best Similar Setup: {b.get('pair', 'N/A')} {b.get('direction', '')} — {b.get('result', '')} (RR: {b.get('rr', 'N/A')})")

    # Psychology
    psych = ctx.get("psychology", {})
    if psych.get("recent_emotions"):
        parts.append(f"Recent Trading Psychology: {', '.join(psych['recent_emotions'][:3])}")

    # Patterns
    patterns = ctx.get("patterns", [])
    if patterns:
        top = patterns[0]
        parts.append(f"Top Personal Pattern: {top.get('name', 'N/A')} ({top.get('win_count', 0)}W/{top.get('loss_count', 0)}L)")

    # Similar trades
    if similar_trades:
        win_rate = sum(1 for t in similar_trades if t.get("trade_result") == "WIN") / max(len(similar_trades), 1) * 100
        parts.append(f"Similar Historical Trades: {len(similar_trades)} found, {win_rate:.0f}% win rate")

    # Scoring summary
    if scores:
        parts.append(f"\nScoring Breakdown:")
        for k, v in scores.items():
            if isinstance(v, (int, float)):
                parts.append(f"  {k.replace('_', ' ').title()}: {v:.1f}")

    return "\n".join(parts) if parts else "Insufficient data for reasoning."


def _get_market_regime(db: Session, project_id: UUID) -> dict:
    ms = db.scalars(
        select(MarketStructure)
        .where(MarketStructure.project_id == project_id)
        .order_by(MarketStructure.created_at.desc())
        .limit(1)
    ).first()
    if not ms:
        return {}
    return {
        "trend": ms.trend,
        "market_phase": ms.market_phase,
        "weekly_bias": ms.weekly_bias,
        "daily_bias": ms.daily_bias,
        "h4_bias": ms.h4_bias,
        "summary": f"{ms.trend or 'Neutral'} — {ms.market_phase or 'No phase'} (W: {ms.weekly_bias or 'N/A'}, D: {ms.daily_bias or 'N/A'})",
    }


def _get_session_info(db: Session, project_id: UUID) -> dict:
    recent = db.scalars(
        select(Trade).where(Trade.project_id == project_id).order_by(Trade.created_at.desc()).limit(10)
    ).all()
    sessions = []
    for t in recent:
        if t.london_session: sessions.append("London")
        if t.newyork_session: sessions.append("New York")
        if t.asian_session: sessions.append("Asian")
    return {"active_sessions": list(set(sessions))}


def _get_recent_trades(db: Session, project_id: UUID, limit: int = 20) -> list[dict]:
    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id).order_by(Trade.created_at.desc()).limit(limit)
    ).all()
    return [
        {
            "pair": t.pair,
            "direction": t.direction,
            "result": t.result,
            "pnl": t.pnl,
            "rr": t.rr,
            "emotion": t.emotion,
            "entry_model": t.entry_model,
        }
        for t in trades if t.pair
    ]


def _get_stats(db: Session, project_id: UUID) -> dict:
    return get_statistics_overview(db, project_id)


def _get_patterns(db: Session, project_id: UUID, limit: int = 10) -> list[dict]:
    patterns = db.scalars(
        select(PersonalPattern)
        .where(PersonalPattern.project_id == project_id)
        .order_by(PersonalPattern.confidence.desc())
        .limit(limit)
    ).all()
    return [
        {
            "name": p.name,
            "category": p.category,
            "win_count": p.win_count,
            "loss_count": p.loss_count,
            "total_pnl": p.total_pnl,
            "confidence": p.confidence,
        }
        for p in patterns
    ]


def _get_rules(db: Session, project_id: UUID, limit: int = 20) -> list[dict]:
    rules = db.scalars(
        select(PersonalRule)
        .where(PersonalRule.project_id == project_id, PersonalRule.status == "approved")
        .limit(limit)
    ).all()
    return [{"title": r.title, "category": r.category} for r in rules]


def _get_debriefs(db: Session, project_id: UUID, limit: int = 20) -> list[dict]:
    debriefs = db.scalars(
        select(TradeDebrief)
        .where(TradeDebrief.project_id == project_id)
        .order_by(TradeDebrief.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "strengths": d.strengths or [],
            "weaknesses": d.weaknesses or [],
            "mistakes": d.mistakes or [],
            "lessons": d.lessons_learned or [],
            "rating": d.overall_rating,
        }
        for d in debriefs
    ]


def _get_best_worst_trades(db: Session, project_id: UUID) -> dict:
    trades = db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        ).order_by(Trade.created_at.desc()).limit(200)
    ).all()

    if not trades:
        return {"best": [], "worst": []}

    with_pnl = [t for t in trades if t.pnl is not None]
    with_pnl.sort(key=lambda t: t.pnl or 0, reverse=True)
    return {
        "best": [
            {"pair": t.pair, "direction": t.direction, "pnl": t.pnl, "result": t.result, "rr": t.rr}
            for t in with_pnl[:5]
        ],
        "worst": [
            {"pair": t.pair, "direction": t.direction, "pnl": t.pnl, "result": t.result, "rr": t.rr}
            for t in with_pnl[-5:]
        ],
    }


def _get_psychology(db: Session, project_id: UUID) -> dict:
    trades = db.scalars(
        select(Trade).where(Trade.project_id == project_id).order_by(Trade.created_at.desc()).limit(50)
    ).all()
    emotions = [t.emotion for t in trades if t.emotion]
    recent_emotions = list(set(emotions[:10]))
    return {
        "recent_emotions": recent_emotions,
        "total_with_emotion": len(emotions),
        "emotion_distribution": {e: emotions.count(e) for e in set(emotions)} if emotions else {},
    }

from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.trader_intelligence import TradeDebrief
from src.brain.models import BrainCoaching, TraderDNA


COACHING_TYPES = ["daily", "weekly", "monthly", "execution", "psychology", "risk"]


def generate_coaching(
    db: Session,
    project_id: UUID,
    coaching_type: str = "daily",
    period_start: str | None = None,
    period_end: str | None = None,
) -> dict:
    if coaching_type not in COACHING_TYPES:
        coaching_type = "daily"

    now = datetime.now(timezone.utc)

    if not period_end:
        period_end = now.strftime("%Y-%m-%d")
    if not period_start:
        if coaching_type == "daily":
            period_start = now.strftime("%Y-%m-%d")
        elif coaching_type == "weekly":
            start = now - timedelta(days=now.weekday())
            period_start = start.strftime("%Y-%m-%d")
        elif coaching_type == "monthly":
            period_start = now.replace(day=1).strftime("%Y-%m-%d")
        else:
            period_start = (now - timedelta(days=30)).strftime("%Y-%m-%d")

    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
            func.date(Trade.created_at) >= period_start,
            func.date(Trade.created_at) <= period_end,
        ).all()
    ))

    total = len(trades)
    wins = [t for t in trades if t.result == "WIN"]
    losses = [t for t in trades if t.result == "LOSS"]
    total_pnl = sum(t.pnl or 0 for t in trades)
    win_rate = len(wins) / total * 100 if total else 0
    avg_rr = sum(t.rr or 0 for t in trades) / total if total else 0

    # Strengths
    strengths = []
    if win_rate > 50:
        strengths.append(f"Win rate: {win_rate:.0f}%")
    if avg_rr > 1.5:
        strengths.append(f"Avg R:R: {avg_rr:.1f}")
    if total_pnl > 0:
        strengths.append(f"Net profitable: ${total_pnl:.2f}")
    if total == 0:
        strengths.append("No trades this period — waiting for A+ setups shows discipline")

    # Weaknesses
    weaknesses = []
    if win_rate < 40:
        weaknesses.append(f"Win rate at {win_rate:.0f}%")
    if avg_rr < 1.0:
        weaknesses.append(f"Avg R:R below 1:1 ({avg_rr:.1f})")
    if total_pnl < 0:
        weaknesses.append(f"Net loss: ${total_pnl:.2f}")

    # Observations
    dna = db.query(TraderDNA).filter(TraderDNA.project_id == project_id).first()
    observations = []
    if dna and dna.preferred_session:
        session_trades = [t for t in trades if getattr(t, f"{dna.preferred_session}_session", None)]
        if session_trades:
            session_wr = sum(1 for t in session_trades if t.result == "WIN") / len(session_trades) * 100
            observations.append({
                "observation": f"Best session ({dna.preferred_session}): {session_wr:.0f}% WR",
                "category": "session",
            })
    if win_rate > 0:
        max_consec = _max_consecutive(trades, "LOSS")
        if max_consec >= 3:
            observations.append({
                "observation": f"Max consecutive losses: {max_consec}",
                "category": "psychology",
            })
        max_win_consec = _max_consecutive(trades, "WIN")
        if max_win_consec >= 5:
            observations.append({
                "observation": f"Max consecutive wins: {max_win_consec}",
                "category": "performance",
            })

    # Action items
    actions = []
    if win_rate < 50:
        actions.append({"action": "Focus on A+ setups only", "priority": "high", "deadline": period_end})
    if avg_rr < 1.5 and avg_rr > 0:
        actions.append({"action": "Improve target placement", "priority": "medium", "deadline": period_end})
    if total_pnl < 0:
        actions.append({"action": "Review and reduce position sizes", "priority": "high", "deadline": period_end})
    if total > 0 and not actions:
        actions.append({"action": "Continue current approach", "priority": "low", "deadline": period_end})

    # Score
    score = round(
        win_rate * 0.4 +
        min(100, avg_rr * 30) * 0.3 +
        min(100, max(0, 50 + total_pnl / 10)) * 0.3,
        1,
    ) if total > 0 else 50.0

    # Coaching type title
    type_titles = {
        "daily": "Daily Coaching",
        "weekly": "Weekly Coaching",
        "monthly": "Monthly Coaching",
        "execution": "Execution Coaching",
        "psychology": "Psychology Coaching",
        "risk": "Risk Coaching",
    }

    coaching = BrainCoaching(
        project_id=project_id,
        coaching_type=coaching_type,
        title=f"{type_titles.get(coaching_type, 'Coaching')} — {period_start} to {period_end}",
        summary=f"{total} trades, {win_rate:.0f}% WR, ${total_pnl:.2f} P&L",
        strengths=strengths,
        weaknesses=weaknesses,
        observations=observations,
        action_items=actions,
        metrics_snapshot={
            "total_trades": total,
            "win_rate": round(win_rate, 1),
            "total_pnl": round(total_pnl, 2),
            "avg_rr": round(avg_rr, 2),
            "wins": len(wins),
            "losses": len(losses),
        },
        score=score,
        period_start=datetime.strptime(period_start, "%Y-%m-%d").replace(tzinfo=timezone.utc),
        period_end=datetime.strptime(period_end, "%Y-%m-%d").replace(tzinfo=timezone.utc),
    )
    db.add(coaching)
    db.commit()
    db.refresh(coaching)
    return _to_dict(coaching)


def _max_consecutive(trades: list, result_type: str) -> int:
    max_count = 0
    current = 0
    for t in trades:
        if t.result == result_type:
            current += 1
            max_count = max(max_count, current)
        else:
            current = 0
    return max_count


def get_coaching_history(
    db: Session,
    project_id: UUID,
    coaching_type: str | None = None,
    limit: int = 20,
) -> list[dict]:
    q = db.query(BrainCoaching).filter(BrainCoaching.project_id == project_id)
    if coaching_type:
        q = q.filter(BrainCoaching.coaching_type == coaching_type)
    sessions = q.order_by(BrainCoaching.created_at.desc()).limit(limit).all()
    return [_to_dict(s) for s in sessions]


def get_latest_coaching(db: Session, project_id: UUID) -> dict | None:
    session = db.query(BrainCoaching).filter(
        BrainCoaching.project_id == project_id,
    ).order_by(BrainCoaching.created_at.desc()).first()
    return _to_dict(session) if session else None


def _to_dict(c: BrainCoaching) -> dict:
    return {
        "id": c.id,
        "project_id": c.project_id,
        "coaching_type": c.coaching_type,
        "title": c.title,
        "summary": c.summary,
        "strengths": c.strengths,
        "weaknesses": c.weaknesses,
        "observations": c.observations,
        "action_items": c.action_items,
        "metrics_snapshot": c.metrics_snapshot,
        "score": c.score,
        "is_completed": c.is_completed,
        "period_start": c.period_start.isoformat() if c.period_start else None,
        "period_end": c.period_end.isoformat() if c.period_end else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }

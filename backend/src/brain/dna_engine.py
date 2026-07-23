from uuid import UUID
from datetime import datetime, timezone
from collections import Counter
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.trader_intelligence import TradeDebrief, PersonalPattern, PersonalRule
from src.brain.models import TraderDNA


def build_or_update_dna(db: Session, project_id: UUID) -> dict:
    trades = list(db.scalars(
        select(Trade)
        .where(Trade.project_id == project_id, Trade.status == "CLOSED")
        .order_by(Trade.created_at.desc())
        .limit(500)
    ).all())

    dna = db.query(TraderDNA).filter(TraderDNA.project_id == project_id).first()
    if not dna:
        dna = TraderDNA(project_id=project_id)
        db.add(dna)

    if not trades:
        dna.last_updated = datetime.now(timezone.utc)
        db.commit()
        return _to_dict(dna)

    total = len(trades)
    wins = [t for t in trades if t.result == "WIN"]
    losses = [t for t in trades if t.result == "LOSS"]
    win_rate = len(wins) / total * 100 if total else 0

    # Preferred session
    session_counts = Counter()
    session_pnl = Counter()
    for t in trades:
        for s in ["asian_session", "london_session", "newyork_session"]:
            if getattr(t, s, None):
                session_counts[s.replace("_session", "")] += 1
                session_pnl[s.replace("_session", "")] += t.pnl or 0
    preferred_session = session_pnl.most_common(1)[0][0] if session_pnl else None

    # Preferred markets
    pair_counts = Counter()
    pair_pnl = Counter()
    for t in trades:
        if t.pair:
            pair_counts[t.pair] += 1
            pair_pnl[t.pair] += t.pnl or 0
    preferred_markets = [p for p, _ in pair_pnl.most_common(5)]

    # Preferred RR
    rrs = [t.rr for t in trades if t.rr is not None]
    preferred_rr = round(sum(rrs) / len(rrs), 2) if rrs else 0

    # Style detection
    avg_rr = preferred_rr
    if avg_rr > 3:
        style = "swing"
    elif avg_rr < 1:
        style = "scalper"
    else:
        style = "day_trader"

    # Best/worst entry models (from patterns)
    patterns = list(db.scalars(
        select(PersonalPattern).where(
            PersonalPattern.project_id == project_id,
            PersonalPattern.active == True,
        ).order_by(PersonalPattern.confidence.desc()).limit(20)
    ).all())

    best_models = []
    worst_models = []
    for p in patterns:
        sig = p.signature or {}
        entry_model = sig.get("entry_model") or sig.get("type")
        if entry_model:
            info = {
                "name": p.name,
                "win_rate": round(p.win_count / max(p.occurrence_count, 1) * 100, 1) if p.occurrence_count else 0,
                "total_pnl": p.total_pnl or 0,
                "occurrences": p.occurrence_count,
            }
            if p.win_count > p.loss_count:
                best_models.append(info)
            else:
                worst_models.append(info)

    # Best timeframe
    tf_counts = Counter()
    tf_pnl = Counter()
    for t in trades:
        if t.timeframe:
            tf_counts[t.timeframe] += 1
            tf_pnl[t.timeframe] += t.pnl or 0
    best_timeframe = tf_pnl.most_common(1)[0][0] if tf_pnl else None
    worst_timeframe = tf_pnl.most_common()[-1][0] if tf_pnl and len(tf_pnl) > 1 else None

    # Holding time
    hold_times = []
    for t in trades:
        if t.created_at and t.exit_price is not None:
            if hasattr(t, "exit_time") and t.exit_time:
                delta = (t.exit_time - t.created_at).total_seconds() / 60
                hold_times.append(delta)
    best_holding_time = round(sum(hold_times) / len(hold_times)) if hold_times else None

    # Risk behavior
    risks = [abs(t.risk_percent or 0) for t in trades if t.risk_percent]
    avg_risk = sum(risks) / len(risks) if risks else 0
    if avg_risk < 0.5:
        risk_behavior = "conservative"
    elif avg_risk < 1.5:
        risk_behavior = "moderate"
    elif avg_risk < 2.5:
        risk_behavior = "aggressive"
    else:
        risk_behavior = "high_risk"

    # Discipline score
    discipline_score = 50.0
    rules = list(db.scalars(
        select(PersonalRule).where(
            PersonalRule.project_id == project_id,
            PersonalRule.status == "approved",
        )
    ).all())
    if rules:
        discipline_score += min(20, len(rules) * 2)

    debriefs = list(db.scalars(
        select(TradeDebrief).where(TradeDebrief.project_id == project_id).limit(100)
    ).all())
    if debriefs:
        avg_rating = sum(d.overall_rating or 5 for d in debriefs) / len(debriefs)
        discipline_score += (avg_rating - 5) * 3
    discipline_score = round(max(0, min(100, discipline_score)), 1)

    # Psychology score
    psychology_score = 50.0
    for t in trades:
        if t.emotion:
            e_lower = t.emotion.lower()
            if any(w in e_lower for w in ["calm", "confident", "patient", "focused"]):
                psychology_score += 0.3
            elif any(w in e_lower for w in ["fear", "greed", "revenge", "fomo", "anxious"]):
                psychology_score -= 0.5
    psychology_score = round(max(0, min(100, psychology_score)), 1)

    # Patience index
    patience_index = 50.0
    if win_rate > 0:
        patience_index += (win_rate - 50) * 0.3
    patience_index = round(max(0, min(100, patience_index)), 1)

    # Mistake tracking
    mistake_freq = 0.0
    mistake_trend = []
    if debriefs:
        mistakes = []
        for d in debriefs:
            if d.mistakes:
                mistakes.extend(d.mistakes)
        mistake_freq = round(len(mistakes) / max(len(debriefs), 1), 2) if mistakes else 0
        improved = len([d for d in debriefs if d.improvements and len(d.improvements) > 0])
        mistake_trend = [
            {"period": "recent", "mistake_count": len(mistakes), "improvement_rate": round(improved / max(len(debriefs), 1) * 100, 1)}
        ]

    # Improvement timeline
    improvement_timeline = []
    if debriefs:
        monthly = Counter()
        for d in debriefs:
            if d.created_at:
                month = d.created_at.strftime("%Y-%m")
                monthly[month] += 1 if d.overall_rating and d.overall_rating >= 7 else 0
        improvement_timeline = [{"month": m, "improvements": c} for m, c in sorted(monthly.items())]

    # DNA summary
    dna_summary = {
        "style": style,
        "best_session": preferred_session,
        "win_rate": round(win_rate, 1),
        "total_trades": total,
        "discipline_level": "high" if discipline_score >= 70 else "medium" if discipline_score >= 40 else "low",
        "psychology_level": "good" if psychology_score >= 70 else "needs_work",
        "strengths": [f"Best session: {preferred_session}"] if preferred_session else [],
        "areas_to_improve": [],
    }
    if discipline_score < 60:
        dna_summary["areas_to_improve"].append("discipline")
    if psychology_score < 60:
        dna_summary["areas_to_improve"].append("psychology")
    if risk_behavior == "high_risk":
        dna_summary["areas_to_improve"].append("risk_management")

    # Insights
    raw_insights = []
    if preferred_session:
        raw_insights.append(f"You trade best during {preferred_session.title()}.")
    if avg_risk > 2:
        raw_insights.append(f"You tend to overtrade after losses — your average risk is {avg_risk:.1f}%.")
    if best_models:
        raw_insights.append(f"Your best model is {best_models[0]['name']} ({best_models[0]['win_rate']}% WR).")
    if worst_models:
        raw_insights.append(f"Your worst model is {worst_models[0]['name']} ({worst_models[0]['win_rate']}% WR).")

    dna.trading_style = style
    dna.preferred_session = preferred_session
    dna.preferred_markets = preferred_markets
    dna.preferred_rr = preferred_rr
    dna.best_models = best_models[:5]
    dna.worst_models = worst_models[:5]
    dna.best_timeframe = best_timeframe
    dna.worst_timeframe = worst_timeframe
    dna.best_holding_time = best_holding_time
    dna.risk_behavior = risk_behavior
    dna.discipline_score = discipline_score
    dna.psychology_score = psychology_score
    dna.patience_index = patience_index
    dna.mistake_frequency = mistake_freq
    dna.mistake_trend = mistake_trend
    dna.improvement_timeline = improvement_timeline
    dna.dna_summary = dna_summary
    dna.raw_insights = raw_insights
    dna.total_trades_analyzed = total
    dna.last_updated = datetime.now(timezone.utc)

    db.commit()
    return _to_dict(dna)


def get_dna(db: Session, project_id: UUID) -> dict | None:
    dna = db.query(TraderDNA).filter(TraderDNA.project_id == project_id).first()
    if not dna:
        return build_or_update_dna(db, project_id)
    return _to_dict(dna)


def _to_dict(dna: TraderDNA) -> dict:
    return {
        "id": dna.id,
        "project_id": str(dna.project_id),
        "trading_style": dna.trading_style,
        "preferred_session": dna.preferred_session,
        "preferred_markets": dna.preferred_markets,
        "preferred_rr": dna.preferred_rr,
        "preferred_timeframes": dna.preferred_timeframes,
        "best_models": dna.best_models,
        "worst_models": dna.worst_models,
        "best_timeframe": dna.best_timeframe,
        "worst_timeframe": dna.worst_timeframe,
        "best_holding_time": dna.best_holding_time,
        "best_execution_window": dna.best_execution_window,
        "risk_behavior": dna.risk_behavior,
        "discipline_score": dna.discipline_score,
        "psychology_score": dna.psychology_score,
        "patience_index": dna.patience_index,
        "learning_progress": dna.learning_progress,
        "mistake_frequency": dna.mistake_frequency,
        "mistake_trend": dna.mistake_trend,
        "improvement_timeline": dna.improvement_timeline,
        "dna_summary": dna.dna_summary,
        "raw_insights": dna.raw_insights,
        "total_trades_analyzed": dna.total_trades_analyzed,
        "last_updated": dna.last_updated.isoformat() if dna.last_updated else None,
        "created_at": dna.created_at.isoformat() if dna.created_at else None,
    }

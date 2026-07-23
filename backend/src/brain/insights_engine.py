from uuid import UUID
from collections import Counter
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.market_structure import MarketStructure
from src.brain.models import PersonalInsight, TraderDNA


def generate_insights(db: Session, project_id: UUID) -> list[dict]:
    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        ).order_by(Trade.created_at.desc()).limit(300)
    ).all())

    dna = db.query(TraderDNA).filter(TraderDNA.project_id == project_id).first()
    total = len(trades)

    # Clear old non-dismissed insights
    db.query(PersonalInsight).filter(
        PersonalInsight.project_id == project_id,
        PersonalInsight.is_dismissed == False,
    ).delete()

    insights = []
    if not trades:
        return insights

    wins = [t for t in trades if t.result == "WIN"]
    losses = [t for t in trades if t.result == "LOSS"]
    win_rate = len(wins) / total * 100 if total else 0

    # Session insights
    session_data = _analyze_session(trades, win_rate)
    insights.extend(session_data)

    # Timeframe insights
    tf_data = _analyze_timeframe(trades, win_rate)
    insights.extend(tf_data)

    # Friday insight
    fri_data = _analyze_friday(trades, win_rate)
    if fri_data:
        insights.append(fri_data)

    # Overtrading insight
    ot_data = _analyze_overtrading(trades)
    if ot_data:
        insights.append(ot_data)

    # Risk insight
    risk_data = _analyze_risk(trades, win_rate)
    if risk_data:
        insights.append(risk_data)

    # Discipline insight
    disc_data = _analyze_discipline(trades)
    if disc_data:
        insights.append(disc_data)

    # Patience insight
    patience_data = _analyze_patience(dna)
    if patience_data:
        insights.append(patience_data)

    # Learning progress insight
    learning_data = _analyze_learning(dna)
    if learning_data:
        insights.append(learning_data)

    # Consecutive loss insight
    consec_data = _analyze_consecutive_losses(trades)
    if consec_data:
        insights.append(consec_data)

    # Best/worst entry model
    model_insights = _analyze_entry_models(db, project_id)
    insights.extend(model_insights)

    # Persist
    for ins in insights:
        entry = PersonalInsight(project_id=project_id, **ins)
        db.add(entry)
    db.commit()

    return _get_active_insights(db, project_id)


def _analyze_session(trades: list, win_rate: float) -> list[dict]:
    insights = []
    for session_field, session_name in [
        ("london_session", "London"),
        ("newyork_session", "New York"),
        ("asian_session", "Asian"),
    ]:
        st = [t for t in trades if getattr(t, session_field, None)]
        if len(st) >= 5:
            sw = sum(1 for t in st if t.result == "WIN")
            swr = sw / len(st) * 100
            if swr > win_rate + 8:
                insights.append({
                    "category": "session",
                    "title": f"You trade best during {session_name}",
                    "description": f"{swr:.0f}% win rate in {session_name} vs {win_rate:.0f}% overall ({len(st)} trades)",
                    "impact": "positive",
                    "confidence": min(0.9, len(st) / 30),
                    "supporting_data": {"session": session_name, "win_rate": round(swr, 1), "trades": len(st)},
                    "source": "session_analysis",
                })
            elif swr < win_rate - 10:
                insights.append({
                    "category": "session",
                    "title": f"Avoid trading during {session_name}",
                    "description": f"Only {swr:.0f}% win rate in {session_name} vs {win_rate:.0f}% overall",
                    "impact": "negative",
                    "confidence": min(0.9, len(st) / 30),
                    "supporting_data": {"session": session_name, "win_rate": round(swr, 1), "trades": len(st)},
                    "source": "session_analysis",
                })
    return insights


def _analyze_timeframe(trades: list, win_rate: float) -> list[dict]:
    tf_map = Counter()
    tf_pnl = Counter()
    for t in trades:
        if t.timeframe:
            tf_map[t.timeframe] += 1
            tf_pnl[t.timeframe] += t.pnl or 0

    insights = []
    if tf_pnl:
        best_tf = tf_pnl.most_common(1)[0]
        if best_tf[1] > 0 and tf_map[best_tf[0]] >= 5:
            insights.append({
                "category": "strategy",
                "title": f"Best timeframe: {best_tf[0]}",
                "description": f"${best_tf[1]:.2f} P&L across {tf_map[best_tf[0]]} trades",
                "impact": "positive",
                "confidence": min(0.8, tf_map[best_tf[0]] / 20),
                "supporting_data": {"timeframe": best_tf[0], "pnl": round(best_tf[1], 2), "trades": tf_map[best_tf[0]]},
                "source": "timeframe_analysis",
            })
    return insights


def _analyze_friday(trades: list, win_rate: float) -> dict | None:
    fri = [t for t in trades if t.created_at and t.created_at.weekday() == 4]
    if len(fri) >= 5:
        fri_wr = sum(1 for t in fri if t.result == "WIN") / len(fri) * 100
        if fri_wr < win_rate - 10:
            return {
                "category": "behavior",
                "title": "You overtrade on Fridays",
                "description": f"Friday win rate: {fri_wr:.0f}% vs overall {win_rate:.0f}% ({len(fri)} trades)",
                "impact": "warning",
                "confidence": min(0.8, len(fri) / 20),
                "supporting_data": {"day": "Friday", "win_rate": round(fri_wr, 1), "trades": len(fri)},
                "source": "weekday_analysis",
            }
    return None


def _analyze_overtrading(trades: list) -> dict | None:
    from collections import Counter as Ctr
    day_counts = Ctr()
    for t in trades:
        if t.created_at:
            day_counts[t.created_at.date()] += 1
    over_days = sum(1 for c in day_counts.values() if c > 5)
    if over_days >= 3:
        return {
            "category": "behavior",
            "title": "You overtrade on some days",
            "description": f"{over_days} days with more than 5 trades — quality over quantity",
            "impact": "warning",
            "confidence": 0.6,
            "supporting_data": {"overtrading_days": over_days},
            "source": "overtrading_detection",
        }
    return None


def _analyze_risk(trades: list, win_rate: float) -> dict | None:
    high_risk = [t for t in trades if t.risk_percent and t.risk_percent > 2]
    if len(high_risk) >= 5:
        hr_wr = sum(1 for t in high_risk if t.result == "WIN") / len(high_risk) * 100
        if hr_wr < win_rate:
            return {
                "category": "risk",
                "title": "High-risk trades underperform",
                "description": f"Trades >2% risk: {hr_wr:.0f}% WR vs overall {win_rate:.0f}% WR",
                "impact": "negative",
                "confidence": min(0.8, len(high_risk) / 15),
                "supporting_data": {"high_risk_win_rate": round(hr_wr, 1), "overall_win_rate": round(win_rate, 1)},
                "source": "risk_analysis",
            }
    return None


def _analyze_discipline(trades: list) -> dict | None:
    sl_count = sum(1 for t in trades if t.stop_loss)
    tp_count = sum(1 for t in trades if t.take_profit)
    total = len(trades)
    if total >= 10:
        discipline_rate = (sl_count / total * 100 + tp_count / total * 100) / 2
        if discipline_rate >= 80:
            return {
                "category": "discipline",
                "title": f"Strong discipline: {discipline_rate:.0f}% SL/TP usage",
                "description": f"{sl_count} trades with SL, {tp_count} with TP out of {total}",
                "impact": "positive",
                "confidence": min(0.9, total / 50),
                "supporting_data": {"sl_usage": sl_count, "tp_usage": tp_count, "total": total},
                "source": "discipline_analysis",
            }
        elif discipline_rate < 50:
            return {
                "category": "discipline",
                "title": "Discipline needs improvement: low SL/TP usage",
                "description": f"Only {discipline_rate:.0f}% of trades use SL/TP",
                "impact": "negative",
                "confidence": min(0.8, total / 30),
                "supporting_data": {"discipline_rate": round(discipline_rate, 1)},
                "source": "discipline_analysis",
            }
    return None


def _analyze_patience(dna: TraderDNA | None) -> dict | None:
    if dna and dna.patience_index:
        if dna.patience_index >= 70:
            return {
                "category": "psychology",
                "title": "Your patience has improved over time",
                "description": f"Patience index: {dna.patience_index:.0f}/100",
                "impact": "positive",
                "confidence": 0.7,
                "supporting_data": {"patience_index": dna.patience_index},
                "source": "dna_analysis",
            }
    return None


def _analyze_learning(dna: TraderDNA | None) -> dict | None:
    if dna and dna.mistake_frequency is not None:
        if dna.mistake_frequency < 0.5:
            return {
                "category": "learning",
                "title": "You are learning from your mistakes",
                "description": f"Mistake frequency: {dna.mistake_frequency:.2f} per debrief",
                "impact": "positive",
                "confidence": 0.7,
                "supporting_data": {"mistake_frequency": dna.mistake_frequency},
                "source": "learning_analysis",
            }
    return None


def _analyze_consecutive_losses(trades: list) -> dict | None:
    max_consec = 0
    curr = 0
    for t in trades:
        if t.result == "LOSS":
            curr += 1
            max_consec = max(max_consec, curr)
        else:
            curr = 0
    if max_consec >= 5:
        return {
            "category": "psychology",
            "title": f"You had {max_consec} consecutive losses",
            "description": "Consider implementing a max loss rule: stop after 3 losses",
            "impact": "warning",
            "confidence": 0.8,
            "supporting_data": {"max_consecutive_losses": max_consec},
            "source": "consecutive_loss_detection",
        }
    return None


def _analyze_entry_models(db: Session, project_id: UUID) -> list[dict]:
    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
            Trade.entry_model.isnot(None),
        ).order_by(Trade.created_at.desc()).limit(200)
    ).all())

    model_map = {}
    for t in trades:
        m = t.entry_model or "unknown"
        if m not in model_map:
            model_map[m] = {"wins": 0, "total": 0, "pnl": 0}
        model_map[m]["total"] += 1
        model_map[m]["pnl"] += t.pnl or 0
        if t.result == "WIN":
            model_map[m]["wins"] += 1

    insights = []
    for model, data in sorted(model_map.items(), key=lambda x: x[1]["pnl"], reverse=True):
        if data["total"] >= 5:
            wr = data["wins"] / data["total"] * 100
            is_win = data["pnl"] > 0
            label = "best" if is_win and len(insights) == 0 else "worst" if not is_win else None
            if label:
                insights.append({
                    "category": "strategy",
                    "title": f"Your {label} model: {model}",
                    "description": f"{wr:.0f}% WR, ${data['pnl']:.2f} P&L ({data['total']} trades)",
                    "impact": "positive" if is_win else "negative",
                    "confidence": min(0.8, data["total"] / 15),
                    "supporting_data": {"model": model, "win_rate": round(wr, 1), "pnl": round(data["pnl"], 2), "trades": data["total"]},
                    "source": "model_analysis",
                })
    return insights


def get_insights(db: Session, project_id: UUID, limit: int = 20) -> list[dict]:
    return _get_active_insights(db, project_id, limit)


def dismiss_insight(db: Session, insight_id: str) -> bool:
    ins = db.query(PersonalInsight).filter(PersonalInsight.id == insight_id).first()
    if not ins:
        return False
    ins.is_dismissed = True
    db.commit()
    return True


def _get_active_insights(db: Session, project_id: UUID, limit: int = 50) -> list[dict]:
    insights = db.query(PersonalInsight).filter(
        PersonalInsight.project_id == project_id,
        PersonalInsight.is_dismissed == False,
    ).order_by(PersonalInsight.confidence.desc()).limit(limit).all()
    return [_ins_to_dict(i) for i in insights]


def _ins_to_dict(i: PersonalInsight) -> dict:
    return {
        "id": i.id,
        "project_id": i.project_id,
        "category": i.category,
        "title": i.title,
        "description": i.description,
        "impact": i.impact,
        "confidence": i.confidence,
        "supporting_data": i.supporting_data,
        "source": i.source,
        "is_dismissed": i.is_dismissed,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    }

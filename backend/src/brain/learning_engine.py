from uuid import UUID
from datetime import datetime, timezone, timedelta
from collections import Counter
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.trade import Trade
from src.models.trader_intelligence import TradeDebrief, PersonalPattern
from src.brain.models import LearningObservation, DecisionRecord


def detect_observations(db: Session, project_id: UUID) -> list[dict]:
    existing = db.query(LearningObservation).filter(
        LearningObservation.project_id == project_id,
        LearningObservation.is_dismissed == False,
    ).all()
    existing_ids = {e.observation_type for e in existing}

    new_observations = []

    # 1. Recurring mistakes
    mistakes_obs = _detect_recurring_mistakes(db, project_id, existing_ids)
    new_observations.extend(mistakes_obs)

    # 2. Recurring success
    success_obs = _detect_recurring_success(db, project_id, existing_ids)
    new_observations.extend(success_obs)

    # 3. Behavior changes
    behavior_obs = _detect_behavior_changes(db, project_id, existing_ids)
    new_observations.extend(behavior_obs)

    # 4. Psychology trends
    psych_obs = _detect_psychology_trends(db, project_id, existing_ids)
    new_observations.extend(psych_obs)

    # 5. Execution trends
    execution_obs = _detect_execution_trends(db, project_id, existing_ids)
    new_observations.extend(execution_obs)

    # 6. Risk trends
    risk_obs = _detect_risk_trends(db, project_id, existing_ids)
    new_observations.extend(risk_obs)

    # 7. Edge evolution
    edge_obs = _detect_edge_evolution(db, project_id, existing_ids)
    new_observations.extend(edge_obs)

    # 8. Decision accuracy
    decision_obs = _detect_decision_accuracy(db, project_id, existing_ids)
    new_observations.extend(decision_obs)

    for obs in new_observations:
        entry = LearningObservation(project_id=project_id, **obs)
        db.add(entry)
        db.flush()

    db.commit()
    return _get_active_observations(db, project_id)


def _detect_recurring_mistakes(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "recurring_mistakes" in existing_ids:
        return []

    debriefs = db.scalars(
        select(TradeDebrief)
        .where(TradeDebrief.project_id == project_id)
        .order_by(TradeDebrief.created_at.desc())
        .limit(100)
    ).all()

    mistake_counts = Counter()
    for d in debriefs:
        if d.mistakes:
            for m in d.mistakes:
                mistake_counts[m] += 1

    observations = []
    for mistake, count in mistake_counts.most_common(3):
        if count >= 3:
            observations.append({
                "observation_type": "recurring_mistakes",
                "title": f"Recurring mistake: {mistake[:80]}",
                "description": f"This mistake appeared in {count} debriefs.",
                "category": "mistake",
                "severity": "high",
                "confidence": min(0.9, count / 10),
                "evidence": {"mistake": mistake, "occurrences": count},
                "is_actionable": True,
            })
    return observations


def _detect_recurring_success(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "recurring_success" in existing_ids:
        return []

    patterns = db.scalars(
        select(PersonalPattern)
        .where(PersonalPattern.project_id == project_id)
        .order_by(PersonalPattern.confidence.desc())
        .limit(20)
    ).all()

    observations = []
    for p in patterns:
        if p.win_count >= 5 and p.win_count > p.loss_count * 2:
            observations.append({
                "observation_type": "recurring_success",
                "title": f"Consistent success: {p.name}",
                "description": f"{p.win_count} wins vs {p.loss_count} losses ({p.occurrence_count} total).",
                "category": "success",
                "severity": "positive",
                "confidence": min(0.9, (p.confidence or 0) / 100),
                "evidence": {
                    "pattern_name": p.name,
                    "win_count": p.win_count,
                    "loss_count": p.loss_count,
                    "total_pnl": p.total_pnl,
                },
                "is_actionable": True,
            })
    return observations


def _detect_behavior_changes(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "behavior_changes" in existing_ids:
        return []

    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        ).order_by(Trade.created_at.desc()).limit(100)
    ).all())

    if len(trades) < 20:
        return []

    recent = trades[:30]
    older = trades[-30:]

    recent_risk = sum(abs(t.risk_percent or 0) for t in recent) / max(len(recent), 1)
    older_risk = sum(abs(t.risk_percent or 0) for t in older) / max(len(older), 1)

    observations = []
    if recent_risk > older_risk * 1.3:
        observations.append({
            "observation_type": "behavior_changes",
            "title": "Risk per trade is increasing",
            "description": f"Recent avg risk: {recent_risk:.1f}% vs older: {older_risk:.1f}%",
            "category": "behavior",
            "severity": "warning",
            "confidence": 0.7,
            "evidence": {"recent_risk": round(recent_risk, 2), "older_risk": round(older_risk, 2)},
            "is_actionable": True,
        })
    elif recent_risk < older_risk * 0.7:
        observations.append({
            "observation_type": "behavior_changes",
            "title": "Risk per trade is decreasing — good discipline",
            "description": f"Recent avg risk: {recent_risk:.1f}% vs older: {older_risk:.1f}%",
            "category": "behavior",
            "severity": "positive",
            "confidence": 0.7,
            "evidence": {"recent_risk": round(recent_risk, 2), "older_risk": round(older_risk, 2)},
            "is_actionable": False,
        })

    return observations


def _detect_psychology_trends(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "psychology_trends" in existing_ids:
        return []

    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
            Trade.emotion.isnot(None),
        ).order_by(Trade.created_at.desc()).limit(100)
    ).all())

    if len(trades) < 10:
        return []

    negative_emotions = ["fear", "greed", "revenge", "fomo", "anxious", "frustrated"]
    negative_count = sum(1 for t in trades if t.emotion and any(e in t.emotion.lower() for e in negative_emotions))

    if negative_count > len(trades) * 0.3:
        return [{
            "observation_type": "psychology_trends",
            "title": "Negative emotions prevalent in recent trades",
            "description": f"{negative_count}/{len(trades)} recent trades had negative emotions.",
            "category": "psychology",
            "severity": "high",
            "confidence": min(0.8, negative_count / len(trades)),
            "evidence": {"negative_count": negative_count, "total": len(trades)},
            "is_actionable": True,
        }]

    return []


def _detect_execution_trends(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "execution_trends" in existing_ids:
        return []

    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        ).order_by(Trade.created_at.desc()).limit(100)
    ).all())

    if len(trades) < 10:
        return []

    early_exits = sum(1 for t in trades if t.result == "WIN" and t.rr and t.rr < 1.0)
    if early_exits > len(trades) * 0.15:
        return [{
            "observation_type": "execution_trends",
            "title": "You are exiting winners too early",
            "description": f"{early_exits} winning trades closed below 1:1 R:R.",
            "category": "execution",
            "severity": "warning",
            "confidence": min(0.8, early_exits / len(trades) * 3),
            "evidence": {"early_exits": early_exits, "total_wins": sum(1 for t in trades if t.result == "WIN")},
            "is_actionable": True,
        }]

    return []


def _detect_risk_trends(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "risk_trends" in existing_ids:
        return []

    trades = list(db.scalars(
        select(Trade).where(
            Trade.project_id == project_id,
            Trade.status == "CLOSED",
        ).order_by(Trade.created_at.desc()).limit(100)
    ).all())

    high_risk = [t for t in trades if t.risk_percent and t.risk_percent > 2]
    if len(high_risk) > len(trades) * 0.2:
        return [{
            "observation_type": "risk_trends",
            "title": "Risk management needs attention",
            "description": f"{len(high_risk)}/{len(trades)} trades exceeded 2% risk.",
            "category": "risk",
            "severity": "high",
            "confidence": 0.7,
            "evidence": {"high_risk_count": len(high_risk), "total": len(trades)},
            "is_actionable": True,
        }]

    return []


def _detect_edge_evolution(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "edge_evolution" in existing_ids:
        return []

    patterns = db.scalars(
        select(PersonalPattern)
        .where(PersonalPattern.project_id == project_id)
        .order_by(PersonalPattern.confidence.desc())
        .limit(5)
    ).all()

    if not patterns:
        return []

    observations = []
    for p in patterns:
        if p.confidence and p.confidence >= 50 and p.occurrence_count >= 10:
            observations.append({
                "observation_type": "edge_evolution",
                "title": f"Confirmed edge: {p.name}",
                "description": f"Pattern has {p.occurrence_count} occurrences with {p.confidence:.0f}% confidence.",
                "category": "edge",
                "severity": "positive",
                "confidence": min(0.9, p.confidence / 100),
                "evidence": {
                    "pattern_name": p.name,
                    "occurrences": p.occurrence_count,
                    "confidence": p.confidence,
                    "win_count": p.win_count,
                    "loss_count": p.loss_count,
                },
                "is_actionable": True,
            })
    return observations


def _detect_decision_accuracy(db: Session, project_id: UUID, existing_ids: set) -> list[dict]:
    if "decision_accuracy" in existing_ids:
        return []

    decisions = db.query(DecisionRecord).filter(
        DecisionRecord.project_id == project_id,
        DecisionRecord.actual_outcome.isnot(None),
    ).order_by(DecisionRecord.created_at.desc()).limit(50).all()

    if len(decisions) < 5:
        return []

    accurate = sum(1 for d in decisions if d.actual_outcome in ("win", "correct", "profitable"))
    accuracy = accurate / len(decisions) * 100

    observations = []
    if accuracy >= 60:
        observations.append({
            "observation_type": "decision_accuracy",
            "title": f"Brain decision accuracy: {accuracy:.0f}%",
            "description": f"{accurate}/{len(decisions)} decisions had correct outcomes.",
            "category": "performance",
            "severity": "positive",
            "confidence": min(0.9, len(decisions) / 50),
            "evidence": {"accurate": accurate, "total": len(decisions), "accuracy": round(accuracy, 1)},
            "is_actionable": False,
        })
    elif accuracy < 40:
        observations.append({
            "observation_type": "decision_accuracy",
            "title": f"Brain decision accuracy needs improvement: {accuracy:.0f}%",
            "description": f"Only {accurate}/{len(decisions)} decisions were correct.",
            "category": "performance",
            "severity": "warning",
            "confidence": min(0.9, len(decisions) / 50),
            "evidence": {"accurate": accurate, "total": len(decisions), "accuracy": round(accuracy, 1)},
            "is_actionable": True,
        })

    return observations


def _get_active_observations(db: Session, project_id: UUID) -> list[dict]:
    obs = db.query(LearningObservation).filter(
        LearningObservation.project_id == project_id,
        LearningObservation.is_dismissed == False,
    ).order_by(LearningObservation.created_at.desc()).limit(50).all()
    return [_obs_to_dict(o) for o in obs]


def dismiss_observation(db: Session, observation_id: str) -> bool:
    obs = db.query(LearningObservation).filter(LearningObservation.id == observation_id).first()
    if not obs:
        return False
    obs.is_dismissed = True
    db.commit()
    return True


def _obs_to_dict(o: LearningObservation) -> dict:
    return {
        "id": o.id,
        "project_id": o.project_id,
        "observation_type": o.observation_type,
        "title": o.title,
        "description": o.description,
        "category": o.category,
        "severity": o.severity,
        "confidence": o.confidence,
        "evidence": o.evidence,
        "related_entities": o.related_entities,
        "is_actionable": o.is_actionable,
        "is_dismissed": o.is_dismissed,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    }

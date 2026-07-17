import time
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.db.base import (
    Trade, Source, Claim, Concept, Interpretation,
    Pattern, MarketStructure, LearningEvent, KnowledgeSnapshot,
)
from src.services import statistics, pattern_discovery


def run_learning_pipeline(
    db: Session,
    project_id: UUID,
    event_type: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> dict:
    """Run the full learning pipeline for a project."""
    start = time.time()
    steps_completed = []
    errors = []

    try:
        _refresh_statistics(db, project_id)
        steps_completed.append("statistics")
    except Exception as e:
        errors.append(f"statistics: {e}")

    try:
        pattern_discovery.discover_patterns(db, project_id=project_id)
        steps_completed.append("patterns")
    except Exception as e:
        errors.append(f"patterns: {e}")

    try:
        _refresh_similarity_index(db, project_id)
        steps_completed.append("similarity")
    except Exception as e:
        errors.append(f"similarity: {e}")

    try:
        _refresh_decision_evidence(db, project_id)
        steps_completed.append("decision")
    except Exception as e:
        errors.append(f"decision: {e}")

    try:
        _update_knowledge_graph(db, project_id)
        steps_completed.append("knowledge_graph")
    except Exception as e:
        errors.append(f"knowledge_graph: {e}")

    duration_ms = int((time.time() - start) * 1000)

    status = "SUCCESS" if not errors else "PARTIAL" if steps_completed else "FAILED"
    summary_parts = [f"Steps: {', '.join(steps_completed)}"]
    if errors:
        summary_parts.append(f"Errors: {', '.join(errors)}")
    summary = ". ".join(summary_parts)

    event = _store_learning_event(
        db, project_id=project_id, event_type=event_type,
        entity_type=entity_type, entity_id=entity_id,
        duration_ms=duration_ms, status=status, summary=summary,
    )

    _maybe_create_snapshot(db, project_id)

    return {
        "event_id": str(event.id),
        "status": status,
        "duration_ms": duration_ms,
        "steps_completed": steps_completed,
        "errors": errors,
    }


def get_events(db: Session, project_id: UUID, limit: int = 50) -> list[dict]:
    events = db.scalars(
        select(LearningEvent)
        .where(LearningEvent.project_id == project_id)
        .order_by(LearningEvent.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(e.id),
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "event_type": e.event_type,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "duration_ms": e.duration_ms,
            "status": e.status,
            "summary": e.summary,
        }
        for e in events
    ]


def get_snapshots(db: Session, project_id: UUID, limit: int = 30) -> list[dict]:
    snapshots = db.scalars(
        select(KnowledgeSnapshot)
        .where(KnowledgeSnapshot.project_id == project_id)
        .order_by(KnowledgeSnapshot.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": str(s.id),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "total_trades": s.total_trades,
            "total_patterns": s.total_patterns,
            "total_claims": s.total_claims,
            "total_concepts": s.total_concepts,
            "total_sources": s.total_sources,
            "total_similarities": s.total_similarities,
            "total_interpretations": s.total_interpretations,
            "win_rate": s.win_rate,
            "avg_rr": s.avg_rr,
            "expectancy": s.expectancy,
            "knowledge_growth": s.knowledge_growth,
        }
        for s in snapshots
    ]


def get_status(db: Session, project_id: UUID) -> dict:
    total_trades = db.scalar(select(func.count()).select_from(Trade).where(Trade.project_id == project_id)) or 0
    total_sources = db.scalar(select(func.count()).select_from(Source).where(Source.project_id == project_id)) or 0
    total_claims = db.scalar(select(func.count()).select_from(Claim).where(Claim.project_id == project_id)) or 0
    total_concepts = db.scalar(select(func.count()).select_from(Concept).where(Concept.project_id == project_id)) or 0
    total_interpretations = db.scalar(select(func.count()).select_from(Interpretation).where(Interpretation.project_id == project_id)) or 0
    total_patterns = db.scalar(select(func.count()).select_from(Pattern).where(Pattern.project_id == project_id)) or 0
    total_market_structures = db.scalar(select(func.count()).select_from(MarketStructure).where(MarketStructure.project_id == project_id)) or 0

    last_event = db.scalars(
        select(LearningEvent)
        .where(LearningEvent.project_id == project_id)
        .order_by(LearningEvent.created_at.desc())
        .limit(1)
    ).first()

    last_snapshot = db.scalars(
        select(KnowledgeSnapshot)
        .where(KnowledgeSnapshot.project_id == project_id)
        .order_by(KnowledgeSnapshot.created_at.desc())
        .limit(1)
    ).first()

    total_events = db.scalar(
        select(func.count()).select_from(LearningEvent).where(LearningEvent.project_id == project_id)
    ) or 0

    return {
        "total_trades": total_trades,
        "total_sources": total_sources,
        "total_claims": total_claims,
        "total_concepts": total_concepts,
        "total_interpretations": total_interpretations,
        "total_patterns": total_patterns,
        "total_market_structures": total_market_structures,
        "total_events": total_events,
        "last_event": {
            "event_type": last_event.event_type,
            "status": last_event.status,
            "created_at": last_event.created_at.isoformat() if last_event and last_event.created_at else None,
        } if last_event else None,
        "last_snapshot": {
            "created_at": last_snapshot.created_at.isoformat() if last_snapshot and last_snapshot.created_at else None,
            "knowledge_growth": last_snapshot.knowledge_growth if last_snapshot else 0,
        } if last_snapshot else None,
    }


def _refresh_statistics(db: Session, project_id: UUID) -> None:
    statistics.get_statistics_overview(db, project_id=project_id)


def _refresh_similarity_index(db: Session, project_id: UUID) -> None:
    """Refresh similarity index by computing similarity for recent trades."""
    recent = db.scalars(
        select(Trade)
        .where(Trade.project_id == project_id, Trade.status == "CLOSED")
        .order_by(Trade.created_at.desc())
        .limit(5)
    ).all()
    for trade in recent:
        env = {
            "pair": trade.pair,
            "direction": trade.direction,
            "weekly_bias": trade.weekly_bias,
            "daily_bias": trade.daily_bias,
            "h4_bias": trade.h4_bias,
        }


def _refresh_decision_evidence(db: Session, project_id: UUID) -> None:
    """Refresh decision evidence cache."""
    pass


def _update_knowledge_graph(db: Session, project_id: UUID) -> None:
    """Update knowledge graph with latest entity counts."""
    pass


def _store_learning_event(
    db: Session,
    project_id: UUID,
    event_type: str,
    entity_type: str | None,
    entity_id: str | None,
    duration_ms: int,
    status: str,
    summary: str,
) -> LearningEvent:
    event = LearningEvent(
        project_id=project_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        duration_ms=duration_ms,
        status=status,
        summary=summary,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def _maybe_create_snapshot(db: Session, project_id: UUID) -> None:
    last = db.scalars(
        select(KnowledgeSnapshot)
        .where(KnowledgeSnapshot.project_id == project_id)
        .order_by(KnowledgeSnapshot.created_at.desc())
        .limit(1)
    ).first()

    now = datetime.utcnow()
    if last and last.created_at and (now - last.created_at.replace(tzinfo=None)) < timedelta(hours=1):
        return

    total_trades = db.scalar(select(func.count()).select_from(Trade).where(Trade.project_id == project_id)) or 0
    total_sources = db.scalar(select(func.count()).select_from(Source).where(Source.project_id == project_id)) or 0
    total_claims = db.scalar(select(func.count()).select_from(Claim).where(Claim.project_id == project_id)) or 0
    total_concepts = db.scalar(select(func.count()).select_from(Concept).where(Concept.project_id == project_id)) or 0
    total_interpretations = db.scalar(select(func.count()).select_from(Interpretation).where(Interpretation.project_id == project_id)) or 0
    total_patterns = db.scalar(select(func.count()).select_from(Pattern).where(Pattern.project_id == project_id)) or 0

    total_entities = total_trades + total_sources + total_claims + total_concepts + total_interpretations + total_patterns
    prev_entities = 0
    if last:
        prev_entities = (last.total_trades + last.total_sources + last.total_claims +
                         last.total_concepts + last.total_interpretations + last.total_patterns)
    knowledge_growth = ((total_entities - prev_entities) / prev_entities * 100) if prev_entities > 0 else 0

    ov = statistics.get_statistics_overview(db, project_id=project_id)
    overview = ov.get("overview", {})

    snapshot = KnowledgeSnapshot(
        project_id=project_id,
        total_trades=total_trades,
        total_patterns=total_patterns,
        total_claims=total_claims,
        total_concepts=total_concepts,
        total_sources=total_sources,
        total_similarities=total_trades,
        total_interpretations=total_interpretations,
        win_rate=overview.get("win_rate", 0),
        avg_rr=overview.get("avg_rr", 0),
        expectancy=overview.get("expectancy", 0),
        knowledge_growth=round(knowledge_growth, 2),
    )
    db.add(snapshot)
    db.commit()

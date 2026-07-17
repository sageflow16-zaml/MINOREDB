from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.collector import CollectorStatus, CollectorLog, CollectorSchedule
from datetime import datetime


def get_statuses(db: Session, *, project_id: UUID) -> list[CollectorStatus]:
    return list(
        db.scalars(
            select(CollectorStatus)
            .where(CollectorStatus.project_id == project_id)
            .order_by(CollectorStatus.name)
        ).all()
    )


def get_status_by_name(
    db: Session, *, project_id: UUID, name: str
) -> CollectorStatus | None:
    return db.scalar(
        select(CollectorStatus).where(
            CollectorStatus.project_id == project_id,
            CollectorStatus.name == name,
        )
    )


def create_status(
    db: Session, *, project_id: UUID, name: str
) -> CollectorStatus:
    existing = get_status_by_name(db, project_id=project_id, name=name)
    if existing:
        return existing
    db_obj = CollectorStatus(project_id=project_id, name=name)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_status(
    db: Session, *, status_id: UUID, obj_in: dict
) -> CollectorStatus | None:
    obj = db.get(CollectorStatus, status_id)
    if not obj:
        return None
    for field, value in obj_in.items():
        setattr(obj, field, value)
    obj.updated_at = datetime.utcnow()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_status_by_name(
    db: Session, *, project_id: UUID, name: str, enabled: bool
) -> CollectorStatus | None:
    obj = get_status_by_name(db, project_id=project_id, name=name)
    if not obj:
        return None
    obj.enabled = enabled
    obj.updated_at = datetime.utcnow()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_logs(
    db: Session, *, project_id: UUID, limit: int = 50
) -> list[CollectorLog]:
    return list(
        db.scalars(
            select(CollectorLog)
            .where(CollectorLog.project_id == project_id)
            .order_by(CollectorLog.created_at.desc())
            .limit(limit)
        ).all()
    )


def get_schedules(db: Session, *, project_id: UUID) -> list[CollectorSchedule]:
    return list(
        db.scalars(
            select(CollectorSchedule)
            .where(CollectorSchedule.project_id == project_id)
            .order_by(CollectorSchedule.collector_name)
        ).all()
    )


def get_schedule_by_name(
    db: Session, *, project_id: UUID, name: str
) -> CollectorSchedule | None:
    return db.scalar(
        select(CollectorSchedule).where(
            CollectorSchedule.project_id == project_id,
            CollectorSchedule.collector_name == name,
        )
    )


def create_default_schedules(
    db: Session, *, project_id: UUID
) -> list[CollectorSchedule]:
    defaults = {
        "MarketCollector": 60,
        "EconomicCalendarCollector": 1440,
        "MT5Collector": 5,
        "NewsCollector": 60,
        "HistoricalCollector": 1440,
    }
    created = []
    for name, interval in defaults.items():
        existing = get_schedule_by_name(db, project_id=project_id, name=name)
        if not existing:
            obj = CollectorSchedule(
                project_id=project_id,
                collector_name=name,
                interval_minutes=interval,
            )
            db.add(obj)
            db.flush()
            created.append(obj)
    if created:
        db.commit()
        for obj in created:
            db.refresh(obj)
    return created

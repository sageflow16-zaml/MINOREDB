from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.reconsideration_trigger import ReconsiderationTrigger
from src.schemas.reconsideration_trigger import ReconsiderationTriggerCreate, ReconsiderationTriggerUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> ReconsiderationTrigger | None:
    if project_id:
        return db.scalar(select(ReconsiderationTrigger).where(ReconsiderationTrigger.id == id, ReconsiderationTrigger.project_id == project_id))
    return db.get(ReconsiderationTrigger, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[ReconsiderationTrigger]:
    stmt = select(ReconsiderationTrigger)
    if project_id:
        stmt = stmt.where(ReconsiderationTrigger.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(ReconsiderationTrigger)
    if project_id:
        stmt = stmt.where(ReconsiderationTrigger.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: ReconsiderationTriggerCreate) -> ReconsiderationTrigger:
    db_obj = ReconsiderationTrigger(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: ReconsiderationTrigger, obj_in: ReconsiderationTriggerUpdate) -> ReconsiderationTrigger:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> ReconsiderationTrigger | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

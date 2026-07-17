from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.conflict import Conflict
from src.schemas.conflict import ConflictCreate, ConflictUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Conflict | None:
    if project_id:
        return db.scalar(select(Conflict).where(Conflict.id == id, Conflict.project_id == project_id))
    return db.get(Conflict, id)

def get_by_ids(db: Session, *, ids: list[UUID]) -> list[Conflict]:
    if not ids:
        return []
    return db.scalars(select(Conflict).filter(Conflict.id.in_(ids))).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Conflict]:
    stmt = select(Conflict)
    if project_id:
        stmt = stmt.where(Conflict.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Conflict)
    if project_id:
        stmt = stmt.where(Conflict.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: ConflictCreate, commit: bool = True) -> Conflict:
    db_obj = Conflict(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    if commit:
        db.commit()
        db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Conflict, obj_in: ConflictUpdate) -> Conflict:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Conflict | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

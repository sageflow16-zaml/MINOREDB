from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.source import Source
from src.schemas.source import SourceCreate, SourceUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Source | None:
    if project_id:
        return db.scalar(select(Source).where(Source.id == id, Source.project_id == project_id))
    return db.get(Source, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Source]:
    stmt = select(Source)
    if project_id:
        stmt = stmt.where(Source.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count(Source.id))
    if project_id:
        stmt = stmt.where(Source.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: SourceCreate) -> Source:
    db_obj = Source(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Source, obj_in: SourceUpdate) -> Source:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Source | None:
    if project_id:
        obj = db.scalar(select(Source).where(Source.id == id, Source.project_id == project_id))
    else:
        obj = db.get(Source, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

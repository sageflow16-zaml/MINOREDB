from uuid import UUID
from sqlalchemy.orm import Session
from src.models.source import Source
from src.schemas.source import SourceCreate, SourceUpdate

def get(db: Session, id: UUID) -> Source | None:
    return db.get(Source, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Source]:
    return db.query(Source).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: SourceCreate) -> Source:
    db_obj = Source(**obj_in.model_dump())
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

def remove(db: Session, *, id: UUID) -> Source | None:
    obj = db.get(Source, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

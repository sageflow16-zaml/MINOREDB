from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.interpretation import Interpretation
from src.schemas.interpretation import InterpretationCreate, InterpretationUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Interpretation | None:
    if project_id:
        return db.scalar(select(Interpretation).where(Interpretation.id == id, Interpretation.project_id == project_id))
    return db.get(Interpretation, id)

def get_by_concept_id(db: Session, *, concept_id: UUID) -> Interpretation | None:
    return db.scalar(select(Interpretation).filter(Interpretation.concept_id == concept_id))

def get_by_statement(db: Session, *, statement: str) -> Interpretation | None:
    return db.scalar(select(Interpretation).filter(
        Interpretation.interpretation_statement == statement
    ))

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Interpretation]:
    stmt = select(Interpretation)
    if project_id:
        stmt = stmt.where(Interpretation.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Interpretation)
    if project_id:
        stmt = stmt.where(Interpretation.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: InterpretationCreate) -> Interpretation:
    db_obj = Interpretation(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Interpretation, obj_in: InterpretationUpdate) -> Interpretation:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Interpretation | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

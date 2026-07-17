from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.hypothesis import Hypothesis
from src.schemas.hypothesis import HypothesisCreate, HypothesisUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Hypothesis | None:
    if project_id:
        return db.scalar(select(Hypothesis).where(Hypothesis.id == id, Hypothesis.project_id == project_id))
    return db.get(Hypothesis, id)

def get_by_research_question(db: Session, *, research_question_id: UUID) -> Hypothesis | None:
    return db.scalar(select(Hypothesis).filter(
        Hypothesis.research_question_id == research_question_id
    ))

def get_by_research_questions(db: Session, *, research_question_ids: list[UUID]) -> list[Hypothesis]:
    return db.scalars(select(Hypothesis).filter(Hypothesis.research_question_id.in_(research_question_ids))).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Hypothesis]:
    stmt = select(Hypothesis)
    if project_id:
        stmt = stmt.where(Hypothesis.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Hypothesis)
    if project_id:
        stmt = stmt.where(Hypothesis.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: HypothesisCreate) -> Hypothesis:
    db_obj = Hypothesis(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Hypothesis, obj_in: HypothesisUpdate) -> Hypothesis:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Hypothesis | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

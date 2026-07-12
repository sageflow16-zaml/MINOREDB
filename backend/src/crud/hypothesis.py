from uuid import UUID
from sqlalchemy.orm import Session
from src.models.hypothesis import Hypothesis
from src.schemas.hypothesis import HypothesisCreate, HypothesisUpdate

def get(db: Session, id: UUID) -> Hypothesis | None:
    return db.get(Hypothesis, id)

def get_by_research_question(db: Session, *, research_question_id: UUID) -> Hypothesis | None:
    return db.query(Hypothesis).filter(
        Hypothesis.research_question_id == research_question_id
    ).first()

def get_by_research_questions(db: Session, *, research_question_ids: list[UUID]) -> list[Hypothesis]:
    return db.query(Hypothesis).filter(Hypothesis.research_question_id.in_(research_question_ids)).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Hypothesis]:
    return db.query(Hypothesis).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: HypothesisCreate) -> Hypothesis:
    db_obj = Hypothesis(**obj_in.model_dump())
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

def remove(db: Session, *, id: UUID) -> Hypothesis | None:
    obj = db.get(Hypothesis, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

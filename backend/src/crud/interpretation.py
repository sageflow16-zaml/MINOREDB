from uuid import UUID
from sqlalchemy.orm import Session
from src.models.interpretation import Interpretation
from src.schemas.interpretation import InterpretationCreate, InterpretationUpdate

def get(db: Session, id: UUID) -> Interpretation | None:
    return db.get(Interpretation, id)

def get_by_concept_id(db: Session, *, concept_id: UUID) -> Interpretation | None:
    return db.query(Interpretation).filter(Interpretation.concept_id == concept_id).first()

def get_by_statement(db: Session, *, statement: str) -> Interpretation | None:
    return db.query(Interpretation).filter(
        Interpretation.interpretation_statement == statement
    ).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Interpretation]:
    return db.query(Interpretation).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: InterpretationCreate) -> Interpretation:
    db_obj = Interpretation(**obj_in.model_dump())
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

def remove(db: Session, *, id: UUID) -> Interpretation | None:
    obj = db.get(Interpretation, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

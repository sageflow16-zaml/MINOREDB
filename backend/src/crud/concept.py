from uuid import UUID
from sqlalchemy.orm import Session
from src.models.concept import Concept
from src.schemas.concept import ConceptCreate, ConceptUpdate

def get(db: Session, id: UUID) -> Concept | None:
    return db.get(Concept, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Concept]:
    return db.query(Concept).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ConceptCreate) -> Concept:
    db_obj = Concept(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Concept, obj_in: ConceptUpdate) -> Concept:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> Concept | None:
    obj = db.get(Concept, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

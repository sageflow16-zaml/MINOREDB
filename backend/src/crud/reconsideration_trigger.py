from uuid import UUID
from sqlalchemy.orm import Session
from src.models.reconsideration_trigger import ReconsiderationTrigger
from src.schemas.reconsideration_trigger import ReconsiderationTriggerCreate, ReconsiderationTriggerUpdate

def get(db: Session, id: UUID) -> ReconsiderationTrigger | None:
    return db.get(ReconsiderationTrigger, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[ReconsiderationTrigger]:
    return db.query(ReconsiderationTrigger).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ReconsiderationTriggerCreate) -> ReconsiderationTrigger:
    db_obj = ReconsiderationTrigger(**obj_in.model_dump())
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

def remove(db: Session, *, id: UUID) -> ReconsiderationTrigger | None:
    obj = db.get(ReconsiderationTrigger, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

from uuid import UUID
from sqlalchemy.orm import Session
from src.models.association import Association
from src.schemas.association import AssociationCreate, AssociationUpdate

def get(db: Session, id: UUID) -> Association | None:
    return db.get(Association, id)

def get_by_claim_and_concept(db: Session, *, claim_id: UUID, concept_id: UUID) -> Association | None:
    return db.query(Association).filter(
        Association.claim_id == claim_id,
        Association.concept_id == concept_id
    ).first()

def get_by_claim_id(db: Session, *, claim_id: UUID) -> list[Association]:
    return db.query(Association).filter(Association.claim_id == claim_id).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Association]:
    return db.query(Association).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: AssociationCreate) -> Association:
    db_obj = Association(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Association, obj_in: AssociationUpdate) -> Association:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> Association | None:
    obj = db.get(Association, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

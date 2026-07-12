from uuid import UUID
from sqlalchemy.orm import Session
from src.models.claim import Claim
from src.schemas.claim import ClaimCreate, ClaimUpdate

def get(db: Session, id: UUID) -> Claim | None:
    return db.get(Claim, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Claim]:
    return db.query(Claim).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ClaimCreate) -> Claim:
    db_obj = Claim(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Claim, obj_in: ClaimUpdate) -> Claim:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> Claim | None:
    obj = db.get(Claim, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

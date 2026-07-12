from uuid import UUID
from sqlalchemy.orm import Session
from src.models.conflict import Conflict
from src.schemas.conflict import ConflictCreate, ConflictUpdate

def get(db: Session, id: UUID) -> Conflict | None:
    return db.get(Conflict, id)

def get_by_claims(db: Session, *, claim_id_1: UUID, claim_id_2: UUID) -> Conflict | None:
    sorted_ids = sorted([str(claim_id_1), str(claim_id_2)])
    search_str = f"claims: {sorted_ids[0]}, {sorted_ids[1]}"
    return db.query(Conflict).filter(
        Conflict.contextual_applicability_check.like(f"%{search_str}%")
    ).first()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Conflict]:
    return db.query(Conflict).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ConflictCreate) -> Conflict:
    db_obj = Conflict(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: Conflict, obj_in: ConflictUpdate) -> Conflict:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> Conflict | None:
    obj = db.get(Conflict, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

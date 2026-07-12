from uuid import UUID
from sqlalchemy.orm import Session
from src.models.claim_conflict import ClaimConflict
from src.schemas.claim_conflict import ClaimConflictCreate

def get(db: Session, id: UUID) -> ClaimConflict | None:
    return db.get(ClaimConflict, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[ClaimConflict]:
    return db.query(ClaimConflict).offset(skip).limit(limit).all()

def get_by_claim(db: Session, *, claim_id: UUID) -> list[ClaimConflict]:
    return db.query(ClaimConflict).filter(ClaimConflict.claim_id == claim_id).all()

def get_by_conflict(db: Session, *, conflict_id: UUID) -> list[ClaimConflict]:
    return db.query(ClaimConflict).filter(ClaimConflict.conflict_id == conflict_id).all()

def get_by_pair(db: Session, *, claim_id: UUID, conflict_id: UUID) -> ClaimConflict | None:
    return db.query(ClaimConflict).filter(
        ClaimConflict.claim_id == claim_id,
        ClaimConflict.conflict_id == conflict_id
    ).first()

def create(db: Session, *, obj_in: ClaimConflictCreate) -> ClaimConflict:
    db_obj = ClaimConflict(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> ClaimConflict | None:
    obj = db.get(ClaimConflict, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

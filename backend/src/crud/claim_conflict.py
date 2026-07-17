from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.claim_conflict import ClaimConflict
from src.schemas.claim_conflict import ClaimConflictCreate

def get(db: Session, id: UUID) -> ClaimConflict | None:
    return db.get(ClaimConflict, id)

def get_by_claim(db: Session, *, claim_id: UUID, project_id: UUID | None = None) -> list[ClaimConflict]:
    stmt = select(ClaimConflict).where(ClaimConflict.claim_id == claim_id)
    if project_id:
        stmt = stmt.where(ClaimConflict.project_id == project_id)
    return db.scalars(stmt).all()

def get_by_conflict(db: Session, *, conflict_id: UUID, project_id: UUID | None = None) -> list[ClaimConflict]:
    stmt = select(ClaimConflict).where(ClaimConflict.conflict_id == conflict_id)
    if project_id:
        stmt = stmt.where(ClaimConflict.project_id == project_id)
    return db.scalars(stmt).all()

def get_by_pair(db: Session, *, claim_id: UUID, conflict_id: UUID) -> ClaimConflict | None:
    return db.scalar(select(ClaimConflict).filter(
        ClaimConflict.claim_id == claim_id,
        ClaimConflict.conflict_id == conflict_id
    ))

def create(db: Session, *, obj_in: ClaimConflictCreate, commit: bool = True) -> ClaimConflict:
    db_obj = ClaimConflict(**obj_in.model_dump())
    db.add(db_obj)
    if commit:
        db.commit()
        db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> ClaimConflict | None:
    obj = db.get(ClaimConflict, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

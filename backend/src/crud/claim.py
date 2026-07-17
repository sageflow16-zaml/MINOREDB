from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.claim import Claim
from src.schemas.claim import ClaimCreate, ClaimUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Claim | None:
    if project_id:
        return db.scalar(select(Claim).where(Claim.id == id, Claim.project_id == project_id))
    return db.get(Claim, id)

def get_by_text_and_source(db: Session, *, text: str, source_id: UUID) -> Claim | None:
    return db.scalar(select(Claim).filter(
        Claim.source_id == source_id,
        Claim.verbatim_text == text
    ))

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Claim]:
    stmt = select(Claim)
    if project_id:
        stmt = stmt.where(Claim.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Claim)
    if project_id:
        stmt = stmt.where(Claim.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: ClaimCreate) -> Claim:
    db_obj = Claim(**obj_in.model_dump(), project_id=project_id)
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

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Claim | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

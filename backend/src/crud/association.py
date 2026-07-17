from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.association import Association
from src.schemas.association import AssociationCreate, AssociationUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Association | None:
    if project_id:
        return db.scalar(select(Association).where(Association.id == id, Association.project_id == project_id))
    return db.get(Association, id)

def get_by_claim_and_concept(db: Session, *, claim_id: UUID, concept_id: UUID) -> Association | None:
    return db.scalar(select(Association).filter(
        Association.claim_id == claim_id,
        Association.concept_id == concept_id
    ))

def get_by_claim_id(db: Session, *, claim_id: UUID) -> list[Association]:
    return db.scalars(select(Association).filter(Association.claim_id == claim_id)).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Association]:
    stmt = select(Association)
    if project_id:
        stmt = stmt.where(Association.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def create(db: Session, *, project_id: UUID, obj_in: AssociationCreate) -> Association:
    db_obj = Association(**obj_in.model_dump(), project_id=project_id)
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

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Association | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.concept import Concept
from src.models.claim import Claim
from src.models.association import Association
from src.models.interpretation import Interpretation
from src.schemas.concept import ConceptCreate, ConceptUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> Concept | None:
    if project_id:
        return db.scalar(select(Concept).where(Concept.id == id, Concept.project_id == project_id))
    return db.get(Concept, id)

def get_claims_by_concept(db: Session, *, concept_id: UUID) -> list[Claim]:
    return db.scalars(select(Claim).join(Association).filter(Association.concept_id == concept_id)).all()

def get_interpretations_by_concept(db: Session, *, concept_id: UUID) -> list[Interpretation]:
    return db.scalars(select(Interpretation).filter(Interpretation.concept_id == concept_id)).all()

def get_by_ids(db: Session, *, ids: list[UUID]) -> list[Concept]:
    return db.scalars(select(Concept).filter(Concept.id.in_(ids))).all()

def get_by_term(db: Session, *, term: str) -> Concept | None:
    return db.scalar(select(Concept).filter(
        Concept.conceptual_term == term
    ))

def get_by_terms(db: Session, *, terms: list[str]) -> list[Concept]:
    if not terms:
        return []
    return db.scalars(select(Concept).filter(Concept.conceptual_term.in_(terms))).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[Concept]:
    stmt = select(Concept)
    if project_id:
        stmt = stmt.where(Concept.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(Concept)
    if project_id:
        stmt = stmt.where(Concept.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: ConceptCreate) -> Concept:
    db_obj = Concept(**obj_in.model_dump(), project_id=project_id)
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

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> Concept | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

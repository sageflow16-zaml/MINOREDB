from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.models.research_question import ResearchQuestion
from src.schemas.research_question import ResearchQuestionCreate, ResearchQuestionUpdate
from src.core.config import settings

def get(db: Session, id: UUID, project_id: UUID | None = None) -> ResearchQuestion | None:
    if project_id:
        return db.scalar(select(ResearchQuestion).where(ResearchQuestion.id == id, ResearchQuestion.project_id == project_id))
    return db.get(ResearchQuestion, id)

def get_by_conflict(db: Session, *, conflict_id: UUID) -> ResearchQuestion | None:
    return db.scalar(select(ResearchQuestion).filter(
        ResearchQuestion.conflict_id == conflict_id
    ))

def get_by_conflicts(db: Session, *, conflict_ids: list[UUID]) -> list[ResearchQuestion]:
    return db.scalars(select(ResearchQuestion).filter(ResearchQuestion.conflict_id.in_(conflict_ids))).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None) -> list[ResearchQuestion]:
    stmt = select(ResearchQuestion)
    if project_id:
        stmt = stmt.where(ResearchQuestion.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(settings.clamp_limit(limit))).all()

def count(db: Session, *, project_id: UUID | None = None) -> int:
    stmt = select(func.count()).select_from(ResearchQuestion)
    if project_id:
        stmt = stmt.where(ResearchQuestion.project_id == project_id)
    return db.scalar(stmt) or 0

def create(db: Session, *, project_id: UUID, obj_in: ResearchQuestionCreate) -> ResearchQuestion:
    db_obj = ResearchQuestion(**obj_in.model_dump(), project_id=project_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, *, db_obj: ResearchQuestion, obj_in: ResearchQuestionUpdate) -> ResearchQuestion:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID, project_id: UUID | None = None) -> ResearchQuestion | None:
    obj = get(db, id, project_id=project_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

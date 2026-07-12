from uuid import UUID
from sqlalchemy.orm import Session
from src.models.research_question import ResearchQuestion
from src.schemas.research_question import ResearchQuestionCreate, ResearchQuestionUpdate

def get(db: Session, id: UUID) -> ResearchQuestion | None:
    return db.get(ResearchQuestion, id)

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[ResearchQuestion]:
    return db.query(ResearchQuestion).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: ResearchQuestionCreate) -> ResearchQuestion:
    db_obj = ResearchQuestion(**obj_in.model_dump())
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

def remove(db: Session, *, id: UUID) -> ResearchQuestion | None:
    obj = db.get(ResearchQuestion, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

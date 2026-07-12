from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.research_question import ResearchQuestionCreate, ResearchQuestionUpdate, ResearchQuestionRead
from src.crud import research_question as crud
from src.services.hypothesis_engine import process_research_question_hypothesis

router = APIRouter()

@router.get("/", response_model=list[ResearchQuestionRead])
def read_questions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ResearchQuestionRead)
def read_question(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research question not found")
    return db_obj

@router.post("/", response_model=ResearchQuestionRead, status_code=status.HTTP_201_CREATED)
def create_question(obj_in: ResearchQuestionCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ResearchQuestionRead)
def update_question(id: UUID, obj_in: ResearchQuestionUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research question not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research question not found")
    return None

@router.post("/{research_question_id}/generate-hypothesis")
def generate_hypothesis(research_question_id: UUID, db: Session = Depends(get_db)):
    hypothesis = process_research_question_hypothesis(db, research_question_id=research_question_id)
    return {
        "research_question_id": research_question_id,
        "hypothesis_id": hypothesis.id,
        "status": "created"
    }

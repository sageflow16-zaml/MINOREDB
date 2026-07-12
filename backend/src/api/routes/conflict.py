from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.conflict import ConflictCreate, ConflictUpdate, ConflictRead
from src.crud import conflict as crud
from src.services.research_question_engine import process_conflict_questions

router = APIRouter()

@router.get("/", response_model=list[ConflictRead])
def read_conflicts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ConflictRead)
def read_conflict(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return db_obj

@router.post("/", response_model=ConflictRead, status_code=status.HTTP_201_CREATED)
def create_conflict(obj_in: ConflictCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ConflictRead)
def update_conflict(id: UUID, obj_in: ConflictUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conflict(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return None

@router.post("/{conflict_id}/generate-question")
def generate_question(conflict_id: UUID, db: Session = Depends(get_db)):
    question = process_conflict_questions(db, conflict_id=conflict_id)
    return {
        "conflict_id": conflict_id,
        "research_question_id": question.id,
        "status": "created"
    }

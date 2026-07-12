from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.interpretation import InterpretationCreate, InterpretationUpdate, InterpretationRead
from src.crud import interpretation as crud

router = APIRouter()

@router.get("/", response_model=list[InterpretationRead])
def read_interpretations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=InterpretationRead)
def read_interpretation(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found")
    return db_obj

@router.post("/", response_model=InterpretationRead, status_code=status.HTTP_201_CREATED)
def create_interpretation(obj_in: InterpretationCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=InterpretationRead)
def update_interpretation(id: UUID, obj_in: InterpretationUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interpretation(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found")
    return None

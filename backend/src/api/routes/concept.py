from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.concept import ConceptCreate, ConceptUpdate, ConceptRead
from src.crud import concept as crud

router = APIRouter()

@router.get("/", response_model=list[ConceptRead])
def read_concepts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ConceptRead)
def read_concept(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return db_obj

@router.post("/", response_model=ConceptRead, status_code=status.HTTP_201_CREATED)
def create_concept(obj_in: ConceptCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ConceptRead)
def update_concept(id: UUID, obj_in: ConceptUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concept(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return None

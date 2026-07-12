from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.reconsideration_trigger import ReconsiderationTriggerCreate, ReconsiderationTriggerUpdate, ReconsiderationTriggerRead
from src.crud import reconsideration_trigger as crud

router = APIRouter()

@router.get("/", response_model=list[ReconsiderationTriggerRead])
def read_triggers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ReconsiderationTriggerRead)
def read_trigger(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reconsideration trigger not found")
    return db_obj

@router.post("/", response_model=ReconsiderationTriggerRead, status_code=status.HTTP_201_CREATED)
def create_trigger(obj_in: ReconsiderationTriggerCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ReconsiderationTriggerRead)
def update_trigger(id: UUID, obj_in: ReconsiderationTriggerUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reconsideration trigger not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trigger(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reconsideration trigger not found")
    return None

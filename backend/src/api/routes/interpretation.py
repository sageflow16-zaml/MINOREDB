from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.interpretation import InterpretationRead
from src.crud import interpretation as crud

router = APIRouter()

@router.get("/", response_model=list[InterpretationRead])
def read_interpretations(project_id: UUID, project: Project = Depends(get_project_or_404), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=InterpretationRead)
def read_interpretation(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found")
    return db_obj

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interpretation(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interpretation not found")
    return None

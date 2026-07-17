from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.concept import ConceptCreate, ConceptUpdate, ConceptRead
from src.schemas.claim import ClaimRead
from src.schemas.interpretation import InterpretationRead
from src.crud import concept as crud

router = APIRouter()

@router.get("/", response_model=list[ConceptRead])
def read_concepts(project_id: UUID, project: Project = Depends(get_project_or_404), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=ConceptRead)
def read_concept(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return db_obj

@router.get("/{id}/claims", response_model=list[ClaimRead])
def read_concept_claims(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    return crud.get_claims_by_concept(db, concept_id=id)

@router.get("/{id}/interpretations", response_model=list[InterpretationRead])
def read_concept_interpretations(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    return crud.get_interpretations_by_concept(db, concept_id=id)

@router.post("/", response_model=ConceptRead, status_code=status.HTTP_201_CREATED)
def create_concept(project_id: UUID, project: Project = Depends(get_project_or_404), obj_in: ConceptCreate = ..., db: Session = Depends(get_db)):
    return crud.create(db, project_id=project_id, obj_in=obj_in)

@router.put("/{id}", response_model=ConceptRead)
def update_concept(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., obj_in: ConceptUpdate = ..., db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concept(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
    return None

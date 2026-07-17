from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.conflict import ConflictRead, ConflictCreate, ConflictUpdate
from src.schemas.claim import ClaimRead
from src.crud import conflict as crud
from src.crud import claim_conflict as cc_crud
from src.crud import claim as claim_crud
from src.services.research_question_engine import process_conflict_questions

router = APIRouter()

@router.get("/", response_model=list[ConflictRead])
def read_conflicts(project_id: UUID, project: Project = Depends(get_project_or_404), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)

@router.get("/{id}", response_model=ConflictRead)
def read_conflict(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return db_obj

@router.post("/", response_model=ConflictRead, status_code=status.HTTP_201_CREATED)
def create_conflict(project_id: UUID, project: Project = Depends(get_project_or_404), obj_in: ConflictCreate = ..., db: Session = Depends(get_db)):
    return crud.create(db, project_id=project_id, obj_in=obj_in)

@router.put("/{id}", response_model=ConflictRead)
def update_conflict(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., obj_in: ConflictUpdate = ..., db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.get("/{id}/claims", response_model=list[ClaimRead])
def read_conflict_claims(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    ccs = cc_crud.get_by_conflict(db, conflict_id=id, project_id=project_id)
    claim_ids = [cc.claim_id for cc in ccs]
    claims = claim_crud.get_by_ids(db, ids=claim_ids) if claim_ids else []
    return claims

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conflict(project_id: UUID, project: Project = Depends(get_project_or_404), id: UUID = ..., db: Session = Depends(get_db)):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")
    return None

@router.post("/{conflict_id}/generate-question")
def generate_question(project_id: UUID, project: Project = Depends(get_project_or_404), conflict_id: UUID = ..., db: Session = Depends(get_db)):
    question = process_conflict_questions(db, conflict_id=conflict_id)
    return {
        "conflict_id": conflict_id,
        "research_question_id": question.id,
        "status": "created"
    }


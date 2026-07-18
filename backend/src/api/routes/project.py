from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api import deps
from src.crud import project as crud
from src.schemas import project as schemas
from src.models.user import User
from uuid import UUID

router = APIRouter()


@router.post("/", response_model=schemas.Project)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return crud.create_project(db, project_in, user_id=current_user.id)


@router.get("/", response_model=list[schemas.Project])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return crud.get_projects(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{project_id}", response_model=schemas.Project)
def read_project(
    project_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_project = crud.get_project(db, project_id)
    if not db_project or db_project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: UUID,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_project = crud.get_project(db, project_id)
    if not db_project or db_project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    db_project = crud.update_project(db, project_id, project_in)
    return db_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_project = crud.get_project(db, project_id)
    if not db_project or db_project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    if not crud.delete_project(db, project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return None

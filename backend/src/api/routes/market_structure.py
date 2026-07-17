from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.market_structure import (
    MarketStructureCreate,
    MarketStructureUpdate,
    MarketStructureRead,
)
from src.crud import market_structure as crud

router = APIRouter()


@router.get("/", response_model=list[MarketStructureRead])
def read_market_structures(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)


@router.get("/{id}", response_model=MarketStructureRead)
def read_market_structure(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market structure not found",
        )
    return db_obj


@router.post(
    "/", response_model=MarketStructureRead, status_code=status.HTTP_201_CREATED
)
def create_market_structure(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    obj_in: MarketStructureCreate = ...,
    db: Session = Depends(get_db),
):
    return crud.create(db, project_id=project_id, obj_in=obj_in)


@router.put("/{id}", response_model=MarketStructureRead)
def update_market_structure(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    obj_in: MarketStructureUpdate = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market structure not found",
        )
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_market_structure(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market structure not found",
        )
    return None

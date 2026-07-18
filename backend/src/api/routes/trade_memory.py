from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.trade_memory import TradeMemoryRead
from src.crud import trade_memory as crud

router = APIRouter()


@router.get("/", response_model=list[TradeMemoryRead])
def read_trade_memories(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)


@router.get("/{trade_id}", response_model=TradeMemoryRead)
def read_trade_memory(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    trade_id: UUID = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, trade_id=trade_id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trade memory not found"
        )
    return db_obj

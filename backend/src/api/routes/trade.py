from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.trade import TradeCreate, TradeUpdate, TradeRead
from src.crud import trade as crud
from src.services.trade_memory import generate_trade_memory
from src.services.knowledge_engine import update_knowledge
from src.services.knowledge_graph import update_graph
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/", response_model=list[TradeRead])
def read_trades(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)


@router.get("/{id}", response_model=TradeRead)
def read_trade(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found"
        )
    return db_obj


@router.post("/", response_model=TradeRead, status_code=status.HTTP_201_CREATED)
def create_trade(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    obj_in: TradeCreate = ...,
    db: Session = Depends(get_db),
):
    trade = crud.create(db, project_id=project_id, obj_in=obj_in)
    try:
        generate_trade_memory(db, trade.id)
        update_knowledge(project_id, db)
        update_graph(project_id, db)
    except Exception as exc:
        logger.warning("Failed to update knowledge for trade %s: %s", trade.id, exc)
    return trade


@router.put("/{id}", response_model=TradeRead)
def update_trade(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    obj_in: TradeUpdate = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found"
        )
    trade = crud.update(db, db_obj=db_obj, obj_in=obj_in)
    try:
        generate_trade_memory(db, trade.id)
        update_knowledge(project_id, db)
        update_graph(project_id, db)
    except Exception as exc:
        logger.warning("Failed to update knowledge for trade %s: %s", trade.id, exc)
    return trade


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trade(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    id: UUID = ...,
    db: Session = Depends(get_db),
):
    if not crud.remove(db, id=id, project_id=project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found"
        )
    return None

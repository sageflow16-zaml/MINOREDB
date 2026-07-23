from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.trade import TradeCreate, TradeUpdate, TradeRead
from src.schemas.trade_import import ImportConfirm, ExportParams, ImportHistoryItem
from src.crud import trade as crud
from src.services.trade_io import preview_import, confirm_import, export_trades, get_import_history
from src.services.trade_memory import generate_trade_memory
from src.services.knowledge_engine import update_knowledge
from src.services.knowledge_graph import update_graph
from src.core.logging import get_logger
from src.core.audit import AuditEvent, log_audit

logger = get_logger(__name__)

router = APIRouter()


# ── Import / Export (must precede /{id} to avoid UUID parsing conflicts) ──


@router.post("/import")
def import_trades_preview(
    project_id: UUID,
    file: UploadFile = File(...),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return preview_import(db, project_id, file)


@router.post("/import/{import_id}/confirm")
def import_trades_confirm(
    project_id: UUID,
    import_id: UUID,
    body: ImportConfirm = ...,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return confirm_import(db, project_id, import_id, body.duplicate_strategy)


@router.get("/export")
def export_trades_endpoint(
    project_id: UUID,
    fmt: str = Query("csv"),
    ids: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    strategy_id: UUID | None = Query(None),
    symbol: str | None = Query(None),
    tags: str | None = Query(None),
    broker: str | None = Query(None),
    result: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    filters: dict = {}
    if ids:
        filters["ids"] = ids.split(",")
    if date_from:
        from datetime import datetime as dt, timezone as tz
        filters["date_from"] = dt.fromisoformat(date_from).replace(tzinfo=tz.utc)
    if date_to:
        from datetime import datetime as dt, timezone as tz
        filters["date_to"] = dt.fromisoformat(date_to).replace(tzinfo=tz.utc)
    if strategy_id:
        filters["strategy_id"] = str(strategy_id)
    if symbol:
        filters["symbol"] = symbol
    if tags:
        filters["tags"] = tags.split(",")
    if broker:
        filters["broker"] = broker
    if result:
        filters["result"] = result
    if status_filter:
        filters["status"] = status_filter
    content, media, filename = export_trades(db, project_id, fmt, filters)
    return Response(content=content, media_type=media, headers={
        "Content-Disposition": f'attachment; filename="{filename}"',
    })


@router.get("/import-history", response_model=list[ImportHistoryItem])
def import_history(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return get_import_history(db, project_id)


# ── CRUD ──


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
    log_audit(AuditEvent("data_import", resource=f"trade:{trade.id}", details={"action": "create", "project_id": str(project_id)}))
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

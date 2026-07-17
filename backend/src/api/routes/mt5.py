from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.mt5 import (
    BrokerConnectionRead,
    TradeSyncLogRead,
    MT5StatusResponse,
    MT5ConnectRequest,
    MT5SyncRequest,
    MT5SyncResponse,
)
from src.services.mt5 import MT5Service

router = APIRouter()


@router.get("/status", response_model=MT5StatusResponse)
def get_status(db: Session = Depends(get_db)):
    svc = MT5Service(db)
    return svc.status()


@router.post("/connect", response_model=BrokerConnectionRead)
def connect(req: MT5ConnectRequest, db: Session = Depends(get_db)):
    svc = MT5Service(db)
    return svc.connect(req.account, req.server, req.terminal_path)


@router.post("/disconnect", response_model=BrokerConnectionRead | None)
def disconnect(db: Session = Depends(get_db)):
    svc = MT5Service(db)
    return svc.disconnect()


@router.post("/sync", response_model=MT5SyncResponse)
def sync_trades(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    req: MT5SyncRequest = MT5SyncRequest(),
    db: Session = Depends(get_db),
):
    svc = MT5Service(db)
    return svc.sync(project_id, mode=req.mode)


@router.get("/logs", response_model=list[TradeSyncLogRead])
def get_logs(limit: int = 100, db: Session = Depends(get_db)):
    svc = MT5Service(db)
    return svc.logs(limit=limit)

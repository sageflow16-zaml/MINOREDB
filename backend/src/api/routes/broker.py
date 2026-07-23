from uuid import UUID
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services.broker import BrokerManager
from src.core.logging import get_logger
from src.core.crypto import encrypt_credentials

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Broker error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class ConnectionCreate(BaseModel):
    provider: str
    label: str
    credentials: dict[str, Any] | None = None
    config: dict[str, Any] | None = None
    permissions: list[str] | None = None

class ConnectionUpdate(BaseModel):
    label: str | None = None
    credentials: dict[str, Any] | None = None
    config: dict[str, Any] | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None

class ManualImport(BaseModel):
    trades: list[dict[str, Any]]

class AIAsk(BaseModel):
    question: str


# ─────────────────────────────────────────────
# PROVIDERS
# ─────────────────────────────────────────────

@router.get("/providers")
def list_providers(project_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(mgr.get_providers)


# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────

@router.get("/dashboard")
def broker_dashboard(project_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(mgr.get_dashboard)


# ─────────────────────────────────────────────
# CONNECTIONS
# ─────────────────────────────────────────────

@router.get("/connections")
def list_connections(project_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(mgr.connections.list_connections)


@router.post("/connections")
def create_connection(project_id: UUID, body: ConnectionCreate, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    data = body.model_dump(exclude_unset=True)
    credentials = data.pop("credentials", None)
    data["credentials_encrypted"] = encrypt_credentials(credentials or {}, context=f"connection:{project_id}")
    return _safe(lambda: mgr.connections.create_connection(data))


@router.get("/connections/{connection_id}")
def get_connection(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.connections.get_connection(connection_id))


@router.put("/connections/{connection_id}")
def update_connection(project_id: UUID, connection_id: UUID, body: ConnectionUpdate, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    data = body.model_dump(exclude_unset=True)
    if "credentials" in data:
        data["credentials_encrypted"] = encrypt_credentials(data.pop("credentials") or {}, context=f"connection:{project_id}")
    return _safe(lambda: mgr.connections.update_connection(connection_id, data))


@router.delete("/connections/{connection_id}")
def delete_connection(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    _safe(lambda: mgr.connections.delete_connection(connection_id))
    return {"status": "deleted"}


@router.post("/connections/{connection_id}/test")
def test_connection(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.connections.test_connection(connection_id))


# ─────────────────────────────────────────────
# ACCOUNTS (Broker)
# ─────────────────────────────────────────────

@router.get("/connections/{connection_id}/accounts")
def list_broker_accounts(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.accounts_svc.list_accounts(connection_id=connection_id))


@router.get("/accounts/{account_id}")
def get_broker_account(project_id: UUID, account_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.accounts_svc.get_account(account_id))


@router.put("/accounts/{account_id}")
def update_broker_account(project_id: UUID, account_id: UUID, body: dict, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.accounts_svc.update_account(account_id, body))


# ─────────────────────────────────────────────
# SYNC
# ─────────────────────────────────────────────

@router.get("/connections/{connection_id}/sync")
def list_sync_history(project_id: UUID, connection_id: UUID, limit: int = 50, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.sync.list_sync_history(connection_id=connection_id, limit=limit))


@router.post("/connections/{connection_id}/sync")
def sync_connection(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.sync.sync_all_accounts(connection_id))


@router.post("/connections/{connection_id}/accounts/{account_id}/sync")
def sync_account_trades(project_id: UUID, connection_id: UUID, account_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.sync.sync_account_trades(connection_id, account_id))


# ─────────────────────────────────────────────
# TRADES (Imported)
# ─────────────────────────────────────────────

@router.get("/trades")
def list_imported_trades(
    project_id: UUID,
    connection_id: UUID | None = Query(None),
    account_id: UUID | None = Query(None),
    symbol: str | None = Query(None),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.trades.list_trades(connection_id, account_id, symbol, limit, offset))


@router.get("/trades/stats")
def trade_stats(project_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(mgr.trades.get_trade_stats)


@router.get("/trades/{trade_id}")
def get_imported_trade(project_id: UUID, trade_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.trades.get_trade(trade_id))


@router.post("/connections/{connection_id}/accounts/{account_id}/trades/import")
def manual_import_trades(project_id: UUID, connection_id: UUID, account_id: UUID, body: ManualImport, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.trades.manual_import(connection_id, account_id, body.trades))


# ─────────────────────────────────────────────
# POSITIONS & ORDERS
# ─────────────────────────────────────────────

@router.get("/positions")
def list_positions(
    project_id: UUID,
    connection_id: UUID | None = Query(None),
    account_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.positions.list_positions(connection_id, account_id))


@router.get("/orders")
def list_orders(
    project_id: UUID,
    connection_id: UUID | None = Query(None),
    account_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.positions.list_orders(connection_id, account_id))


# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

@router.get("/analytics")
def list_broker_analytics(project_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(mgr.analytics.compare_brokers)


@router.get("/connections/{connection_id}/analytics")
def get_connection_analytics(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.analytics.get_analytics(connection_id))


@router.get("/connections/{connection_id}/execution")
def get_execution_analysis(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.analytics.get_execution_analysis(connection_id))


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@router.get("/connections/{connection_id}/health")
def get_health(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.logs.get_health(connection_id))


@router.post("/connections/{connection_id}/health")
def check_health(project_id: UUID, connection_id: UUID, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.logs.check_health(connection_id))


# ─────────────────────────────────────────────
# LOGS
# ─────────────────────────────────────────────

@router.get("/connections/{connection_id}/logs")
def list_logs(
    project_id: UUID,
    connection_id: UUID,
    level: str | None = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    mgr = BrokerManager(db, project_id)
    return _safe(lambda: mgr.logs.list_logs(connection_id, level, limit))


# ─────────────────────────────────────────────
# AI
# ─────────────────────────────────────────────

@router.post("/ai/ask")
def ai_ask(project_id: UUID, body: AIAsk, db: Session = Depends(get_db)):
    mgr = BrokerManager(db, project_id)
    answer = _safe(lambda: mgr.ai.ask(body.question))
    return {"question": body.question, "answer": answer}

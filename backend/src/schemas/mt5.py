from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class BrokerConnectionBase(BaseModel):
    broker: str = "MetaTrader5"
    account: str
    server: str
    terminal_path: str = ""


class BrokerConnectionCreate(BrokerConnectionBase):
    pass


class BrokerConnectionRead(BrokerConnectionBase):
    id: UUID
    status: str
    connected: bool
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TradeSyncLogRead(BaseModel):
    id: UUID
    broker: str
    trade_ticket: int
    sync_time: datetime
    status: str
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MT5StatusResponse(BaseModel):
    connected: bool
    broker: Optional[str] = None
    account: Optional[str] = None
    server: Optional[str] = None
    terminal_path: Optional[str] = None
    last_sync: Optional[datetime] = None
    total_trades: int = 0
    total_synced: int = 0


class MT5SyncRequest(BaseModel):
    mode: str = "incremental"


class MT5SyncResponse(BaseModel):
    status: str
    trades_imported: int
    trades_skipped: int
    trades_updated: int
    duration_ms: int


class MT5ConnectRequest(BaseModel):
    account: str
    server: str
    terminal_path: str = ""


class MT5ImportedTrade(BaseModel):
    ticket: int
    symbol: str
    direction: str
    lot_size: float
    entry_price: float
    exit_price: float
    stop_loss: float
    take_profit: float
    open_time: datetime
    close_time: datetime
    profit: float
    commission: float
    swap: float
    magic_number: int
    comment: str

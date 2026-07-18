from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class MarketCandleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pair: str
    timeframe: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    candle_index: int


class ReplaySessionCreate(BaseModel):
    pair: str
    timeframe: str
    start_date: datetime
    end_date: datetime
    notes: str | None = None


class ReplaySessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    pair: str
    timeframe: str
    start_date: datetime
    current_date: datetime
    end_date: datetime
    current_candle: int
    total_candles: int
    status: str
    started_at: datetime
    completed_at: datetime | None
    notes: str | None
    created_at: datetime


class ReplayTradeCreate(BaseModel):
    direction: str
    entry_price: float
    stop_loss: float | None = None
    take_profit: float | None = None
    position_size: float | None = None
    risk_percent: float | None = None
    notes: str | None = None
    confidence: float | None = None


class ReplayTradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    trade_id: UUID | None
    candle_index: int
    direction: str | None
    entry_price: float | None
    stop_loss: float | None
    take_profit: float | None
    position_size: float | None
    risk_percent: float | None
    notes: str | None
    confidence: float | None
    created_at: datetime


class ReplayBookmarkCreate(BaseModel):
    candle_index: int
    date: datetime
    note: str | None = None


class ReplayBookmarkUpdate(BaseModel):
    note: str | None = None


class ReplayBookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    candle_index: int
    date: datetime
    note: str | None
    created_at: datetime


class ReplayNavigateResponse(BaseModel):
    session: ReplaySessionResponse
    candle: MarketCandleResponse | None
    candles_visible: list[MarketCandleResponse]
    trades: list[ReplayTradeResponse]
    bookmarks: list[ReplayBookmarkResponse]


class ReplayDashboardStats(BaseModel):
    total_sessions: int
    total_trades: int
    avg_rr: float
    avg_win_rate: float
    learning_progress: int
    knowledge_growth: int


class ReplaySessionListResponse(BaseModel):
    sessions: list[ReplaySessionResponse]
    total: int

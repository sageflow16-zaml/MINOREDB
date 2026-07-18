from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class TradeMemoryBase(BaseModel):
    pair: Optional[str] = None
    direction: Optional[str] = None
    session: Optional[str] = None
    weekly_bias: Optional[str] = None
    daily_bias: Optional[str] = None
    h4_bias: Optional[str] = None
    market_phase: Optional[str] = None
    market_trend: Optional[str] = None
    entry_model: Optional[str] = None
    liquidity_type: Optional[str] = None
    execution_model: Optional[str] = None
    risk_percent: Optional[float] = None
    rr: Optional[float] = None
    pnl: Optional[float] = None
    result: Optional[str] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    mistakes: Optional[list[str]] = None
    lessons: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    confidence: Optional[float] = None
    pattern_match: Optional[float] = None
    similarity_score: Optional[float] = None
    summary: Optional[str] = None


class TradeMemoryCreate(TradeMemoryBase):
    trade_id: UUID
    project_id: UUID


class TradeMemoryUpdate(BaseModel):
    pass


class TradeMemoryRead(TradeMemoryBase):
    id: UUID
    project_id: UUID
    trade_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

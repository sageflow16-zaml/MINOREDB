from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class TradeBase(BaseModel):
    market_structure_id: Optional[UUID] = None
    pair: Optional[str] = None
    direction: Optional[str] = None
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    exit_price: Optional[float] = None
    position_size: Optional[float] = None
    risk_percent: Optional[float] = None
    rr: Optional[float] = None
    pnl: Optional[float] = None
    result: Optional[str] = None
    status: Optional[str] = None
    weekly_bias: Optional[str] = None
    daily_bias: Optional[str] = None
    h4_bias: Optional[str] = None
    liquidity_sweep: Optional[str] = None
    bos: Optional[str] = None
    mss: Optional[str] = None
    order_block: Optional[str] = None
    fvg: Optional[str] = None
    asian_session: Optional[str] = None
    london_session: Optional[str] = None
    newyork_session: Optional[str] = None
    dxy: Optional[str] = None
    us10y: Optional[str] = None
    us02y: Optional[str] = None
    news_event: Optional[str] = None
    emotion: Optional[str] = None
    notes: Optional[str] = None
    before_image: Optional[str] = None
    after_image: Optional[str] = None


class TradeCreate(TradeBase):
    pass


class TradeUpdate(TradeBase):
    pass


class TradeRead(TradeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

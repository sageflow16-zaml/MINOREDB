from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime, date as _date_type
from typing import Optional


class MarketStructureBase(BaseModel):
    trade_id: Optional[UUID] = None
    date: Optional[_date_type] = None
    pair: Optional[str] = None
    timeframe: Optional[str] = None
    weekly_bias: Optional[str] = None
    daily_bias: Optional[str] = None
    h4_bias: Optional[str] = None
    market_phase: Optional[str] = None
    trend: Optional[str] = None
    premium_discount: Optional[str] = None
    external_liquidity: Optional[str] = None
    internal_liquidity: Optional[str] = None
    equal_highs: Optional[str] = None
    equal_lows: Optional[str] = None
    buy_side_liquidity: Optional[str] = None
    sell_side_liquidity: Optional[str] = None
    bos: Optional[str] = None
    mss: Optional[str] = None
    choch: Optional[str] = None
    order_block: Optional[str] = None
    breaker: Optional[str] = None
    mitigation: Optional[str] = None
    fvg: Optional[str] = None
    ifvg: Optional[str] = None
    asian_high: Optional[float] = None
    asian_low: Optional[float] = None
    london_open: Optional[float] = None
    newyork_open: Optional[float] = None
    london_killzone: Optional[str] = None
    newyork_killzone: Optional[str] = None


class MarketStructureCreate(MarketStructureBase):
    pass


class MarketStructureUpdate(MarketStructureBase):
    pass


class MarketStructureRead(MarketStructureBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

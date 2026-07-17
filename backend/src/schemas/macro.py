from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class MacroEventBase(BaseModel):
    provider: str
    event_name: str
    country: str = "US"
    currency: str = "USD"
    category: str = "general"
    importance: str = "medium"
    actual: Optional[float] = None
    forecast: Optional[float] = None
    previous: Optional[float] = None
    unit: str = ""
    release_time: Optional[datetime] = None


class MacroEventCreate(MacroEventBase):
    pass


class MacroEventRead(MacroEventBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MarketSnapshotBase(BaseModel):
    timestamp: datetime
    dxy: Optional[float] = None
    us02y: Optional[float] = None
    us10y: Optional[float] = None
    yield_curve: Optional[float] = None
    sp500: Optional[float] = None
    nasdaq: Optional[float] = None
    gold: Optional[float] = None
    oil: Optional[float] = None
    vix: Optional[float] = None


class MarketSnapshotCreate(MarketSnapshotBase):
    pass


class MarketSnapshotRead(MarketSnapshotBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MacroRefreshResult(BaseModel):
    events_stored: int
    snapshot_stored: int
    duration_ms: int


class MarketState(BaseModel):
    snapshot: Optional[MarketSnapshotRead] = None
    events_today: list[MacroEventRead] = []
    high_impact_events: list[MacroEventRead] = []
    upcoming_events: list[MacroEventRead] = []
    recent_releases: list[MacroEventRead] = []

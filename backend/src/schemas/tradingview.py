from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel


class WebhookPayload(BaseModel):
    symbol: str
    timeframe: str
    event_type: str
    price: Optional[float] = None
    timestamp: Optional[str] = None
    secret: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class MarketEventRead(BaseModel):
    id: UUID
    symbol: str
    timeframe: str
    timestamp: datetime
    event_type: str
    price: Optional[float] = None
    event_metadata: Optional[dict[str, Any]] = None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookLogRead(BaseModel):
    id: UUID
    received_at: datetime
    status: str
    payload: Optional[dict[str, Any]] = None
    processing_time_ms: Optional[int] = None
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookResponse(BaseModel):
    status: str
    event_id: Optional[UUID] = None
    message: str


class WebhookStats(BaseModel):
    total_events: int
    total_logs: int
    events_by_type: dict[str, int]
    events_by_symbol: dict[str, int]
    events_by_timeframe: dict[str, int]

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


# ── Annotations ──

class ReplayAnnotationBase(BaseModel):
    candle_index: int
    annotation_type: str
    content: Optional[dict] = None
    color: Optional[str] = None
    label: Optional[str] = None


class ReplayAnnotationCreate(ReplayAnnotationBase):
    pass


class ReplayAnnotationUpdate(BaseModel):
    content: Optional[dict] = None
    color: Optional[str] = None
    label: Optional[str] = None
    candle_index: Optional[int] = None


class ReplayAnnotationRead(ReplayAnnotationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    session_id: UUID
    model_config = ConfigDict(from_attributes=True)


# ── Timeline Events ──

class ReplayTimelineEventCreate(BaseModel):
    candle_index: int
    event_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    metadata: Optional[dict] = None


class ReplayTimelineEventRead(BaseModel):
    id: UUID
    created_at: datetime
    session_id: UUID
    candle_index: int
    event_type: str
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    metadata: Optional[dict] = None
    model_config = ConfigDict(from_attributes=True)


# ── Review ──

class ReplayReviewBase(BaseModel):
    went_well: Optional[str] = None
    went_wrong: Optional[str] = None
    rule_violations: Optional[str] = None
    execution_quality: Optional[str] = None
    risk_management: Optional[str] = None
    psychology: Optional[str] = None
    confidence_score: Optional[float] = None
    trade_grade: Optional[str] = None
    discipline_score: Optional[float] = None
    completed_checklist: Optional[list[str]] = None
    missed_checklist: Optional[list[str]] = None
    rule_compliance: Optional[float] = None


class ReplayReviewCreate(ReplayReviewBase):
    pass


class ReplayReviewUpdate(ReplayReviewBase):
    pass


class ReplayReviewRead(ReplayReviewBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    session_id: UUID
    model_config = ConfigDict(from_attributes=True)


# ── Mistakes ──

class ReplayMistakeBase(BaseModel):
    mistake_type: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    candle_index: Optional[int] = None
    preventable: Optional[bool] = None
    recommendation: Optional[str] = None


class ReplayMistakeCreate(ReplayMistakeBase):
    pass


class ReplayMistakeUpdate(ReplayMistakeBase):
    pass


class ReplayMistakeRead(ReplayMistakeBase):
    id: UUID
    created_at: datetime
    session_id: UUID
    model_config = ConfigDict(from_attributes=True)


# ── Screenshots ──

class ReplayScreenshotBase(BaseModel):
    candle_index: int
    category: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None


class ReplayScreenshotCreate(ReplayScreenshotBase):
    pass


class ReplayScreenshotUpdate(BaseModel):
    category: Optional[str] = None
    caption: Optional[str] = None


class ReplayScreenshotRead(ReplayScreenshotBase):
    id: UUID
    created_at: datetime
    session_id: UUID
    model_config = ConfigDict(from_attributes=True)


# ── Extended ReplayState ──

class ReplayWorkspaceState(BaseModel):
    session: ReplaySessionResponse
    candle: Optional[MarketCandleResponse] = None
    candles_visible: list[MarketCandleResponse]
    trades: list[ReplayTradeResponse]
    bookmarks: list[ReplayBookmarkResponse]
    annotations: list[ReplayAnnotationRead] = []
    timeline_events: list[ReplayTimelineEventRead] = []
    review: Optional[ReplayReviewRead] = None
    mistakes: list[ReplayMistakeRead] = []
    screenshots: list[ReplayScreenshotRead] = []

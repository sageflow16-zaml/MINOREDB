from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class PatternBase(BaseModel):
    name: str
    description: Optional[str] = None
    signature: dict
    total_occurrences: int = 0
    wins: int = 0
    losses: int = 0
    breakevens: int = 0
    win_rate: float = 0.0
    average_rr: float = 0.0
    expectancy: float = 0.0
    profit_factor: float = 0.0
    average_duration: Optional[float] = None
    avg_win: float = 0.0
    avg_loss: float = 0.0
    confidence_score: float = 0.0
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class PatternCreate(PatternBase):
    project_id: UUID


class PatternUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    signature: Optional[dict] = None
    total_occurrences: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    breakevens: Optional[int] = None
    win_rate: Optional[float] = None
    average_rr: Optional[float] = None
    expectancy: Optional[float] = None
    profit_factor: Optional[float] = None
    average_duration: Optional[float] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    confidence_score: Optional[float] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class PatternRead(PatternBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatternSearchFilters(BaseModel):
    pair: Optional[str] = None
    session: Optional[str] = None
    direction: Optional[str] = None
    weekly_bias: Optional[str] = None
    market_phase: Optional[str] = None
    min_occurrences: Optional[int] = None
    min_win_rate: Optional[float] = None
    min_expectancy: Optional[float] = None
    limit: int = 50
    offset: int = 0


class PatternStatistics(BaseModel):
    total_patterns: int
    high_confidence_patterns: int
    avg_win_rate: float
    avg_expectancy: float
    top_pattern_id: Optional[UUID] = None
    top_pattern_name: Optional[str] = None
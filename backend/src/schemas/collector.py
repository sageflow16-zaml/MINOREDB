from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class CollectorStatusRead(BaseModel):
    id: UUID
    name: str
    status: str
    enabled: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    records_collected: int = 0
    errors: int = 0
    last_error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectorStatusUpdate(BaseModel):
    enabled: Optional[bool] = None


class CollectorLogRead(BaseModel):
    id: UUID
    collector_name: str
    status: str
    records_count: int = 0
    errors_count: int = 0
    error_message: Optional[str] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectorScheduleRead(BaseModel):
    id: UUID
    collector_name: str
    interval_minutes: int = 60
    enabled: bool = True
    last_executed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CollectorInfo(BaseModel):
    name: str
    description: str
    status: str
    enabled: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    records_collected: int = 0
    errors: int = 0
    last_error_message: Optional[str] = None


class CollectorRunResult(BaseModel):
    collector_name: str
    status: str
    records_collected: int
    errors_count: int
    error_message: Optional[str] = None
    duration_ms: int

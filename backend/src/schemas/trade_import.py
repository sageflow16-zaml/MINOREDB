from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Any


class ImportRow(BaseModel):
    row_number: int
    data: dict[str, Any]
    errors: list[str] = []
    is_duplicate: bool = False
    duplicate_of: str | None = None


class ImportPreview(BaseModel):
    import_id: UUID
    filename: str
    format: str
    total_rows: int
    valid_rows: int
    duplicate_rows: int
    error_rows: int
    rows: list[ImportRow]
    created_at: datetime


class ImportConfirm(BaseModel):
    duplicate_strategy: str = "skip"


class ImportResult(BaseModel):
    import_id: UUID
    status: str
    total_rows: int
    imported: int
    updated: int
    skipped: int
    failed: int
    details: list[dict[str, Any]] = []


class ImportHistoryItem(BaseModel):
    id: UUID
    project_id: UUID
    filename: str
    format: str
    status: str
    total_rows: int
    imported_count: int
    updated_count: int
    skipped_count: int
    failed_count: int
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ExportParams(BaseModel):
    format: str = "csv"
    ids: list[str] | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    strategy_id: UUID | None = None
    symbol: str | None = None
    tags: list[str] | None = None
    broker: str | None = None
    result: str | None = None
    status: str | None = None

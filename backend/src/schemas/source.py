from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any

class SourceBase(BaseModel):
    admissibility_status: Optional[str] = None
    origin_type: Optional[str] = None
    attribution: Optional[str] = None
    temporal_reference: Optional[str] = None
    location: Optional[str] = None
    provenance_confidence: Optional[str] = None
    source_metadata: Optional[dict[str, Any]] = None
    provenance_metadata: Optional[dict[str, Any]] = None
    raw_text: Optional[str] = None
    normalized_text: Optional[str] = None

class SourceCreate(SourceBase):
    pass

class SourceUpdate(SourceBase):
    pass

class SourceRead(SourceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SourceUpload(BaseModel):
    """Schema for structured metadata accompanying an upload."""
    origin_type: Optional[str] = "unknown"
    attribution: Optional[str] = None
    location: Optional[str] = None

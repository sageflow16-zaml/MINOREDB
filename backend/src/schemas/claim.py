from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ClaimBase(BaseModel):
    source_id: Optional[UUID] = None
    verbatim_text: Optional[str] = None
    source_location: Optional[str] = None
    semantic_classification: Optional[str] = None
    paraphrase_representation: Optional[str] = None
    contextual_boundary: Optional[str] = None

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(ClaimBase):
    pass

class ClaimRead(ClaimBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

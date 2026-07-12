from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ConflictBase(BaseModel):
    conflict_classification: Optional[str] = None
    contextual_applicability_check: Optional[str] = None

class ConflictCreate(ConflictBase):
    pass

class ConflictUpdate(ConflictBase):
    pass

class ConflictRead(ConflictBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

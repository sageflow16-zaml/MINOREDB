from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ClaimConflictBase(BaseModel):
    project_id: UUID
    claim_id: UUID
    conflict_id: UUID
    role: Optional[str] = None

class ClaimConflictCreate(ClaimConflictBase):
    pass

class ClaimConflictUpdate(BaseModel):
    role: Optional[str] = None

class ClaimConflictRead(ClaimConflictBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

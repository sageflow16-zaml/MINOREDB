from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ReconsiderationTriggerBase(BaseModel):
    interpretation_id: Optional[UUID] = None
    trigger_detail: Optional[str] = None
    trigger_classification: Optional[str] = None

class ReconsiderationTriggerCreate(ReconsiderationTriggerBase):
    pass

class ReconsiderationTriggerUpdate(ReconsiderationTriggerBase):
    pass

class ReconsiderationTriggerRead(ReconsiderationTriggerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

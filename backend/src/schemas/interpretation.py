from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class InterpretationBase(BaseModel):
    concept_id: Optional[UUID] = None
    interpretation_statement: Optional[str] = None
    reasoning_chain: Optional[str] = None
    interpretation_foundation: Optional[str] = None

class InterpretationCreate(InterpretationBase):
    pass

class InterpretationUpdate(InterpretationBase):
    pass

class InterpretationRead(InterpretationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

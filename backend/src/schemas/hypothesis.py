from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class HypothesisBase(BaseModel):
    research_question_id: Optional[UUID] = None
    hypothesis_statement: Optional[str] = None
    variable_specification: Optional[str] = None
    measurement_specification: Optional[str] = None
    substantive_departure: Optional[str] = None

class HypothesisCreate(HypothesisBase):
    pass

class HypothesisUpdate(HypothesisBase):
    pass

class HypothesisRead(HypothesisBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

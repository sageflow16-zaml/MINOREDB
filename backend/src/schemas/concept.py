from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ConceptBase(BaseModel):
    conceptual_term: Optional[str] = None
    definition: Optional[str] = None

class ConceptCreate(ConceptBase):
    pass

class ConceptUpdate(ConceptBase):
    pass

class ConceptRead(ConceptBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class AssociationBase(BaseModel):
    claim_id: Optional[UUID] = None
    concept_id: Optional[UUID] = None
    association_state: Optional[str] = None
    ambiguity_metric: Optional[str] = None

class AssociationCreate(AssociationBase):
    pass

class AssociationUpdate(AssociationBase):
    pass

class AssociationRead(AssociationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

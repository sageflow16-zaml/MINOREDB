from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResearchQuestionBase(BaseModel):
    question_statement: Optional[str] = None
    inquiry_origin: Optional[str] = None
    domain_relevance: Optional[str] = None
    substantive_grounding: Optional[str] = None

class ResearchQuestionCreate(ResearchQuestionBase):
    pass

class ResearchQuestionUpdate(ResearchQuestionBase):
    pass

class ResearchQuestionRead(ResearchQuestionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

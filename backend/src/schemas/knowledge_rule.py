from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class KnowledgeRuleBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rule_type: Optional[str] = None
    confidence: Optional[float] = None
    occurrences: Optional[int] = 0
    wins: Optional[int] = 0
    losses: Optional[int] = 0
    win_rate: Optional[float] = None
    avg_rr: Optional[float] = None
    expectancy: Optional[float] = None
    signature: Optional[str] = None


class KnowledgeRuleCreate(KnowledgeRuleBase):
    project_id: UUID
    title: str
    occurrences: int = 0
    wins: int = 0
    losses: int = 0


class KnowledgeRuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rule_type: Optional[str] = None
    confidence: Optional[float] = None
    occurrences: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    win_rate: Optional[float] = None
    avg_rr: Optional[float] = None
    expectancy: Optional[float] = None


class KnowledgeRuleRead(KnowledgeRuleBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

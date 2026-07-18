from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class AnalystQuery(BaseModel):
    question: str


class EvidenceItem(BaseModel):
    source: str
    data: object


class AnalystResponse(BaseModel):
    answer: str
    confidence: int
    sources: list[str]
    evidence: list[EvidenceItem]

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class ResearchTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    step: int
    tool: str
    description: str | None
    status: str
    evidence_count: int
    created_at: datetime


class ResearchReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    summary: str
    findings: list | None
    recommendations: list | None
    limitations: list | None
    confidence: float | None
    sources: list | None
    created_at: datetime


class ResearchSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    question: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    duration: float | None
    created_at: datetime


class ResearchDetailResponse(BaseModel):
    session: ResearchSessionResponse
    tasks: list[ResearchTaskResponse]
    report: ResearchReportResponse | None


class ResearchRunRequest(BaseModel):
    question: str


class ResearchRunResponse(BaseModel):
    session_id: UUID
    status: str
    message: str

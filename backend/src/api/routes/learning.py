from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import continuous_learning

router = APIRouter()


class LearningEventRead(BaseModel):
    id: str
    created_at: Optional[str] = None
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    duration_ms: Optional[int] = None
    status: str
    summary: Optional[str] = None


class KnowledgeSnapshotRead(BaseModel):
    id: str
    created_at: Optional[str] = None
    total_trades: int
    total_patterns: int
    total_claims: int
    total_concepts: int
    total_sources: int
    total_similarities: int
    total_interpretations: int
    win_rate: float
    avg_rr: float
    expectancy: float
    knowledge_growth: float


class RebuildRequest(BaseModel):
    event_type: str = "manual_rebuild"


class RebuildResponse(BaseModel):
    event_id: str
    status: str
    duration_ms: int
    steps_completed: list[str]
    errors: list[str]


class LearningStatus(BaseModel):
    total_trades: int
    total_sources: int
    total_claims: int
    total_concepts: int
    total_interpretations: int
    total_patterns: int
    total_market_structures: int
    total_events: int
    last_event: Optional[dict] = None
    last_snapshot: Optional[dict] = None


@router.get("/events", response_model=list[LearningEventRead])
def get_learning_events(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    events = continuous_learning.get_events(db, project_id=project_id, limit=limit)
    return [LearningEventRead(**e) for e in events]


@router.get("/snapshots", response_model=list[KnowledgeSnapshotRead])
def get_knowledge_snapshots(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    limit: int = 30,
):
    snapshots = continuous_learning.get_snapshots(db, project_id=project_id, limit=limit)
    return [KnowledgeSnapshotRead(**s) for s in snapshots]


@router.post("/rebuild", response_model=RebuildResponse)
def rebuild_learning(
    project_id: UUID,
    request: RebuildRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = continuous_learning.run_learning_pipeline(
        db, project_id=project_id, event_type=request.event_type,
    )
    return RebuildResponse(**result)


@router.get("/status", response_model=LearningStatus)
def get_learning_status(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    status = continuous_learning.get_status(db, project_id=project_id)
    return LearningStatus(**status)

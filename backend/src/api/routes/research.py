from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.research import (
    ResearchRunRequest,
    ResearchRunResponse,
    ResearchDetailResponse,
    ResearchSessionResponse,
    ResearchTaskResponse,
    ResearchReportResponse,
)
from src.services.research.engine import run_research, get_session, get_history

router = APIRouter()


@router.get("/", response_model=list[ResearchSessionResponse])
def list_research_sessions(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return get_history(db, project_id)


@router.post("/run", response_model=ResearchRunResponse)
def run_research_endpoint(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    body: ResearchRunRequest = ...,
    db: Session = Depends(get_db),
):
    return run_research(project_id, body.question, db)


@router.get("/{session_id}", response_model=ResearchDetailResponse)
def get_research_session(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = get_session(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Research session not found")
    return result


@router.get("/history/list", response_model=list[ResearchSessionResponse])
def get_research_history(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return get_history(db, project_id)

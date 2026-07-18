from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.analyst import AnalystQuery, AnalystResponse
from src.services.ai.analyst import analyze

router = APIRouter()


@router.post("/query", response_model=AnalystResponse)
def query_analyst(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    body: AnalystQuery = ...,
    db: Session = Depends(get_db),
):
    return analyze(project_id, body.question, db)

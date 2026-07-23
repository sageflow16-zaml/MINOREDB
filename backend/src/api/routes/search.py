from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project

router = APIRouter()


@router.get("/")
def search(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    q: str = ...,
    db: Session = Depends(get_db),
):
    from src.services.knowledge_search import search_knowledge
    return search_knowledge(db, q, project_id=project_id)

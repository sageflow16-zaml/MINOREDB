from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.knowledge_rule import KnowledgeRuleRead
from src.crud import knowledge_rule as crud
from src.services.knowledge_engine import update_knowledge

router = APIRouter()


@router.get("/", response_model=list[KnowledgeRuleRead])
def read_knowledge_rules(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return crud.get_multi(db, project_id=project_id, skip=skip, limit=limit)


@router.get("/top", response_model=KnowledgeRuleRead | None)
def read_top_knowledge_rule(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    rules = crud.get_multi(db, project_id=project_id, skip=0, limit=1)
    return rules[0] if rules else None


@router.get("/{rule_id}", response_model=KnowledgeRuleRead)
def read_knowledge_rule(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    rule_id: UUID = ...,
    db: Session = Depends(get_db),
):
    db_obj = crud.get(db, id=rule_id, project_id=project_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge rule not found"
        )
    return db_obj


@router.post("/refresh", response_model=list[KnowledgeRuleRead])
def refresh_knowledge(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return update_knowledge(project_id=project_id, db=db)

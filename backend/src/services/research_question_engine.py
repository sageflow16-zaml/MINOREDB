from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.crud import conflict as conflict_crud
from src.crud import research_question as rq_crud
from src.schemas.research_question import ResearchQuestionCreate
from src.models.research_question import ResearchQuestion

def process_conflict_questions(db: Session, conflict_id: UUID) -> ResearchQuestion:
    """
    Deterministically generates a research question for a conflict.
    """
    conflict = conflict_crud.get(db, id=conflict_id)
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Conflict not found"
        )
    
    # Prevent duplicate
    existing = rq_crud.get_by_conflict(db, conflict_id=conflict_id)
    if existing:
        return existing
        
    obj_in = ResearchQuestionCreate(
        conflict_id=conflict_id,
        question_statement="What evidence would resolve the detected conflict?",
        inquiry_origin="CONFLICT_ANALYSIS",
        domain_relevance="HIGH",
        substantive_grounding="Deterministic conflict detection"
    )
    
    return rq_crud.create(db, obj_in=obj_in)

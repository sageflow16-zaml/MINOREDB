from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.crud import research_question as rq_crud
from src.crud import hypothesis as hyp_crud
from src.schemas.hypothesis import HypothesisCreate
from src.models.hypothesis import Hypothesis

def process_research_question_hypothesis(db: Session, research_question_id: UUID) -> Hypothesis:
    """
    Deterministically generates a hypothesis for a research question.
    """
    rq = rq_crud.get(db, id=research_question_id)
    if not rq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Research question not found"
        )
    
    # Prevent duplicate
    existing = hyp_crud.get_by_research_question(db, research_question_id=research_question_id)
    if existing:
        return existing
        
    obj_in = HypothesisCreate(
        research_question_id=research_question_id,
        hypothesis_statement="Additional evidence can resolve this research question.",
        variable_specification="Evidence",
        measurement_specification="Comparison of supporting and contradicting claims.",
        substantive_departure="Deterministic hypothesis generation."
    )
    
    return hyp_crud.create(db, obj_in=obj_in)

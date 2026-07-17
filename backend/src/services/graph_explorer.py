from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.crud import claim as claim_crud
from src.crud import association as association_crud
from src.crud import concept as concept_crud
from src.crud import interpretation as interpretation_crud
from src.crud import claim_conflict as cc_crud
from src.crud import conflict as conflict_crud
from src.crud import research_question as rq_crud
from src.crud import hypothesis as hyp_crud
from src.schemas.graph import GraphResponse
from src.schemas.claim import ClaimRead
from src.schemas.concept import ConceptRead
from src.schemas.interpretation import InterpretationRead
from src.schemas.conflict import ConflictRead
from src.schemas.research_question import ResearchQuestionRead
from src.schemas.hypothesis import HypothesisRead

def explore_claim(db: Session, claim_id: UUID) -> GraphResponse:
    """
    Traverses the knowledge graph to retrieve the research chain using CRUD helpers.
    """
    claim = claim_crud.get(db, claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Claim not found"
        )
            
    # Load associated Concepts
    associations = association_crud.get_by_claim_id(db, claim_id=claim_id)
    concept_ids = [a.concept_id for a in associations]
    concepts = concept_crud.get_by_ids(db, ids=concept_ids)
    
    # Load Interpretation
    interpretation = None
    for cid in concept_ids:
        interpretation = interpretation_crud.get_by_concept_id(db, concept_id=cid)
        if interpretation:
            break
    
    # Load Conflicts via ClaimConflict linkage (single batched query, no N+1)
    ccs = cc_crud.get_by_claim(db, claim_id=claim_id)
    conflict_ids = [cc.conflict_id for cc in ccs]
    conflicts = conflict_crud.get_by_ids(db, ids=conflict_ids)
    
    # Load Research Questions
    research_questions = rq_crud.get_by_conflicts(db, conflict_ids=conflict_ids)
    rq_ids = [rq.id for rq in research_questions]
    
    # Load Hypotheses
    hypotheses = hyp_crud.get_by_research_questions(db, research_question_ids=rq_ids)
    
    return GraphResponse(
        claim=ClaimRead.model_validate(claim),
        concepts=[ConceptRead.model_validate(c) for c in concepts],
        interpretation=InterpretationRead.model_validate(interpretation) if interpretation else None,
        conflicts=[ConflictRead.model_validate(c) for c in conflicts],
        research_questions=[ResearchQuestionRead.model_validate(rq) for rq in research_questions],
        hypotheses=[HypothesisRead.model_validate(h) for h in hypotheses]
    )

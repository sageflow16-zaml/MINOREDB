from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.crud import claim as claim_crud
from src.crud import interpretation as interpretation_crud
from src.models.association import Association
from src.models.concept import Concept
from src.schemas.interpretation import InterpretationCreate
from src.models.interpretation import Interpretation

def process_claim_interpretation(db: Session, claim_id: UUID) -> Interpretation:
    """
    Orchestrates interpretation generation for a given claim.
    """
    claim = claim_crud.get(db, id=claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Claim not found"
        )
    
    # Load all associated Concepts
    associations = db.query(Association).filter(Association.claim_id == claim_id).all()
    concept_ids = [assoc.concept_id for assoc in associations if assoc.concept_id]
    concepts = db.query(Concept).filter(Concept.id.in_(concept_ids)).all() if concept_ids else []
    
    # Extract concept terms and format the statement
    concept_names = [c.conceptual_term for c in concepts if c.conceptual_term]
    concept_names_str = ", ".join(concept_names) if concept_names else "none"
    
    # Formulate statement, reasoning chain, and foundation strictly from explicit data
    interpretation_statement = f"Claim references concepts: {concept_names_str}. Verbatim claim: {claim.verbatim_text}"
    reasoning_chain = "Deterministic concept association."
    interpretation_foundation = "Rule-based extraction."
    
    # Prevent duplicate interpretations
    existing = interpretation_crud.get_by_statement(db, statement=interpretation_statement)
    if existing:
        return existing
        
    # Associate with first concept if present
    concept_id = concept_ids[0] if concept_ids else None
    
    obj_in = InterpretationCreate(
        concept_id=concept_id,
        interpretation_statement=interpretation_statement,
        reasoning_chain=reasoning_chain,
        interpretation_foundation=interpretation_foundation
    )
    
    return interpretation_crud.create(db, obj_in=obj_in)

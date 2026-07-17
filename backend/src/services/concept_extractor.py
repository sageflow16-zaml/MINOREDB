import re
from uuid import UUID
from sqlalchemy.orm import Session
from src.crud import concept as concept_crud
from src.crud import association as association_crud
from src.crud import claim as claim_crud
from src.models.concept import Concept
from src.schemas.concept import ConceptCreate
from src.schemas.association import AssociationCreate

def extract_concept_candidates(text: str) -> list[str]:
    """
    Deterministically extracts concept candidates from text.
    Supports:
    - Acronyms (e.g., ICT, SMC, BOS, FVG)
    - Capitalized phrases (e.g., Fair Value Gap, Order Block)
    - Mixed abbreviations (e.g., PD Array)
    """
    if not text:
        return []

    # Matches:
    # 1. All-caps acronyms (2+ chars): \b[A-Z]{2,}\b
    # 2. Capitalized phrases: \b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b
    # 3. Mixed (Acronym + Capitalized): \b[A-Z]{2,}(?:\s+[A-Z][a-z]+)*\b
    
    # Combined pattern to capture the above
    pattern = r'\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2,}(?:\s+[A-Z][a-z]+)*)\b'
    candidates = re.findall(pattern, text)
    
    seen = set()
    return [x for x in candidates if not (x in seen or seen.add(x))]

def process_claim_concepts(db: Session, claim_id: UUID) -> list[Concept]:
    """
    Orchestrates the extraction and association of concepts for a given claim.
    """
    claim = claim_crud.get(db, id=claim_id)
    if not claim or not claim.verbatim_text:
        return []

    candidates = extract_concept_candidates(claim.verbatim_text)
    project_id = claim.project_id

    # Batch-load existing concepts for all candidate terms in a single query (no N+1).
    existing = concept_crud.get_by_terms(db, terms=candidates)
    existing_by_term = {c.conceptual_term: c for c in existing}

    processed_concepts = []
    for term in candidates:
        concept = existing_by_term.get(term)

        if not concept:
            concept_in = ConceptCreate(
                conceptual_term=term,
                definition=f"Extracted from claim {claim_id}"
            )
            concept = concept_crud.create(db, project_id=project_id, obj_in=concept_in)
            existing_by_term[term] = concept

        # Prevent duplicate associations
        if not association_crud.get_by_claim_and_concept(db, claim_id=claim_id, concept_id=concept.id):
            association_in = AssociationCreate(
                claim_id=claim_id,
                concept_id=concept.id,
                association_state="EXTRACTED"
            )
            association_crud.create(db, project_id=project_id, obj_in=association_in)
        
        processed_concepts.append(concept)
        
    return processed_concepts

import re
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.crud import source as source_crud
from src.crud import conflict as conflict_crud
from src.crud import claim_conflict as cc_crud
from src.models.claim import Claim
from src.models.association import Association
from src.schemas.conflict import ConflictCreate
from src.schemas.claim_conflict import ClaimConflictCreate

POLARITY_PAIRS = [
    ("increase", "decrease"),
    ("higher", "lower"),
    ("always", "never"),
    ("true", "false"),
    ("buy", "sell"),
    ("bullish", "bearish"),
    ("long", "short"),
    ("above", "below"),
    ("before", "after"),
    ("present", "absent"),
    ("support", "resistance")
]

def has_polarity_conflict(text1: str, text2: str) -> bool:
    """
    Checks if two texts contain opposing polarity terms using word boundaries.
    """
    t1 = text1.lower()
    t2 = text2.lower()
    
    for p1, p2 in POLARITY_PAIRS:
        p1_in_t1 = bool(re.search(rf"\b{p1}\b", t1))
        p2_in_t2 = bool(re.search(rf"\b{p2}\b", t2))
        p2_in_t1 = bool(re.search(rf"\b{p2}\b", t1))
        p1_in_t2 = bool(re.search(rf"\b{p1}\b", t2))
        
        if (p1_in_t1 and p2_in_t2) or (p2_in_t1 and p1_in_t2):
            return True
            
    return False

def process_source_conflicts(db: Session, source_id: UUID) -> int:
    """
    Orchestrates deterministic conflict detection among claims of a given source.
    """
    source = source_crud.get(db, id=source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Source not found"
        )

    claims = db.query(Claim).filter(Claim.source_id == source_id).all()
    if len(claims) < 2:
        return 0

    claim_concepts = {}
    for claim in claims:
        associations = db.query(Association).filter(Association.claim_id == claim.id).all()
        claim_concepts[claim.id] = {a.concept_id for a in associations if a.concept_id}

    conflicts_created = 0

    for i in range(len(claims)):
        for j in range(i + 1, len(claims)):
            c1 = claims[i]
            c2 = claims[j]

            if c1.verbatim_text == c2.verbatim_text:
                continue

            shared_concepts = claim_concepts[c1.id].intersection(claim_concepts[c2.id])
            if not shared_concepts:
                continue

            if has_polarity_conflict(c1.verbatim_text, c2.verbatim_text):
                # Check for existing conflict between c1 and c2 via ClaimConflict
                conflicts_a = {cc.conflict_id for cc in cc_crud.get_by_claim(db, claim_id=c1.id)}
                conflicts_b = {cc.conflict_id for cc in cc_crud.get_by_claim(db, claim_id=c2.id)}
                
                if not conflicts_a.intersection(conflicts_b):
                    classification = "Deterministic polarity conflict detected. Confidence: HIGH"
                    applicability_check = "Opposite polarity terms detected in claims sharing concepts."
                    
                    conflict_in = ConflictCreate(
                        conflict_classification=classification,
                        contextual_applicability_check=applicability_check
                    )
                    conflict = conflict_crud.create(db, obj_in=conflict_in)
                    
                    # Create two ClaimConflict rows
                    cc1 = ClaimConflictCreate(claim_id=c1.id, conflict_id=conflict.id)
                    cc2 = ClaimConflictCreate(claim_id=c2.id, conflict_id=conflict.id)
                    cc_crud.create(db, obj_in=cc1)
                    cc_crud.create(db, obj_in=cc2)
                    
                    conflicts_created += 1

    return conflicts_created

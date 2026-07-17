import re
from uuid import UUID
from sqlalchemy import select
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
    ("increase", "decrease"), ("higher", "lower"), ("always", "never"),
    ("true", "false"), ("buy", "sell"), ("bullish", "bearish"),
    ("long", "short"), ("above", "below"), ("before", "after"),
    ("present", "absent"), ("support", "resistance")
]

def has_polarity_conflict(text1: str, text2: str) -> bool:
    t1 = text1.lower()
    t2 = text2.lower()
    
    for p1, p2 in POLARITY_PAIRS:
        if (bool(re.search(rf"\b{p1}\b", t1)) and bool(re.search(rf"\b{p2}\b", t2))) or \
           (bool(re.search(rf"\b{p2}\b", t1)) and bool(re.search(rf"\b{p1}\b", t2))):
            return True
    return False

def process_source_conflicts(db: Session, source_id: UUID) -> int:
    source = source_crud.get(db, id=source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    project_id = source.project_id

    # Load claims
    stmt = select(Claim).where(Claim.source_id == source_id)
    claims = db.scalars(stmt).all()
    if len(claims) < 2:
        return 0

    # Group claims by concept: concept_id -> list of claim_ids
    concept_map = {}
    for claim in claims:
        stmt = select(Association.concept_id).where(Association.claim_id == claim.id)
        c_ids = db.scalars(stmt).all()
        for cid in c_ids:
            concept_map.setdefault(cid, []).append(claim)

    conflicts_created = 0
    checked_pairs = set()

    # Stage all writes and commit once at the end so a failure cannot leave a
    # dangling Conflict with only one ClaimConflict link (atomic transaction).
    staged: list[ClaimConflictCreate] = []
    for claims_in_concept in concept_map.values():
        if len(claims_in_concept) < 2:
            continue
            
        for i in range(len(claims_in_concept)):
            for j in range(i + 1, len(claims_in_concept)):
                c1, c2 = claims_in_concept[i], claims_in_concept[j]
                pair_id = tuple(sorted((c1.id, c2.id)))
                
                if pair_id in checked_pairs or c1.verbatim_text == c2.verbatim_text:
                    continue
                
                checked_pairs.add(pair_id)

                if has_polarity_conflict(c1.verbatim_text, c2.verbatim_text):
                    # Check for existing conflict via ClaimConflict linkage
                    conflicts_a = {cc.conflict_id for cc in cc_crud.get_by_claim(db, claim_id=c1.id)}
                    conflicts_b = {cc.conflict_id for cc in cc_crud.get_by_claim(db, claim_id=c2.id)}
                    
                    if not conflicts_a.intersection(conflicts_b):
                        conflict = conflict_crud.create(db, project_id=project_id, obj_in=ConflictCreate(
                            conflict_classification="Deterministic polarity conflict detected. Confidence: HIGH",
                            contextual_applicability_check="Opposite polarity terms detected."
                        ), commit=False)
                        db.flush()

                        staged.append(ClaimConflictCreate(
                            project_id=project_id,
                            claim_id=c1.id,
                            conflict_id=conflict.id,
                        ))
                        staged.append(ClaimConflictCreate(
                            project_id=project_id,
                            claim_id=c2.id,
                            conflict_id=conflict.id,
                        ))
                        
                        conflicts_created += 1

    if staged:
        for link in staged:
            cc_crud.create(db, obj_in=link, commit=False)
        db.commit()

    return conflicts_created

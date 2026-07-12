from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status
from src.crud import source as source_crud
from src.crud import claim as claim_crud
from src.services.claim_extractor import extract_claims
from src.schemas.claim import ClaimCreate

def extract_claims_from_source(db: Session, source_id: UUID) -> int:
    """
    Orchestrates the extraction of claims from a source.
    """
    source = source_crud.get(db, id=source_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    
    if not source.normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Source has no normalized text to extract from"
        )
    
    extracted_texts = extract_claims(source.normalized_text)
    
    created_count = 0
    for text in extracted_texts:
        # Duplicate detection moved to CRUD layer
        if not claim_crud.get_by_text_and_source(db, text=text, source_id=source_id):
            claim_in = ClaimCreate(
                source_id=source_id,
                verbatim_text=text
            )
            claim_crud.create(db, obj_in=claim_in)
            created_count += 1
            
    return created_count

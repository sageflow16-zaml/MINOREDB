from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.schemas.claim import ClaimCreate, ClaimUpdate, ClaimRead
from src.crud import claim as crud
from src.services.concept_extractor import process_claim_concepts
from src.services.interpretation_engine import process_claim_interpretation
from src.services.graph_explorer import explore_claim
from src.schemas.graph import GraphResponse

router = APIRouter()

@router.get("/", response_model=list[ClaimRead])
def read_claims(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=ClaimRead)
def read_claim(id: UUID, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return db_obj

@router.post("/", response_model=ClaimRead, status_code=status.HTTP_201_CREATED)
def create_claim(obj_in: ClaimCreate, db: Session = Depends(get_db)):
    return crud.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ClaimRead)
def update_claim(id: UUID, obj_in: ClaimUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return crud.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_claim(id: UUID, db: Session = Depends(get_db)):
    if not crud.remove(db, id=id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return None

@router.post("/{claim_id}/extract-concepts")
def extract_concepts(claim_id: UUID, db: Session = Depends(get_db)):
    concepts = process_claim_concepts(db, claim_id=claim_id)
    return {
        "claim_id": claim_id,
        "concepts_created": len(concepts)
    }

@router.post("/{claim_id}/interpret")
def interpret_claim(claim_id: UUID, db: Session = Depends(get_db)):
    interpretation = process_claim_interpretation(db, claim_id=claim_id)
    return {
        "claim_id": claim_id,
        "interpretation_id": interpretation.id,
        "status": "created"
    }

@router.get("/{claim_id}/graph", response_model=GraphResponse)
def get_claim_graph(claim_id: UUID, db: Session = Depends(get_db)):
    return explore_claim(db, claim_id=claim_id)

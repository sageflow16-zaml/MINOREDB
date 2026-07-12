from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db
from src.services.knowledge_search import search_knowledge

router = APIRouter()

@router.get("/")
def search(q: str, db: Session = Depends(get_db)):
    return search_knowledge(db, q)

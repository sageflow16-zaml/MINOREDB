from fastapi import APIRouter
from src.api.routes import (
    source,
    claim,
    concept,
    association,
    conflict,
    interpretation,
    reconsideration_trigger,
    research_question,
    hypothesis,
)

api_router = APIRouter()

api_router.include_router(source.router, prefix="/sources", tags=["Sources"])
api_router.include_router(claim.router, prefix="/claims", tags=["Claims"])
api_router.include_router(concept.router, prefix="/concepts", tags=["Concepts"])
api_router.include_router(association.router, prefix="/associations", tags=["Associations"])
api_router.include_router(conflict.router, prefix="/conflicts", tags=["Conflicts"])
api_router.include_router(interpretation.router, prefix="/interpretations", tags=["Interpretations"])
api_router.include_router(reconsideration_trigger.router, prefix="/triggers", tags=["Triggers"])
api_router.include_router(research_question.router, prefix="/questions", tags=["Questions"])
api_router.include_router(hypothesis.router, prefix="/hypotheses", tags=["Hypotheses"])

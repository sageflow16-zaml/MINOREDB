from pydantic import BaseModel
from typing import List, Optional
from src.schemas.claim import ClaimRead
from src.schemas.concept import ConceptRead
from src.schemas.interpretation import InterpretationRead
from src.schemas.conflict import ConflictRead
from src.schemas.research_question import ResearchQuestionRead
from src.schemas.hypothesis import HypothesisRead

class GraphResponse(BaseModel):
    claim: ClaimRead
    concepts: List[ConceptRead]
    interpretation: Optional[InterpretationRead] = None
    conflicts: List[ConflictRead]
    research_questions: List[ResearchQuestionRead]
    hypotheses: List[HypothesisRead]

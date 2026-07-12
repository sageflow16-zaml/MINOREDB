from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.db.base import (
    Source, Claim, Concept, Interpretation, 
    ResearchQuestion, Hypothesis
)

def search_knowledge(db: Session, query: str) -> dict:
    """
    Performs a deterministic, case-insensitive partial match search across
    key entities in the knowledge graph.
    """
    q = f"%{query}%"
    
    return {
        "sources": db.query(Source).filter(
            or_(Source.raw_text.ilike(q), Source.normalized_text.ilike(q))
        ).all(),
        "claims": db.query(Claim).filter(
            Claim.verbatim_text.ilike(q)
        ).all(),
        "concepts": db.query(Concept).filter(
            or_(Concept.conceptual_term.ilike(q), Concept.definition.ilike(q))
        ).all(),
        "interpretations": db.query(Interpretation).filter(
            or_(
                Interpretation.interpretation_statement.ilike(q),
                Interpretation.reasoning_chain.ilike(q),
                Interpretation.interpretation_foundation.ilike(q)
            )
        ).all(),
        "research_questions": db.query(ResearchQuestion).filter(
            ResearchQuestion.question_statement.ilike(q)
        ).all(),
        "hypotheses": db.query(Hypothesis).filter(
            Hypothesis.hypothesis_statement.ilike(q)
        ).all()
    }

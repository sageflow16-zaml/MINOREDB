from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, select
from src.db.base import (
    Source, Claim, Concept, Interpretation,
    ResearchQuestion, Hypothesis
)
from src.schemas.source import SourceRead
from src.schemas.claim import ClaimRead
from src.schemas.concept import ConceptRead
from src.schemas.interpretation import InterpretationRead
from src.schemas.research_question import ResearchQuestionRead
from src.schemas.hypothesis import HypothesisRead


def search_knowledge(db: Session, query: str, project_id: UUID | None = None) -> dict:
    """
    Performs a deterministic, case-insensitive partial match search across
    key entities in the knowledge graph, scoped to a project when provided.
    """
    q = f"%{query}%"

    def _scope(stmt, model):
        if project_id is not None:
            stmt = stmt.where(model.project_id == project_id)
        return stmt

    sources = db.scalars(
        _scope(select(Source).filter(
            or_(Source.raw_text.ilike(q), Source.normalized_text.ilike(q))
        ), Source)
    ).all()
    claims = db.scalars(
        _scope(select(Claim).filter(Claim.verbatim_text.ilike(q)), Claim)
    ).all()
    concepts = db.scalars(
        _scope(select(Concept).filter(
            or_(Concept.conceptual_term.ilike(q), Concept.definition.ilike(q))
        ), Concept)
    ).all()
    interpretations = db.scalars(
        _scope(select(Interpretation).filter(
            or_(
                Interpretation.interpretation_statement.ilike(q),
                Interpretation.reasoning_chain.ilike(q),
                Interpretation.interpretation_foundation.ilike(q)
            )
        ), Interpretation)
    ).all()
    research_questions = db.scalars(
        _scope(select(ResearchQuestion).filter(
            ResearchQuestion.question_statement.ilike(q)
        ), ResearchQuestion)
    ).all()
    hypotheses = db.scalars(
        _scope(select(Hypothesis).filter(
            Hypothesis.hypothesis_statement.ilike(q)
        ), Hypothesis)
    ).all()

    return {
        "sources": [SourceRead.model_validate(s) for s in sources],
        "claims": [ClaimRead.model_validate(c) for c in claims],
        "concepts": [ConceptRead.model_validate(c) for c in concepts],
        "interpretations": [InterpretationRead.model_validate(i) for i in interpretations],
        "research_questions": [ResearchQuestionRead.model_validate(r) for r in research_questions],
        "hypotheses": [HypothesisRead.model_validate(h) for h in hypotheses],
    }

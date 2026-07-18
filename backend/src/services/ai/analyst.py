"""AI Research Analyst — orchestrates planning, retrieval, context building, LLM, and validation."""

from uuid import UUID
from sqlalchemy.orm import Session

from src.services.ai.planner import plan
from src.services.ai.retrievers import RETRIEVERS
from src.services.ai.context_builder import build_context
from src.services.ai.llm import generate_answer
from src.services.ai.validator import validate


def analyze(project_id: UUID, question: str, db: Session) -> dict:
    """Run the full analysis pipeline: plan → retrieve → build → LLM → validate → return."""
    engines = plan(question)

    evidence: dict[str, object] = {}
    for engine in engines:
        retriever = RETRIEVERS.get(engine)
        if not retriever:
            continue
        try:
            if engine in ("trade_memory", "statistics", "patterns", "knowledge_rules", "learning"):
                result = retriever(db, project_id)
            elif engine == "macro":
                result = retriever(db, project_id)
            elif engine == "knowledge_graph":
                result = retriever(db, project_id)
            elif engine == "similarity":
                result = retriever(db, project_id, trade_id=None)
            elif engine == "institutional_knowledge":
                result = retriever(db, project_id)
            else:
                result = retriever(db, project_id)
            if result:
                evidence[engine] = result
        except Exception:
            continue

    context = build_context(evidence, question)
    llm_result = generate_answer(context)
    raw_answer = llm_result.get("answer", "")
    validated = validate(raw_answer, context)
    evidence_list = [
        {"source": name, "data": data}
        for name, data in evidence.items()
        if data
    ]

    return {
        "answer": validated,
        "confidence": llm_result.get("confidence", 0),
        "sources": llm_result.get("sources", []),
        "evidence": evidence_list[:5],
    }

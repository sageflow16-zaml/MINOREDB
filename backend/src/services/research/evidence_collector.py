"""Evidence Collector — collects raw evidence from every project data source.

Each collector returns structured dicts. Never raises on empty/missing data.
"""

from uuid import UUID
from sqlalchemy.orm import Session
from src.services.ai.retrievers import RETRIEVERS


def collect_trade_memory(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["trade_memory"](db, project_id, limit=20)
    except Exception:
        return []


def collect_similarity(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["similarity"](db, project_id, trade_id=None, limit=10)
    except Exception:
        return []


def collect_statistics(db: Session, project_id: UUID) -> dict:
    try:
        return RETRIEVERS["statistics"](db, project_id)
    except Exception:
        return {}


def collect_patterns(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["patterns"](db, project_id, limit=20)
    except Exception:
        return []


def collect_knowledge_rules(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["knowledge_rules"](db, project_id, limit=20)
    except Exception:
        return []


def collect_knowledge_graph(db: Session, project_id: UUID) -> dict:
    try:
        return RETRIEVERS["knowledge_graph"](db, project_id)
    except Exception:
        return {}


def collect_macro(db: Session, project_id: UUID) -> dict:
    try:
        return RETRIEVERS["macro"](db, project_id, limit=20)
    except Exception:
        return {"recent_events": []}


def collect_learning(db: Session, project_id: UUID) -> dict:
    try:
        return RETRIEVERS["learning"](db, project_id, limit=10)
    except Exception:
        return {"events": [], "latest_snapshot": None}


def collect_institutional_knowledge(db: Session, project_id: UUID) -> dict:
    try:
        return RETRIEVERS["institutional_knowledge"](db, project_id, limit=20)
    except Exception:
        return {"results": [], "relationships": [], "examples": [], "summary": {}}


def collect_trade_debriefs(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["trade_debrief"](db, project_id, limit=20)
    except Exception:
        return []


def collect_personal_patterns(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["personal_pattern"](db, project_id, limit=20)
    except Exception:
        return []


def collect_personal_rules(db: Session, project_id: UUID) -> list[dict]:
    try:
        return RETRIEVERS["personal_rule"](db, project_id, limit=20)
    except Exception:
        return []


def collect_trader_profile(db: Session, project_id: UUID) -> dict | None:
    try:
        return RETRIEVERS["trader_profile"](db, project_id)
    except Exception:
        return None


COLLECTORS: dict[str, callable] = {
    "trade_memory": collect_trade_memory,
    "similarity": collect_similarity,
    "statistics": collect_statistics,
    "patterns": collect_patterns,
    "knowledge_rules": collect_knowledge_rules,
    "knowledge_graph": collect_knowledge_graph,
    "macro": collect_macro,
    "learning": collect_learning,
    "trade_debrief": collect_trade_debriefs,
    "personal_pattern": collect_personal_patterns,
    "personal_rule": collect_personal_rules,
    "trader_profile": collect_trader_profile,
    "institutional_knowledge": collect_institutional_knowledge,
}


def collect_all(db: Session, project_id: UUID) -> dict[str, object]:
    """Collect evidence from all available sources."""
    evidence: dict[str, object] = {}
    for name, collector in COLLECTORS.items():
        try:
            result = collector(db, project_id)
            if result:
                evidence[name] = result
        except Exception:
            continue
    return evidence


def collect_tool(db: Session, project_id: UUID, tool: str) -> object:
    """Collect evidence from a single named tool."""
    collector = COLLECTORS.get(tool)
    if not collector:
        return None
    try:
        return collector(db, project_id)
    except Exception:
        return None

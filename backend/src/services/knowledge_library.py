"""Deterministic retrievers for the Institutional Knowledge Library.

Every function returns structured dicts only. No LLM, no external calls.
These are registered in the AI Analyst RETRIEVERS dict so that both the
quick Q&A pipeline and the full Research Engine can use them as evidence.
"""

from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session, joinedload
from src.models.knowledge import KnowledgeConcept, KnowledgeCategory, KnowledgeTag, KnowledgeRelationship, KnowledgeExample, KnowledgeReference


def get_institutional_concepts(db: Session, concept_id: UUID | None = None, limit: int = 10) -> list[dict]:
    stmt = select(KnowledgeConcept).options(
        joinedload(KnowledgeConcept.category),
        joinedload(KnowledgeConcept.tags),
    ).where(KnowledgeConcept.status == "published")
    if concept_id:
        stmt = stmt.where(KnowledgeConcept.id == concept_id)
    concepts = list(db.scalars(stmt.order_by(KnowledgeConcept.confidence.desc().nullslast()).limit(limit)).unique().all())
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "category": c.category.name if c.category else None,
            "summary": c.summary,
            "definition": c.definition,
            "purpose": c.purpose,
            "difficulty": c.difficulty,
            "confidence": c.confidence,
            "tags": [t.name for t in c.tags],
        }
        for c in concepts
    ]


def get_institutional_concepts_by_category(db: Session, category_slug: str, limit: int = 20) -> list[dict]:
    cat = db.scalar(select(KnowledgeCategory).where(KnowledgeCategory.slug == category_slug))
    if not cat:
        return []
    concepts = db.scalars(
        select(KnowledgeConcept)
        .where(KnowledgeConcept.category_id == cat.id, KnowledgeConcept.status == "published")
        .order_by(KnowledgeConcept.title)
        .limit(limit)
    ).all()
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "summary": c.summary,
            "difficulty": c.difficulty,
            "confidence": c.confidence,
        }
        for c in concepts
    ]


def get_institutional_rules(db: Session, concept_id: UUID | None = None, limit: int = 10) -> list[dict]:
    stmt = select(KnowledgeConcept).where(KnowledgeConcept.status == "published", KnowledgeConcept.rules.isnot(None))
    if concept_id:
        stmt = stmt.where(KnowledgeConcept.id == concept_id)
    concepts = db.scalars(stmt.order_by(KnowledgeConcept.confidence.desc().nullslast()).limit(limit)).all()
    result = []
    for c in concepts:
        rules = c.rules or {}
        result.append({
            "concept_id": str(c.id),
            "concept_title": c.title,
            "rules": rules.get("rules", rules),
            "conditions": c.conditions,
            "confirmations": c.confirmations,
            "invalidations": c.invalidations,
        })
    return result


def get_institutional_relationships(db: Session, concept_id: UUID | None = None, limit: int = 20) -> list[dict]:
    stmt = select(KnowledgeRelationship).options(
        joinedload(KnowledgeRelationship.source_concept),
        joinedload(KnowledgeRelationship.target_concept),
    )
    if concept_id:
        stmt = stmt.where(
            or_(KnowledgeRelationship.source_concept_id == concept_id, KnowledgeRelationship.target_concept_id == concept_id)
        )
    rels = db.scalars(stmt.limit(limit)).all()
    return [
        {
            "id": str(r.id),
            "source": r.source_concept.title if r.source_concept else str(r.source_concept_id),
            "target": r.target_concept.title if r.target_concept else str(r.target_concept_id),
            "relationship_type": r.relationship_type,
            "strength": r.strength,
            "confidence": r.confidence,
            "description": r.description,
        }
        for r in rels
    ]


def get_institutional_examples(db: Session, concept_id: UUID | None = None, limit: int = 10) -> list[dict]:
    stmt = select(KnowledgeExample).options(joinedload(KnowledgeExample.concept))
    if concept_id:
        stmt = stmt.where(KnowledgeExample.concept_id == concept_id)
    examples = db.scalars(stmt.order_by(KnowledgeExample.created_at.desc()).limit(limit)).all()
    return [
        {
            "id": str(e.id),
            "concept_title": e.concept.title if e.concept else None,
            "title": e.title,
            "description": e.description,
            "market": e.market,
            "pair": e.pair,
            "timeframe": e.timeframe,
        }
        for e in examples
    ]


def search_institutional_knowledge(db: Session, q: str, limit: int = 10) -> list[dict]:
    like = f"%{q}%"
    concepts = list(db.scalars(
        select(KnowledgeConcept)
        .options(joinedload(KnowledgeConcept.category))
        .where(
            KnowledgeConcept.status == "published",
            or_(KnowledgeConcept.title.ilike(like), KnowledgeConcept.summary.ilike(like), KnowledgeConcept.definition.ilike(like)),
        )
        .limit(limit)
    ).unique().all())
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "category": c.category.name if c.category else None,
            "summary": c.summary,
            "match_type": "concept",
        }
        for c in concepts
    ]


def get_institutional_knowledge_summary(db: Session, limit: int = 10) -> dict:
    total = db.scalar(select(func.count()).select_from(KnowledgeConcept))
    categories = db.scalars(
        select(KnowledgeCategory).order_by(KnowledgeCategory.sort_order)
    ).all()
    return {
        "total_concepts": total or 0,
        "categories": [
            {"name": cat.name, "slug": cat.slug, "icon": cat.icon, "color": cat.color}
            for cat in categories
        ],
    }


# --- Retriever registration for the AI Analyst ---

def get_institutional_knowledge(db: Session, project_id: UUID, question: str | None = None, limit: int = 10) -> dict:
    if question:
        results = search_institutional_knowledge(db, question, limit=limit)
    else:
        results = get_institutional_concepts(db, limit=limit)
    rels = get_institutional_relationships(db, limit=limit)
    examples = get_institutional_examples(db, limit=limit)
    summary = get_institutional_knowledge_summary(db)
    return {
        "results": results,
        "relationships": rels,
        "examples": examples,
        "summary": summary,
    }

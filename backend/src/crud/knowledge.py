from uuid import UUID
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import Session, joinedload
from src.models.knowledge import (
    KnowledgeCategory, KnowledgeTag, KnowledgeConcept, KnowledgeConceptTag,
    KnowledgeRelationship, KnowledgeExample, KnowledgeReference,
    KnowledgeSource, KnowledgeChunk, KnowledgeRevision,
)
from src.schemas.knowledge import (
    KnowledgeCategoryCreate, KnowledgeCategoryUpdate,
    KnowledgeTagCreate, KnowledgeTagUpdate,
    KnowledgeConceptCreate, KnowledgeConceptUpdate,
    KnowledgeRelationshipCreate, KnowledgeRelationshipUpdate,
    KnowledgeExampleCreate, KnowledgeExampleUpdate,
    KnowledgeReferenceCreate, KnowledgeReferenceUpdate,
    KnowledgeSourceCreate, KnowledgeSourceUpdate,
)


def _sync_tags(db: Session, concept: KnowledgeConcept, tag_ids: list[UUID] | None) -> None:
    if tag_ids is None:
        return
    existing = {t.id for t in concept.tags}
    desired = set(tag_ids)
    for tid in desired - existing:
        tag = db.get(KnowledgeTag, tid)
        if tag:
            concept.tags.append(tag)
    for tid in existing - desired:
        tag = db.get(KnowledgeTag, tid)
        if tag:
            concept.tags.remove(tag)


# --- Category ---

def get_category(db: Session, id: UUID) -> KnowledgeCategory | None:
    return db.get(KnowledgeCategory, id)

def get_category_by_slug(db: Session, slug: str) -> KnowledgeCategory | None:
    return db.scalar(select(KnowledgeCategory).where(KnowledgeCategory.slug == slug))

def get_categories(db: Session, *, skip: int = 0, limit: int = 100) -> list[KnowledgeCategory]:
    return db.scalars(select(KnowledgeCategory).order_by(KnowledgeCategory.sort_order, KnowledgeCategory.name).offset(skip).limit(limit)).all()

def create_category(db: Session, *, obj_in: KnowledgeCategoryCreate) -> KnowledgeCategory:
    db_obj = KnowledgeCategory(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_category(db: Session, *, db_obj: KnowledgeCategory, obj_in: KnowledgeCategoryUpdate) -> KnowledgeCategory:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_category(db: Session, *, id: UUID) -> KnowledgeCategory | None:
    obj = db.get(KnowledgeCategory, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Tag ---

def get_tag(db: Session, id: UUID) -> KnowledgeTag | None:
    return db.get(KnowledgeTag, id)

def get_tags(db: Session, *, skip: int = 0, limit: int = 100) -> list[KnowledgeTag]:
    return db.scalars(select(KnowledgeTag).order_by(KnowledgeTag.name).offset(skip).limit(limit)).all()

def create_tag(db: Session, *, obj_in: KnowledgeTagCreate) -> KnowledgeTag:
    db_obj = KnowledgeTag(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_tag(db: Session, *, db_obj: KnowledgeTag, obj_in: KnowledgeTagUpdate) -> KnowledgeTag:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_tag(db: Session, *, id: UUID) -> KnowledgeTag | None:
    obj = db.get(KnowledgeTag, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Concept ---

def get_concept(db: Session, id: UUID) -> KnowledgeConcept | None:
    return db.scalar(
        select(KnowledgeConcept)
        .options(
            joinedload(KnowledgeConcept.tags),
            joinedload(KnowledgeConcept.category),
            joinedload(KnowledgeConcept.relationships_outgoing).joinedload(KnowledgeRelationship.target_concept),
            joinedload(KnowledgeConcept.relationships_incoming).joinedload(KnowledgeRelationship.source_concept),
            joinedload(KnowledgeConcept.examples),
            joinedload(KnowledgeConcept.references),
            joinedload(KnowledgeConcept.revisions),
        )
        .where(KnowledgeConcept.id == id)
    )

def get_concept_by_slug(db: Session, category_id: UUID, slug: str) -> KnowledgeConcept | None:
    return db.scalar(
        select(KnowledgeConcept)
        .options(joinedload(KnowledgeConcept.tags))
        .where(KnowledgeConcept.category_id == category_id, KnowledgeConcept.slug == slug)
    )

def get_concepts(db: Session, *, skip: int = 0, limit: int = 100, category_id: UUID | None = None) -> list[KnowledgeConcept]:
    stmt = select(KnowledgeConcept).options(joinedload(KnowledgeConcept.tags), joinedload(KnowledgeConcept.category))
    if category_id:
        stmt = stmt.where(KnowledgeConcept.category_id == category_id)
    return list(db.scalars(stmt.order_by(KnowledgeConcept.title).offset(skip).limit(limit)).unique().all())

def create_concept(db: Session, *, obj_in: KnowledgeConceptCreate) -> KnowledgeConcept:
    data = obj_in.model_dump(exclude={"tag_ids"})
    db_obj = KnowledgeConcept(**data)
    db.add(db_obj)
    db.flush()
    _sync_tags(db, db_obj, obj_in.tag_ids)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_concept(db: Session, *, db_obj: KnowledgeConcept, obj_in: KnowledgeConceptUpdate) -> KnowledgeConcept:
    data = obj_in.model_dump(exclude={"tag_ids"}, exclude_unset=True)
    for field, value in data.items():
        setattr(db_obj, field, value)
    _sync_tags(db, db_obj, obj_in.tag_ids)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_concept(db: Session, *, id: UUID) -> KnowledgeConcept | None:
    obj = db.get(KnowledgeConcept, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Relationship ---

def get_relationship(db: Session, id: UUID) -> KnowledgeRelationship | None:
    return db.scalar(
        select(KnowledgeRelationship)
        .options(
            joinedload(KnowledgeRelationship.source_concept).joinedload(KnowledgeConcept.tags),
            joinedload(KnowledgeRelationship.target_concept).joinedload(KnowledgeConcept.tags),
        )
        .where(KnowledgeRelationship.id == id)
    )

def get_relationships(db: Session, *, skip: int = 0, limit: int = 100, concept_id: UUID | None = None) -> list[KnowledgeRelationship]:
    stmt = select(KnowledgeRelationship).options(
        joinedload(KnowledgeRelationship.source_concept),
        joinedload(KnowledgeRelationship.target_concept),
    )
    if concept_id:
        stmt = stmt.where(
            or_(KnowledgeRelationship.source_concept_id == concept_id, KnowledgeRelationship.target_concept_id == concept_id)
        )
    return db.scalars(stmt.order_by(KnowledgeRelationship.created_at.desc()).offset(skip).limit(limit)).all()

def create_relationship(db: Session, *, obj_in: KnowledgeRelationshipCreate) -> KnowledgeRelationship:
    db_obj = KnowledgeRelationship(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_relationship(db: Session, *, db_obj: KnowledgeRelationship, obj_in: KnowledgeRelationshipUpdate) -> KnowledgeRelationship:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_relationship(db: Session, *, id: UUID) -> KnowledgeRelationship | None:
    obj = db.get(KnowledgeRelationship, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Example ---

def get_example(db: Session, id: UUID) -> KnowledgeExample | None:
    return db.get(KnowledgeExample, id)

def get_examples(db: Session, *, skip: int = 0, limit: int = 100, concept_id: UUID | None = None) -> list[KnowledgeExample]:
    stmt = select(KnowledgeExample)
    if concept_id:
        stmt = stmt.where(KnowledgeExample.concept_id == concept_id)
    return db.scalars(stmt.order_by(KnowledgeExample.created_at.desc()).offset(skip).limit(limit)).all()

def create_example(db: Session, *, obj_in: KnowledgeExampleCreate) -> KnowledgeExample:
    db_obj = KnowledgeExample(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_example(db: Session, *, db_obj: KnowledgeExample, obj_in: KnowledgeExampleUpdate) -> KnowledgeExample:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_example(db: Session, *, id: UUID) -> KnowledgeExample | None:
    obj = db.get(KnowledgeExample, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Reference ---

def get_reference(db: Session, id: UUID) -> KnowledgeReference | None:
    return db.get(KnowledgeReference, id)

def get_references(db: Session, *, skip: int = 0, limit: int = 100, concept_id: UUID | None = None) -> list[KnowledgeReference]:
    stmt = select(KnowledgeReference)
    if concept_id:
        stmt = stmt.where(KnowledgeReference.concept_id == concept_id)
    return db.scalars(stmt.order_by(KnowledgeReference.created_at.desc()).offset(skip).limit(limit)).all()

def create_reference(db: Session, *, obj_in: KnowledgeReferenceCreate) -> KnowledgeReference:
    db_obj = KnowledgeReference(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_reference(db: Session, *, db_obj: KnowledgeReference, obj_in: KnowledgeReferenceUpdate) -> KnowledgeReference:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_reference(db: Session, *, id: UUID) -> KnowledgeReference | None:
    obj = db.get(KnowledgeReference, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# --- Source ---

def get_source(db: Session, id: UUID) -> KnowledgeSource | None:
    return db.get(KnowledgeSource, id)

def get_sources(db: Session, *, skip: int = 0, limit: int = 100) -> list[KnowledgeSource]:
    return db.scalars(select(KnowledgeSource).order_by(KnowledgeSource.created_at.desc()).offset(skip).limit(limit)).all()

def create_source(db: Session, *, obj_in: KnowledgeSourceCreate) -> KnowledgeSource:
    db_obj = KnowledgeSource(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_source(db: Session, *, db_obj: KnowledgeSource, obj_in: KnowledgeSourceUpdate) -> KnowledgeSource:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def search_concepts(
    db: Session, *,
    q: str, category_id: UUID | None = None, tag_ids: list[UUID] | None = None,
    difficulty: str | None = None, status: str | None = None,
    limit: int = 20, offset: int = 0,
) -> list[dict]:
    from sqlalchemy import and_
    stmt = select(KnowledgeConcept).options(joinedload(KnowledgeConcept.tags), joinedload(KnowledgeConcept.category))
    filters = []
    if q:
        like = f"%{q}%"
        filters.append(or_(KnowledgeConcept.title.ilike(like), KnowledgeConcept.summary.ilike(like), KnowledgeConcept.definition.ilike(like)))
    if category_id:
        filters.append(KnowledgeConcept.category_id == category_id)
    if difficulty:
        filters.append(KnowledgeConcept.difficulty == difficulty)
    if status:
        filters.append(KnowledgeConcept.status == status)
    if filters:
        stmt = stmt.where(and_(*filters))
    if tag_ids:
        stmt = stmt.where(KnowledgeConcept.tags.any(KnowledgeTag.id.in_(tag_ids)))
    results = db.scalars(stmt.order_by(KnowledgeConcept.title).offset(offset).limit(limit)).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "summary": c.summary,
            "category_name": c.category.name if c.category else None,
            "difficulty": c.difficulty,
            "status": c.status,
            "match_type": "concept",
            "relevance": 1.0,
        }
        for c in results
    ]


def get_related_concepts(db: Session, concept_id: UUID, limit: int = 20) -> list[KnowledgeConcept]:
    rel_ids = db.scalars(
        select(KnowledgeRelationship.source_concept_id).where(KnowledgeRelationship.target_concept_id == concept_id)
    ).all()
    rel_ids += db.scalars(
        select(KnowledgeRelationship.target_concept_id).where(KnowledgeRelationship.source_concept_id == concept_id)
    ).all()
    if not rel_ids:
        return []
    return list(db.scalars(
        select(KnowledgeConcept)
        .options(joinedload(KnowledgeConcept.tags), joinedload(KnowledgeConcept.category))
        .where(KnowledgeConcept.id.in_(set(rel_ids)))
        .limit(limit)
    ).unique().all())


def get_explorer_data(db: Session, concept_id: UUID | None = None) -> tuple[list[dict], list[dict]]:
    stmt = select(KnowledgeRelationship).options(
        joinedload(KnowledgeRelationship.source_concept),
        joinedload(KnowledgeRelationship.target_concept),
    )
    if concept_id:
        stmt = stmt.where(
            or_(KnowledgeRelationship.source_concept_id == concept_id, KnowledgeRelationship.target_concept_id == concept_id)
        )
    rels = db.scalars(stmt).all()
    seen_ids = set()
    nodes = []
    edges = []
    for r in rels:
        for c in (r.source_concept, r.target_concept):
            if c and c.id not in seen_ids:
                seen_ids.add(c.id)
                nodes.append({"id": c.id, "title": c.title, "category_name": c.category.name if c.category else None, "difficulty": c.difficulty})
        edges.append({"source_id": r.source_concept_id, "target_id": r.target_concept_id, "relationship_type": r.relationship_type, "strength": r.strength})
    return nodes, edges


def get_revisions(db: Session, concept_id: UUID | None = None, *, skip: int = 0, limit: int = 100) -> list[KnowledgeRevision]:
    stmt = select(KnowledgeRevision).options(joinedload(KnowledgeRevision.concept))
    if concept_id:
        stmt = stmt.where(KnowledgeRevision.concept_id == concept_id)
    return db.scalars(stmt.order_by(KnowledgeRevision.created_at.desc()).offset(skip).limit(limit)).all()


def create_revision(db: Session, *, obj_in) -> KnowledgeRevision:
    db_obj = KnowledgeRevision(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

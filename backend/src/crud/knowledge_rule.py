from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.knowledge_rule import KnowledgeRule
from src.schemas.knowledge_rule import KnowledgeRuleCreate, KnowledgeRuleUpdate


def get(db: Session, id: UUID, project_id: UUID) -> KnowledgeRule | None:
    return db.scalar(
        select(KnowledgeRule).where(
            KnowledgeRule.id == id,
            KnowledgeRule.project_id == project_id,
        )
    )


def get_by_signature(db: Session, project_id: UUID, signature: str) -> KnowledgeRule | None:
    return db.scalar(
        select(KnowledgeRule).where(
            KnowledgeRule.project_id == project_id,
            KnowledgeRule.signature == signature,
        )
    )


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, project_id: UUID | None = None
) -> list[KnowledgeRule]:
    stmt = select(KnowledgeRule).order_by(KnowledgeRule.confidence.desc().nullslast())
    if project_id:
        stmt = stmt.where(KnowledgeRule.project_id == project_id)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


def create(db: Session, *, obj_in: KnowledgeRuleCreate) -> KnowledgeRule:
    db_obj = KnowledgeRule(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, *, db_obj: KnowledgeRule, obj_in: KnowledgeRuleUpdate) -> KnowledgeRule:
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, *, id: UUID) -> KnowledgeRule | None:
    obj = db.get(KnowledgeRule, id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

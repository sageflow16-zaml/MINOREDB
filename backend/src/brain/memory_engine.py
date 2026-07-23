from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import or_
from sqlalchemy.orm import Session
from src.brain.models import BrainMemory


def store_memory(
    db: Session,
    project_id: UUID,
    memory_type: str,
    key: str,
    title: str | None = None,
    content: dict | None = None,
    text_content: str | None = None,
    importance: str = "medium",
    tags: list[str] | None = None,
    source_entity_type: str | None = None,
    source_entity_id: str | None = None,
    expires_at: datetime | None = None,
) -> dict:
    existing = db.query(BrainMemory).filter(
        BrainMemory.project_id == project_id,
        BrainMemory.memory_type == memory_type,
        BrainMemory.key == key,
        BrainMemory.is_archived == False,
    ).first()

    if existing:
        existing.content = content
        existing.text_content = text_content
        existing.importance = importance
        existing.tags = tags
        existing.updated_at = datetime.now(timezone.utc)
        if expires_at:
            existing.expires_at = expires_at
        entry = existing
    else:
        entry = BrainMemory(
            project_id=project_id,
            memory_type=memory_type,
            key=key,
            title=title,
            content=content,
            text_content=text_content,
            importance=importance,
            tags=tags,
            source_entity_type=source_entity_type,
            source_entity_id=source_entity_id,
            expires_at=expires_at,
        )
        db.add(entry)

    db.flush()
    return _to_dict(entry)


def get_memory(db: Session, project_id: UUID, memory_type: str, key: str) -> dict | None:
    entry = db.query(BrainMemory).filter(
        BrainMemory.project_id == project_id,
        BrainMemory.memory_type == memory_type,
        BrainMemory.key == key,
        BrainMemory.is_archived == False,
        or_(BrainMemory.expires_at.is_(None), BrainMemory.expires_at > datetime.now(timezone.utc)),
    ).first()
    return _to_dict(entry) if entry else None


def search_memories(
    db: Session,
    project_id: UUID,
    query: str | None = None,
    memory_type: str | None = None,
    tags: list[str] | None = None,
    limit: int = 20,
    include_archived: bool = False,
) -> list[dict]:
    q = db.query(BrainMemory).filter(
        BrainMemory.project_id == project_id,
        or_(BrainMemory.expires_at.is_(None), BrainMemory.expires_at > datetime.now(timezone.utc)),
    )
    if not include_archived:
        q = q.filter(BrainMemory.is_archived == False)
    if memory_type:
        q = q.filter(BrainMemory.memory_type == memory_type)
    if query:
        like = f"%{query}%"
        q = q.filter(
            or_(
                BrainMemory.title.ilike(like),
                BrainMemory.text_content.ilike(like),
                BrainMemory.key.ilike(like),
            )
        )
    if tags:
        q = q.filter(BrainMemory.tags.contains(tags))

    entries = q.order_by(
        BrainMemory.importance.desc(),
        BrainMemory.updated_at.desc(),
    ).limit(limit).all()
    return [_to_dict(e) for e in entries]


def delete_memory(db: Session, project_id: UUID, memory_id: str) -> bool:
    entry = db.query(BrainMemory).filter(
        BrainMemory.id == memory_id,
        BrainMemory.project_id == project_id,
    ).first()
    if not entry:
        return False
    entry.is_archived = True
    db.commit()
    return True


def get_memory_summary(db: Session, project_id: UUID) -> dict:
    entries = db.query(BrainMemory).filter(
        BrainMemory.project_id == project_id,
        BrainMemory.is_archived == False,
    ).all()

    total = len(entries)
    by_type = {}
    importance_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    expired = 0
    now = datetime.now(timezone.utc)

    for e in entries:
        by_type[e.memory_type] = by_type.get(e.memory_type, 0) + 1
        imp = e.importance or "medium"
        importance_dist[imp] = importance_dist.get(imp, 0) + 1
        if e.expires_at and e.expires_at <= now:
            expired += 1

    return {
        "total": total,
        "by_type": by_type,
        "importance_distribution": importance_dist,
        "expired": expired,
        "active": total - expired,
    }


def get_relevant_memories(db: Session, project_id: UUID, context: str, limit: int = 10) -> list[dict]:
    entries = db.query(BrainMemory).filter(
        BrainMemory.project_id == project_id,
        BrainMemory.is_archived == False,
        or_(BrainMemory.expires_at.is_(None), BrainMemory.expires_at > datetime.now(timezone.utc)),
    ).all()

    context_lower = context.lower()
    context_words = set(context_lower.split())

    scored = []
    for e in entries:
        text = (e.text_content or "").lower() + " " + (e.title or "").lower() + " " + (e.key or "").lower()
        text_words = set(text.split())
        overlap = len(context_words & text_words)
        keyword_score = overlap / max(len(context_words), 1)

        imp_map = {"low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}
        imp_score = imp_map.get(e.importance, 0.5)

        age_hours = (now - (e.updated_at or e.created_at)).total_seconds() / 3600
        recency_score = max(0, 1 - age_hours / 720)

        score = 0.4 * imp_score + 0.4 * keyword_score + 0.2 * recency_score
        scored.append((score, e))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [_to_dict(e) for _, e in scored[:limit]]


def _to_dict(entry: BrainMemory) -> dict:
    return {
        "id": entry.id,
        "project_id": entry.project_id,
        "memory_type": entry.memory_type,
        "key": entry.key,
        "title": entry.title,
        "content": entry.content,
        "text_content": entry.text_content,
        "importance": entry.importance,
        "tags": entry.tags,
        "source_entity_type": entry.source_entity_type,
        "source_entity_id": entry.source_entity_id,
        "is_archived": entry.is_archived,
        "expires_at": entry.expires_at.isoformat() if entry.expires_at else None,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }

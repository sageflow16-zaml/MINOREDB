"""
Memory System — manages conversation, preference, long-term, session, knowledge, and prompt history memory.
"""
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from src.models.rag_copilot import AIMemory


class MemorySystem:
    """Manages multiple memory types with scoring, expiry, and summarization."""

    MEMORY_TYPES = {"conversation", "preference", "long_term", "session", "knowledge", "prompt_history"}

    def __init__(self, db: Session):
        self.db = db

    def store(
        self,
        project_id: UUID,
        memory_type: str,
        key: str,
        value: dict | None = None,
        text_value: str | None = None,
        importance: float = 0.5,
        ttl_seconds: int | None = None,
        conversation_id: UUID | None = None,
        tags: list[str] | None = None,
    ) -> AIMemory:
        memory_type = memory_type.lower()
        if memory_type not in self.MEMORY_TYPES:
            raise ValueError(f"Invalid memory_type '{memory_type}'. Must be one of {self.MEMORY_TYPES}")

        expires_at = None
        if ttl_seconds is not None:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

        existing = (
            self.db.query(AIMemory)
            .filter(
                AIMemory.project_id == project_id,
                AIMemory.memory_type == memory_type,
                AIMemory.key == key,
            )
            .first()
        )

        if existing:
            existing.value = value
            existing.text_value = text_value
            existing.importance = importance
            existing.expires_at = expires_at
            existing.conversation_id = conversation_id
            existing.tags = tags
            existing.updated_at = datetime.now(timezone.utc)
            entry = existing
        else:
            entry = AIMemory(
                project_id=project_id,
                memory_type=memory_type,
                key=key,
                value=value,
                text_value=text_value,
                importance=importance,
                expires_at=expires_at,
                conversation_id=conversation_id,
                tags=tags,
            )
            self.db.add(entry)

        self.db.flush()
        return entry

    def get(self, project_id: UUID, memory_type: str, key: str) -> dict | None:
        entry = (
            self.db.query(AIMemory)
            .filter(
                AIMemory.project_id == project_id,
                AIMemory.memory_type == memory_type,
                AIMemory.key == key,
                or_(AIMemory.expires_at.is_(None), AIMemory.expires_at > datetime.now(timezone.utc)),
            )
            .first()
        )
        if entry is None:
            return None
        return self._to_dict(entry)

    def search(
        self,
        project_id: UUID,
        memory_type: str | None = None,
        query: str | None = None,
        tags: list[str] | None = None,
        limit: int = 20,
    ) -> list[dict]:
        q = self.db.query(AIMemory).filter(
            AIMemory.project_id == project_id,
            or_(AIMemory.expires_at.is_(None), AIMemory.expires_at > datetime.now(timezone.utc)),
        )

        if memory_type:
            q = q.filter(AIMemory.memory_type == memory_type)

        if query:
            like = f"%{query}%"
            q = q.filter(
                or_(
                    AIMemory.key.ilike(like),
                    AIMemory.text_value.ilike(like),
                )
            )

        if tags:
            q = q.filter(AIMemory.tags.contains(tags))

        entries = q.order_by(AIMemory.importance.desc(), AIMemory.updated_at.desc()).limit(limit).all()
        return [self._to_dict(e) for e in entries]

    def delete(self, project_id: UUID, memory_type: str, key: str) -> bool:
        result = (
            self.db.query(AIMemory)
            .filter(
                AIMemory.project_id == project_id,
                AIMemory.memory_type == memory_type,
                AIMemory.key == key,
            )
            .delete()
        )
        return result > 0

    def clear_session(self, project_id: UUID, conversation_id: UUID) -> int:
        result = (
            self.db.query(AIMemory)
            .filter(
                AIMemory.project_id == project_id,
                AIMemory.memory_type == "session",
                AIMemory.conversation_id == conversation_id,
            )
            .delete()
        )
        return result

    def summarize(self, project_id: UUID) -> dict:
        entries = (
            self.db.query(AIMemory)
            .filter(AIMemory.project_id == project_id)
            .all()
        )

        total = len(entries)
        by_type: dict[str, int] = {}
        importance_distribution = {"low": 0, "medium": 0, "high": 0}
        expired = 0
        now = datetime.now(timezone.utc)

        for e in entries:
            by_type[e.memory_type] = by_type.get(e.memory_type, 0) + 1
            if e.expires_at and e.expires_at <= now:
                expired += 1
            if e.importance < 0.4:
                importance_distribution["low"] += 1
            elif e.importance < 0.7:
                importance_distribution["medium"] += 1
            else:
                importance_distribution["high"] += 1

        return {
            "total": total,
            "by_type": by_type,
            "importance_distribution": importance_distribution,
            "expired": expired,
            "active": total - expired,
        }

    def get_relevant(self, project_id: UUID, context: str, limit: int = 10) -> list[dict]:
        now = datetime.now(timezone.utc)
        entries = (
            self.db.query(AIMemory)
            .filter(
                AIMemory.project_id == project_id,
                or_(AIMemory.expires_at.is_(None), AIMemory.expires_at > now),
            )
            .all()
        )

        context_lower = context.lower()
        context_words = set(context_lower.split())

        scored = []
        for e in entries:
            text = (e.text_value or "").lower() + " " + (e.key or "").lower()
            if e.value and isinstance(e.value, dict):
                text += " " + " ".join(str(v).lower() for v in e.value.values() if v)

            text_words = set(text.split())
            overlap = len(context_words & text_words)
            keyword_score = overlap / max(len(context_words), 1)

            age_hours = (now - (e.updated_at or e.created_at)).total_seconds() / 3600
            recency_score = max(0, 1 - age_hours / 720)

            score = 0.5 * e.importance + 0.3 * keyword_score + 0.2 * recency_score
            scored.append((score, e))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [self._to_dict(e) for _, e in scored[:limit]]

    @staticmethod
    def _to_dict(entry: AIMemory) -> dict:
        return {
            "id": str(entry.id),
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
            "project_id": str(entry.project_id),
            "memory_type": entry.memory_type,
            "key": entry.key,
            "value": entry.value,
            "text_value": entry.text_value,
            "importance": entry.importance,
            "expires_at": entry.expires_at.isoformat() if entry.expires_at else None,
            "conversation_id": str(entry.conversation_id) if entry.conversation_id else None,
            "tags": entry.tags,
        }

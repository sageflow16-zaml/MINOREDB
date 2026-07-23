"""Conversation Service — CRUD for AI conversations and messages."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models.rag_copilot import AIConversation, AIMessage


class ConversationService:
    """Manages AI conversation threads and messages for a trading copilot."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------ #
    #  Conversations
    # ------------------------------------------------------------------ #

    def create_conversation(
        self,
        project_id: UUID,
        title: str,
        agent_type: str | None = None,
        folder: str | None = None,
        tags: list[str] | None = None,
    ) -> dict:
        conv = AIConversation(
            project_id=project_id,
            title=title,
            agent_type=agent_type,
            folder=folder,
            tags=tags,
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return self._conv_to_dict(conv)

    def get_conversation(self, project_id: UUID, conversation_id: UUID) -> dict | None:
        conv = self._get_conv(project_id, conversation_id)
        return self._conv_to_dict(conv) if conv else None

    def list_conversations(
        self,
        project_id: UUID,
        agent_type: str | None = None,
        folder: str | None = None,
        is_pinned: bool | None = None,
        limit: int = 50,
    ) -> list[dict]:
        q = self.db.query(AIConversation).filter(
            AIConversation.project_id == project_id,
            AIConversation.is_archived == False,
        )
        if agent_type is not None:
            q = q.filter(AIConversation.agent_type == agent_type)
        if folder is not None:
            q = q.filter(AIConversation.folder == folder)
        if is_pinned is not None:
            q = q.filter(AIConversation.is_pinned == is_pinned)

        q = q.order_by(AIConversation.updated_at.desc()).limit(limit)
        return [self._conv_to_dict(c) for c in q.all()]

    def update_conversation(
        self, project_id: UUID, conversation_id: UUID, data: dict
    ) -> dict | None:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return None

        allowed = {"title", "agent_type", "folder", "tags", "summary"}
        for key, value in data.items():
            if key in allowed:
                setattr(conv, key, value)

        conv.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(conv)
        return self._conv_to_dict(conv)

    def delete_conversation(self, project_id: UUID, conversation_id: UUID) -> bool:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return False
        self.db.delete(conv)
        self.db.commit()
        return True

    def pin_conversation(self, project_id: UUID, conversation_id: UUID) -> dict | None:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return None
        conv.is_pinned = True
        conv.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(conv)
        return self._conv_to_dict(conv)

    def unpin_conversation(
        self, project_id: UUID, conversation_id: UUID
    ) -> dict | None:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return None
        conv.is_pinned = False
        conv.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(conv)
        return self._conv_to_dict(conv)

    def archive_conversation(self, project_id: UUID, conversation_id: UUID) -> bool:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return False
        conv.is_archived = True
        conv.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def search_conversations(self, project_id: UUID, query: str) -> list[dict]:
        q = (
            self.db.query(AIConversation)
            .filter(
                AIConversation.project_id == project_id,
                AIConversation.is_archived == False,
                AIConversation.title.ilike(f"%{query}%"),
            )
            .order_by(AIConversation.updated_at.desc())
        )
        return [self._conv_to_dict(c) for c in q.all()]

    def get_conversation_stats(self, project_id: UUID) -> dict:
        total = (
            self.db.query(func.count(AIConversation.id))
            .filter(
                AIConversation.project_id == project_id,
                AIConversation.is_archived == False,
            )
            .scalar()
            or 0
        )
        pinned = (
            self.db.query(func.count(AIConversation.id))
            .filter(
                AIConversation.project_id == project_id,
                AIConversation.is_pinned == True,
                AIConversation.is_archived == False,
            )
            .scalar()
            or 0
        )
        msg_result = (
            self.db.query(
                func.count(AIMessage.id),
                func.coalesce(func.sum(AIMessage.total_tokens), 0),
                func.coalesce(func.sum(AIMessage.prompt_tokens), 0),
                func.coalesce(func.sum(AIMessage.completion_tokens), 0),
                func.coalesce(func.sum(AIMessage.cost_usd), 0.0),
            )
            .join(AIConversation, AIMessage.conversation_id == AIConversation.id)
            .filter(
                AIConversation.project_id == project_id,
                AIConversation.is_archived == False,
            )
            .first()
        )
        total_messages = msg_result[0] or 0
        total_tokens = msg_result[1] or 0
        total_prompt_tokens = msg_result[2] or 0
        total_completion_tokens = msg_result[3] or 0
        total_cost = float(msg_result[4] or 0.0)

        return {
            "total_conversations": total,
            "pinned_conversations": pinned,
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens,
            "total_cost_usd": round(total_cost, 6),
        }

    def export_conversation(
        self, project_id: UUID, conversation_id: UUID, format: str = "markdown"
    ) -> str:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return ""

        messages = (
            self.db.query(AIMessage)
            .filter(
                AIMessage.conversation_id == conversation_id,
                AIMessage.project_id == project_id,
            )
            .order_by(AIMessage.created_at.asc())
            .all()
        )

        lines = [
            f"# {conv.title}",
            f"",
            f"**Agent:** {conv.agent_type or 'N/A'}  ",
            f"**Date:** {conv.created_at.strftime('%Y-%m-%d %H:%M UTC')}  ",
            f"**Messages:** {len(messages)}  ",
            f"",
            f"---",
            f"",
        ]
        for msg in messages:
            lines.append(f"## {msg.role.capitalize()}")
            lines.append(f"")
            lines.append(msg.content)
            lines.append(f"")
            lines.append(f"---")
            lines.append(f"")

        return "\n".join(lines)

    # ------------------------------------------------------------------ #
    #  Messages
    # ------------------------------------------------------------------ #

    def add_message(
        self,
        project_id: UUID,
        conversation_id: UUID,
        role: str,
        content: str,
        **kwargs,
    ) -> dict | None:
        conv = self._get_conv(project_id, conversation_id)
        if not conv:
            return None

        msg = AIMessage(
            conversation_id=conversation_id,
            project_id=project_id,
            role=role,
            content=content,
            agent_type=kwargs.get("agent_type"),
            provider=kwargs.get("provider"),
            model=kwargs.get("model"),
            citations=kwargs.get("citations"),
            contexts=kwargs.get("contexts"),
            chunks_retrieved=kwargs.get("chunks_retrieved"),
            latency_ms=kwargs.get("latency_ms"),
            prompt_tokens=kwargs.get("prompt_tokens"),
            completion_tokens=kwargs.get("completion_tokens"),
            total_tokens=kwargs.get("total_tokens"),
            cost_usd=kwargs.get("cost_usd"),
            is_streaming=kwargs.get("is_streaming", False),
            is_error=kwargs.get("is_error", False),
            error_message=kwargs.get("error_message"),
        )
        self.db.add(msg)

        conv.message_count = (conv.message_count or 0) + 1
        conv.updated_at = datetime.utcnow()
        if msg.total_tokens:
            conv.total_tokens = (conv.total_tokens or 0) + msg.total_tokens

        self.db.commit()
        self.db.refresh(msg)
        return self._msg_to_dict(msg)

    def get_messages(
        self, project_id: UUID, conversation_id: UUID, limit: int = 100
    ) -> list[dict]:
        msgs = (
            self.db.query(AIMessage)
            .filter(
                AIMessage.conversation_id == conversation_id,
                AIMessage.project_id == project_id,
            )
            .order_by(AIMessage.created_at.asc())
            .limit(limit)
            .all()
        )
        return [self._msg_to_dict(m) for m in msgs]

    # ------------------------------------------------------------------ #
    #  Internal helpers
    # ------------------------------------------------------------------ #

    def _get_conv(self, project_id: UUID, conversation_id: UUID) -> AIConversation | None:
        return (
            self.db.query(AIConversation)
            .filter(
                AIConversation.id == conversation_id,
                AIConversation.project_id == project_id,
            )
            .first()
        )

    @staticmethod
    def _conv_to_dict(conv: AIConversation) -> dict:
        return {
            "id": str(conv.id),
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
            "project_id": str(conv.project_id),
            "title": conv.title,
            "agent_type": conv.agent_type,
            "folder": conv.folder,
            "is_pinned": conv.is_pinned,
            "is_archived": conv.is_archived,
            "tags": conv.tags or [],
            "message_count": conv.message_count or 0,
            "total_tokens": conv.total_tokens,
            "summary": conv.summary,
        }

    @staticmethod
    def _msg_to_dict(msg: AIMessage) -> dict:
        return {
            "id": str(msg.id),
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "conversation_id": str(msg.conversation_id),
            "project_id": str(msg.project_id),
            "role": msg.role,
            "content": msg.content,
            "agent_type": msg.agent_type,
            "provider": msg.provider,
            "model": msg.model,
            "citations": msg.citations,
            "contexts": msg.contexts,
            "chunks_retrieved": msg.chunks_retrieved,
            "latency_ms": msg.latency_ms,
            "prompt_tokens": msg.prompt_tokens,
            "completion_tokens": msg.completion_tokens,
            "total_tokens": msg.total_tokens,
            "cost_usd": msg.cost_usd,
            "is_streaming": msg.is_streaming,
            "is_error": msg.is_error,
            "error_message": msg.error_message,
        }

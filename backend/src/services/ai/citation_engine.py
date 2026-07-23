"""Source citation engine for the AI trading copilot.

Every AI response should include citations referencing user data so the
trader can trace claims back to the original source.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.models.rag_copilot import AICitation

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

SOURCE_EMOJI: dict[str, str] = {
    "trade": "\U0001f4ca",
    "journal": "\U0001f4d3",
    "strategy": "\U0001f3af",
    "replay": "\u25b6\ufe0f",
    "research": "\U0001f52c",
    "obsidian": "\U0001f4dd",
    "planning": "\U0001f4cb",
    "risk": "\u26a0\ufe0f",
    "market_intel": "\U0001f9e0",
    "knowledge": "\U0001f517",
}

SOURCE_URL_MAP: dict[str, str] = {
    "trade": "/projects/{project_id}/trades",
    "journal": "/projects/{project_id}/learning",
    "strategy": "/projects/{project_id}/strategies",
    "replay": "/projects/{project_id}/replay",
    "research": "/projects/{project_id}/research",
    "obsidian": "/projects/{project_id}/obsidian/notes",
    "planning": "/projects/{project_id}/planning",
    "risk": "/projects/{project_id}/risk",
    "market_intel": "/projects/{project_id}/market-intel",
    "knowledge": "/projects/{project_id}/knowledge-graph",
}

SOURCE_LABELS: dict[str, str] = {
    "trade": "Trade",
    "journal": "Journal",
    "strategy": "Strategy",
    "replay": "Replay",
    "research": "Research",
    "obsidian": "Obsidian Note",
    "planning": "Plan",
    "risk": "Risk Assessment",
    "market_intel": "Market Intel",
    "knowledge": "Knowledge Graph",
}


@dataclass
class CitationEntry:
    """A single source citation for an AI response."""

    source_type: str
    source_id: str
    source_title: str | None = None
    snippet: str | None = None
    relevance_score: float | None = None
    url: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "source_type": self.source_type,
            "source_id": self.source_id,
            "source_title": self.source_title,
            "snippet": self.snippet,
            "relevance_score": self.relevance_score,
            "url": self.url,
        }
        return {k: v for k, v in d.items() if v is not None}


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


class CitationEngine:
    """Persist, retrieve, and format source citations for AI messages.

    Args:
        db: Active SQLAlchemy session.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_citation(
        self,
        project_id: str | UUID,
        message_id: str | UUID,
        source_type: str,
        source_id: str,
        source_title: str | None = None,
        snippet: str | None = None,
        relevance_score: float | None = None,
        chunk_id: str | UUID | None = None,
    ) -> dict[str, Any]:
        """Store a single citation in the database.

        Returns the fully populated citation dict including the generated
        ``id`` and ``created_at``.
        """
        citation = AICitation(
            id=uuid.uuid4(),
            project_id=UUID(str(project_id)),
            message_id=UUID(str(message_id)),
            source_type=source_type,
            source_id=str(source_id),
            source_title=source_title,
            snippet=snippet,
            relevance_score=relevance_score,
            chunk_id=UUID(str(chunk_id)) if chunk_id else None,
        )
        self.db.add(citation)
        self.db.flush()

        url = self.get_source_url(source_type, source_id, project_id)

        return {
            "id": str(citation.id),
            "created_at": citation.created_at.isoformat()
            if citation.created_at
            else datetime.now(timezone.utc).isoformat(),
            "project_id": str(citation.project_id),
            "message_id": str(citation.message_id),
            "source_type": citation.source_type,
            "source_id": citation.source_id,
            "source_title": citation.source_title,
            "snippet": citation.snippet,
            "relevance_score": citation.relevance_score,
            "chunk_id": str(citation.chunk_id) if citation.chunk_id else None,
            "url": url,
        }

    def create_citations_bulk(
        self,
        project_id: str | UUID,
        message_id: str | UUID,
        entries: list[CitationEntry | dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Store multiple citations in a single flush.

        Accepts a list of ``CitationEntry`` instances or plain dicts with
        the same keys.
        """
        results: list[dict[str, Any]] = []
        rows: list[AICitation] = []

        for entry in entries:
            if isinstance(entry, dict):
                source_type = entry.get("source_type", "unknown")
                source_id = str(entry.get("source_id", ""))
                source_title = entry.get("source_title")
                snippet = entry.get("snippet")
                relevance_score = entry.get("relevance_score")
                chunk_id = entry.get("chunk_id")
            else:
                source_type = entry.source_type
                source_id = entry.source_id
                source_title = entry.source_title
                snippet = entry.snippet
                relevance_score = entry.relevance_score
                chunk_id = entry.source_id  # fallback for dataclass

            rows.append(
                AICitation(
                    id=uuid.uuid4(),
                    project_id=UUID(str(project_id)),
                    message_id=UUID(str(message_id)),
                    source_type=source_type,
                    source_id=source_id,
                    source_title=source_title,
                    snippet=snippet,
                    relevance_score=relevance_score,
                    chunk_id=UUID(str(chunk_id)) if chunk_id else None,
                )
            )

        self.db.add_all(rows)
        self.db.flush()

        for row in rows:
            url = self.get_source_url(row.source_type, row.source_id, project_id)
            results.append(
                {
                    "id": str(row.id),
                    "created_at": row.created_at.isoformat()
                    if row.created_at
                    else datetime.now(timezone.utc).isoformat(),
                    "project_id": str(row.project_id),
                    "message_id": str(row.message_id),
                    "source_type": row.source_type,
                    "source_id": row.source_id,
                    "source_title": row.source_title,
                    "snippet": row.snippet,
                    "relevance_score": row.relevance_score,
                    "chunk_id": str(row.chunk_id) if row.chunk_id else None,
                    "url": url,
                }
            )

        return results

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_citations_for_message(
        self,
        project_id: str | UUID,
        message_id: str | UUID,
    ) -> list[dict[str, Any]]:
        """Return all citations associated with a given AI message.

        Results are ordered by relevance score descending (highest first).
        """
        rows = (
            self.db.execute(
                select(AICitation)
                .where(
                    AICitation.project_id == UUID(str(project_id)),
                    AICitation.message_id == UUID(str(message_id)),
                )
                .order_by(desc(AICitation.relevance_score))
            )
            .scalars()
            .all()
        )

        return [
            {
                "id": str(r.id),
                "created_at": r.created_at.isoformat()
                if r.created_at
                else None,
                "project_id": str(r.project_id),
                "message_id": str(r.message_id),
                "source_type": r.source_type,
                "source_id": r.source_id,
                "source_title": r.source_title,
                "snippet": r.snippet,
                "relevance_score": r.relevance_score,
                "chunk_id": str(r.chunk_id) if r.chunk_id else None,
                "url": self.get_source_url(r.source_type, r.source_id, project_id),
            }
            for r in rows
        ]

    def get_citations_for_conversation(
        self,
        project_id: str | UUID,
        conversation_id: str | UUID,
    ) -> list[dict[str, Any]]:
        """Return all citations across messages in a conversation.

        Useful for summarising every source referenced during a chat session.
        """
        from src.models.rag_copilot import AIMessage

        subq = (
            select(AIMessage.id)
            .where(
                AIMessage.project_id == UUID(str(project_id)),
                AIMessage.conversation_id == UUID(str(conversation_id)),
            )
            .scalar_subquery()
        )

        rows = (
            self.db.execute(
                select(AICitation)
                .where(
                    AICitation.project_id == UUID(str(project_id)),
                    AICitation.message_id.in_(subq),
                )
                .order_by(desc(AICitation.relevance_score))
            )
            .scalars()
            .all()
        )

        return [
            {
                "id": str(r.id),
                "created_at": r.created_at.isoformat()
                if r.created_at
                else None,
                "project_id": str(r.project_id),
                "message_id": str(r.message_id),
                "source_type": r.source_type,
                "source_id": r.source_id,
                "source_title": r.source_title,
                "snippet": r.snippet,
                "relevance_score": r.relevance_score,
                "chunk_id": str(r.chunk_id) if r.chunk_id else None,
                "url": self.get_source_url(r.source_type, r.source_id, project_id),
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # URL generation
    # ------------------------------------------------------------------

    def get_source_url(
        self,
        source_type: str,
        source_id: str,
        project_id: str | UUID,
    ) -> str | None:
        """Generate a frontend deep-link URL for the given source.

        Returns ``None`` when *source_type* is not recognised.
        """
        path = SOURCE_URL_MAP.get(source_type)
        if path is None:
            return None
        project_str = str(project_id)
        return path.format(project_id=project_str)

    # ------------------------------------------------------------------
    # Formatting
    # ------------------------------------------------------------------

    def format_citations(
        self,
        citations: list[dict[str, Any] | CitationEntry],
        format: str = "markdown",
    ) -> str:
        """Render a list of citations as formatted text.

        Supported formats:

        - ``"markdown"`` (default): blockquote lines with emoji, label, and
          snippet.
        - ``"json"``: JSON array string.
        - ``"text"``: plain lines, no markdown formatting.
        """
        if format == "json":
            import json

            return json.dumps(
                [
                    c.to_dict() if isinstance(c, CitationEntry) else c
                    for c in citations
                ],
                indent=2,
                default=str,
            )

        lines: list[str] = []

        for citation in citations:
            if isinstance(citation, CitationEntry):
                source_type = citation.source_type
                source_id = citation.source_id
                source_title = citation.source_title
                snippet = citation.snippet
                citation_url = citation.url
            else:
                source_type = citation.get("source_type", "unknown")
                source_id = citation.get("source_id", "")
                source_title = citation.get("source_title")
                snippet = citation.get("snippet")
                citation_url = citation.get("url")

            emoji = SOURCE_EMOJI.get(source_type, "\U0001f4cc")
            label = SOURCE_LABELS.get(source_type, source_type.replace("_", " ").title())

            title_str = source_title or f"{label} #{source_id[:8]}"

            parts = [f"{emoji} **{title_str}**"]

            if snippet:
                snippet_clean = snippet.strip().replace("\n", " ")
                if len(snippet_clean) > 200:
                    snippet_clean = snippet_clean[:197] + "..."
                parts.append(f"\n> {snippet_clean}")

            if citation_url:
                parts.append(f"\n> [Open {label}]({citation_url})")

            line = "> " + " ".join(parts) if format == "markdown" else " ".join(parts)

            lines.append(line)

        return "\n\n".join(lines) if format == "markdown" else "\n".join(lines)

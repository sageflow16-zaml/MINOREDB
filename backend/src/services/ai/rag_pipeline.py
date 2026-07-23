"""Complete RAG pipeline for the Minore trading copilot.

Pipeline stages:
  1. Document ingestion (delegates to ingestion service)
  2. Chunking (text splitting with overlap)
  3. Metadata extraction (source_type, date, tags, entity_type)
  4. Embedding generation (delegates to embedding provider)
  5. Vector storage (delegates to vector store)
  6. Hybrid search (vector + keyword + metadata)
  7. Context ranking (relevance + recency + importance scoring)
  8. Context compression (dedup + truncation + summarization)
  9. Prompt assembly (build context-aware prompt)
  10. Citation generation (track source attribution)
  11. Response generation (delegate to LLM provider)
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from src.models.rag_copilot import (
    AIDocumentIngestion,
    AIDocumentChunk,
    AIConversation,
    AIMessage,
    AICitation,
)
from src.models.ai_foundation import AIProviderConfig
from src.services.ai.llm_provider import get_provider, LLMResponse
from src.services.ai.embedding_provider import get_embedding_provider, EmbeddingResponse
from src.services.ai.vector_store import get_vector_store, BaseVectorStore, SearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Exported types
# ---------------------------------------------------------------------------

@dataclass
class Citation:
    source_type: str
    source_id: str
    source_title: str | None = None
    snippet: str | None = None
    relevance_score: float | None = None
    chunk_id: str | None = None


@dataclass
class RankedChunk:
    chunk: AIDocumentChunk
    relevance_score: float = 0.0
    recency_score: float = 0.0
    importance_score: float = 0.0
    composite_score: float = 0.0
    content_hash: str = ""


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
DEFAULT_TOP_K = 10
DEFAULT_MAX_CONTEXT_CHARS = 8000
RELEVANCE_WEIGHT = 0.6
RECENCY_WEIGHT = 0.25
IMPORTANCE_WEIGHT = 0.15

SYSTEM_PROMPT_TEMPLATE = """You are Minore, an institutional-grade AI trading research copilot.

You are answering a trader's question based on the retrieved context below.
Use ONLY the provided context to answer. If the context does not contain
enough information, say so clearly.

Rules:
1. Every factual claim must be traceable to a cited source.
2. Never recommend BUY or SELL — only explain past outcomes and patterns.
3. Be concise and precise; this is for professional traders.
4. Distinguish between personal trading data and general methodology.
5. Structure your response in clear paragraphs.

Retrieved Context:
{context}
"""


# ---------------------------------------------------------------------------
# Pipeline class
# ---------------------------------------------------------------------------

class RAGPipeline:
    """End-to-end RAG pipeline for the trading copilot.

    Args:
        db: SQLAlchemy session.
        embedding_provider: Optional embedding provider; falls back to
            ``get_embedding_provider("simple")`` when ``None``.
        vector_store: Optional vector store; falls back to
            ``get_vector_store("sqlite")`` when ``None``.
        llm_provider: Optional LLM provider; falls back to rule-based
            analysis when ``None``.
    """

    def __init__(
        self,
        db: Session,
        embedding_provider: Any | None = None,
        vector_store: BaseVectorStore | None = None,
        llm_provider: Any | None = None,
    ) -> None:
        self.db = db
        self._embed = embedding_provider or get_embedding_provider("simple")
        self._vector_store = vector_store or get_vector_store("sqlite")
        self._llm = llm_provider

    # -----------------------------------------------------------------------
    # Stage 2: Chunking
    # -----------------------------------------------------------------------

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> list[str]:
        """Split *text* into overlapping chunks of approximately *chunk_size*
        characters each, preserving word boundaries."""
        if not text:
            return []

        chunks: list[str] = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + chunk_size
            if end >= text_len:
                chunks.append(text[start:])
                break

            # Try to break at a sentence boundary or word boundary
            boundary = max(
                text.rfind(". ", start, end),
                text.rfind("! ", start, end),
                text.rfind("? ", start, end),
                text.rfind("\n\n", start, end),
                text.rfind(" ", start, end),
            )
            if boundary > start:
                end = boundary + 1

            chunks.append(text[start:end])
            start = end - overlap if end - overlap > start else end

        return chunks

    # -----------------------------------------------------------------------
    # Stage 1–5: Document ingestion pipeline
    # -----------------------------------------------------------------------

    def ingest_document(
        self,
        project_id: str,
        source_type: str,
        source_id: str | None,
        title: str | None,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Run the full ingestion pipeline for a single document.

        Returns a dict with ingestion status, chunk count, and any error.
        """
        meta = metadata or {}
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        # Create ingestion record
        try:
            ingestion = AIDocumentIngestion(
                id=uuid.uuid4(),
                project_id=UUID(project_id),
                source_type=source_type,
                source_id=UUID(source_id) if source_id else None,
                title=title,
                content_hash=content_hash,
                chunk_count=0,
                status="processing",
                metadata_json=meta,
            )
            self.db.add(ingestion)
            self.db.flush()
        except Exception as exc:
            self.db.rollback()
            logger.exception("Failed to create ingestion record")
            return {"status": "failed", "error": str(exc), "chunk_count": 0}

        try:
            # Stage 2: Chunking
            raw_chunks = self.chunk_text(content)

            # Stage 3: Metadata extraction
            extracted_meta = self._extract_metadata(
                source_type, title, content, meta
            )

            # Stage 4: Embedding generation
            chunk_texts = []
            chunk_objects: list[dict[str, Any]] = []

            for idx, chunk_text in enumerate(raw_chunks):
                chunk_id = str(uuid.uuid4())
                chunk_texts.append(chunk_text)

                chunk_obj = {
                    "id": chunk_id,
                    "ingestion_id": str(ingestion.id),
                    "source_type": source_type,
                    "source_id": source_id,
                    "chunk_index": idx,
                    "content": chunk_text,
                    "document_title": title,
                    "created_date": extracted_meta.get("date")
                    or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "tags": extracted_meta.get("tags", []),
                    "entity_type": extracted_meta.get("entity_type", source_type),
                    "entity_id": extracted_meta.get("entity_id"),
                    "keywords": extracted_meta.get("keywords", []),
                }
                chunk_objects.append(chunk_obj)

            # Stage 4: Embed
            embedding_resp: EmbeddingResponse = self._embed.embed(chunk_texts)

            # Attach embeddings to chunk objects
            for i, emb in enumerate(embedding_resp.embeddings):
                if i < len(chunk_objects):
                    chunk_objects[i]["embedding"] = emb
                    chunk_objects[i]["embedding_model"] = embedding_resp.model

            # Stage 5: Vector store
            stored = self._vector_store.store_embeddings(project_id, chunk_objects)

            # Persist to DB
            self._persist_chunks(project_id, ingestion.id, chunk_objects)

            # Update ingestion record
            ingestion.status = "completed"
            ingestion.chunk_count = stored
            self.db.commit()

            return {
                "status": "completed",
                "ingestion_id": str(ingestion.id),
                "chunk_count": stored,
                "error": None,
            }

        except Exception as exc:
            self.db.rollback()
            logger.exception("Document ingestion failed")
            try:
                ingestion.status = "failed"
                ingestion.error = str(exc)
                self.db.commit()
            except Exception:
                self.db.rollback()
            return {"status": "failed", "error": str(exc), "chunk_count": 0}

    # -----------------------------------------------------------------------
    # Stage 6–7: Hybrid search with ranking
    # -----------------------------------------------------------------------

    def search(
        self,
        project_id: str,
        query: str,
        top_k: int = DEFAULT_TOP_K,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """Hybrid search: vector + keyword + metadata filtering with
        context ranking.

        Returns ranked SearchResult list.
        """
        if not query or not query.strip():
            return []

        try:
            # Embed the query
            query_emb_resp = self._embed.embed([query])
            if not query_emb_resp.embeddings:
                return []
            query_embedding = query_emb_resp.embeddings[0]

            # Stage 6: Vector search with metadata filters
            vector_results = self._vector_store.search(
                project_id=project_id,
                query_embedding=query_embedding,
                top_k=top_k * 2,  # Fetch extra for re-ranking
                filters=filters,
            )

            if not vector_results:
                return []

            # Stage 7: Context ranking
            ranked = self._rank_results(project_id, vector_results, query)

            return ranked[:top_k]

        except Exception as exc:
            logger.exception("Search failed")
            return []

    # -----------------------------------------------------------------------
    # Stage 9–11: Full RAG generate
    # -----------------------------------------------------------------------

    def generate(
        self,
        project_id: str,
        conversation_id: str | None,
        user_message: str,
        agent_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Full RAG generate pipeline.

        Args:
            project_id: Project UUID string.
            conversation_id: Optional conversation UUID string. A new
                conversation is created if ``None``.
            user_message: The trader's query.
            agent_type: Optional agent type for system prompt selection.
            options: Optional dict with keys:
                - ``top_k`` (int): Chunks to retrieve.
                - ``max_context_chars`` (int): Max context length.
                - ``filters`` (dict): Metadata filters for search.
                - ``system_prompt`` (str): Override system prompt.
                - ``model`` (str): Override LLM model.
                - ``temperature`` (float): LLM temperature.
                - ``stream`` (bool): Enable streaming response.

        Returns:
            Dict with keys:
            - ``message_id``: str
            - ``answer``: str
            - ``citations``: list[Citation]
            - ``chunks_retrieved``: int
            - ``confidence``: float
            - ``error``: str | None
            - ``latency_ms``: int
        """
        opts = options or {}
        top_k = opts.get("top_k", DEFAULT_TOP_K)
        max_chars = opts.get("max_context_chars", DEFAULT_MAX_CONTEXT_CHARS)
        search_filters = opts.get("filters")
        custom_system_prompt = opts.get("system_prompt")
        model = opts.get("model")
        temperature = opts.get("temperature", 0.1)
        stream = opts.get("stream", False)

        start_time = time.perf_counter()
        result: dict[str, Any] = {
            "message_id": str(uuid.uuid4()),
            "answer": "",
            "citations": [],
            "chunks_retrieved": 0,
            "confidence": 0.0,
            "error": None,
            "latency_ms": 0,
        }

        try:
            # Ensure conversation exists
            conv_id = self._ensure_conversation(
                project_id, conversation_id, agent_type
            )

            # Persist user message
            user_msg = AIMessage(
                id=uuid.uuid4(),
                conversation_id=UUID(conv_id),
                project_id=UUID(project_id),
                role="user",
                content=user_message,
                agent_type=agent_type,
            )
            self.db.add(user_msg)
            self.db.flush()

            # Stage 6: Search
            raw_results = self.search(
                project_id=project_id,
                query=user_message,
                top_k=top_k,
                filters=search_filters,
            )
            result["chunks_retrieved"] = len(raw_results)

            # Stage 8: Context compression
            compressed_context, top_chunks = self._compress_context(
                raw_results, project_id, max_chars
            )

            # Stage 10: Citation generation
            citations = self._build_citations(top_chunks)
            result["citations"] = [
                {
                    "source_type": c.source_type,
                    "source_id": c.source_id,
                    "source_title": c.source_title,
                    "snippet": c.snippet,
                    "relevance_score": c.relevance_score,
                }
                for c in citations
            ]

            # Stage 9: Prompt assembly
            system_prompt = custom_system_prompt or SYSTEM_PROMPT_TEMPLATE.format(
                context=compressed_context
            )
            prompt = self._assemble_prompt(
                system_prompt=system_prompt,
                user_message=user_message,
                agent_type=agent_type,
                conversation_history=self._get_history(conv_id),
            )

            # Stage 11: Response generation
            answer, confidence, error = self._generate_response(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model,
                temperature=temperature,
                stream=stream,
            )

            # Persist assistant message
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            assist_msg = AIMessage(
                id=UUID(result["message_id"]),
                conversation_id=UUID(conv_id),
                project_id=UUID(project_id),
                role="assistant",
                content=answer,
                agent_type=agent_type,
                citations=result["citations"],
                contexts=[c.snippet for c in citations[:5]],
                chunks_retrieved=len(raw_results),
                latency_ms=elapsed_ms,
                is_error=error is not None,
                error_message=error,
            )
            self.db.add(assist_msg)

            # Persist citations
            for c in citations:
                citation_row = AICitation(
                    id=uuid.uuid4(),
                    project_id=UUID(project_id),
                    message_id=assist_msg.id,
                    source_type=c.source_type,
                    source_id=c.source_id,
                    source_title=c.source_title,
                    snippet=c.snippet,
                    relevance_score=c.relevance_score,
                    chunk_id=UUID(c.chunk_id) if c.chunk_id else None,
                )
                self.db.add(citation_row)

            # Update conversation metadata
            self.db.execute(
                select(AIConversation).where(AIConversation.id == UUID(conv_id))
            )
            conv = self.db.get(AIConversation, UUID(conv_id))
            if conv:
                conv.updated_at = datetime.now(timezone.utc)
                conv.message_count = (conv.message_count or 0) + 2

            self.db.commit()

            result["answer"] = answer
            result["confidence"] = confidence
            result["error"] = error
            result["latency_ms"] = elapsed_ms

        except Exception as exc:
            self.db.rollback()
            logger.exception("RAG generate failed")
            result["error"] = str(exc)
            result["latency_ms"] = int((time.perf_counter() - start_time) * 1000)
            # Fallback
            result["answer"], result["confidence"], _ = self._rule_fallback(
                user_message
            )

        return result

    # -----------------------------------------------------------------------
    # Stage 7: Context ranking
    # -----------------------------------------------------------------------

    def _rank_results(
        self,
        project_id: str,
        results: list[SearchResult],
        query: str,
    ) -> list[SearchResult]:
        """Score and re-rank search results.

        Composite score = (RELEVANCE_WEIGHT * relevance)
                        + (RECENCY_WEIGHT * recency)
                        + (IMPORTANCE_WEIGHT * importance)
        """
        query_lower = query.lower()
        query_tokens = set(query_lower.split())

        scored: list[tuple[float, SearchResult]] = []
        now = datetime.now(timezone.utc)

        for r in results:
            # Relevance: cosine similarity from vector store is already in score
            relevance = max(0.0, min(1.0, r.score))

            # Recency: newer chunks score higher (0-1)
            created_raw = r.metadata.get("created_date", "")
            recency = self._compute_recency(created_raw, now)

            # Importance: keyword overlap + chunk index heuristic
            importance = self._compute_importance(
                r.content, query_tokens, r.metadata
            )

            composite = (
                RELEVANCE_WEIGHT * relevance
                + RECENCY_WEIGHT * recency
                + IMPORTANCE_WEIGHT * importance
            )

            scored.append((composite, r))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [sr for _, sr in scored]

    def _compute_recency(self, date_str: str, now: datetime) -> float:
        """Compute recency score (0-1) from a date string."""
        if not date_str:
            return 0.5  # Neutral for unknown dates

        try:
            if len(date_str) == 10:  # YYYY-MM-DD
                dt = datetime.strptime(date_str, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc
                )
            else:
                dt = datetime.fromisoformat(date_str)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            return 0.5

        days_diff = (now - dt).days
        if days_diff < 0:
            return 1.0
        # Exponential decay over 365 days
        return max(0.0, 1.0 - (days_diff / 365.0))

    def _compute_importance(
        self,
        content: str,
        query_tokens: set[str],
        metadata: dict[str, Any],
    ) -> float:
        """Compute importance score (0-1) based on keyword overlap and
        metadata signals."""
        score = 0.3  # Base importance

        # Keyword overlap bonus
        content_lower = content.lower()
        if query_tokens:
            matches = sum(1 for t in query_tokens if t in content_lower)
            score += 0.3 * min(1.0, matches / max(len(query_tokens), 1))

        # Chunk index bonus: earlier chunks tend to be more important
        chunk_index = metadata.get("chunk_index")
        if chunk_index is not None and isinstance(chunk_index, (int, float)):
            score += 0.15 * max(0.0, 1.0 - (chunk_index / 20.0))

        # Tags/entity_type signal
        if metadata.get("tags") or metadata.get("entity_type"):
            score += 0.1

        # Relevance score from original metadata
        existing_relevance = metadata.get("relevance_score")
        if existing_relevance is not None:
            score += 0.15 * min(1.0, float(existing_relevance))

        return min(1.0, score)

    # -----------------------------------------------------------------------
    # Stage 8: Context compression
    # -----------------------------------------------------------------------

    def _compress_context(
        self,
        results: list[SearchResult],
        project_id: str,
        max_chars: int = DEFAULT_MAX_CONTEXT_CHARS,
    ) -> tuple[str, list[SearchResult]]:
        """Deduplicate, truncate, and preserve top-K results by score.

        Returns (compressed_context_string, top_chunks).
        """
        seen_hashes: set[str] = set()
        unique: list[SearchResult] = []

        for r in results:
            content_hash = hashlib.sha256(
                r.content.encode("utf-8")
            ).hexdigest()
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique.append(r)

        # Sort by score descending
        unique.sort(key=lambda x: x.score, reverse=True)

        # Truncate to max_chars
        parts: list[str] = []
        total = 0
        top_chunks: list[SearchResult] = []

        for r in unique:
            snippet = r.content.strip()
            if total + len(snippet) > max_chars:
                remaining = max_chars - total
                if remaining > 100:
                    parts.append(snippet[:remaining] + "...")
                    top_chunks.append(r)
                break
            parts.append(snippet)
            top_chunks.append(r)
            total += len(snippet)

        return "\n\n---\n\n".join(parts), top_chunks

    # -----------------------------------------------------------------------
    # Stage 9: Prompt assembly
    # -----------------------------------------------------------------------

    def _assemble_prompt(
        self,
        system_prompt: str,
        user_message: str,
        agent_type: str | None = None,
        conversation_history: list[dict[str, str]] | None = None,
    ) -> list[dict[str, str]]:
        """Build the message list for the LLM."""
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history (last 10 messages)
        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append(msg)

        messages.append({"role": "user", "content": user_message})
        return messages

    def _get_history(
        self, conversation_id: str
    ) -> list[dict[str, str]]:
        """Retrieve recent conversation history."""
        try:
            rows = (
                self.db.execute(
                    select(AIMessage)
                    .where(AIMessage.conversation_id == UUID(conversation_id))
                    .order_by(AIMessage.created_at.asc())
                    .limit(20)
                )
                .scalars()
                .all()
            )
            return [
                {"role": m.role, "content": m.content}
                for m in rows
                if m.role in ("user", "assistant")
            ]
        except Exception:
            return []

    # -----------------------------------------------------------------------
    # Stage 10: Citation generation
    # -----------------------------------------------------------------------

    def _build_citations(
        self, chunks: list[SearchResult]
    ) -> list[Citation]:
        """Convert search results to structured citations."""
        citations: list[Citation] = []
        seen_sources: set[tuple[str, str]] = set()

        for r in chunks:
            source_type = r.source_type or "unknown"
            source_id = str(r.metadata.get("source_id", "")) or r.chunk_id
            key = (source_type, source_id)

            if key in seen_sources:
                continue
            seen_sources.add(key)

            citations.append(
                Citation(
                    source_type=source_type,
                    source_id=source_id,
                    source_title=r.metadata.get("document_title"),
                    snippet=r.content[:300],
                    relevance_score=r.score,
                    chunk_id=r.chunk_id,
                )
            )

        return citations

    # -----------------------------------------------------------------------
    # Stage 11: Response generation
    # -----------------------------------------------------------------------

    def _generate_response(
        self,
        prompt: list[dict[str, str]],
        system_prompt: str,
        model: str | None = None,
        temperature: float = 0.1,
        stream: bool = False,
    ) -> tuple[str, float, str | None]:
        """Call the LLM provider or fall back to rule-based generation."""
        if self._llm is None:
            # Use factory with env-based config
            try:
                # Try to load provider config from DB
                provider_config = self._load_provider_config()
                if provider_config:
                    llm = get_provider(
                        provider_config.get("provider", "openai"),
                        provider_config,
                    )
                else:
                    llm = get_provider("openai", {"model": model or "gpt-4o-mini"})
            except Exception:
                logger.warning("No LLM provider configured; using rule-based fallback")
                return self._rule_fallback(prompt[-1]["content"] if prompt else "")

        else:
            llm = self._llm

        try:
            if stream:
                return self._stream_response(llm, prompt, model, temperature)

            resp: LLMResponse = llm.chat_complete(
                messages=prompt,
                model=model,
                temperature=temperature,
            )

            if resp.error:
                logger.warning("LLM returned error: %s", resp.error)
                return self._rule_fallback(prompt[-1]["content"] if prompt else "")

            confidence = self._estimate_confidence(resp.content)
            return resp.content, confidence, resp.error

        except Exception as exc:
            logger.exception("LLM call failed")
            return self._rule_fallback(prompt[-1]["content"] if prompt else "")

    def _stream_response(
        self,
        llm: Any,
        prompt: list[dict[str, str]],
        model: str | None,
        temperature: float,
    ) -> tuple[str, float, str | None]:
        """Handle streaming responses by collecting the full output."""
        full_content: list[str] = []
        try:
            for token in llm.chat_complete_stream(
                messages=prompt,
                model=model,
                temperature=temperature,
            ):
                full_content.append(token)
        except Exception as exc:
            logger.exception("Streaming failed")
            return "".join(full_content), 0.0, str(exc)

        answer = "".join(full_content)
        confidence = self._estimate_confidence(answer)
        return answer, confidence, None

    def _estimate_confidence(self, content: str) -> float:
        """Heuristic confidence estimation based on response content."""
        if not content or len(content) < 20:
            return 0.0

        score = 0.5
        # Longer, substantive answers get higher confidence
        if len(content) > 200:
            score += 0.15
        if len(content) > 500:
            score += 0.1

        # Presence of specific markers
        if re.search(r"\d+[\.\d]*%", content):
            score += 0.1  # Contains percentages
        if re.search(r"\$?\d+\.?\d*", content):
            score += 0.05  # Contains numbers
        if "based on" in content.lower() or "according to" in content.lower():
            score += 0.05  # Cites sources
        if "insufficient evidence" in content.lower():
            score -= 0.2

        return min(1.0, max(0.0, score))

    def _rule_fallback(
        self, user_message: str
    ) -> tuple[str, float, str | None]:
        """Deterministic fallback when no LLM is available."""
        msg_lower = user_message.lower()

        if "win" in msg_lower or "rate" in msg_lower:
            answer = (
                "I don't have enough information to answer your question "
                "about win rates. Try ingesting some trading data first."
            )
        elif "loss" in msg_lower or "drawdown" in msg_lower:
            answer = (
                "I don't have enough information about losses or drawdown. "
                "Please ensure your trading data has been ingested."
            )
        elif "strategy" in msg_lower or "pattern" in msg_lower:
            answer = (
                "I don't have enough information about strategies or patterns. "
                "Ingest your trades and knowledge rules to get insights."
            )
        elif "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
            answer = (
                "Hello! I'm Minore, your trading research copilot. "
                "Ask me about your trading performance, patterns, or "
                "strategies once you've ingested some data."
            )
        else:
            answer = (
                "I'm operating in offline mode — no AI provider is configured. "
                "Set up an LLM provider in Settings to enable AI-powered responses, "
                "or ingest trading data for rule-based analysis."
            )

        return answer, 0.3, "No LLM provider configured; used rule-based fallback"

    # -----------------------------------------------------------------------
    # Metadata extraction helper (Stage 3)
    # -----------------------------------------------------------------------

    def _extract_metadata(
        self,
        source_type: str,
        title: str | None,
        content: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Extract structured metadata from a document."""
        result: dict[str, Any] = {
            "source_type": source_type,
            "date": metadata.get("date") or self._extract_date(content),
            "tags": metadata.get("tags", []),
            "entity_type": metadata.get("entity_type") or source_type,
            "entity_id": metadata.get("entity_id"),
            "keywords": metadata.get("keywords", self._extract_keywords(title, content)),
        }
        return result

    @staticmethod
    def _extract_date(content: str) -> str | None:
        """Extract the first ISO-like date from content."""
        patterns = [
            r"\b(\d{4}-\d{2}-\d{2})\b",
            r"\b(\d{2}/\d{2}/\d{4})\b",
            r"\b(\d{4}/\d{2}/\d{2})\b",
        ]
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                raw = match.group(1)
                if "/" in raw:
                    parts = raw.split("/")
                    if len(parts[0]) == 4:
                        return raw.replace("/", "-")
                    return f"{parts[2]}-{parts[0]}-{parts[1]}"
                return raw
        return None

    @staticmethod
    def _extract_keywords(
        title: str | None, content: str
    ) -> list[str]:
        """Extract meaningful keywords using a simple heuristic."""
        text = f"{title or ''} {content}".lower()

        # Trading-specific keywords to look for
        trading_terms = [
            "eurusd", "gbpusd", "usdjpy", "gbpjpy", "audusd", "nzdusd",
            "usdcad", "eurjpy", "eurgbp", "xauusd", "btc", "eth",
            "bullish", "bearish", "breakout", "retracement", "support",
            "resistance", "trend", "range", "volatility", "liquidity",
            "momentum", "divergence", "confluence", "confirmation",
            "entry", "exit", "stop loss", "take profit", "risk",
            "reward", "rr", "pnl", "win", "loss", "drawdown",
            "scalping", "day trading", "swing", "position",
            "london", "new york", "asian", "session",
            "m1", "m5", "m15", "m30", "h1", "h4", "d1", "w1",
            "fibonacci", "ichimoku", "moving average", "rsi", "macd",
            "bollinger", "elliot", "harmonic", "order block",
            "fair value gap", "cisd", "breaker", "mitigation",
        ]

        found = [term for term in trading_terms if term in text]
        return list(dict.fromkeys(found))[:10]  # Deduplicate, max 10

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _ensure_conversation(
        self,
        project_id: str,
        conversation_id: str | None,
        agent_type: str | None = None,
    ) -> str:
        """Get or create a conversation."""
        if conversation_id:
            conv = self.db.get(AIConversation, UUID(conversation_id))
            if conv:
                return conversation_id

        conv = AIConversation(
            id=uuid.uuid4(),
            project_id=UUID(project_id),
            title="RAG Query",
            agent_type=agent_type,
            is_pinned=False,
            is_archived=False,
            message_count=0,
        )
        self.db.add(conv)
        self.db.flush()
        return str(conv.id)

    def _persist_chunks(
        self,
        project_id: str,
        ingestion_id: UUID,
        chunk_objects: list[dict[str, Any]],
    ) -> None:
        """Write chunk rows to the database."""
        rows = []
        for co in chunk_objects:
            row = AIDocumentChunk(
                id=UUID(co["id"]),
                project_id=UUID(project_id),
                ingestion_id=ingestion_id,
                source_type=co.get("source_type", ""),
                source_id=UUID(co["source_id"]) if co.get("source_id") else None,
                chunk_index=co.get("chunk_index", 0),
                content=co.get("content", ""),
                embedding=co.get("embedding"),
                embedding_model=co.get("embedding_model"),
                document_title=co.get("document_title"),
                created_date=co.get("created_date"),
                tags=co.get("tags", []),
                entity_type=co.get("entity_type"),
                entity_id=co.get("entity_id"),
                keywords=co.get("keywords", []),
            )
            rows.append(row)

        self.db.add_all(rows)

    def _load_provider_config(self) -> dict[str, Any] | None:
        """Load the default LLM provider configuration from the database."""
        try:
            config = (
                self.db.execute(
                    select(AIProviderConfig).where(
                        AIProviderConfig.is_default == True,
                        AIProviderConfig.is_enabled == True,
                    )
                )
                .scalars()
                .first()
            )
            if not config:
                return None

            cfg = config.config_json or {}
            cfg["provider"] = config.provider_name
            cfg["model"] = config.model_name or cfg.get("model")
            return cfg
        except Exception:
            return None

from __future__ import annotations

import json
import logging
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

import numpy as np
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from src.core.logging import get_logger
from src.db.session import SessionLocal
from src.models.rag_copilot import AIDocumentChunk

logger = get_logger(__name__)


@dataclass
class SearchResult:
    chunk_id: str
    content: str
    score: float
    metadata: dict[str, Any] = field(default_factory=dict)
    source_type: str = ""


@dataclass
class VectorStoreConfig:
    host: str = "localhost"
    port: int = 0
    api_key: str = ""
    collection_name: str = "minore_chunks"
    dimension: int = 1536
    distance: str = "cosine"  # cosine | euclidean | dot
    table_name: str = "ai_document_chunk"
    # Chroma-specific
    chroma_persist_directory: str = "./chroma_data"
    # FAISS-specific
    faiss_index_path: str = "./faiss_index"
    # Qdrant-specific
    grpc_port: int = 6334
    prefer_grpc: bool = False
    # pgvector-specific
    connection_string: str = ""
    # Pinecone-specific
    pinecone_environment: str = ""
    # Weaviate-specific
    weaviate_scheme: str = "http"
    # Milvus-specific
    milvus_alias: str = "default"
    extra: dict[str, Any] = field(default_factory=dict)


class BaseVectorStore(ABC):
    """Abstract vector store provider for the Minore RAG pipeline."""

    def __init__(self, config: VectorStoreConfig) -> None:
        self.config = config
        self.logger = get_logger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    def store_embeddings(
        self, project_id: str, chunks: list[dict[str, Any]]
    ) -> int:
        """Store chunk embeddings for a project.

        Args:
            project_id: UUID string identifying the project.
            chunks: List of dicts, each containing at minimum:
                - ``content``: text content
                - ``embedding``: list[float] vector
                - ``source_type``: e.g. "trade", "journal"
                - Optional: ``id``, ``source_id``, ``chunk_index``,
                  ``metadata``, ``tags``, ``entity_type``, ``keywords``

        Returns:
            Number of chunks successfully stored.
        """
        ...

    @abstractmethod
    def search(
        self,
        project_id: str,
        query_embedding: list[float],
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """Hybrid search: vector similarity combined with keyword/attribute
        filters.

        Args:
            project_id: UUID string identifying the project.
            query_embedding: Dense vector representation of the query.
            top_k: Maximum number of results to return.
            filters: Optional dict with keys:
                - ``source_type`` (str)
                - ``entity_type`` (str)
                - ``tags`` (list[str])
                - ``date_range`` (dict with ``start``/``end`` ISO strings)
                - ``keyword`` (str — matched via SQL LIKE)

        Returns:
            List of SearchResults ordered by descending score.
        """
        ...

    @abstractmethod
    def delete_project_vectors(self, project_id: str) -> int:
        """Remove all vectors belonging to a project.

        Returns:
            Number of deleted entries.
        """
        ...

    def _build_filter_clause(
        self,
        stmt: Any,
        model: type[AIDocumentChunk],
        filters: dict[str, Any] | None,
    ) -> Any:
        """Apply metadata filters to a SQLAlchemy select statement."""
        if not filters:
            return stmt

        if source_type := filters.get("source_type"):
            stmt = stmt.where(model.source_type == source_type)
        if entity_type := filters.get("entity_type"):
            stmt = stmt.where(model.entity_type == entity_type)
        if tags := filters.get("tags"):
            if isinstance(tags, list) and tags:
                stmt = stmt.where(model.tags.has_any(tags))
        if date_range := filters.get("date_range"):
            start = date_range.get("start")
            end = date_range.get("end")
            if start:
                stmt = stmt.where(model.created_date >= start)
            if end:
                stmt = stmt.where(model.created_date <= end)
        if keyword := filters.get("keyword"):
            stmt = stmt.where(model.content.ilike(f"%{keyword}%"))
        return stmt

    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """Compute cosine similarity between two vectors.

        Returns a value in [-1, 1]; values are clamped to avoid float
        drift outside this range.
        """
        arr_a = np.array(a, dtype=np.float64)
        arr_b = np.array(b, dtype=np.float64)
        norm_a = np.linalg.norm(arr_a)
        norm_b = np.linalg.norm(arr_b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        sim = float(np.dot(arr_a, arr_b) / (norm_a * norm_b))
        return max(-1.0, min(1.0, sim))


class SQLiteVectorStore(BaseVectorStore):
    """Default vector store.

    Embeds are stored as JSONB in the ``ai_document_chunk`` table.
    Search performs in-memory cosine similarity over all project chunks,
    optionally filtered by metadata attributes and keyword.
    """

    def store_embeddings(
        self, project_id: str, chunks: list[dict[str, Any]]
    ) -> int:
        """Insert or update chunk rows via the ORM.

        Each dict in *chunks* may carry an ``id`` key for upsert;
        otherwise a new row is inserted.
        """
        stored = 0
        db: Session = SessionLocal()
        try:
            for chunk in chunks:
                chunk_id = chunk.get("id")
                if chunk_id:
                    existing = db.get(AIDocumentChunk, UUID(chunk_id))
                    if existing:
                        _update_chunk_row(existing, chunk)
                        stored += 1
                        continue

                row = _dict_to_chunk_row(project_id, chunk)
                db.add(row)
                stored += 1

            db.commit()
            self.logger.info(
                "Stored %d chunks for project %s", stored, project_id
            )
            return stored
        except Exception:
            db.rollback()
            self.logger.exception(
                "Failed to store embeddings for project %s", project_id
            )
            raise
        finally:
            db.close()

    def search(
        self,
        project_id: str,
        query_embedding: list[float],
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        db: Session = SessionLocal()
        try:
            stmt = select(AIDocumentChunk).where(
                AIDocumentChunk.project_id == UUID(project_id),
                AIDocumentChunk.embedding.isnot(None),
            )
            stmt = self._build_filter_clause(stmt, AIDocumentChunk, filters)
            rows = db.scalars(stmt).all()
        except Exception:
            self.logger.exception(
                "Search query failed for project %s", project_id
            )
            return []
        finally:
            db.close()

        if not rows:
            return []

        scored: list[tuple[float, AIDocumentChunk]] = []
        for row in rows:
            if not row.embedding:
                continue
            sim = self._cosine_similarity(query_embedding, row.embedding)
            scored.append((sim, row))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            _row_to_search_result(sim, row) for sim, row in scored[:top_k]
        ]

    def delete_project_vectors(self, project_id: str) -> int:
        db: Session = SessionLocal()
        try:
            result = db.execute(
                select(AIDocumentChunk).where(
                    AIDocumentChunk.project_id == UUID(project_id)
                )
            )
            rows = result.scalars().all()
            count = len(rows)
            for row in rows:
                db.delete(row)
            db.commit()
            self.logger.info(
                "Deleted %d vectors for project %s", count, project_id
            )
            return count
        except Exception:
            db.rollback()
            self.logger.exception(
                "Failed to delete vectors for project %s", project_id
            )
            raise
        finally:
            db.close()


class ChromaVectorStore(BaseVectorStore):
    """ChromaDB-backed vector store."""

    def __init__(self, config: VectorStoreConfig) -> None:
        super().__init__(config)
        self._client: Any = None
        self._collection: Any = None

    def _lazy_init(self) -> None:
        if self._collection is not None:
            return
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
        except ImportError:
            raise ImportError(
                "chromadb is required for ChromaVectorStore. "
                "Install it with: pip install chromadb"
            )

        client_settings = ChromaSettings(
            anonymized_telemetry=False,
            persist_directory=self.config.chroma_persist_directory,
        )
        self._client = chromadb.Client(client_settings)
        try:
            self._collection = self._client.get_collection(
                self.config.collection_name
            )
        except Exception:
            self._collection = self._client.create_collection(
                self.config.collection_name,
                metadata={"hnsw:space": self.config.distance},
            )

    def store_embeddings(
        self, project_id: str, chunks: list[dict[str, Any]]
    ) -> int:
        self._lazy_init()
        ids: list[str] = []
        embeddings: list[list[float]] = []
        metadatas: list[dict[str, Any]] = []
        documents: list[str] = []

        for chunk in chunks:
            chunk_id = chunk.get("id") or str(
                __import__("uuid").uuid4()
            )
            ids.append(f"{project_id}::{chunk_id}")
            embeddings.append(chunk["embedding"])
            meta = {
                "project_id": project_id,
                "source_type": chunk.get("source_type", ""),
                "entity_type": chunk.get("entity_type", ""),
                "tags": json.dumps(chunk.get("tags", [])),
                "created_date": chunk.get("created_date", ""),
            }
            if chunk.get("metadata"):
                meta.update(chunk["metadata"])
            metadatas.append(meta)
            documents.append(chunk.get("content", ""))

        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )
        self.logger.info(
            "Stored %d chunks in Chroma for project %s",
            len(chunks),
            project_id,
        )
        return len(chunks)

    def search(
        self,
        project_id: str,
        query_embedding: list[float],
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        self._lazy_init()
        where_clause: dict[str, Any] = {"project_id": project_id}
        if filters:
            if source_type := filters.get("source_type"):
                where_clause["source_type"] = source_type
            if entity_type := filters.get("entity_type"):
                where_clause["entity_type"] = entity_type
            if tags := filters.get("tags"):
                if isinstance(tags, list) and tags:
                    where_clause["tags"] = {"$in": tags}
            if date_range := filters.get("date_range"):
                cond: dict[str, str] = {}
                if start := date_range.get("start"):
                    cond["$gte"] = start
                if end := date_range.get("end"):
                    cond["$lte"] = end
                if cond:
                    where_clause["created_date"] = cond

        try:
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, 100),
                where=where_clause if len(where_clause) > 1 else None,
                include=["metadatas", "documents", "distances"],
            )
        except Exception:
            self.logger.exception("Chroma query failed")
            return []

        if not results or not results["ids"]:
            return []

        search_results: list[SearchResult] = []
        for i, doc_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results.get("distances") else 0.0
            score = 1.0 - distance if self.config.distance == "cosine" else distance
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            content = results["documents"][0][i] if results.get("documents") else ""

            search_results.append(
                SearchResult(
                    chunk_id=doc_id.split("::", 1)[-1] if "::" in doc_id else doc_id,
                    content=content,
                    score=float(score),
                    metadata={k: v for k, v in meta.items() if k != "project_id"},
                    source_type=meta.get("source_type", ""),
                )
            )

        # Apply keyword filter at application level if Chroma didn't support it
        if filters and filters.get("keyword"):
            kw = filters["keyword"].lower()
            search_results = [
                r for r in search_results if kw in r.content.lower()
            ]

        return search_results[:top_k]

    def delete_project_vectors(self, project_id: str) -> int:
        self._lazy_init()
        try:
            results = self._collection.get(
                where={"project_id": project_id}
            )
            ids = results.get("ids", [])
            if ids:
                self._collection.delete(ids=ids)
            self.logger.info(
                "Deleted %d vectors from Chroma for project %s",
                len(ids),
                project_id,
            )
            return len(ids)
        except Exception:
            self.logger.exception(
                "Failed to delete vectors from Chroma for project %s",
                project_id,
            )
            raise


class FAISSVectorStore(BaseVectorStore):
    """FAISS-backed in-process vector store.

    Stores indexes on disk at *faiss_index_path* using a project-scoped
    filename. Because FAISS does not natively handle metadata filtering,
    all filtering is done at application level after retrieval.
    """

    def __init__(self, config: VectorStoreConfig) -> None:
        super().__init__(config)
        self._indexes: dict[str, Any] = {}
        self._id_registry: dict[str, list[dict[str, Any]]] = {}

    def _get_index_path(self, project_id: str) -> str:
        import os
        return os.path.join(
            self.config.faiss_index_path, f"project_{project_id}.faiss"
        )

    def _load_or_create_index(self, project_id: str) -> Any:
        import faiss
        import os

        if project_id in self._indexes:
            return self._indexes[project_id]

        path = self._get_index_path(project_id)
        dim = self.config.dimension
        if os.path.exists(path):
            index = faiss.read_index(path)
            self._indexes[project_id] = index
            self._load_registry(project_id)
        else:
            index = faiss.IndexFlatIP(dim)
            self._indexes[project_id] = index
            self._id_registry[project_id] = []
        return index

    def _load_registry(self, project_id: str) -> None:
        import json
        import os

        path = self._get_index_path(project_id) + ".registry.json"
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                self._id_registry[project_id] = json.load(f)
        else:
            self._id_registry[project_id] = []

    def _save_index(self, project_id: str) -> None:
        import faiss
        import json
        import os

        os.makedirs(self.config.faiss_index_path, exist_ok=True)
        if project_id in self._indexes:
            faiss.write_index(
                self._indexes[project_id], self._get_index_path(project_id)
            )
        reg_path = self._get_index_path(project_id) + ".registry.json"
        with open(reg_path, "w", encoding="utf-8") as f:
            json.dump(self._id_registry.get(project_id, []), f)

    def store_embeddings(
        self, project_id: str, chunks: list[dict[str, Any]]
    ) -> int:
        import faiss
        import numpy as np

        index = self._load_or_create_index(project_id)
        registry = self._id_registry.setdefault(project_id, [])

        vectors = np.array(
            [chunk["embedding"] for chunk in chunks], dtype=np.float32
        )
        faiss.normalize_L2(vectors)
        index.add(vectors)

        for chunk in chunks:
            chunk_id = chunk.get("id") or str(
                __import__("uuid").uuid4()
            )
            registry.append(
                {
                    "chunk_id": chunk_id,
                    "content": chunk.get("content", ""),
                    "source_type": chunk.get("source_type", ""),
                    "entity_type": chunk.get("entity_type", ""),
                    "tags": chunk.get("tags", []),
                    "created_date": chunk.get("created_date", ""),
                    "metadata": chunk.get("metadata", {}),
                }
            )

        self._save_index(project_id)
        self.logger.info(
            "Stored %d chunks in FAISS for project %s",
            len(chunks),
            project_id,
        )
        return len(chunks)

    def search(
        self,
        project_id: str,
        query_embedding: list[float],
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        try:
            import faiss
            import numpy as np
        except ImportError:
            raise ImportError(
                "faiss is required for FAISSVectorStore. "
                "Install it with: pip install faiss-cpu"
            )

        index = self._load_or_create_index(project_id)
        registry = self._id_registry.get(project_id, [])
        if index.ntotal == 0 or not registry:
            return []

        query_vec = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(query_vec)

        k = min(top_k * 2, index.ntotal)
        distances, indices = index.search(query_vec, k)

        scored: list[tuple[float, int]] = []
        for i in range(len(indices[0])):
            idx = int(indices[0][i])
            if idx < 0 or idx >= len(registry):
                continue
            scored.append((float(distances[0][i]), idx))

        scored.sort(key=lambda x: x[0], reverse=True)

        results: list[SearchResult] = []
        seen: set[int] = set()
        for score, idx in scored:
            if idx in seen:
                continue
            seen.add(idx)
            row = registry[idx]
            if not _matches_filters(row, filters):
                continue
            results.append(
                SearchResult(
                    chunk_id=row["chunk_id"],
                    content=row["content"],
                    score=score,
                    metadata=row.get("metadata", {}),
                    source_type=row.get("source_type", ""),
                )
            )
            if len(results) >= top_k:
                break

        return results

    def delete_project_vectors(self, project_id: str) -> int:
        import os

        count = 0
        if project_id in self._indexes:
            count = self._indexes[project_id].ntotal
            del self._indexes[project_id]
        if project_id in self._id_registry:
            count = max(count, len(self._id_registry[project_id]))
            del self._id_registry[project_id]

        for suffix in ("", ".registry.json"):
            path = self._get_index_path(project_id) + suffix
            if os.path.exists(path):
                os.remove(path)

        self.logger.info(
            "Deleted %d vectors from FAISS for project %s",
            count,
            project_id,
        )
        return count


# ---------------------------------------------------------------------------
# Factory — proxy stores for unimplemented backends
# ---------------------------------------------------------------------------


class _ProxyStore(BaseVectorStore):
    """Stand-in for stores that require external packages."""

    def __init__(self, config: VectorStoreConfig) -> None:
        super().__init__(config)
        self._store_name = "unknown"

    def store_embeddings(self, project_id: str, chunks: list[dict[str, Any]]) -> int:
        raise NotImplementedError(f"Vector store '{self._store_name}' not yet implemented.")

    def search(self, project_id: str, query_embedding: list[float], top_k: int = 10, filters: dict[str, Any] | None = None) -> list[SearchResult]:
        raise NotImplementedError(f"Vector store '{self._store_name}' not yet implemented.")

    def delete_project_vectors(self, project_id: str) -> int:
        raise NotImplementedError(f"Vector store '{self._store_name}' not yet implemented.")


_STORE_REGISTRY: dict[str, type[BaseVectorStore]] = {
    "sqlite": SQLiteVectorStore,
    "chroma": ChromaVectorStore,
    "faiss": FAISSVectorStore,
    "qdrant": _ProxyStore,
    "pgvector": _ProxyStore,
    "pinecone": _ProxyStore,
    "weaviate": _ProxyStore,
    "milvus": _ProxyStore,
}


def get_vector_store(name: str = "sqlite", config: VectorStoreConfig | None = None) -> BaseVectorStore:
    cfg = config or VectorStoreConfig()
    cls = _STORE_REGISTRY.get(name.lower())
    if cls is None:
        raise ValueError(f"Unknown vector store '{name}'. Available: {', '.join(sorted(_STORE_REGISTRY))}")
    if cls is _ProxyStore:
        raise ImportError(f"Vector store '{name}' is not yet implemented. Please use 'sqlite', 'chroma', or 'faiss'.")
    return cls(cfg)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _dict_to_chunk_row(
    project_id: str, chunk: dict[str, Any]
) -> AIDocumentChunk:
    """Build an ORM row from a chunk dict."""
    import uuid as _uuid

    return AIDocumentChunk(
        id=UUID(chunk.get("id", str(_uuid.uuid4()))),
        project_id=UUID(project_id),
        ingestion_id=UUID(chunk["ingestion_id"])
        if chunk.get("ingestion_id")
        else UUID(int=0),
        source_type=chunk.get("source_type", ""),
        source_id=(
            UUID(chunk["source_id"]) if chunk.get("source_id") else None
        ),
        chunk_index=chunk.get("chunk_index", 0),
        content=chunk.get("content", ""),
        content_tokens=chunk.get("content_tokens"),
        embedding=chunk.get("embedding"),
        embedding_model=chunk.get("embedding_model"),
        document_title=chunk.get("document_title"),
        created_date=chunk.get("created_date"),
        tags=chunk.get("tags", []),
        entity_type=chunk.get("entity_type"),
        entity_id=chunk.get("entity_id"),
        keywords=chunk.get("keywords", []),
        relevance_score=chunk.get("relevance_score"),
    )


def _update_chunk_row(row: AIDocumentChunk, chunk: dict[str, Any]) -> None:
    """Patch an existing ORM row with non-None values from *chunk*."""
    for key, col in {
        "content": "content",
        "embedding": "embedding",
        "embedding_model": "embedding_model",
        "source_type": "source_type",
        "entity_type": "entity_type",
        "tags": "tags",
        "keywords": "keywords",
        "document_title": "document_title",
        "created_date": "created_date",
        "relevance_score": "relevance_score",
    }.items():
        if key in chunk and chunk[key] is not None:
            setattr(row, col, chunk[key])


def _row_to_search_result(
    score: float, row: AIDocumentChunk
) -> SearchResult:
    """Convert an ORM row to a SearchResult."""
    return SearchResult(
        chunk_id=str(row.id),
        content=row.content or "",
        score=score,
        metadata={
            "document_title": row.document_title,
            "created_date": row.created_date,
            "tags": row.tags or [],
            "entity_type": row.entity_type,
            "entity_id": row.entity_id,
            "keywords": row.keywords or [],
            "relevance_score": row.relevance_score,
            "chunk_index": row.chunk_index,
        },
        source_type=row.source_type or "",
    )


def _matches_filters(
    row: dict[str, Any], filters: dict[str, Any] | None
) -> bool:
    """Check if a FAISS registry row satisfies the given filters."""
    if not filters:
        return True
    if source_type := filters.get("source_type"):
        if row.get("source_type") != source_type:
            return False
    if entity_type := filters.get("entity_type"):
        if row.get("entity_type") != entity_type:
            return False
    if tags := filters.get("tags"):
        if isinstance(tags, list) and tags:
            row_tags = row.get("tags") or []
            if not any(t in row_tags for t in tags):
                return False
    if date_range := filters.get("date_range"):
        created = row.get("created_date", "")
        if start := date_range.get("start"):
            if created < start:
                return False
        if end := date_range.get("end"):
            if created > end:
                return False
    if keyword := filters.get("keyword"):
        if keyword.lower() not in (row.get("content") or "").lower():
            return False
    return True

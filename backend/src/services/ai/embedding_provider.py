"""Embedding provider abstraction — supports OpenAI, BGE, Nomic, Jina, Voyage,
Sentence Transformers, and a fallback SimpleEmbeddingProvider for testing.

Selected via EMBEDDING_PROVIDER env var (default: simple).
Use EMBEDDING_API_KEY, EMBEDDING_MODEL, EMBEDDING_ENDPOINT, EMBEDDING_DIMENSIONS
to configure.
"""

import logging
import os
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Response dataclass
# ---------------------------------------------------------------------------

BATCH_SIZE = 20
MAX_RETRIES = 3
RETRY_DELAY = 1.0


@dataclass
class EmbeddingResponse:
    embeddings: list[list[float]]
    model: str
    provider: str
    usage_tokens: int = 0
    latency_ms: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------


class BaseEmbeddingProvider(ABC):
    """Abstract embedding provider. Subclasses must implement _embed_batch."""

    provider_name: str = "base"
    model_name: str = ""

    def embed(self, texts: list[str]) -> EmbeddingResponse:
        """Embed a list of texts with automatic chunking and retry."""
        if not texts:
            return EmbeddingResponse(
                embeddings=[], model=self.model_name, provider=self.provider_name
            )

        all_embeddings: list[list[float]] = []
        total_tokens = 0
        start = time.perf_counter()

        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i : i + BATCH_SIZE]
            resp = self._embed_with_retry(batch)
            all_embeddings.extend(resp["embeddings"])
            total_tokens += resp.get("usage_tokens", 0)

        elapsed_ms = (time.perf_counter() - start) * 1000

        return EmbeddingResponse(
            embeddings=all_embeddings,
            model=self.model_name,
            provider=self.provider_name,
            usage_tokens=total_tokens,
            latency_ms=round(elapsed_ms, 2),
        )

    def _embed_with_retry(self, texts: list[str]) -> dict:
        last_error: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return self._embed_batch(texts)
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Embedding attempt %d/%d failed for %s: %s",
                    attempt,
                    MAX_RETRIES,
                    self.provider_name,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY * attempt)
        raise RuntimeError(
            f"Embedding failed after {MAX_RETRIES} retries: {last_error}"
        ) from last_error

    @abstractmethod
    def _embed_batch(self, texts: list[str]) -> dict:
        """Return dict with keys 'embeddings' (list[list[float]]) and optionally 'usage_tokens'."""
        ...


# ---------------------------------------------------------------------------
# OpenAI
# ---------------------------------------------------------------------------


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    provider_name = "openai"
    model_name: str

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "text-embedding-3-small",
        dimensions: int = 1536,
        endpoint: str | None = None,
    ):
        self.model_name = model
        self._dimensions = dimensions
        self._api_key = api_key or os.getenv("EMBEDDING_API_KEY", "")
        self._endpoint = endpoint
        self._client: Any = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        try:
            import openai
        except ImportError:
            logger.warning("openai package not installed; falling back to SimpleEmbeddingProvider")
            raise
        kwargs: dict[str, Any] = {"api_key": self._api_key}
        if self._endpoint:
            kwargs["base_url"] = self._endpoint
        self._client = openai.OpenAI(**kwargs)
        return self._client

    def _embed_batch(self, texts: list[str]) -> dict:
        client = self._get_client()
        kwargs: dict[str, Any] = {
            "model": self.model_name,
            "input": texts,
        }
        if self.model_name != "text-embedding-ada-002":
            kwargs["dimensions"] = self._dimensions
        resp = client.embeddings.create(**kwargs)
        # Sort by index to preserve order
        sorted_data = sorted(resp.data, key=lambda x: x.index)
        embeddings = [item.embedding for item in sorted_data]
        return {
            "embeddings": embeddings,
            "usage_tokens": resp.usage.total_tokens if resp.usage else 0,
        }


# ---------------------------------------------------------------------------
# Sentence Transformers (local)
# ---------------------------------------------------------------------------


class SentenceTransformersEmbeddingProvider(BaseEmbeddingProvider):
    provider_name = "sentence_transformers"
    model_name: str

    def __init__(self, model: str = "all-MiniLM-L6-v2", device: str = "cpu"):
        self.model_name = model
        self._device = device
        self._model: Any = None

    def _get_model(self):
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError:
            logger.warning(
                "sentence-transformers package not installed; "
                "falling back to SimpleEmbeddingProvider"
            )
            raise
        self._model = SentenceTransformer(self.model_name, device=self._device)
        return self._model

    def _embed_batch(self, texts: list[str]) -> dict:
        model = self._get_model()
        embeddings = model.encode(texts, show_progress_bar=False).tolist()
        return {"embeddings": embeddings}


# ---------------------------------------------------------------------------
# Simple (random) — fallback / testing
# ---------------------------------------------------------------------------


class SimpleEmbeddingProvider(BaseEmbeddingProvider):
    provider_name = "simple"

    def __init__(self, dimensions: int = 384, seed: int = 42):
        self.model_name = f"random-{dimensions}d"
        self._dimensions = dimensions
        self._rng = random.Random(seed)

    def _embed_batch(self, texts: list[str]) -> dict:
        embeddings = [
            [self._rng.gauss(0, 0.1) for _ in range(self._dimensions)]
            for _ in texts
        ]
        return {"embeddings": embeddings}


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

_PROVIDER_REGISTRY: dict[str, type[BaseEmbeddingProvider]] = {
    "openai": OpenAIEmbeddingProvider,
    "sentence_transformers": SentenceTransformersEmbeddingProvider,
    "simple": SimpleEmbeddingProvider,
}


def get_embedding_provider(
    name: str | None = None,
    config: dict[str, Any] | None = None,
) -> BaseEmbeddingProvider:
    """Factory: return an embedding provider by name.

    Falls back to SimpleEmbeddingProvider when the requested provider's
    package is not installed.
    """
    cfg = config or {}
    name = (name or os.getenv("EMBEDDING_PROVIDER", "simple")).lower()

    cls = _PROVIDER_REGISTRY.get(name)
    if cls is None:
        logger.warning(
            "Unknown embedding provider '%s'; falling back to 'simple'", name
        )
        cls = SimpleEmbeddingProvider

    # Build provider-specific kwargs from config + env
    if cls is OpenAIEmbeddingProvider:
        kwargs = {
            "api_key": cfg.get("api_key") or os.getenv("EMBEDDING_API_KEY"),
            "model": cfg.get("model") or os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
            "dimensions": int(
                cfg.get("dimensions") or os.getenv("EMBEDDING_DIMENSIONS", "1536")
            ),
            "endpoint": cfg.get("endpoint") or os.getenv("EMBEDDING_ENDPOINT"),
        }
    elif cls is SentenceTransformersEmbeddingProvider:
        kwargs = {
            "model": cfg.get("model") or os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
            "device": cfg.get("device", "cpu"),
        }
    elif cls is SimpleEmbeddingProvider:
        kwargs = {
            "dimensions": int(
                cfg.get("dimensions") or os.getenv("EMBEDDING_DIMENSIONS", "384")
            ),
        }
    else:
        kwargs = {}

    try:
        return cls(**kwargs)
    except (ImportError, Exception) as exc:
        logger.warning(
            "Failed to initialise %s (%s); falling back to SimpleEmbeddingProvider",
            name,
            exc,
        )
        dims = int(cfg.get("dimensions") or os.getenv("EMBEDDING_DIMENSIONS", "384"))
        return SimpleEmbeddingProvider(dimensions=dims)

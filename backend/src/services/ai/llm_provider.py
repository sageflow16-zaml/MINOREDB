"""LLM provider abstraction layer for the trading RAG copilot.

Supports OpenAI, Anthropic Claude, Google Gemini, OpenRouter,
Ollama, LM Studio, Azure OpenAI, and custom HTTP providers.

Usage:
    from llm_provider import get_provider, LLMResponse

    config = {
        "api_key": "sk-...",
        "model": "gpt-4o",
        "max_tokens": 2048,
        "temperature": 0.1,
    }
    provider = get_provider("openai", config)
    response: LLMResponse = provider.chat_complete(
        messages=[{"role": "user", "content": "Hello"}]
    )
"""

from __future__ import annotations

import importlib
import json
import logging
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Generator, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Response type
# ---------------------------------------------------------------------------

@dataclass
class Usage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


@dataclass
class LLMResponse:
    content: str
    model: str = ""
    provider: str = ""
    usage: Usage = field(default_factory=Usage)
    latency_ms: float = 0.0
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------

def _retry(max_retries: int = 3, base_delay: float = 1.0) -> Any:
    """Decorator: retry a callable with exponential backoff on any exception.

    Returns (result, latency_ms) on success, or raises the last exception.
    """
    def decorator(fn: Any) -> Any:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Optional[Exception] = None
            for attempt in range(1, max_retries + 1):
                start = time.perf_counter()
                try:
                    result = fn(*args, **kwargs)
                    latency = (time.perf_counter() - start) * 1000
                    return result, latency
                except Exception as exc:
                    latency = (time.perf_counter() - start) * 1000
                    last_exc = exc
                    if attempt < max_retries:
                        delay = base_delay * (2 ** (attempt - 1))
                        logger.warning(
                            "Provider call attempt %d/%d failed after %.0f ms: %s. "
                            "Retrying in %.1fs...",
                            attempt, max_retries, latency, exc, delay,
                        )
                        time.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class BaseLLMProvider(ABC):
    """Abstract LLM provider.

    Subclasses must implement _chat_complete and may override
    chat_complete / chat_complete_stream for custom behaviour.
    """

    provider_name: str = "base"

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    # -- Public API -------------------------------------------------------

    def chat_complete(
        self,
        messages: list[dict[str, str]],
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> LLMResponse:
        """Send a chat completion request and return the response."""
        model = model or self.config.get("model", "unknown")
        try:
            result, latency_ms = self._invoke(messages, model, **kwargs)
        except Exception as exc:
            logger.exception("[%s] chat_complete failed", self.provider_name)
            return LLMResponse(
                content="",
                model=model,
                provider=self.provider_name,
                error=str(exc),
            )
        content, usage = result
        return LLMResponse(
            content=content,
            model=model,
            provider=self.provider_name,
            usage=usage,
            latency_ms=latency_ms,
        )

    def chat_complete_stream(
        self,
        messages: list[dict[str, str]],
        model: Optional[str] = None,
        **kwargs: Any,
    ) -> Generator[str, None, None]:
        """Stream a chat completion (stub — yields the full response)."""
        resp = self.chat_complete(messages, model=model, **kwargs)
        if resp.content:
            yield resp.content

    # -- Internal ---------------------------------------------------------

    def _invoke(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[tuple[str, Usage], float]:
        """Call _chat_complete wrapped with retry logic.

        Returns ((content, usage), latency_ms).
        """
        decorated = _retry(max_retries=3)(self._chat_complete)
        return decorated(messages, model, **kwargs)

    @abstractmethod
    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        """Subclass hook — must return (content, usage)."""


# ---------------------------------------------------------------------------
# Helper: safe import
# ---------------------------------------------------------------------------

def _safe_import(module_name: str, package_name: Optional[str] = None) -> Any:
    """Try to import *module_name*; return the module or None."""
    try:
        return importlib.import_module(module_name)
    except ImportError:
        pkg = package_name or module_name.split(".")[0]
        logger.warning(
            "Package '%s' is not installed. "
            "Install it with: pip install %s",
            pkg, pkg,
        )
        return None


# ---------------------------------------------------------------------------
# OpenAI
# ---------------------------------------------------------------------------

class OpenAIProvider(BaseLLMProvider):
    provider_name = "openai"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        openai = _safe_import("openai")
        if openai is None:
            return "", Usage()

        client = openai.OpenAI(
            api_key=self.config.get("api_key"),
            base_url=self.config.get("endpoint"),
        )
        resp = client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=self.config.get("max_tokens", 2048),
            temperature=self.config.get("temperature", 0.1),
            **kwargs,
        )
        choice = resp.choices[0]
        content = choice.message.content or ""
        usage_obj = getattr(resp, "usage", None)
        usage = Usage(
            prompt_tokens=getattr(usage_obj, "prompt_tokens", 0),
            completion_tokens=getattr(usage_obj, "completion_tokens", 0),
            total_tokens=getattr(usage_obj, "total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Anthropic / Claude
# ---------------------------------------------------------------------------

class AnthropicProvider(BaseLLMProvider):
    provider_name = "anthropic"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        anthropic = _safe_import("anthropic")
        if anthropic is None:
            return "", Usage()

        client = anthropic.Anthropic(
            api_key=self.config.get("api_key"),
            base_url=self.config.get("endpoint"),
        )
        system_msgs = [m for m in messages if m.get("role") == "system"]
        other_msgs = [m for m in messages if m.get("role") != "system"]

        system_prompt = system_msgs[-1]["content"] if system_msgs else ""

        resp = client.messages.create(
            model=model,
            system=system_prompt,
            messages=other_msgs,  # type: ignore[arg-type]
            max_tokens=self.config.get("max_tokens", 2048),
            **kwargs,
        )
        content = "".join(
            b.text for b in resp.content if hasattr(b, "text")
        ) if resp.content else ""
        usage_obj = getattr(resp, "usage", None)
        usage = Usage(
            prompt_tokens=getattr(usage_obj, "input_tokens", 0),
            completion_tokens=getattr(usage_obj, "output_tokens", 0),
            total_tokens=(
                getattr(usage_obj, "input_tokens", 0)
                + getattr(usage_obj, "output_tokens", 0)
            ),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Google Gemini
# ---------------------------------------------------------------------------

class GeminiProvider(BaseLLMProvider):
    provider_name = "gemini"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        genai = _safe_import("google.generativeai")
        if genai is None:
            return "", Usage()

        genai.configure(api_key=self.config.get("api_key"))

        system_msgs = [m for m in messages if m.get("role") == "system"]
        other_msgs = [m for m in messages if m.get("role") != "system"]

        system_instruction = system_msgs[-1]["content"] if system_msgs else None
        generation_config = {
            "max_output_tokens": self.config.get("max_tokens", 2048),
            "temperature": self.config.get("temperature", 0.1),
        }
        safety_settings = self.config.get("safety_settings", None)

        model_instance = genai.GenerativeModel(
            model_name=model,
            system_instruction=system_instruction,
            generation_config=generation_config,
            safety_settings=safety_settings,
        )

        user_content = "\n".join(
            m["content"] for m in other_msgs if m.get("content")
        ) if other_msgs else ""

        resp = model_instance.generate_content(user_content, **kwargs)
        content = resp.text if hasattr(resp, "text") else ""

        usage_meta = getattr(resp, "usage_metadata", None)
        usage = Usage(
            prompt_tokens=getattr(usage_meta, "prompt_token_count", 0),
            completion_tokens=getattr(usage_meta, "candidates_token_count", 0),
            total_tokens=getattr(usage_meta, "total_token_count", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# OpenRouter (OpenAI-compatible)
# ---------------------------------------------------------------------------

class OpenRouterProvider(BaseLLMProvider):
    provider_name = "openrouter"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        openai = _safe_import("openai")
        if openai is None:
            return "", Usage()

        client = openai.OpenAI(
            api_key=self.config.get("api_key"),
            base_url=self.config.get("endpoint", "https://openrouter.ai/api/v1"),
            default_headers={
                "HTTP-Referer": self.config.get("site_url", ""),
                "X-Title": self.config.get("site_name", "Minore"),
            },
        )
        resp = client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=self.config.get("max_tokens", 2048),
            temperature=self.config.get("temperature", 0.1),
            **kwargs,
        )
        choice = resp.choices[0]
        content = choice.message.content or ""
        usage_obj = getattr(resp, "usage", None)
        usage = Usage(
            prompt_tokens=getattr(usage_obj, "prompt_tokens", 0),
            completion_tokens=getattr(usage_obj, "completion_tokens", 0),
            total_tokens=getattr(usage_obj, "total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Ollama (local)
# ---------------------------------------------------------------------------

class OllamaProvider(BaseLLMProvider):
    provider_name = "ollama"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        requests = _safe_import("requests")
        if requests is None:
            return "", Usage()

        endpoint = self.config.get(
            "endpoint", "http://localhost:11434"
        ).rstrip("/")
        url = f"{endpoint}/api/chat"

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "num_predict": self.config.get("max_tokens", 2048),
                "temperature": self.config.get("temperature", 0.1),
            },
        }
        resp = requests.post(url, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()

        content = data.get("message", {}).get("content", "")
        usage_data = data.get("usage", {}) or {}
        usage = Usage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# LM Studio (local, OpenAI-compatible)
# ---------------------------------------------------------------------------

class LMStudioProvider(BaseLLMProvider):
    provider_name = "lm_studio"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        openai = _safe_import("openai")
        if openai is None:
            return "", Usage()

        endpoint = self.config.get(
            "endpoint", "http://localhost:1234/v1"
        ).rstrip("/")

        client = openai.OpenAI(
            api_key=self.config.get("api_key", "lm-studio"),
            base_url=endpoint,
        )
        resp = client.chat.completions.create(
            model=model or "local-model",
            messages=messages,  # type: ignore[arg-type]
            max_tokens=self.config.get("max_tokens", 2048),
            temperature=self.config.get("temperature", 0.1),
            **kwargs,
        )
        choice = resp.choices[0]
        content = choice.message.content or ""
        usage_obj = getattr(resp, "usage", None)
        usage = Usage(
            prompt_tokens=getattr(usage_obj, "prompt_tokens", 0),
            completion_tokens=getattr(usage_obj, "completion_tokens", 0),
            total_tokens=getattr(usage_obj, "total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Azure OpenAI
# ---------------------------------------------------------------------------

class AzureOpenAIProvider(BaseLLMProvider):
    provider_name = "azure_openai"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        openai = _safe_import("openai")
        if openai is None:
            return "", Usage()

        client = openai.AzureOpenAI(
            api_key=self.config.get("api_key"),
            azure_endpoint=self.config.get("endpoint"),
            api_version=self.config.get(
                "api_version", "2024-02-15-preview"
            ),
            azure_deployment=self.config.get("deployment", model),
        )
        resp = client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=self.config.get("max_tokens", 2048),
            temperature=self.config.get("temperature", 0.1),
            **kwargs,
        )
        choice = resp.choices[0]
        content = choice.message.content or ""
        usage_obj = getattr(resp, "usage", None)
        usage = Usage(
            prompt_tokens=getattr(usage_obj, "prompt_tokens", 0),
            completion_tokens=getattr(usage_obj, "completion_tokens", 0),
            total_tokens=getattr(usage_obj, "total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Custom (generic HTTP endpoint)
# ---------------------------------------------------------------------------

class CustomProvider(BaseLLMProvider):
    provider_name = "custom"

    def _chat_complete(
        self,
        messages: list[dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> tuple[str, Usage]:
        requests = _safe_import("requests")
        if requests is None:
            return "", Usage()

        endpoint = self.config.get("endpoint", "").rstrip("/")
        if not endpoint:
            raise ValueError("Custom provider requires an 'endpoint' in config")

        headers = {
            "Content-Type": "application/json",
            **self.config.get("headers", {}),
        }
        api_key = self.config.get("api_key")
        if api_key:
            api_key_header = self.config.get("api_key_header", "Authorization")
            api_key_prefix = self.config.get("api_key_prefix", "Bearer ")
            headers[api_key_header] = f"{api_key_prefix}{api_key}"

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": self.config.get("max_tokens", 2048),
            "temperature": self.config.get("temperature", 0.1),
        }
        payload.update(kwargs)
        payload.update(self.config.get("extra_body", {}))

        path = self.config.get("path", "/v1/chat/completions")
        url = f"{endpoint}{path}"

        resp = requests.post(url, json=payload, headers=headers, timeout=120)
        resp.raise_for_status()
        data = resp.json()

        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        usage_data = data.get("usage", {}) or {}
        usage = Usage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            total_tokens=usage_data.get("total_tokens", 0),
        )
        return content, usage


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

_PROVIDER_REGISTRY: dict[str, type[BaseLLMProvider]] = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "claude": AnthropicProvider,
    "gemini": GeminiProvider,
    "openrouter": OpenRouterProvider,
    "ollama": OllamaProvider,
    "lm_studio": LMStudioProvider,
    "lmstudio": LMStudioProvider,
    "azure_openai": AzureOpenAIProvider,
    "azure": AzureOpenAIProvider,
    "custom": CustomProvider,
}

# Public aliases
PROVIDER_NAMES = frozenset(_PROVIDER_REGISTRY.keys())


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def get_provider(
    name: str,
    config: dict[str, Any] | None = None,
) -> BaseLLMProvider:
    """Return a provider instance for the given *name*.

    Args:
        name: Provider identifier (e.g. ``"openai"``, ``"anthropic"``,
              ``"ollama"``, ``"custom"``). Case-insensitive.
        config: Configuration dictionary. If ``None``, an empty dict is used.

    Returns:
        An instance of a :class:`BaseLLMProvider` subclass.

    Raises:
        ValueError: If *name* is not in the provider registry.
    """
    config = config or {}
    key = name.strip().lower().replace("-", "_")
    cls = _PROVIDER_REGISTRY.get(key)
    if cls is None:
        raise ValueError(
            f"Unknown LLM provider: '{name}'. "
            f"Available: {', '.join(sorted(PROVIDER_NAMES))}"
        )
    return cls(config)

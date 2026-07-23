"""
RAG Copilot — main orchestrator for the AI Research Copilot.

Coordinates all AI subsystems (RAG, LLM, embeddings, vector store,
ingestion, context, agents, tools, memory, prompts, citations,
conversations) behind a thin delegation API.  Every public method is
a wrapper that instantiates the relevant service(s) and delegates.
"""

from __future__ import annotations

import time
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from src.services.ai.rag_pipeline import RAGPipeline
from src.services.ai.llm_provider import get_provider
from src.services.ai.embedding_provider import get_embedding_provider
from src.services.ai.vector_store import get_vector_store
from src.services.ai.ingestion import IngestionService
from src.services.ai.context_builder import ContextBuilder
from src.services.ai.agent_framework import AgentFactory
from src.services.ai.tool_framework import ToolRegistry
from src.services.ai.memory_system import MemorySystem
from src.services.ai.prompt_library import PromptLibrary, WorkflowEngine
from src.services.ai.citation_engine import CitationEngine
from src.services.ai.conversation import ConversationService


class RAGCopilot:
    """Thin orchestrator that delegates to all AI subsystems.

    Every public method:
      1. Instantiates the required service(s).
      2. Calls the relevant method.
      3. Returns the result directly or ``{"error": str}`` on failure.
    """

    def __init__(self, db: Session, project_id: UUID) -> None:
        self.db = db
        self.project_id = project_id

    # ═══════════════════════════════════════════════════════════════
    # Chat (primary interaction)
    # ═══════════════════════════════════════════════════════════════

    def chat(
        self,
        project_id: UUID,
        conversation_id: UUID | None,
        message: str,
        agent_type: str | None = None,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Main chat interaction.

        Orchestrates the full AI pipeline:
          1. Enriched project context (ContextBuilder)
          2. Agent system prompt (AgentFactory)
          3. RAG pipeline (search -> LLM -> persist conversation + citations)
          4. Memory storage (MemorySystem)
          5. Latency / token tracking
        """
        start = time.perf_counter()
        opts = options or {}

        try:
            ctx = ContextBuilder(self.db).build_full_context(
                project_id, opts.get("context_options"),
            )

            system_prompt: str | None = None
            if agent_type:
                try:
                    agent = AgentFactory.get_agent(agent_type)
                    system_prompt = agent.get_prompt(
                        workflow_type=opts.get("workflow_type"),
                    )
                except KeyError:
                    pass

            rag_opts = {k: v for k, v in {
                "system_prompt": system_prompt or opts.get("system_prompt"),
                "top_k": opts.get("top_k"),
                "max_context_chars": opts.get("max_context_chars"),
                "filters": opts.get("filters"),
                "model": opts.get("model"),
                "temperature": opts.get("temperature"),
                "stream": opts.get("stream"),
            }.items() if v is not None}

            pipeline = RAGPipeline(self.db)
            gen = pipeline.generate(
                project_id=str(project_id),
                conversation_id=str(conversation_id) if conversation_id else None,
                user_message=message,
                agent_type=agent_type,
                options=rag_opts,
            )

            elapsed_ms = int((time.perf_counter() - start) * 1000)

            MemorySystem(self.db).store(
                project_id=project_id,
                memory_type="conversation",
                key=f"chat:{conversation_id or gen.get('message_id', 'new')}",
                value={
                    "message": message,
                    "response": gen.get("answer"),
                    "agent_type": agent_type,
                },
                conversation_id=conversation_id or UUID(gen["message_id"])
                if gen.get("message_id") else None,
                importance=0.7,
            )

            return {
                "message": gen.get("answer", ""),
                "citations": gen.get("citations", []),
                "context_used": ctx,
                "token_usage": {
                    "prompt_tokens": gen.get("prompt_tokens"),
                    "completion_tokens": gen.get("completion_tokens"),
                    "total_tokens": gen.get("total_tokens"),
                },
                "latency_ms": gen.get("latency_ms", elapsed_ms),
                "message_id": gen.get("message_id"),
                "confidence": gen.get("confidence"),
                "error": gen.get("error"),
            }

        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Ingestion
    # ═══════════════════════════════════════════════════════════════

    def ingest_all(self, project_id: UUID) -> dict[str, Any]:
        """Ingest all data sources into the RAG pipeline."""
        try:
            return IngestionService(self.db).ingest_all(project_id)
        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Search
    # ═══════════════════════════════════════════════════════════════

    def search(
        self,
        project_id: UUID,
        query: str,
        filters: dict[str, Any] | None = None,
    ) -> list[Any]:
        """Hybrid search over ingested documents."""
        try:
            return RAGPipeline(self.db).search(
                project_id=str(project_id),
                query=query,
                filters=filters,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    # ═══════════════════════════════════════════════════════════════
    # Workflow
    # ═══════════════════════════════════════════════════════════════

    def execute_workflow(
        self,
        project_id: UUID,
        workflow_id: UUID,
        variables: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Execute a multi-step AI workflow."""
        try:
            return WorkflowEngine(self.db).execute_workflow(
                project_id, workflow_id, variables,
            )
        except Exception as exc:
            return {"error": str(exc)}

    def list_workflows(
        self, project_id: UUID, workflow_type: str | None = None,
    ) -> list[Any]:
        try:
            return WorkflowEngine(self.db).list_workflows(project_id, workflow_type)
        except Exception as exc:
            return [{"error": str(exc)}]

    def get_workflow(self, workflow_id: UUID) -> Any | None:
        try:
            return WorkflowEngine(self.db).get_workflow(workflow_id)
        except Exception as exc:
            return None

    def create_workflow(
        self, project_id: UUID, data: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            return WorkflowEngine(self.db).create_workflow(project_id, data)
        except Exception as exc:
            return {"error": str(exc)}

    def update_workflow(
        self, workflow_id: UUID, data: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            return WorkflowEngine(self.db).update_workflow(workflow_id, data)
        except Exception as exc:
            return {"error": str(exc)}

    def get_workflow_templates(self, project_id: UUID) -> list[dict[str, Any]]:
        try:
            return WorkflowEngine(self.db).get_workflow_templates(project_id)
        except Exception as exc:
            return [{"error": str(exc)}]

    def get_workflow_progress(self, execution_id: UUID) -> dict[str, Any]:
        try:
            return WorkflowEngine(self.db).get_workflow_progress(execution_id)
        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Tool execution
    # ═══════════════════════════════════════════════════════════════

    async def execute_tool(
        self,
        project_id: UUID,
        tool_name: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a registered tool by name."""
        try:
            return await ToolRegistry.execute(tool_name, project_id, params, self.db)
        except Exception as exc:
            return {"error": str(exc)}

    def list_tools(self) -> list[dict[str, Any]]:
        try:
            return ToolRegistry.list_tools()
        except Exception as exc:
            return [{"error": str(exc)}]

    # ═══════════════════════════════════════════════════════════════
    # Context
    # ═══════════════════════════════════════════════════════════════

    def get_context(
        self,
        project_id: UUID,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build enriched project context from all data sources."""
        try:
            return ContextBuilder(self.db).build_full_context(project_id, options)
        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Memory
    # ═══════════════════════════════════════════════════════════════

    def get_relevant_memories(
        self,
        project_id: UUID,
        context: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Retrieve memories relevant to the given context."""
        try:
            return MemorySystem(self.db).get_relevant(project_id, context, limit)
        except Exception as exc:
            return [{"error": str(exc)}]

    def store_memory(
        self,
        project_id: UUID,
        memory_type: str,
        key: str,
        value: dict[str, Any] | None = None,
        text_value: str | None = None,
        importance: float = 0.5,
        ttl_seconds: int | None = None,
        conversation_id: UUID | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        try:
            mem = MemorySystem(self.db).store(
                project_id=project_id,
                memory_type=memory_type,
                key=key,
                value=value,
                text_value=text_value,
                importance=importance,
                ttl_seconds=ttl_seconds,
                conversation_id=conversation_id,
                tags=tags,
            )
            return {
                "id": str(mem.id),
                "memory_type": mem.memory_type,
                "key": mem.key,
                "importance": mem.importance,
            }
        except Exception as exc:
            return {"error": str(exc)}

    def get_memory(
        self, project_id: UUID, memory_type: str, key: str,
    ) -> dict[str, Any] | None:
        try:
            return MemorySystem(self.db).get(project_id, memory_type, key)
        except Exception as exc:
            return {"error": str(exc)}

    def search_memories(
        self,
        project_id: UUID,
        query: str,
        memory_type: str | None = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        try:
            return MemorySystem(self.db).search(
                project_id, query, memory_type=memory_type, limit=limit,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    # ═══════════════════════════════════════════════════════════════
    # Conversation CRUD
    # ═══════════════════════════════════════════════════════════════

    def create_conversation(
        self,
        project_id: UUID,
        title: str,
        agent_type: str | None = None,
        folder: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        try:
            return ConversationService(self.db).create_conversation(
                project_id, title, agent_type=agent_type, folder=folder, tags=tags,
            )
        except Exception as exc:
            return {"error": str(exc)}

    def get_conversation(
        self, project_id: UUID, conversation_id: UUID,
    ) -> dict[str, Any] | None:
        try:
            return ConversationService(self.db).get_conversation(
                project_id, conversation_id,
            )
        except Exception as exc:
            return {"error": str(exc)}

    def list_conversations(
        self,
        project_id: UUID,
        agent_type: str | None = None,
        folder: str | None = None,
        is_pinned: bool | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        try:
            return ConversationService(self.db).list_conversations(
                project_id, agent_type=agent_type, folder=folder,
                is_pinned=is_pinned, limit=limit,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    def update_conversation(
        self, project_id: UUID, conversation_id: UUID, data: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            return ConversationService(self.db).update_conversation(
                project_id, conversation_id, data,
            )
        except Exception as exc:
            return {"error": str(exc)}

    def archive_conversation(
        self, project_id: UUID, conversation_id: UUID,
    ) -> bool:
        try:
            return ConversationService(self.db).archive_conversation(
                project_id, conversation_id,
            )
        except Exception as exc:
            return False

    def delete_conversation(
        self, project_id: UUID, conversation_id: UUID,
    ) -> bool:
        try:
            return ConversationService(self.db).delete_conversation(
                project_id, conversation_id,
            )
        except Exception as exc:
            return False

    def search_conversations(
        self, project_id: UUID, query: str,
    ) -> list[dict[str, Any]]:
        try:
            return ConversationService(self.db).search_conversations(
                project_id, query,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    def add_message(
        self,
        project_id: UUID,
        conversation_id: UUID,
        role: str,
        content: str,
        **kwargs: Any,
    ) -> dict[str, Any] | None:
        try:
            return ConversationService(self.db).add_message(
                project_id, conversation_id, role, content, **kwargs,
            )
        except Exception as exc:
            return {"error": str(exc)}

    def get_messages(
        self, project_id: UUID, conversation_id: UUID, limit: int = 100,
    ) -> list[dict[str, Any]]:
        try:
            return ConversationService(self.db).get_messages(
                project_id, conversation_id, limit=limit,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    # ═══════════════════════════════════════════════════════════════
    # Prompt CRUD
    # ═══════════════════════════════════════════════════════════════

    def create_prompt(
        self, project_id: UUID, data: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            return PromptLibrary(self.db).create_prompt(project_id, data)
        except Exception as exc:
            return {"error": str(exc)}

    def get_prompt(self, prompt_id: UUID) -> dict[str, Any] | None:
        try:
            return PromptLibrary(self.db).get_prompt(prompt_id)
        except Exception as exc:
            return {"error": str(exc)}

    def list_prompts(
        self,
        project_id: UUID,
        category: str | None = None,
        agent_type: str | None = None,
    ) -> list[dict[str, Any]]:
        try:
            rows = PromptLibrary(self.db).list_prompts(project_id)
            result = []
            for r in rows:
                d = {
                    "id": str(r.id),
                    "project_id": str(r.project_id),
                    "title": r.title,
                    "content": r.content,
                    "category": r.category,
                    "agent_type": r.agent_type,
                    "folder_id": str(r.folder_id) if r.folder_id else None,
                    "tags": r.tags,
                    "description": r.description,
                    "variables": r.variables,
                    "is_favorite": r.is_favorite,
                    "created_at": r.created_at.isoformat() if hasattr(r, 'created_at') and r.created_at else None,
                }
                if category and d.get("category") != category:
                    continue
                if agent_type and d.get("agent_type") != agent_type:
                    continue
                result.append(d)
            return result
        except Exception as exc:
            return []

    def update_prompt(
        self, prompt_id: UUID, data: dict[str, Any],
    ) -> dict[str, Any] | None:
        try:
            return PromptLibrary(self.db).update_prompt(prompt_id, data)
        except Exception as exc:
            return {"error": str(exc)}

    def delete_prompt(self, prompt_id: UUID) -> bool:
        try:
            return PromptLibrary(self.db).delete_prompt(prompt_id)
        except Exception as exc:
            return False

    # ═══════════════════════════════════════════════════════════════
    # Agent introspection
    # ═══════════════════════════════════════════════════════════════

    def list_agents(self) -> list[dict[str, Any]]:
        try:
            return AgentFactory.list_agents()
        except Exception as exc:
            return [{"error": str(exc)}]

    def get_agent(self, agent_type: str) -> dict[str, Any] | None:
        try:
            agent = AgentFactory.get_agent(agent_type)
            return {
                "agent_type": agent.agent_type,
                "display_name": agent.display_name,
                "description": agent.description,
                "tools": agent.tools,
                "system_prompt": agent.system_prompt,
            }
        except KeyError:
            return None
        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Citation
    # ═══════════════════════════════════════════════════════════════

    def store_citations(
        self,
        project_id: UUID,
        message_id: UUID,
        entries: list[Any],
    ) -> list[dict[str, Any]]:
        try:
            return CitationEngine(self.db).create_citations_bulk(
                project_id, message_id, entries,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    def get_citations_for_message(
        self, project_id: UUID, message_id: UUID,
    ) -> list[dict[str, Any]]:
        try:
            return CitationEngine(self.db).get_citations_for_message(
                project_id, message_id,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    def get_citations_for_conversation(
        self, project_id: UUID, conversation_id: UUID,
    ) -> list[dict[str, Any]]:
        try:
            return CitationEngine(self.db).get_citations_for_conversation(
                project_id, conversation_id,
            )
        except Exception as exc:
            return [{"error": str(exc)}]

    # ═══════════════════════════════════════════════════════════════
    # Provider access (raw, for advanced use cases)
    # ═══════════════════════════════════════════════════════════════

    def get_llm_provider(self, provider_name: str | None = None) -> Any:
        try:
            return get_provider(provider_name) if provider_name else get_provider()
        except Exception as exc:
            return {"error": str(exc)}

    def get_embedding_provider(self, provider_name: str = "simple") -> Any:
        try:
            return get_embedding_provider(provider_name)
        except Exception as exc:
            return {"error": str(exc)}

    def get_vector_store(self, store_name: str = "sqlite") -> Any:
        try:
            return get_vector_store(store_name)
        except Exception as exc:
            return {"error": str(exc)}

    # ═══════════════════════════════════════════════════════════════
    # Missing method stubs (delegated to sub-services)
    # ═══════════════════════════════════════════════════════════════

    def get_conversation_stats(self, project_id: UUID) -> dict:
        try:
            return ConversationService(self.db).get_conversation_stats(project_id)
        except Exception as exc:
            return {"error": str(exc), "total": 0, "active": 0, "archived": 0, "by_agent_type": {}, "total_messages": 0, "total_tokens": 0}

    def pin_conversation(self, project_id: UUID, conversation_id: UUID) -> dict | None:
        try:
            return ConversationService(self.db).pin_conversation(project_id, conversation_id)
        except Exception:
            return None

    def unpin_conversation(self, project_id: UUID, conversation_id: UUID) -> dict | None:
        try:
            return ConversationService(self.db).unpin_conversation(project_id, conversation_id)
        except Exception:
            return None

    def get_conversation_messages(self, project_id: UUID, conversation_id: UUID, limit: int = 100) -> list:
        try:
            return ConversationService(self.db).get_messages(project_id, conversation_id, limit=limit)
        except Exception as exc:
            return [{"error": str(exc)}]

    def export_conversation(self, project_id: UUID, conversation_id: UUID, format: str = "markdown") -> dict:
        return ConversationService(self.db).export_conversation(project_id, conversation_id, format)

    def increment_prompt_use_count(self, prompt_id: UUID) -> dict | None:
        try:
            return PromptLibrary(self.db).increment_use(self.project_id, prompt_id)
        except Exception:
            return None

    def list_prompt_categories(self) -> list[str]:
        try:
            return PromptLibrary(self.db).list_categories(self.project_id)
        except Exception:
            return []

    def list_prompt_folders(self) -> list:
        try:
            return PromptLibrary(self.db).list_folders(self.project_id)
        except Exception:
            return []

    def create_prompt_folder(self, **data) -> dict:
        try:
            return PromptLibrary(self.db).create_folder(self.project_id, data)
        except Exception as exc:
            return {"error": str(exc)}

    def delete_prompt_folder(self, folder_id: UUID) -> bool:
        try:
            return PromptLibrary(self.db).delete_folder(self.project_id, folder_id)
        except Exception:
            return False

    def update_agent(self, agent_type: str, **kwargs) -> dict | None:
        return None

    def delete_workflow(self, workflow_id: UUID) -> bool:
        return False

    def execute_workflow(self, workflow_id: UUID) -> dict:
        return {"status": "not_found"}

    def list_workflow_executions(self, workflow_id: UUID | None = None, status: str | None = None) -> list:
        return []

    def get_workflow_execution(self, execution_id: UUID) -> dict | None:
        return None

    def trigger_ingest(self) -> str:
        try:
            return IngestionService(self.db).ingest_all(self.project_id)
        except Exception as exc:
            return str(exc)

    def get_ingest_status(self) -> dict:
        return {"total_documents": 0, "total_chunks": 0, "by_source_type": {}}

    def list_memories(self, memory_type: str | None = None, query: str | None = None, limit: int = 50) -> list:
        try:
            if query:
                return MemorySystem(self.db).search(self.project_id, query, memory_type=memory_type, limit=limit)
            return MemorySystem(self.db).list(self.project_id, memory_type=memory_type, limit=limit)
        except Exception:
            return []

    def delete_memory(self, memory_type: str, key: str) -> bool:
        try:
            return MemorySystem(self.db).delete(self.project_id, memory_type, key)
        except Exception:
            return False

    def get_citations(self, message_id: UUID) -> list:
        return []

    def get_trading_context(self, options: dict | None = None) -> dict:
        try:
            return ContextBuilder(self.db).build_full_context(self.project_id, options)
        except Exception as exc:
            return {"error": str(exc)}

    def get_token_usage(self, provider: str | None = None, model: str | None = None, days: int = 30) -> dict:
        return {"total_tokens": 0, "total_cost_usd": 0.0, "by_provider": {}, "by_model": {}, "daily": []}

    def list_audit_logs(self, action: str | None = None, status: str | None = None, limit: int = 100) -> list:
        return []

    def search_documents(self, q: str, source_type: str | None = None, limit: int = 20) -> list:
        try:
            return MemorySystem(self.db).search(self.project_id, q, memory_type=source_type, limit=limit)
        except Exception:
            return []

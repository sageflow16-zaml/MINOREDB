"""
AI Research Copilot — Models for RAG pipeline, conversations, agents, memory, workflows.
"""
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class AIConversation(Base):
    """AI Chat Workspace — conversation threads."""
    __tablename__ = "ai_conversation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    title: Mapped[str] = mapped_column(String, nullable=False)
    agent_type: Mapped[str | None] = mapped_column(String, nullable=True)
    folder: Mapped[str | None] = mapped_column(String, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class AIMessage(Base):
    """Individual message in a conversation."""
    __tablename__ = "ai_message"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    conversation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_conversation.id", ondelete="CASCADE"), nullable=False)
    conversation: Mapped["AIConversation"] = relationship("AIConversation")
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    role: Mapped[str] = mapped_column(String, nullable=False)  # user, assistant, system, tool
    content: Mapped[str] = mapped_column(Text, nullable=False)
    agent_type: Mapped[str | None] = mapped_column(String, nullable=True)
    provider: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str | None] = mapped_column(String, nullable=True)

    # RAG metadata
    citations: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    contexts: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    chunks_retrieved: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Performance
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_streaming: Mapped[bool] = mapped_column(Boolean, default=False)
    is_error: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class AIPinnedChat(Base):
    """Pinned and bookmarked chats."""
    __tablename__ = "ai_pinned_chat"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_conversation.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)


class AISavedPrompt(Base):
    """Reusable prompt templates."""
    __tablename__ = "ai_saved_prompt"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    agent_type: Mapped[str | None] = mapped_column(String, nullable=True)
    folder_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_prompt_folder.id", ondelete="SET NULL"), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    use_count: Mapped[int] = mapped_column(Integer, default=0)
    variables: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)


class AIPromptFolder(Base):
    """Folders for organizing saved prompts."""
    __tablename__ = "ai_prompt_folder"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    parent_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class AIWorkflow(Base):
    """Reusable AI workflow definitions."""
    __tablename__ = "ai_workflow"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    workflow_type: Mapped[str] = mapped_column(String, nullable=False)  # daily_brief, weekly_review, trade_review, etc.
    steps: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    run_count: Mapped[int] = mapped_column(Integer, default=0)


class AIWorkflowExecution(Base):
    """Execution records for AI workflows."""
    __tablename__ = "ai_workflow_execution"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_workflow.id", ondelete="CASCADE"), nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False, default="running")  # running, completed, failed
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AIDocumentIngestion(Base):
    """Records of documents ingested into the RAG pipeline."""
    __tablename__ = "ai_document_ingestion"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    source_type: Mapped[str] = mapped_column(String, nullable=False)  # trade, journal, strategy, replay, research, obsidian, pdf, markdown, csv, word
    source_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending, processing, completed, failed
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class AIDocumentChunk(Base):
    """Individual chunks of ingested documents with embeddings."""
    __tablename__ = "ai_document_chunk"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    ingestion_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_document_ingestion.id", ondelete="CASCADE"), nullable=False)

    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Embedding (stored as JSONB list for portability; external vector DBs will use their own storage)
    embedding: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String, nullable=True)

    # Metadata for filtering
    document_title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_date: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    entity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # RAG ranking
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)


class AIAgentConfig(Base):
    """Configuration for specialized AI agents."""
    __tablename__ = "ai_agent_config"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    agent_type: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    config_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tools: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    icon: Mapped[str | None] = mapped_column(String, nullable=True)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class AIMemory(Base):
    """Memory System — long-term, session, and knowledge memory entries."""
    __tablename__ = "ai_memory"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    memory_type: Mapped[str] = mapped_column(String, nullable=False)  # conversation, preference, long_term, session, knowledge, prompt_history
    key: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    text_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    importance: Mapped[float] = mapped_column(Float, default=0.5)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    conversation_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)


class AICitation(Base):
    """Source citations for AI responses."""
    __tablename__ = "ai_citation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_message.id", ondelete="CASCADE"), nullable=False)

    source_type: Mapped[str] = mapped_column(String, nullable=False)  # trade, journal, strategy, etc.
    source_id: Mapped[str] = mapped_column(String, nullable=False)
    source_title: Mapped[str | None] = mapped_column(String, nullable=True)
    snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    chunk_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)


class AITokenUsage(Base):
    """Token usage and cost tracking."""
    __tablename__ = "ai_token_usage"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)

    provider: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    operation: Mapped[str | None] = mapped_column(String, nullable=True)  # chat, embedding, evaluation


class AIAuditLog(Base):
    """Security audit logging for AI operations."""
    __tablename__ = "ai_audit_log"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)

    action: Mapped[str] = mapped_column(String, nullable=False)  # chat, agent_run, workflow_run, ingest, export
    status: Mapped[str] = mapped_column(String, nullable=False)  # success, failure, denied
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)

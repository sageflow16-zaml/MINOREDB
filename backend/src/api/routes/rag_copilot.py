"""
AI Research Copilot — RAG-powered chat, conversations, agents, workflows, memory.
"""
from uuid import UUID
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services.rag_copilot import RAGCopilot


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    conversation_id: UUID | None = None
    agent_type: str | None = None
    options: dict[str, Any] | None = None

class CitationItem(BaseModel):
    source_type: str
    source_id: str
    source_title: str | None = None
    snippet: str | None = None
    relevance_score: float | None = None

class ChatResponse(BaseModel):
    message: str
    citations: list[CitationItem] = []
    context_used: list[dict[str, Any]] = []
    token_usage: dict[str, Any] = {}
    latency_ms: int = 0

class ConversationCreate(BaseModel):
    title: str
    agent_type: str | None = None
    folder: str | None = None
    tags: list[str] | None = None

class ConversationUpdate(BaseModel):
    title: str | None = None
    folder: str | None = None
    tags: list[str] | None = None

class ConversationRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    agent_type: str | None = None
    folder: str | None = None
    is_pinned: bool = False
    is_archived: bool = False
    tags: list[str] | None = None
    message_count: int = 0
    total_tokens: int | None = None
    summary: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageRead(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    agent_type: str | None = None
    provider: str | None = None
    model: str | None = None
    citations: list[dict[str, Any]] | None = None
    contexts: list[dict[str, Any]] | None = None
    chunks_retrieved: int | None = None
    latency_ms: int | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    cost_usd: float | None = None
    is_error: bool = False
    error_message: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class PromptCreate(BaseModel):
    title: str
    content: str
    category: str | None = None
    agent_type: str | None = None
    folder_id: UUID | None = None
    tags: list[str] | None = None
    description: str | None = None
    variables: list[str] | None = None

class PromptUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    agent_type: str | None = None
    folder_id: UUID | None = None
    tags: list[str] | None = None
    description: str | None = None
    variables: list[str] | None = None
    is_favorite: bool | None = None

class PromptRead(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    content: str
    category: str | None = None
    agent_type: str | None = None
    folder_id: UUID | None = None
    tags: list[str] | None = None
    is_favorite: bool = False
    use_count: int = 0
    variables: list[str] | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PromptFolderCreate(BaseModel):
    name: str
    parent_id: UUID | None = None
    sort_order: int = 0

class PromptFolderRead(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    parent_id: UUID | None = None
    sort_order: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class AgentConfigRead(BaseModel):
    agent_type: str
    display_name: str
    description: str | None = None
    is_enabled: bool = True
    system_prompt: str | None = None
    provider: str | None = None
    model: str | None = None
    tools: list[str] | None = None
    icon: str | None = None
    color: str | None = None
    sort_order: int = 0

    class Config:
        from_attributes = True

class AgentConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    system_prompt: str | None = None
    provider: str | None = None
    model: str | None = None
    tools: list[str] | None = None

class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    workflow_type: str
    steps: list[dict[str, Any]]
    config: dict[str, Any] | None = None

class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    workflow_type: str | None = None
    steps: list[dict[str, Any]] | None = None
    config: dict[str, Any] | None = None
    is_active: bool | None = None

class WorkflowRead(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: str | None = None
    workflow_type: str
    steps: list[dict[str, Any]]
    config: dict[str, Any] | None = None
    is_active: bool = True
    last_run_at: datetime | None = None
    run_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowExecutionRead(BaseModel):
    id: UUID
    project_id: UUID
    workflow_id: UUID
    status: str
    result: dict[str, Any] | None = None
    error: str | None = None
    duration_ms: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class ToolExecuteRequest(BaseModel):
    params: dict[str, Any] = {}

class ToolExecuteResponse(BaseModel):
    result: Any = None
    error: str | None = None
    duration_ms: int = 0

class MemoryCreate(BaseModel):
    memory_type: str
    key: str
    value: dict[str, Any] | None = None
    text_value: str | None = None
    importance: float = 0.5
    tags: list[str] | None = None

class MemoryRead(BaseModel):
    id: UUID
    project_id: UUID
    memory_type: str
    key: str
    value: dict[str, Any] | None = None
    text_value: str | None = None
    importance: float = 0.5
    tags: list[str] | None = None
    conversation_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IngestStatus(BaseModel):
    total_documents: int
    total_chunks: int
    by_source_type: dict[str, int] = {}

class TokenUsageStats(BaseModel):
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    by_provider: dict[str, dict[str, Any]] = {}
    by_model: dict[str, dict[str, Any]] = {}
    daily: list[dict[str, Any]] = []

class AuditLogRead(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID | None = None
    action: str
    status: str
    details: dict[str, Any] | None = None
    ip_address: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExportResponse(BaseModel):
    content: str
    format: str = "markdown"
    filename: str

class ConversationStats(BaseModel):
    total: int = 0
    active: int = 0
    archived: int = 0
    by_agent_type: dict[str, int] = {}
    total_messages: int = 0
    total_tokens: int = 0

router = APIRouter()


# ======================== CHAT ========================

@router.post("/chat", response_model=ChatResponse)
def chat(
    project_id: UUID,
    body: ChatRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.chat, project_id=project_id, message=body.message, conversation_id=body.conversation_id, agent_type=body.agent_type, options=body.options)


# ======================== CONVERSATIONS ========================

@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    project_id: UUID,
    agent_type: str | None = Query(None),
    folder: str | None = Query(None),
    is_pinned: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_conversations, project_id=project_id, agent_type=agent_type, folder=folder, is_pinned=is_pinned, limit=limit)


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    project_id: UUID,
    body: ConversationCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.create_conversation, project_id=project_id, title=body.title, agent_type=body.agent_type, folder=body.folder, tags=body.tags)


@router.get("/conversations/stats", response_model=ConversationStats)
def conversation_stats(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_conversation_stats, project_id=project_id)


@router.get("/conversations/search", response_model=list[ConversationRead])
def search_conversations(
    project_id: UUID,
    q: str = Query(..., min_length=1),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.search_conversations, project_id=project_id, q=q)


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.get_conversation, project_id=project_id, conversation_id=conversation_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return result


@router.put("/conversations/{conversation_id}", response_model=ConversationRead)
def update_conversation(
    project_id: UUID,
    conversation_id: UUID,
    body: ConversationUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.update_conversation, project_id=project_id, conversation_id=conversation_id, title=body.title, folder=body.folder, tags=body.tags)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return result


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    deleted = _safe(copilot.delete_conversation, project_id=project_id, conversation_id=conversation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")


@router.put("/conversations/{conversation_id}/pin", response_model=ConversationRead)
def pin_conversation(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.pin_conversation, project_id=project_id, conversation_id=conversation_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return result


@router.put("/conversations/{conversation_id}/unpin", response_model=ConversationRead)
def unpin_conversation(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.unpin_conversation, project_id=project_id, conversation_id=conversation_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return result


@router.put("/conversations/{conversation_id}/archive", response_model=ConversationRead)
def archive_conversation(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.archive_conversation, project_id=project_id, conversation_id=conversation_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return result


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageRead])
def get_conversation_messages(
    project_id: UUID,
    conversation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_conversation_messages, project_id=project_id, conversation_id=conversation_id)


@router.get("/conversations/{conversation_id}/export", response_model=ExportResponse)
def export_conversation(
    project_id: UUID,
    conversation_id: UUID,
    format: str = Query("markdown", pattern="^(markdown|json|text)$"),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.export_conversation, project_id=project_id, conversation_id=conversation_id, format=format)


# ======================== PROMPTS ========================

@router.get("/prompts", response_model=list[PromptRead])
def list_prompts(
    project_id: UUID,
    category: str | None = Query(None),
    agent_type: str | None = Query(None),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    try:
        return _safe(copilot.list_prompts, project_id=project_id, category=category, agent_type=agent_type)
    except Exception:
        return []


@router.post("/prompts", response_model=PromptRead, status_code=status.HTTP_201_CREATED)
def create_prompt(
    project_id: UUID,
    body: PromptCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.create_prompt, project_id=project_id, data=body.model_dump())


@router.put("/prompts/{prompt_id}", response_model=PromptRead)
def update_prompt(
    project_id: UUID,
    prompt_id: UUID,
    body: PromptUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.update_prompt, prompt_id=prompt_id, data=body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    return result


@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    project_id: UUID,
    prompt_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    deleted = _safe(copilot.delete_prompt, prompt_id=prompt_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")


@router.post("/prompts/{prompt_id}/use", response_model=PromptRead)
def use_prompt(
    project_id: UUID,
    prompt_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.increment_prompt_use_count, prompt_id=prompt_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
    return result


@router.get("/prompts/categories", response_model=list[str])
def list_prompt_categories(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_prompt_categories)


@router.get("/prompts/folders", response_model=list[PromptFolderRead])
def list_prompt_folders(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_prompt_folders)


@router.post("/prompts/folders", response_model=PromptFolderRead, status_code=status.HTTP_201_CREATED)
def create_prompt_folder(
    project_id: UUID,
    body: PromptFolderCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.create_prompt_folder, **body.model_dump())


@router.delete("/prompts/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt_folder(
    project_id: UUID,
    folder_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    deleted = _safe(copilot.delete_prompt_folder, folder_id=folder_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")


# ======================== AGENTS ========================

@router.get("/agents", response_model=list[AgentConfigRead])
def list_agents(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_agents)


@router.get("/agents/{agent_type}", response_model=AgentConfigRead)
def get_agent(
    project_id: UUID,
    agent_type: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.get_agent, agent_type=agent_type)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return result


@router.put("/agents/{agent_type}", response_model=AgentConfigRead)
def update_agent(
    project_id: UUID,
    agent_type: str,
    body: AgentConfigUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.update_agent, agent_type=agent_type, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return result


# ======================== WORKFLOWS ========================

@router.get("/workflows", response_model=list[WorkflowRead])
def list_workflows(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_workflows, project_id=project_id)


@router.post("/workflows", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
def create_workflow(
    project_id: UUID,
    body: WorkflowCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.create_workflow, project_id=project_id, data=body.model_dump())


@router.put("/workflows/{workflow_id}", response_model=WorkflowRead)
def update_workflow(
    project_id: UUID,
    workflow_id: UUID,
    body: WorkflowUpdate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.update_workflow, workflow_id=workflow_id, data=body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return result


@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    project_id: UUID,
    workflow_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    deleted = _safe(copilot.delete_workflow, workflow_id=workflow_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecutionRead)
def execute_workflow(
    project_id: UUID,
    workflow_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.execute_workflow, workflow_id=workflow_id)


@router.get("/workflows/executions", response_model=list[WorkflowExecutionRead])
def list_workflow_executions(
    project_id: UUID,
    workflow_id: UUID | None = Query(None),
    status: str | None = Query(None),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_workflow_executions, workflow_id=workflow_id, status=status)


@router.get("/workflows/executions/{execution_id}", response_model=WorkflowExecutionRead)
def get_workflow_execution(
    project_id: UUID,
    execution_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    result = _safe(copilot.get_workflow_execution, execution_id=execution_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")
    return result


# ======================== TOOLS ========================

@router.get("/tools", response_model=list[dict[str, Any]])
def list_tools(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_tools)


@router.post("/tools/{tool_name}/execute", response_model=ToolExecuteResponse)
def execute_tool(
    project_id: UUID,
    tool_name: str,
    body: ToolExecuteRequest,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.execute_tool, tool_name=tool_name, params=body.params)


# ======================== RAG ========================

@router.get("/search", response_model=list[dict[str, Any]])
def search_documents(
    project_id: UUID,
    q: str = Query(..., min_length=1),
    source_type: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.search_documents, q=q, source_type=source_type, limit=limit)


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
def trigger_ingest(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return {"status": "accepted", "message": _safe(copilot.trigger_ingest)}


@router.get("/ingest/status", response_model=IngestStatus)
def get_ingest_status(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_ingest_status)


# ======================== MEMORY ========================

@router.get("/memory", response_model=list[MemoryRead])
def list_memories(
    project_id: UUID,
    memory_type: str | None = Query(None),
    query: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_memories, memory_type=memory_type, query=query, limit=limit)


@router.post("/memory", response_model=MemoryRead, status_code=status.HTTP_201_CREATED)
def store_memory(
    project_id: UUID,
    body: MemoryCreate,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.store_memory, project_id=project_id, **body.model_dump())


@router.delete("/memory", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    project_id: UUID,
    memory_type: str = Query(...),
    key: str = Query(...),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    _safe(copilot.delete_memory, memory_type=memory_type, key=key)


@router.get("/memory/relevant", response_model=list[MemoryRead])
def get_relevant_memories(
    project_id: UUID,
    context: str = Query(..., min_length=1),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_relevant_memories, project_id=project_id, context=context)


# ======================== CITATIONS ========================

@router.get("/citations/{message_id}", response_model=list[CitationItem])
def get_citations(
    project_id: UUID,
    message_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_citations, message_id=message_id)


# ======================== CONTEXT ========================

@router.get("/context", response_model=dict[str, Any])
def get_trading_context(
    project_id: UUID,
    options: str | None = Query(None, description="JSON-encoded options"),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    import json
    parsed = json.loads(options) if options else {}
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_trading_context, options=parsed)


# ======================== TOKEN USAGE ========================

@router.get("/usage", response_model=TokenUsageStats)
def get_token_usage(
    project_id: UUID,
    provider: str | None = Query(None),
    model: str | None = Query(None),
    days: int = Query(30, ge=1, le=365),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.get_token_usage, provider=provider, model=model, days=days)


# ======================== AUDIT ========================

@router.get("/audit", response_model=list[AuditLogRead])
def list_audit_logs(
    project_id: UUID,
    action: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    copilot = RAGCopilot(db, project_id)
    return _safe(copilot.list_audit_logs, action=action, status=status, limit=limit)

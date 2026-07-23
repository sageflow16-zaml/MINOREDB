# Phase 3.4 — AI Research Copilot & RAG Platform

**Commit:** `3.4.0-rag-copilot`  
**Files created:** 15 (22 backend files + 3 frontend files + 1 report)  
**Files modified:** 4 (router.py, replay.py, types.ts, AppRoutes.tsx, Sidebar.tsx)  
**Build:** 3375 modules, ~72s, tsc clean

## Architecture

### Backend (15 models, 22 files, 45 API endpoints)

| Layer | File | Description |
|-------|------|-------------|
| Models | `backend/src/models/rag_copilot.py` | 15 SQLAlchemy models: AIConversation, AIMessage, AIPinnedChat, AISavedPrompt, AIPromptFolder, AIWorkflow, AIWorkflowExecution, AIDocumentIngestion, AIDocumentChunk, AIAgentConfig, AIMemory, AICitation, AITokenUsage, AIAuditLog |
| LLM Abstraction | `backend/src/services/ai/llm_provider.py` | BaseLLMProvider ABC + 9 providers (OpenAI, Anthropic, Gemini, OpenRouter, Ollama, LM Studio, Azure OpenAI, Custom), 3-attempt retry with exponential backoff, streaming stub |
| Embedding | `backend/src/services/ai/embedding_provider.py` | BaseEmbeddingProvider ABC + 4+ providers, batch embed (chunk size 20), auto-fallback to SimpleEmbeddingProvider |
| Vector Store | `backend/src/services/ai/vector_store.py` | BaseVectorStore ABC + SQLiteVectorStore (default, in-memory cosine), ChromaVectorStore, FAISSVectorStore, 5 proxy stubs (Qdrant, Pinecone, Weaviate, Milvus, pgvector) |
| RAG Pipeline | `backend/src/services/ai/rag_pipeline.py` | RAGPipeline with chunk_text (1K char / 200 overlap), ingest_document, search (hybrid rank: 0.6 relevance + 0.25 recency + 0.15 importance), generate (context compression, prompt assembly, citations, rule-based fallback) |
| Ingestion | `backend/src/services/ai/ingestion.py` | IngestionService with 10 source methods (trades, journal, strategies, replay, research, planning, risk, market, obsidian), content_hash dedup |
| Agent Framework | `backend/src/services/ai/agent_framework.py` | BaseAgent ABC + 10 specialized agents (TradingCoach, PsychologyCoach, RiskCoach, ResearchAssistant, StrategyReviewer, TradeReviewer, PerformanceAnalyst, MarketAnalyst, MacroAnalyst, KnowledgeAssistant) |
| Tool Framework | `backend/src/services/ai/tool_framework.py` | ToolRegistry singleton + 8 tools (SearchTrades, SearchJournal, SearchResearch, SearchObsidian, RunAnalytics, GenerateReport, GetContext, SearchKnowledge) |
| Memory System | `backend/src/services/ai/memory_system.py` | MemorySystem with 6 memory types (conversation, preference, long_term, session, knowledge, prompt_history), TTL expiry, relevance scoring |
| Prompt Library | `backend/src/services/ai/prompt_library.py` | PromptLibrary (CRUD + 10 predefined trading prompts + render_prompt) + WorkflowEngine (8 templates: daily_brief, weekly_review, monthly_review, trade_review, market_preparation, risk_assessment, strategy_audit, psychology_review) |
| Citation Engine | `backend/src/services/ai/citation_engine.py` | CitationEngine with create, get_by_message, format_citations (markdown/json/text), source URL generation (10+ source→frontend route mappings) |
| Conversation | `backend/src/services/ai/conversation.py` | ConversationService: full CRUD for conversations and messages, pin/unpin/archive, search, export (markdown), stats |
| Context Builder | `backend/src/services/ai/context_builder.py` | ContextBuilder with 10 build methods (full, trading, performance, strategy, risk, planning, journal, market, knowledge, psychology) + format_context_for_prompt (max_tokens budget) |
| Orchestrator | `backend/src/services/rag_copilot.py` | RAGCopilot orchestrator: chat → ContextBuilder → AgentFactory → RAGPipeline.generate → MemorySystem → CitationEngine → ConversationService |
| Routes | `backend/src/api/routes/rag_copilot.py` | 45 endpoints across 9 sections |
| Router | `backend/src/api/router.py` | Registered at `/projects/{project_id}/copilot` |

### Frontend (1 page, 20+ hooks, 1 service client)

| File | Description |
|------|-------------|
| `frontend/src/api/types.ts` | 20+ new TypeScript interfaces (AIConversation, AIMessage, AIPinnedChat, AISavedPrompt, AIWorkflow, AIDocumentIngestion, AIDocumentChunk, AIAgentConfig, AIMemoryEntry, AICitation, AITokenUsage, AIAuditLogEntry, ChatRequest, ChatResponse, etc.) |
| `frontend/src/api/copilot.ts` | API client with 40+ methods covering all 9 endpoint groups |
| `frontend/src/hooks/useCopilot.ts` | 20+ React Query hooks (queries + mutations) for conversations, prompts, agents, workflows, RAG, memory, citations, usage, audit |
| `frontend/src/pages/CopilotWorkspace.tsx` | Premium chat workspace: left sidebar (conversation list), center (chat messages with Bot/User avatars, agent selector, prompt library, preset questions, citation display, token/latency footer), right panel (agent details) |
| `frontend/src/routes/AppRoutes.tsx` | `/projects/:projectId/copilot` route added |
| `frontend/src/components/Sidebar.tsx` | "Copilot" item added to AI Coach section with Sparkles icon |

## Bug Fixes During Implementation

| Bug | File | Fix |
|-----|------|-----|
| `metadata` collides with SQLAlchemy reserved attribute | `backend/src/models/replay.py:157` | Renamed to `event_metadata` |
| `_ProxyStore` defined after `_STORE_REGISTRY` | `backend/src/services/ai/vector_store.py` | Moved class/factory before registry dict |

## API Endpoints (45)

### Chat
- `POST /chat` — Send message, get AI response (full pipeline: context→agent→RAG→memory→citation→conversation)

### Conversations
- `GET /conversations` — List conversations (filter: agent_type)
- `POST /conversations` — Create conversation
- `GET /conversations/{conv_id}` — Get conversation
- `PUT /conversations/{conv_id}` — Update title/agent_type
- `DELETE /conversations/{conv_id}` — Delete
- `PUT /conversations/{conv_id}/pin` — Toggle pin
- `PUT /conversations/{conv_id}/archive` — Toggle archive
- `GET /conversations/{conv_id}/messages` — List messages
- `POST /conversations/{conv_id}/messages` — Create message (system)
- `PUT /messages/{msg_id}` — Update message
- `DELETE /messages/{msg_id}` — Delete message
- `GET /conversations/{conv_id}/export` — Export as markdown
- `GET /conversations/stats` — Aggregated stats

### Prompts
- `GET /prompts` — List prompts (filter: folder_id, tags)
- `POST /prompts` — Create prompt
- `PUT /prompts/{prompt_id}` — Update prompt
- `DELETE /prompts/{prompt_id}` — Delete
- `GET /prompts/folders` — List folders
- `POST /prompts/folders` — Create folder

### Agents
- `GET /agents` — List agents
- `GET /agents/{agent_id}` — Get agent config
- `PUT /agents/{agent_id}` — Update config
- `POST /agents/{agent_id}/test` — Test agent response

### Workflows
- `GET /workflows` — List workflow templates
- `POST /workflows` — Create workflow execution
- `GET /workflows/{execution_id}` — Get execution status
- `POST /workflows/{template_name}/execute` — Execute template

### RAG / Search / Ingest
- `GET /search` — Search knowledge base (query, top_k, threshold, source_type)
- `POST /ingest` — Ingest document (source_type, source_id, content)
- `GET /documents` — List ingested documents (filter: source_type)
- `GET /documents/{doc_id}` — Get document with chunks

### Memory
- `GET /memory` — Get relevant memories (context, memory_type, top_k)
- `POST /memory` — Store memory
- `DELETE /memory/{memory_id}` — Delete memory
- `POST /memory/clear-session` — Clear session memory

### Citations
- `GET /citations/{message_id}` — Get citations for message

### Usage
- `GET /usage` — Get token usage stats
- `GET /usage/daily` — Get daily usage breakdown

### Audit
- `GET /audit` — Get audit log (filter: action, agent_type, limit)

## Design Decisions

1. **Provider abstraction**: 9 LLM providers + 4+ embedding providers via ABC with registry pattern; new providers registered via `@LLMProviderRegistry.register('name')`
2. **Default vector store**: SQLite with in-memory cosine similarity (no external deps); Chroma/FAISS for production; 5 cloud store stubs ready for credentials
3. **Hybrid search ranking**: 0.6 relevance + 0.25 recency + 0.15 importance scoring for RAG retrieval
4. **Context builder**: Aggregate up to `max_tokens` worth of context from all data sources before LLM call
5. **10 specialized agents**: Each with a deep trading-domain system prompt covering psychology, risk, macro, performance, etc.
6. **6 memory types**: Separate TTLs (session: 1h, conversation: 24h, preference: 7d, long_term: 30d, knowledge: 90d, prompt_history: 7d)
7. **8 workflow templates**: Predefined multi-step analysis briefs (daily through monthly, plus specialty reviews)
8. **Citation engine**: Tracks source documents with frontend deep links for every AI response
9. **Ingestion dedup**: `content_hash` on (source_type, source_id) prevents duplicate ingestion
10. **Token usage tracking**: Every chat/agent call records model, tokens, latency, cost to `ai_token_usage` table

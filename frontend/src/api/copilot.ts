import api from '../services/api';
import type {
  AIConversation, AIMessage, AIChatRequest, AIChatResponse,
  AIPrompt, AIPromptFolder, AIAgentConfig, AIWorkflow,
  AIWorkflowExecution, AITool, AIMemoryEntry, AIDocumentIngestion,
  AISearchResult, AITokenUsage, AIAuditLog,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/copilot`;

export const copilotService = {
  // Chat
  chat: (projectId: string, data: AIChatRequest) =>
    api.post<AIChatResponse>(`${base(projectId)}/chat`, data).then((r) => r.data),

  // Conversations
  conversations: (projectId: string, params?: { agent_type?: string; folder?: string; is_pinned?: boolean; limit?: number }) =>
    api.get<AIConversation[]>(`${base(projectId)}/conversations`, { params }).then((r) => r.data),

  createConversation: (projectId: string, data: { title: string; agent_type?: string; folder?: string; tags?: string[] }) =>
    api.post<AIConversation>(`${base(projectId)}/conversations`, data).then((r) => r.data),

  getConversation: (projectId: string, conversationId: string) =>
    api.get<AIConversation>(`${base(projectId)}/conversations/${conversationId}`).then((r) => r.data),

  updateConversation: (projectId: string, conversationId: string, data: { title?: string; folder?: string; tags?: string[] }) =>
    api.put<AIConversation>(`${base(projectId)}/conversations/${conversationId}`, data).then((r) => r.data),

  deleteConversation: (projectId: string, conversationId: string) =>
    api.delete(`${base(projectId)}/conversations/${conversationId}`).then((r) => r.data),

  pinConversation: (projectId: string, conversationId: string) =>
    api.put<AIConversation>(`${base(projectId)}/conversations/${conversationId}/pin`).then((r) => r.data),

  unpinConversation: (projectId: string, conversationId: string) =>
    api.put<AIConversation>(`${base(projectId)}/conversations/${conversationId}/unpin`).then((r) => r.data),

  archiveConversation: (projectId: string, conversationId: string) =>
    api.put(`${base(projectId)}/conversations/${conversationId}/archive`).then((r) => r.data),

  messages: (projectId: string, conversationId: string) =>
    api.get<AIMessage[]>(`${base(projectId)}/conversations/${conversationId}/messages`).then((r) => r.data),

  exportConversation: (projectId: string, conversationId: string, format?: string) =>
    api.get<string>(`${base(projectId)}/conversations/${conversationId}/export`, { params: { format } }).then((r) => r.data),

  conversationStats: (projectId: string) =>
    api.get(`${base(projectId)}/conversations/stats`).then((r) => r.data),

  searchConversations: (projectId: string, q: string) =>
    api.get<AIConversation[]>(`${base(projectId)}/conversations/search`, { params: { q } }).then((r) => r.data),

  // Prompts
  prompts: (projectId: string, params?: { category?: string; agent_type?: string }) =>
    api.get<AIPrompt[]>(`${base(projectId)}/prompts`, { params }).then((r) => r.data),

  createPrompt: (projectId: string, data: Partial<AIPrompt>) =>
    api.post<AIPrompt>(`${base(projectId)}/prompts`, data).then((r) => r.data),

  updatePrompt: (projectId: string, promptId: string, data: Partial<AIPrompt>) =>
    api.put<AIPrompt>(`${base(projectId)}/prompts/${promptId}`, data).then((r) => r.data),

  deletePrompt: (projectId: string, promptId: string) =>
    api.delete(`${base(projectId)}/prompts/${promptId}`).then((r) => r.data),

  usePrompt: (projectId: string, promptId: string) =>
    api.post(`${base(projectId)}/prompts/${promptId}/use`).then((r) => r.data),

  promptCategories: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/prompts/categories`).then((r) => r.data),

  promptFolders: (projectId: string) =>
    api.get<AIPromptFolder[]>(`${base(projectId)}/prompts/folders`).then((r) => r.data),

  createPromptFolder: (projectId: string, data: { name: string; parent_id?: string }) =>
    api.post<AIPromptFolder>(`${base(projectId)}/prompts/folders`, data).then((r) => r.data),

  deletePromptFolder: (projectId: string, folderId: string) =>
    api.delete(`${base(projectId)}/prompts/folders/${folderId}`).then((r) => r.data),

  // Agents
  agents: (projectId: string) =>
    api.get<AIAgentConfig[]>(`${base(projectId)}/agents`).then((r) => r.data),

  getAgent: (projectId: string, agentType: string) =>
    api.get<AIAgentConfig>(`${base(projectId)}/agents/${agentType}`).then((r) => r.data),

  updateAgent: (projectId: string, agentType: string, data: Partial<AIAgentConfig>) =>
    api.put<AIAgentConfig>(`${base(projectId)}/agents/${agentType}`, data).then((r) => r.data),

  // Workflows
  workflows: (projectId: string) =>
    api.get<AIWorkflow[]>(`${base(projectId)}/workflows`).then((r) => r.data),

  createWorkflow: (projectId: string, data: Partial<AIWorkflow>) =>
    api.post<AIWorkflow>(`${base(projectId)}/workflows`, data).then((r) => r.data),

  updateWorkflow: (projectId: string, workflowId: string, data: Partial<AIWorkflow>) =>
    api.put<AIWorkflow>(`${base(projectId)}/workflows/${workflowId}`, data).then((r) => r.data),

  deleteWorkflow: (projectId: string, workflowId: string) =>
    api.delete(`${base(projectId)}/workflows/${workflowId}`).then((r) => r.data),

  executeWorkflow: (projectId: string, workflowId: string) =>
    api.post<AIWorkflowExecution>(`${base(projectId)}/workflows/${workflowId}/execute`).then((r) => r.data),

  workflowExecutions: (projectId: string, params?: { workflow_id?: string; status?: string }) =>
    api.get<AIWorkflowExecution[]>(`${base(projectId)}/workflows/executions`, { params }).then((r) => r.data),

  getExecution: (projectId: string, executionId: string) =>
    api.get<AIWorkflowExecution>(`${base(projectId)}/workflows/executions/${executionId}`).then((r) => r.data),

  // Tools
  tools: (projectId: string) =>
    api.get<AITool[]>(`${base(projectId)}/tools`).then((r) => r.data),

  executeTool: (projectId: string, toolName: string, params: Record<string, unknown>) =>
    api.post(`${base(projectId)}/tools/${toolName}/execute`, { params }).then((r) => r.data),

  // RAG
  searchRag: (projectId: string, q: string, sourceType?: string, limit?: number) =>
    api.get<AISearchResult[]>(`${base(projectId)}/search`, { params: { q, source_type: sourceType, limit } }).then((r) => r.data),

  ingestAll: (projectId: string) =>
    api.post<Record<string, number>>(`${base(projectId)}/ingest`).then((r) => r.data),

  ingestStatus: (projectId: string) =>
    api.get<AIDocumentIngestion[]>(`${base(projectId)}/ingest/status`).then((r) => r.data),

  // Memory
  memories: (projectId: string, params?: { memory_type?: string; query?: string; limit?: number }) =>
    api.get<AIMemoryEntry[]>(`${base(projectId)}/memory`, { params }).then((r) => r.data),

  storeMemory: (projectId: string, data: { memory_type: string; key: string; value?: Record<string, unknown>; text_value?: string; importance?: number; tags?: string[] }) =>
    api.post<AIMemoryEntry>(`${base(projectId)}/memory`, data).then((r) => r.data),

  deleteMemory: (projectId: string, memoryType: string, key: string) =>
    api.delete(`${base(projectId)}/memory`, { params: { memory_type: memoryType, key } }).then((r) => r.data),

  relevantMemories: (projectId: string, context: string) =>
    api.get<AIMemoryEntry[]>(`${base(projectId)}/memory/relevant`, { params: { context } }).then((r) => r.data),

  // Citations
  citations: (projectId: string, messageId: string) =>
    api.get(`${base(projectId)}/citations/${messageId}`).then((r) => r.data),

  // Context
  context: (projectId: string, options?: Record<string, unknown>) =>
    api.get(`${base(projectId)}/context`, { params: { options: JSON.stringify(options) } }).then((r) => r.data),

  // Token usage
  usage: (projectId: string, params?: { provider?: string; model?: string; days?: number }) =>
    api.get<AITokenUsage[]>(`${base(projectId)}/usage`, { params }).then((r) => r.data),

  // Audit
  audit: (projectId: string, params?: { action?: string; status?: string; limit?: number }) =>
    api.get<AIAuditLog[]>(`${base(projectId)}/audit`, { params }).then((r) => r.data),
};

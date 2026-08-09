import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  AIConversation, AIMessage, AIChatRequest, AIChatResponse,
  AIPrompt, AIPromptFolder, AIAgentConfig, AIWorkflow,
  AIWorkflowExecution, AITool, AIMemoryEntry, AIDocumentIngestion,
  AISearchResult, AITokenUsage, AIAuditLog,
} from './types';

export const copilotService = {
  chat: async (projectId: string, data: AIChatRequest): Promise<AIChatResponse> =>
    callEdgeFunction('ai', { operation: 'chat', project_id: projectId, data: data as any }),

  conversations: async (projectId: string, params?: { agent_type?: string; folder?: string; is_pinned?: boolean; limit?: number }): Promise<AIConversation[]> => {
    let query = supabase.from('ai_conversation').select('*').eq('project_id', projectId);
    if (params?.agent_type) query = query.eq('agent_type', params.agent_type);
    if (params?.folder) query = query.eq('folder', params.folder);
    if (params?.is_pinned !== undefined) query = query.eq('is_pinned', params.is_pinned);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  createConversation: async (projectId: string, data: { title: string; agent_type?: string; folder?: string; tags?: string[] }): Promise<AIConversation> => {
    const { data: row, error } = await supabase.from('ai_conversation').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row;
  },

  getConversation: async (projectId: string, conversationId: string): Promise<AIConversation> => {
    const { data, error } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).eq('project_id', projectId).single();
    if (error) throw error;
    return data;
  },

  updateConversation: async (projectId: string, conversationId: string, data: { title?: string; folder?: string; tags?: string[] }): Promise<AIConversation> => {
    const { data: row, error } = await supabase.from('ai_conversation').update(data).eq('id', conversationId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row;
  },

  deleteConversation: async (projectId: string, conversationId: string): Promise<void> => {
    const { error } = await supabase.from('ai_conversation').delete().eq('id', conversationId).eq('project_id', projectId);
    if (error) throw error;
  },

  pinConversation: async (projectId: string, conversationId: string): Promise<AIConversation> => {
    const { data, error } = await supabase.from('ai_conversation').update({ is_pinned: true }).eq('id', conversationId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data;
  },

  unpinConversation: async (projectId: string, conversationId: string): Promise<AIConversation> => {
    const { data, error } = await supabase.from('ai_conversation').update({ is_pinned: false }).eq('id', conversationId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data;
  },

  archiveConversation: async (projectId: string, conversationId: string): Promise<void> => {
    const { error } = await supabase.from('ai_conversation').update({ is_archived: true }).eq('id', conversationId).eq('project_id', projectId);
    if (error) throw error;
  },

  messages: async (_projectId: string, conversationId: string): Promise<AIMessage[]> => {
    const { data, error } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  exportConversation: async (projectId: string, conversationId: string, _format?: string): Promise<string> => {
    const { data: conversation, error: convErr } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).eq('project_id', projectId).single();
    if (convErr) throw convErr;
    const { data: msgs, error: msgErr } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (msgErr) throw msgErr;
    return JSON.stringify({ conversation, messages: msgs ?? [] });
  },

  conversationStats: async (projectId: string): Promise<Record<string, unknown>> => {
    const { data, error } = await supabase.from('ai_conversation').select('*').eq('project_id', projectId);
    if (error) throw error;
    const total = data?.length ?? 0;
    const pinned = data?.filter((c) => c.is_pinned).length ?? 0;
    const archived = data?.filter((c) => c.is_archived).length ?? 0;
    return { total, pinned, archived };
  },

  searchConversations: async (projectId: string, q: string): Promise<AIConversation[]> => {
    const { data, error } = await supabase.from('ai_conversation').select('*').eq('project_id', projectId).ilike('title', `%${q}%`).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  prompts: async (projectId: string, params?: { category?: string; agent_type?: string }): Promise<AIPrompt[]> => {
    let query = supabase.from('ai_saved_prompt').select('*').eq('project_id', projectId);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.agent_type) query = query.eq('agent_type', params.agent_type);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  createPrompt: async (projectId: string, data: Partial<AIPrompt>): Promise<AIPrompt> => {
    const { data: row, error } = await supabase.from('ai_saved_prompt').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row;
  },

  updatePrompt: async (projectId: string, promptId: string, data: Partial<AIPrompt>): Promise<AIPrompt> => {
    const { data: row, error } = await supabase.from('ai_saved_prompt').update(data).eq('id', promptId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row;
  },

  deletePrompt: async (projectId: string, promptId: string): Promise<void> => {
    const { error } = await supabase.from('ai_saved_prompt').delete().eq('id', promptId).eq('project_id', projectId);
    if (error) throw error;
  },

  usePrompt: async (projectId: string, promptId: string): Promise<void> => {
    const { data: prompt } = await supabase.from('ai_saved_prompt').select('use_count').eq('id', promptId).eq('project_id', projectId).single();
    const { error } = await supabase.from('ai_saved_prompt').update({ use_count: (prompt?.use_count ?? 0) + 1 }).eq('id', promptId).eq('project_id', projectId);
    if (error) throw error;
  },

  promptCategories: async (projectId: string): Promise<string[]> => {
    const { data, error } = await supabase.from('ai_saved_prompt').select('category').eq('project_id', projectId).not('category', 'is', null);
    if (error) throw error;
    const cats = (data ?? []).map((r: any) => r.category).filter(Boolean); return [...new Set(cats)] as string[];
  },

  promptFolders: async (projectId: string): Promise<AIPromptFolder[]> => {
    const { data, error } = await supabase.from('ai_prompt_folder').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  createPromptFolder: async (projectId: string, data: { name: string; parent_id?: string }): Promise<AIPromptFolder> => {
    const { data: row, error } = await supabase.from('ai_prompt_folder').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row;
  },

  deletePromptFolder: async (projectId: string, folderId: string): Promise<void> => {
    const { error } = await supabase.from('ai_prompt_folder').delete().eq('id', folderId).eq('project_id', projectId);
    if (error) throw error;
  },

  agents: async (projectId: string): Promise<AIAgentConfig[]> => {
    const { data, error } = await supabase.from('ai_agent_config').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  getAgent: async (projectId: string, agentType: string): Promise<AIAgentConfig> => {
    const { data, error } = await supabase.from('ai_agent_config').select('*').eq('project_id', projectId).eq('name', agentType).single();
    if (error) throw error;
    return data;
  },

  updateAgent: async (projectId: string, agentType: string, data: Partial<AIAgentConfig>): Promise<AIAgentConfig> => {
    const { data: row, error } = await supabase.from('ai_agent_config').update(data).eq('project_id', projectId).eq('name', agentType).select().single();
    if (error) throw error;
    return row;
  },

  workflows: async (projectId: string): Promise<AIWorkflow[]> => {
    const { data, error } = await supabase.from('ai_workflow').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  createWorkflow: async (projectId: string, data: Partial<AIWorkflow>): Promise<AIWorkflow> => {
    const { data: row, error } = await supabase.from('ai_workflow').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row;
  },

  updateWorkflow: async (projectId: string, workflowId: string, data: Partial<AIWorkflow>): Promise<AIWorkflow> => {
    const { data: row, error } = await supabase.from('ai_workflow').update(data).eq('id', workflowId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row;
  },

  deleteWorkflow: async (projectId: string, workflowId: string): Promise<void> => {
    const { error } = await supabase.from('ai_workflow').update({ is_active: false }).eq('id', workflowId).eq('project_id', projectId);
    if (error) throw error;
  },

  executeWorkflow: async (projectId: string, workflowId: string): Promise<AIWorkflowExecution> =>
    callEdgeFunction('ai', { operation: 'execute-workflow', project_id: projectId, data: { workflow_id: workflowId } }),

  workflowExecutions: async (projectId: string, params?: { workflow_id?: string; status?: string }): Promise<AIWorkflowExecution[]> => {
    let query = supabase.from('ai_workflow_execution').select('*').eq('project_id', projectId);
    if (params?.workflow_id) query = query.eq('workflow_id', params.workflow_id);
    if (params?.status) query = query.eq('status', params.status);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  getExecution: async (projectId: string, executionId: string): Promise<AIWorkflowExecution> => {
    const { data, error } = await supabase.from('ai_workflow_execution').select('*').eq('id', executionId).eq('project_id', projectId).single();
    if (error) throw error;
    return data;
  },

  tools: async (projectId: string): Promise<AITool[]> =>
    callEdgeFunction('ai', { operation: 'list-tools', project_id: projectId }),

  executeTool: async (projectId: string, toolName: string, params: Record<string, unknown>): Promise<unknown> =>
    callEdgeFunction('ai', { operation: 'execute-tool', project_id: projectId, data: { tool_name: toolName, params } }),

  searchRag: async (projectId: string, q: string, sourceType?: string, limit?: number): Promise<AISearchResult[]> =>
    callEdgeFunction('ai', { operation: 'search', project_id: projectId, data: { query: q, source_type: sourceType, limit } }),

  ingestAll: async (projectId: string): Promise<Record<string, number>> =>
    callEdgeFunction('ai', { operation: 'ingest', project_id: projectId }),

  ingestStatus: async (projectId: string): Promise<AIDocumentIngestion[]> => {
    const { data, error } = await supabase.from('ai_document_ingestion').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  memories: async (projectId: string, params?: { memory_type?: string; query?: string; limit?: number }): Promise<AIMemoryEntry[]> => {
    let query = supabase.from('ai_memory').select('*').eq('project_id', projectId);
    if (params?.memory_type) query = query.eq('memory_type', params.memory_type);
    if (params?.query) query = query.ilike('key', `%${params.query}%`);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  storeMemory: async (projectId: string, data: { memory_type: string; key: string; value?: Record<string, unknown>; text_value?: string; importance?: number; tags?: string[] }): Promise<AIMemoryEntry> => {
    const { data: row, error } = await supabase.from('ai_memory').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row;
  },

  deleteMemory: async (projectId: string, memoryType: string, key: string): Promise<void> => {
    const { error } = await supabase.from('ai_memory').delete().eq('project_id', projectId).eq('memory_type', memoryType).eq('key', key);
    if (error) throw error;
  },

  relevantMemories: async (projectId: string, context: string): Promise<AIMemoryEntry[]> =>
    callEdgeFunction('ai', { operation: 'relevant-memories', project_id: projectId, data: { context } }),

  citations: async (projectId: string, messageId: string): Promise<unknown> =>
    callEdgeFunction('ai', { operation: 'citations', project_id: projectId, data: { message_id: messageId } }),

  context: async (projectId: string, options?: Record<string, unknown>): Promise<unknown> =>
    callEdgeFunction('ai', { operation: 'context', project_id: projectId, data: { options } }),

  usage: async (projectId: string, params?: { provider?: string; model?: string; days?: number }): Promise<AITokenUsage[]> => {
    let query = supabase.from('ai_token_usage').select('*').eq('project_id', projectId);
    if (params?.provider) query = query.eq('provider', params.provider);
    if (params?.model) query = query.eq('model', params.model);
    if (params?.days) {
      const since = new Date();
      since.setDate(since.getDate() - params.days);
      query = query.gte('created_at', since.toISOString());
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  audit: async (projectId: string, params?: { action?: string; status?: string; limit?: number }): Promise<AIAuditLog[]> => {
    let query = supabase.from('ai_audit_log').select('*').eq('project_id', projectId);
    if (params?.action) query = query.eq('action', params.action);
    if (params?.status) query = query.eq('severity', params.status);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
};

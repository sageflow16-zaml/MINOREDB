import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { copilotService } from '../api/copilot';

// ── Chat ──
export const useChat = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { message: string; conversation_id?: string; agent_type?: string; options?: Record<string, unknown> }) =>
      copilotService.chat(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

// ── Conversations ──
export const useConversations = (projectId: string, params?: { agent_type?: string; folder?: string; is_pinned?: boolean }) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'conversations', params],
    queryFn: () => copilotService.conversations(projectId, params),
    enabled: !!projectId,
  });
};

export const useConversation = (projectId: string, conversationId?: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'conversation', conversationId],
    queryFn: () => copilotService.getConversation(projectId, conversationId!),
    enabled: !!projectId && !!conversationId,
  });
};

export const useCreateConversation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; agent_type?: string; folder?: string; tags?: string[] }) =>
      copilotService.createConversation(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId, 'conversations'] }),
  });
};

export const useUpdateConversation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: { title?: string; folder?: string; tags?: string[] } }) =>
      copilotService.updateConversation(projectId, conversationId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const useDeleteConversation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => copilotService.deleteConversation(projectId, conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const usePinConversation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => copilotService.pinConversation(projectId, conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const useUnpinConversation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => copilotService.unpinConversation(projectId, conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const useConversationMessages = (projectId: string, conversationId?: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'messages', conversationId],
    queryFn: () => copilotService.messages(projectId, conversationId!),
    enabled: !!projectId && !!conversationId,
  });
};

export const useConversationStats = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'conversations', 'stats'],
    queryFn: () => copilotService.conversationStats(projectId),
    enabled: !!projectId,
  });
};

export const useSearchConversations = (projectId: string, q: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'conversations', 'search', q],
    queryFn: () => copilotService.searchConversations(projectId, q),
    enabled: !!projectId && q.length > 0,
  });
};

// ── Prompts ──
export const usePrompts = (projectId: string, params?: { category?: string; agent_type?: string }) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'prompts', params],
    queryFn: () => copilotService.prompts(projectId, params),
    enabled: !!projectId,
  });
};

export const useCreatePrompt = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<import('../api/types').AIPrompt>) => copilotService.createPrompt(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId, 'prompts'] }),
  });
};

export const useUpdatePrompt = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ promptId, data }: { promptId: string; data: Partial<import('../api/types').AIPrompt> }) =>
      copilotService.updatePrompt(projectId, promptId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const useDeletePrompt = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) => copilotService.deletePrompt(projectId, promptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const usePromptFolders = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'prompts', 'folders'],
    queryFn: () => copilotService.promptFolders(projectId),
    enabled: !!projectId,
  });
};

// ── Agents ──
export const useAgents = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'agents'],
    queryFn: () => copilotService.agents(projectId),
    enabled: !!projectId,
  });
};

export const useAgent = (projectId: string, agentType?: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'agent', agentType],
    queryFn: () => copilotService.getAgent(projectId, agentType!),
    enabled: !!projectId && !!agentType,
  });
};

export const useUpdateAgent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentType, data }: { agentType: string; data: Partial<import('../api/types').AIAgentConfig> }) =>
      copilotService.updateAgent(projectId, agentType, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId, 'agents'] }),
  });
};

// ── Workflows ──
export const useWorkflows = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'workflows'],
    queryFn: () => copilotService.workflows(projectId),
    enabled: !!projectId,
  });
};

export const useExecuteWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) => copilotService.executeWorkflow(projectId, workflowId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId] }),
  });
};

export const useWorkflowExecutions = (projectId: string, params?: { workflow_id?: string; status?: string }) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'workflows', 'executions', params],
    queryFn: () => copilotService.workflowExecutions(projectId, params),
    enabled: !!projectId,
  });
};

// ── Tools ──
export const useTools = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'tools'],
    queryFn: () => copilotService.tools(projectId),
    enabled: !!projectId,
  });
};

// ── RAG ──
export const useRagSearch = (projectId: string, q: string, sourceType?: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'search', q, sourceType],
    queryFn: () => copilotService.searchRag(projectId, q, sourceType),
    enabled: !!projectId && q.length > 0,
  });
};

export const useIngestAll = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => copilotService.ingestAll(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId, 'ingest'] }),
  });
};

export const useIngestStatus = (projectId: string) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'ingest', 'status'],
    queryFn: () => copilotService.ingestStatus(projectId),
    enabled: !!projectId,
  });
};

// ── Memory ──
export const useMemories = (projectId: string, params?: { memory_type?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'memory', params],
    queryFn: () => copilotService.memories(projectId, params),
    enabled: !!projectId,
  });
};

export const useStoreMemory = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { memory_type: string; key: string; value?: Record<string, unknown>; text_value?: string; importance?: number; tags?: string[] }) =>
      copilotService.storeMemory(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot', projectId, 'memory'] }),
  });
};

// ── Usage ──
export const useTokenUsage = (projectId: string, params?: { days?: number }) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'usage', params],
    queryFn: () => copilotService.usage(projectId, params),
    enabled: !!projectId,
  });
};

// ── Context ──
export const useCopilotContext = (projectId: string, options?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['copilot', projectId, 'context', options],
    queryFn: () => copilotService.context(projectId, options),
    enabled: !!projectId,
  });
};

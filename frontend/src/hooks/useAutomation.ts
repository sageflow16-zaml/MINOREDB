import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService } from '../api/automation';

// ── Dashboard ──
export const useAutomationDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'dashboard'],
    queryFn: () => automationService.dashboard(projectId),
    enabled: !!projectId,
  });
};

// ── Workflows ──
export const useWorkflows = (projectId: string, params?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: ['automation', projectId, 'workflows', params],
    queryFn: () => automationService.workflows(projectId, params),
    enabled: !!projectId,
  });
};

export const useWorkflow = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['automation', projectId, 'workflows', id],
    queryFn: () => automationService.getWorkflow(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useCreateWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createWorkflow(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'workflows'] }),
  });
};

export const useUpdateWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      automationService.updateWorkflow(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId] }),
  });
};

export const useDeleteWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteWorkflow(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'workflows'] }),
  });
};

export const useDuplicateWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.duplicateWorkflow(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'workflows'] }),
  });
};

export const useExecuteWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, triggerData }: { id: string; triggerData?: Record<string, unknown> }) =>
      automationService.executeWorkflow(projectId, id, triggerData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId] }),
  });
};

export const useToggleWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.toggleWorkflow(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'workflows'] }),
  });
};

// ── Executions ──
export const useWorkflowExecutions = (projectId: string, params?: { workflow_id?: string; status?: string }) => {
  return useQuery({
    queryKey: ['automation', projectId, 'executions', params],
    queryFn: () => automationService.executions(projectId, params),
    enabled: !!projectId,
  });
};

export const useWorkflowExecution = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['automation', projectId, 'executions', id],
    queryFn: () => automationService.getExecution(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

// ── Rules ──
export const useRules = (projectId: string, enabledOnly?: boolean) => {
  return useQuery({
    queryKey: ['automation', projectId, 'rules', { enabledOnly }],
    queryFn: () => automationService.rules(projectId, enabledOnly),
    enabled: !!projectId,
  });
};

export const useRule = (projectId: string, id: string | undefined) => {
  return useQuery({
    queryKey: ['automation', projectId, 'rules', id],
    queryFn: () => automationService.getRule(projectId, id!),
    enabled: !!projectId && !!id,
  });
};

export const useCreateRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createRule(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'rules'] }),
  });
};

export const useUpdateRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      automationService.updateRule(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId] }),
  });
};

export const useDeleteRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteRule(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'rules'] }),
  });
};

export const useEvaluateRules = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (context: Record<string, unknown>) => automationService.evaluateRules(projectId, context),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'rules'] }),
  });
};

// ── Jobs ──
export const useJobs = (projectId: string, enabledOnly?: boolean) => {
  return useQuery({
    queryKey: ['automation', projectId, 'jobs', { enabledOnly }],
    queryFn: () => automationService.jobs(projectId, enabledOnly),
    enabled: !!projectId,
  });
};

export const useCreateJob = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createJob(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'jobs'] }),
  });
};

export const useUpdateJob = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      automationService.updateJob(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'jobs'] }),
  });
};

export const useDeleteJob = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteJob(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'jobs'] }),
  });
};

export const useExecuteJob = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.executeJob(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId] }),
  });
};

export const useJobExecutions = (projectId: string, jobId: string | undefined) => {
  return useQuery({
    queryKey: ['automation', projectId, 'jobs', jobId, 'executions'],
    queryFn: () => automationService.getJobExecutions(projectId, jobId!),
    enabled: !!projectId && !!jobId,
  });
};

// ── Notifications ──
export const useNotifications = (projectId: string, params?: { unread_only?: boolean }) => {
  return useQuery({
    queryKey: ['automation', projectId, 'notifications', params],
    queryFn: () => automationService.notifications(projectId, params),
    enabled: !!projectId,
  });
};

export const useSendNotification = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.sendNotification(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'notifications'] }),
  });
};

export const useMarkNotificationRead = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.markNotificationRead(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'notifications'] }),
  });
};

export const useMarkAllNotificationsRead = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => automationService.markAllNotificationsRead(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'notifications'] }),
  });
};

export const useUnreadCount = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'notifications', 'unread-count'],
    queryFn: () => automationService.getUnreadCount(projectId),
    enabled: !!projectId,
  });
};

// ── Channels ──
export const useChannels = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'channels'],
    queryFn: () => automationService.channels(projectId),
    enabled: !!projectId,
  });
};

export const useCreateChannel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createChannel(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'channels'] }),
  });
};

export const useDeleteChannel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteChannel(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'channels'] }),
  });
};

export const useVerifyChannel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.verifyChannel(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'channels'] }),
  });
};

// ── Reports ──
export const useReports = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'reports'],
    queryFn: () => automationService.reports(projectId),
    enabled: !!projectId,
  });
};

export const useCreateReport = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createReport(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'reports'] }),
  });
};

export const useDeleteReport = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteReport(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'reports'] }),
  });
};

export const useGenerateReport = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.generateReport(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'reports'] }),
  });
};

// ── Connectors ──
export const useConnectors = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'connectors'],
    queryFn: () => automationService.connectors(projectId),
    enabled: !!projectId,
  });
};

export const useCreateConnector = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => automationService.createConnector(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'connectors'] }),
  });
};

export const useDeleteConnector = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.deleteConnector(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'connectors'] }),
  });
};

export const useTestConnector = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.testConnector(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'connectors'] }),
  });
};

export const useSyncConnector = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationService.syncConnector(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'connectors'] }),
  });
};

// ── Audit ──
export const useAuditLogs = (projectId: string, params?: { event_type?: string; source?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['automation', projectId, 'audit', params],
    queryFn: () => automationService.auditLogs(projectId, params),
    enabled: !!projectId,
  });
};

export const useAuditSummary = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'audit', 'summary'],
    queryFn: () => automationService.auditSummary(projectId),
    enabled: !!projectId,
  });
};

// ── Templates ──
export const useTemplates = (projectId: string, category?: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'templates', { category }],
    queryFn: () => automationService.templates(projectId, category),
    enabled: !!projectId,
  });
};

export const useCreateFromTemplate = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) =>
      automationService.createFromTemplate(projectId, templateId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation', projectId, 'workflows'] }),
  });
};

export const useTemplateCategories = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'templates', 'categories'],
    queryFn: () => automationService.templateCategories(projectId),
    enabled: !!projectId,
  });
};

// ── Metadata ──
export const useTriggerTypes = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'trigger-types'],
    queryFn: () => automationService.triggerTypes(projectId),
    enabled: !!projectId,
  });
};

export const useActionTypes = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'action-types'],
    queryFn: () => automationService.actionTypes(projectId),
    enabled: !!projectId,
  });
};

export const useConditionTypes = (projectId: string) => {
  return useQuery({
    queryKey: ['automation', projectId, 'condition-types'],
    queryFn: () => automationService.conditionTypes(projectId),
    enabled: !!projectId,
  });
};

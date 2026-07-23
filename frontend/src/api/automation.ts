import api from '../services/api';
import type {
  Workflow, WorkflowExecution, Rule, ScheduledJob, JobExecution,
  Notification, NotificationChannel, AuditLog, Connector,
  AutomationReport, WorkflowTemplate, AutomationDashboardData,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/automation`;

export const automationService = {
  // Dashboard
  dashboard: (projectId: string) =>
    api.get<AutomationDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  // Workflows
  workflows: (projectId: string, params?: { status?: string; category?: string; limit?: number }) =>
    api.get<Workflow[]>(`${base(projectId)}/workflows`, { params }).then((r) => r.data),

  createWorkflow: (projectId: string, data: Record<string, unknown>) =>
    api.post<Workflow>(`${base(projectId)}/workflows`, data).then((r) => r.data),

  getWorkflow: (projectId: string, id: string) =>
    api.get<Workflow>(`${base(projectId)}/workflows/${id}`).then((r) => r.data),

  updateWorkflow: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<Workflow>(`${base(projectId)}/workflows/${id}`, data).then((r) => r.data),

  deleteWorkflow: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/workflows/${id}`).then((r) => r.data),

  duplicateWorkflow: (projectId: string, id: string) =>
    api.post<Workflow>(`${base(projectId)}/workflows/${id}/duplicate`).then((r) => r.data),

  executeWorkflow: (projectId: string, id: string, triggerData?: Record<string, unknown>) =>
    api.post<WorkflowExecution>(`${base(projectId)}/workflows/${id}/execute`, triggerData || {}).then((r) => r.data),

  toggleWorkflow: (projectId: string, id: string) =>
    api.post<Workflow>(`${base(projectId)}/workflows/${id}/toggle`).then((r) => r.data),

  // Executions
  executions: (projectId: string, params?: { workflow_id?: string; status?: string; limit?: number }) =>
    api.get<WorkflowExecution[]>(`${base(projectId)}/executions`, { params }).then((r) => r.data),

  getExecution: (projectId: string, id: string) =>
    api.get<WorkflowExecution>(`${base(projectId)}/executions/${id}`).then((r) => r.data),

  // Rules
  rules: (projectId: string, enabledOnly?: boolean) =>
    api.get<Rule[]>(`${base(projectId)}/rules`, { params: { enabled_only: enabledOnly } }).then((r) => r.data),

  createRule: (projectId: string, data: Record<string, unknown>) =>
    api.post<Rule>(`${base(projectId)}/rules`, data).then((r) => r.data),

  getRule: (projectId: string, id: string) =>
    api.get<Rule>(`${base(projectId)}/rules/${id}`).then((r) => r.data),

  updateRule: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<Rule>(`${base(projectId)}/rules/${id}`, data).then((r) => r.data),

  deleteRule: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/rules/${id}`).then((r) => r.data),

  evaluateRules: (projectId: string, context: Record<string, unknown>) =>
    api.post<Rule[]>(`${base(projectId)}/rules/evaluate`, { context }).then((r) => r.data),

  // Jobs
  jobs: (projectId: string, enabledOnly?: boolean) =>
    api.get<ScheduledJob[]>(`${base(projectId)}/jobs`, { params: { enabled_only: enabledOnly } }).then((r) => r.data),

  createJob: (projectId: string, data: Record<string, unknown>) =>
    api.post<ScheduledJob>(`${base(projectId)}/jobs`, data).then((r) => r.data),

  updateJob: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<ScheduledJob>(`${base(projectId)}/jobs/${id}`, data).then((r) => r.data),

  deleteJob: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/jobs/${id}`).then((r) => r.data),

  executeJob: (projectId: string, id: string) =>
    api.post<JobExecution>(`${base(projectId)}/jobs/${id}/execute`).then((r) => r.data),

  getJobExecutions: (projectId: string, id: string, limit?: number) =>
    api.get<JobExecution[]>(`${base(projectId)}/jobs/${id}/executions`, { params: { limit } }).then((r) => r.data),

  // Notifications
  notifications: (projectId: string, params?: { unread_only?: boolean; limit?: number }) =>
    api.get<Notification[]>(`${base(projectId)}/notifications`, { params }).then((r) => r.data),

  sendNotification: (projectId: string, data: Record<string, unknown>) =>
    api.post<Notification>(`${base(projectId)}/notifications`, data).then((r) => r.data),

  markNotificationRead: (projectId: string, id: string) =>
    api.put<Notification>(`${base(projectId)}/notifications/${id}/read`).then((r) => r.data),

  markAllNotificationsRead: (projectId: string) =>
    api.post(`${base(projectId)}/notifications/read-all`).then((r) => r.data),

  getUnreadCount: (projectId: string) =>
    api.get<{ count: number }>(`${base(projectId)}/notifications/unread-count`).then((r) => r.data),

  // Channels
  channels: (projectId: string) =>
    api.get<NotificationChannel[]>(`${base(projectId)}/channels`).then((r) => r.data),

  createChannel: (projectId: string, data: Record<string, unknown>) =>
    api.post<NotificationChannel>(`${base(projectId)}/channels`, data).then((r) => r.data),

  updateChannel: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<NotificationChannel>(`${base(projectId)}/channels/${id}`, data).then((r) => r.data),

  deleteChannel: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/channels/${id}`).then((r) => r.data),

  verifyChannel: (projectId: string, id: string) =>
    api.post<NotificationChannel>(`${base(projectId)}/channels/${id}/verify`).then((r) => r.data),

  // AI Automation
  aiSummarizeTrades: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/summarize-trades`, context || {}).then((r) => r.data),

  aiReviewJournal: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/review-journal`, context || {}).then((r) => r.data),

  aiAnalyzePsychology: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/analyze-psychology`, context || {}).then((r) => r.data),

  aiGenerateReport: (projectId: string, reportType: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/generate-report`, { report_type: reportType, context }).then((r) => r.data),

  aiIdentifyWeaknesses: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/identify-weaknesses`, context || {}).then((r) => r.data),

  aiSuggestResearch: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/suggest-research`, context || {}).then((r) => r.data),

  aiCreateDailyPlan: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/create-daily-plan`, context || {}).then((r) => r.data),

  aiGenerateCoaching: (projectId: string, context?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/ai/generate-coaching`, context || {}).then((r) => r.data),

  // Reports
  reports: (projectId: string) =>
    api.get<AutomationReport[]>(`${base(projectId)}/reports`).then((r) => r.data),

  createReport: (projectId: string, data: Record<string, unknown>) =>
    api.post<AutomationReport>(`${base(projectId)}/reports`, data).then((r) => r.data),

  updateReport: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<AutomationReport>(`${base(projectId)}/reports/${id}`, data).then((r) => r.data),

  deleteReport: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/reports/${id}`).then((r) => r.data),

  generateReport: (projectId: string, id: string) =>
    api.post<AutomationReport>(`${base(projectId)}/reports/${id}/generate`).then((r) => r.data),

  generateDailyReport: (projectId: string) =>
    api.post(`${base(projectId)}/reports/generate/daily`).then((r) => r.data),

  generateWeeklyReport: (projectId: string) =>
    api.post(`${base(projectId)}/reports/generate/weekly`).then((r) => r.data),

  generateMonthlyReport: (projectId: string) =>
    api.post(`${base(projectId)}/reports/generate/monthly`).then((r) => r.data),

  generatePerformanceReport: (projectId: string) =>
    api.post(`${base(projectId)}/reports/generate/performance`).then((r) => r.data),

  generateRiskReport: (projectId: string) =>
    api.post(`${base(projectId)}/reports/generate/risk`).then((r) => r.data),

  // Connectors
  connectors: (projectId: string) =>
    api.get<Connector[]>(`${base(projectId)}/connectors`).then((r) => r.data),

  createConnector: (projectId: string, data: Record<string, unknown>) =>
    api.post<Connector>(`${base(projectId)}/connectors`, data).then((r) => r.data),

  updateConnector: (projectId: string, id: string, data: Record<string, unknown>) =>
    api.put<Connector>(`${base(projectId)}/connectors/${id}`, data).then((r) => r.data),

  deleteConnector: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/connectors/${id}`).then((r) => r.data),

  testConnector: (projectId: string, id: string) =>
    api.post(`${base(projectId)}/connectors/${id}/test`).then((r) => r.data),

  syncConnector: (projectId: string, id: string) =>
    api.post(`${base(projectId)}/connectors/${id}/sync`).then((r) => r.data),

  // Audit
  auditLogs: (projectId: string, params?: { event_type?: string; source?: string; limit?: number }) =>
    api.get<AuditLog[]>(`${base(projectId)}/audit`, { params }).then((r) => r.data),

  auditSummary: (projectId: string) =>
    api.get(`${base(projectId)}/audit/summary`).then((r) => r.data),

  // Templates
  templates: (projectId: string, category?: string) =>
    api.get<WorkflowTemplate[]>(`${base(projectId)}/templates`, { params: { category } }).then((r) => r.data),

  createFromTemplate: (projectId: string, templateId: string, name?: string) =>
    api.post<Workflow>(`${base(projectId)}/templates/${templateId}/create`, null, { params: { name } }).then((r) => r.data),

  templateCategories: (projectId: string) =>
    api.get(`${base(projectId)}/templates/categories`).then((r) => r.data),

  // Metadata
  triggerTypes: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/trigger-types`).then((r) => r.data),

  actionTypes: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/action-types`).then((r) => r.data),

  conditionTypes: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/condition-types`).then((r) => r.data),

  connectorTypes: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/connector-types`).then((r) => r.data),

  reportTypes: (projectId: string) =>
    api.get<string[]>(`${base(projectId)}/report-types`).then((r) => r.data),
};

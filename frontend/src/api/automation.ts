import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  Workflow, WorkflowExecution, Rule, ScheduledJob, JobExecution,
  Notification, NotificationChannel, AuditLog, Connector,
  AutomationReport, WorkflowTemplate, AutomationDashboardData,
} from './types';

export const automationService = {
  // Dashboard
  async dashboard(projectId: string): Promise<AutomationDashboardData> {
    const { data: workflows, error: wfErr } = await supabase
      .from('automation_workflow')
      .select('id, status')
      .eq('project_id', projectId)
      .is('deleted_at', null);
    if (wfErr) throw wfErr;

    const { data: rules, error: rulesErr } = await supabase
      .from('automation_rule')
      .select('id, enabled')
      .eq('project_id', projectId);
    if (rulesErr) throw rulesErr;

    const { count: totalJobs, error: jobsErr } = await supabase
      .from('automation_scheduled_job')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    if (jobsErr) throw jobsErr;

    const { count: totalNotifications, error: notifErr } = await supabase
      .from('automation_notification')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    if (notifErr) throw notifErr;

    const { count: unreadNotifications, error: unreadErr } = await supabase
      .from('automation_notification')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('is_read', false);
    if (unreadErr) throw unreadErr;

    const { data: recentExecutions, error: execErr } = await supabase
      .from('automation_workflow_execution')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (execErr) throw execErr;

    const { data: recentAuditLogs, error: auditErr } = await supabase
      .from('automation_audit_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (auditErr) throw auditErr;

    return {
      total_workflows: workflows.length,
      active_workflows: workflows.filter((w) => w.status === 'active').length,
      total_rules: rules.length,
      enabled_rules: rules.filter((r) => r.enabled).length,
      total_jobs: totalJobs ?? 0,
      active_jobs: 0,
      total_notifications: totalNotifications ?? 0,
      unread_notifications: unreadNotifications ?? 0,
      recent_executions: (recentExecutions ?? []) as WorkflowExecution[],
      recent_audit_logs: (recentAuditLogs ?? []) as AuditLog[],
    };
  },

  // Workflows
  async workflows(projectId: string, params?: { status?: string; category?: string; limit?: number }): Promise<Workflow[]> {
    let query = supabase
      .from('automation_workflow')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Workflow[];
  },

  async createWorkflow(projectId: string, data: Record<string, unknown>): Promise<Workflow> {
    const { data: result, error } = await supabase
      .from('automation_workflow')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Workflow;
  },

  async getWorkflow(projectId: string, id: string): Promise<Workflow> {
    const { data, error } = await supabase
      .from('automation_workflow')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as Workflow;
  },

  async updateWorkflow(projectId: string, id: string, data: Record<string, unknown>): Promise<Workflow> {
    const { data: result, error } = await supabase
      .from('automation_workflow')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Workflow;
  },

  async deleteWorkflow(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_workflow')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async duplicateWorkflow(projectId: string, id: string): Promise<Workflow> {
    const { data: original, error: getErr } = await supabase
      .from('automation_workflow')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (getErr) throw getErr;

    const { name, description, tags, category, nodes, connections, triggers, actions, conditions, config, metadata, error_handling } = original;
    const { data: result, error: insertErr } = await supabase
      .from('automation_workflow')
      .insert({
        project_id: projectId,
        name: `${name} (Copy)`,
        description,
        status: 'draft',
        version: 1,
        tags,
        category,
        nodes,
        connections,
        triggers,
        actions,
        conditions,
        config,
        metadata,
        error_handling,
      })
      .select()
      .single();
    if (insertErr) throw insertErr;
    return result as unknown as Workflow;
  },

  async executeWorkflow(projectId: string, id: string, triggerData?: Record<string, unknown>): Promise<WorkflowExecution> {
    const { data, error } = await supabase
      .from('automation_workflow_execution')
      .insert({
        project_id: projectId,
        workflow_id: id,
        status: 'pending',
        triggered_by: 'manual',
        input_data: triggerData ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as WorkflowExecution;
  },

  async toggleWorkflow(projectId: string, id: string): Promise<Workflow> {
    const { data: current, error: getErr } = await supabase
      .from('automation_workflow')
      .select('status')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (getErr) throw getErr;

    const newStatus = current.status === 'active' ? 'paused' : 'active';
    const { data: result, error: updateErr } = await supabase
      .from('automation_workflow')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return result as unknown as Workflow;
  },

  // Executions
  async executions(projectId: string, params?: { workflow_id?: string; status?: string; limit?: number }): Promise<WorkflowExecution[]> {
    let query = supabase
      .from('automation_workflow_execution')
      .select('*')
      .eq('project_id', projectId);
    if (params?.workflow_id) query = query.eq('workflow_id', params.workflow_id);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as WorkflowExecution[];
  },

  async getExecution(projectId: string, id: string): Promise<WorkflowExecution> {
    const { data, error } = await supabase
      .from('automation_workflow_execution')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as WorkflowExecution;
  },

  // Rules
  async rules(projectId: string, enabledOnly?: boolean): Promise<Rule[]> {
    let query = supabase
      .from('automation_rule')
      .select('*')
      .eq('project_id', projectId);
    if (enabledOnly) query = query.eq('enabled', true);
    query = query.order('priority', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Rule[];
  },

  async createRule(projectId: string, data: Record<string, unknown>): Promise<Rule> {
    const { data: result, error } = await supabase
      .from('automation_rule')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Rule;
  },

  async getRule(projectId: string, id: string): Promise<Rule> {
    const { data, error } = await supabase
      .from('automation_rule')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as unknown as Rule;
  },

  async updateRule(projectId: string, id: string, data: Record<string, unknown>): Promise<Rule> {
    const { data: result, error } = await supabase
      .from('automation_rule')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Rule;
  },

  async deleteRule(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rule')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async evaluateRules(projectId: string, context: Record<string, unknown>): Promise<Rule[]> {
    return callEdgeFunction('automation-connector', {
      operation: 'evaluate_rules',
      project_id: projectId,
      data: { context },
    });
  },

  // Jobs
  async jobs(projectId: string, enabledOnly?: boolean): Promise<ScheduledJob[]> {
    let query = supabase
      .from('automation_scheduled_job')
      .select('*')
      .eq('project_id', projectId);
    if (enabledOnly) query = query.eq('enabled', true);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ScheduledJob[];
  },

  async createJob(projectId: string, data: Record<string, unknown>): Promise<ScheduledJob> {
    const { data: result, error } = await supabase
      .from('automation_scheduled_job')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as ScheduledJob;
  },

  async updateJob(projectId: string, id: string, data: Record<string, unknown>): Promise<ScheduledJob> {
    const { data: result, error } = await supabase
      .from('automation_scheduled_job')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as ScheduledJob;
  },

  async deleteJob(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_scheduled_job')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async executeJob(projectId: string, id: string): Promise<JobExecution> {
    const { data, error } = await supabase
      .from('automation_job_execution')
      .insert({
        project_id: projectId,
        job_id: id,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as JobExecution;
  },

  async getJobExecutions(projectId: string, id: string, limit?: number): Promise<JobExecution[]> {
    let query = supabase
      .from('automation_job_execution')
      .select('*')
      .eq('project_id', projectId)
      .eq('job_id', id);
    if (limit) query = query.limit(limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as JobExecution[];
  },

  // Notifications
  async notifications(projectId: string, params?: { unread_only?: boolean; limit?: number }): Promise<Notification[]> {
    let query = supabase
      .from('automation_notification')
      .select('*')
      .eq('project_id', projectId);
    if (params?.unread_only) query = query.eq('is_read', false);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((n) => ({ ...n, read: n.is_read })) as unknown as Notification[];
  },

  async sendNotification(projectId: string, data: Record<string, unknown>): Promise<Notification> {
    const { is_read, read, ...rest } = data as any;
    const { data: result, error } = await supabase
      .from('automation_notification')
      .insert({ ...rest, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return { ...result, read: result.is_read } as unknown as Notification;
  },

  async markNotificationRead(projectId: string, id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('automation_notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return { ...data, read: data.is_read } as unknown as Notification;
  },

  async markAllNotificationsRead(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async getUnreadCount(projectId: string): Promise<{ count: number }> {
    const { count, error } = await supabase
      .from('automation_notification')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('is_read', false);
    if (error) throw error;
    return { count: count ?? 0 };
  },

  // Channels
  async channels(projectId: string): Promise<NotificationChannel[]> {
    const { data, error } = await supabase
      .from('automation_notification_channel')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as NotificationChannel[];
  },

  async createChannel(projectId: string, data: Record<string, unknown>): Promise<NotificationChannel> {
    const { data: result, error } = await supabase
      .from('automation_notification_channel')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as NotificationChannel;
  },

  async updateChannel(projectId: string, id: string, data: Record<string, unknown>): Promise<NotificationChannel> {
    const { data: result, error } = await supabase
      .from('automation_notification_channel')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as NotificationChannel;
  },

  async deleteChannel(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_notification_channel')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async verifyChannel(projectId: string, id: string): Promise<NotificationChannel> {
    const { data, error } = await supabase
      .from('automation_notification_channel')
      .update({ verified: true, last_verified_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as NotificationChannel;
  },

  // AI Automation
  async aiGenerateReport(projectId: string, reportType: string, context?: Record<string, unknown>): Promise<any> {
    return callEdgeFunction('ai', { operation: 'generate_report', project_id: projectId, data: { report_type: reportType, context } });
  },

  async aiGenerateCoaching(projectId: string, context?: Record<string, unknown>): Promise<any> {
    return callEdgeFunction('ai', { operation: 'generate_coaching', project_id: projectId, data: context ?? {} });
  },

  // Reports
  async reports(projectId: string): Promise<AutomationReport[]> {
    const { data, error } = await supabase
      .from('automation_report')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AutomationReport[];
  },

  async createReport(projectId: string, data: Record<string, unknown>): Promise<AutomationReport> {
    const { data: result, error } = await supabase
      .from('automation_report')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as AutomationReport;
  },

  async updateReport(projectId: string, id: string, data: Record<string, unknown>): Promise<AutomationReport> {
    const { data: result, error } = await supabase
      .from('automation_report')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as AutomationReport;
  },

  async deleteReport(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_report')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async generateReport(projectId: string, id: string): Promise<AutomationReport> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_report',
      project_id: projectId,
      data: { report_id: id },
    });
  },

  async generateDailyReport(projectId: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_daily_report',
      project_id: projectId,
    });
  },

  async generateWeeklyReport(projectId: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_weekly_report',
      project_id: projectId,
    });
  },

  async generateMonthlyReport(projectId: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_monthly_report',
      project_id: projectId,
    });
  },

  async generatePerformanceReport(projectId: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_performance_report',
      project_id: projectId,
    });
  },

  async generateRiskReport(projectId: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'generate_risk_report',
      project_id: projectId,
    });
  },

  // Connectors
  async connectors(projectId: string): Promise<Connector[]> {
    const { data, error } = await supabase
      .from('automation_connector')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Connector[];
  },

  async createConnector(projectId: string, data: Record<string, unknown>): Promise<Connector> {
    const { data: result, error } = await supabase
      .from('automation_connector')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Connector;
  },

  async updateConnector(projectId: string, id: string, data: Record<string, unknown>): Promise<Connector> {
    const { data: result, error } = await supabase
      .from('automation_connector')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return result as unknown as Connector;
  },

  async deleteConnector(projectId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_connector')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  async testConnector(projectId: string, id: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'test_connector',
      project_id: projectId,
      data: { connector_id: id },
    });
  },

  async syncConnector(projectId: string, id: string): Promise<any> {
    return callEdgeFunction('automation-connector', {
      operation: 'sync_connector',
      project_id: projectId,
      data: { connector_id: id },
    });
  },

  // Audit
  async auditLogs(projectId: string, params?: { event_type?: string; source?: string; limit?: number }): Promise<AuditLog[]> {
    let query = supabase
      .from('automation_audit_log')
      .select('*')
      .eq('project_id', projectId);
    if (params?.event_type) query = query.eq('event_type', params.event_type);
    if (params?.source) query = query.eq('source', params.source);
    if (params?.limit) query = query.limit(params.limit);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as AuditLog[];
  },

  async auditSummary(projectId: string): Promise<any> {
    const { data, error } = await supabase
      .from('automation_audit_log')
      .select('event_type, severity')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as any[];
  },

  // Templates
  async templates(projectId: string, category?: string): Promise<WorkflowTemplate[]> {
    let query = supabase
      .from('automation_workflow_template')
      .select('*');
    if (category) query = query.eq('category', category);
    query = query.order('usage_count', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as WorkflowTemplate[];
  },

  async createFromTemplate(projectId: string, templateId: string, name?: string): Promise<Workflow> {
    const { data: template, error: getErr } = await supabase
      .from('automation_workflow_template')
      .select('*')
      .eq('id', templateId)
      .single();
    if (getErr) throw getErr;

    const { data: result, error: insertErr } = await supabase
      .from('automation_workflow')
      .insert({
        project_id: projectId,
        name: name ?? template.name,
        description: template.description,
        status: 'draft',
        version: 1,
        tags: template.tags,
        category: template.category,
        nodes: template.nodes_config,
        connections: template.connections_config,
        triggers: template.triggers_config,
        actions: template.actions_config,
        conditions: template.conditions_config,
        is_template: false,
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    const { error: countErr } = await supabase
      .from('automation_workflow_template')
      .update({ usage_count: (template.usage_count ?? 0) + 1 })
      .eq('id', templateId);
    if (countErr) throw countErr;

    return result as unknown as Workflow;
  },

  async templateCategories(projectId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('automation_workflow_template')
      .select('category')
      .not('category', 'is', null);
    if (error) throw error;
    const cats = (data ?? []).map((r: any) => r.category).filter(Boolean); return [...new Set(cats)] as string[];
  },

  // Metadata
  async triggerTypes(projectId: string): Promise<string[]> {
    return ['time', 'event', 'webhook', 'schedule', 'manual', 'condition', 'alert', 'trade', 'price', 'indicator'];
  },

  async actionTypes(projectId: string): Promise<string[]> {
    return ['webhook', 'notification', 'email', 'api_call', 'trade', 'update_record', 'create_record', 'calculate', 'transform', 'alert'];
  },

  async conditionTypes(projectId: string): Promise<string[]> {
    return ['comparison', 'logical', 'range', 'contains', 'regex', 'time_window', 'aggregate', 'threshold', 'trend'];
  },

  async connectorTypes(projectId: string): Promise<string[]> {
    return ['discord', 'telegram', 'slack', 'email', 'webhook', 'tradingview', 'mt4', 'mt5', 'custom_api', 'database'];
  },

  async reportTypes(projectId: string): Promise<string[]> {
    return ['daily', 'weekly', 'monthly', 'quarterly', 'performance', 'risk', 'research', 'strategy'];
  },
};

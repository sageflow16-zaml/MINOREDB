import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { AgentTask, AgentExecution, AgentStatus, AgentWorkflow, AgentDashboard } from './types';

export interface AgentTaskCreate {
  agent_name: string;
  task_type: string;
  title: string;
  description?: string;
  input_data?: Record<string, unknown>;
  priority?: number;
  scheduled_at?: string;
  workflow_id?: string;
  workflow_step?: number;
  depends_on?: string;
}

export interface WorkflowChainCreate {
  name: string;
  description?: string;
  steps: Record<string, unknown>[];
  trigger_type?: string;
  trigger_config?: Record<string, unknown>;
}

export const getAgentDashboard = async (projectId: string): Promise<AgentDashboard> => {
  const today = new Date().toISOString().slice(0, 10);

  const [pendingRes, executionsRes, workflowsRes, agentNamesRes] = await Promise.all([
    supabase.from('agent_task').select('*').eq('project_id', projectId).eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('agent_execution').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
    supabase.from('agent_workflow').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.rpc('get_distinct_agent_names', { p_project_id: projectId }),
  ]);

  if (pendingRes.error) throw pendingRes.error;
  if (executionsRes.error) throw executionsRes.error;
  if (workflowsRes.error) throw workflowsRes.error;

  const pendingTasks = (pendingRes.data ?? []) as AgentTask[];
  const recentExecutions = (executionsRes.data ?? []) as AgentExecution[];
  const workflows = (workflowsRes.data ?? []) as AgentWorkflow[];

  const agentNames = (agentNamesRes.data ?? []) as string[];

  const agentStatuses: AgentStatus[] = [];

  for (const name of agentNames.length ? agentNames : ['researcher', 'analyst', 'trader']) {
    const { count: totalTasksRun } = await supabase
      .from('agent_task')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('agent_name', name);

    const { data: lastExec } = await supabase
      .from('agent_execution')
      .select('*')
      .eq('project_id', projectId)
      .eq('agent_name', name)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: aggData } = await supabase
      .from('agent_execution')
      .select('confidence, status')
      .eq('project_id', projectId)
      .eq('agent_name', name);

    const execs = aggData ?? [];
    const avgConf = execs.length
      ? execs.reduce((sum, e) => sum + (e.confidence ?? 0), 0) / execs.length
      : null;
    const successCount = execs.filter((e) => e.status === 'success').length;
    const successRate = execs.length ? successCount / execs.length : null;

    agentStatuses.push({
      agent_name: name,
      display_name: name.charAt(0).toUpperCase() + name.slice(1),
      description: '',
      capabilities: [],
      is_available: true,
      total_tasks_run: totalTasksRun ?? 0,
      last_execution: (lastExec?.[0] as AgentExecution) ?? null,
      avg_confidence: avgConf,
      success_rate: successRate,
    });
  }

  const { data: todayTasks } = await supabase
    .from('agent_task')
    .select('id')
    .eq('project_id', projectId)
    .gte('created_at', today);

  const todayTaskIds = (todayTasks ?? []).map((t) => t.id);

  let totalDiscoveries = 0;
  if (todayTaskIds.length) {
    const { data: todayExecs } = await supabase
      .from('agent_execution')
      .select('discoveries')
      .eq('project_id', projectId)
      .in('task_id', todayTaskIds);
    totalDiscoveries = (todayExecs ?? []).reduce(
      (sum, e) => sum + ((e.discoveries as unknown[])?.length ?? 0),
      0,
    );
  }

  const allConfs = recentExecutions
    .map((e) => e.confidence)
    .filter((c): c is number => c !== null);
  const totalExecs = recentExecutions.length;

  return {
    agents: agentStatuses,
    pending_tasks: pendingTasks,
    recent_executions: recentExecutions,
    workflows,
    total_tasks_today: todayTaskIds.length,
    total_discoveries: totalDiscoveries,
    avg_confidence: allConfs.length
      ? allConfs.reduce((a, b) => a + b, 0) / allConfs.length
      : null,
    success_rate: totalExecs
      ? recentExecutions.filter((e) => e.status === 'success').length / totalExecs
      : null,
  };
};

export const listAgentStatuses = async (projectId: string): Promise<AgentStatus[]> => {
  const { data: agents, error } = await supabase
    .rpc('get_distinct_agent_names', { p_project_id: projectId });

  if (error) throw error;
  const agentNames = (agents ?? []) as string[];

  const statuses: AgentStatus[] = [];

  for (const name of agentNames.length ? agentNames : ['researcher', 'analyst', 'trader']) {
    const { count: totalTasksRun } = await supabase
      .from('agent_task')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('agent_name', name);

    const { data: lastExec } = await supabase
      .from('agent_execution')
      .select('*')
      .eq('project_id', projectId)
      .eq('agent_name', name)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: aggData } = await supabase
      .from('agent_execution')
      .select('confidence, status')
      .eq('project_id', projectId)
      .eq('agent_name', name);

    const execs = aggData ?? [];
    const avgConf = execs.length
      ? execs.reduce((sum, e) => sum + (e.confidence ?? 0), 0) / execs.length
      : null;
    const successCount = execs.filter((e) => e.status === 'success').length;
    const successRate = execs.length ? successCount / execs.length : null;

    statuses.push({
      agent_name: name,
      display_name: name.charAt(0).toUpperCase() + name.slice(1),
      description: '',
      capabilities: [],
      is_available: true,
      total_tasks_run: totalTasksRun ?? 0,
      last_execution: (lastExec?.[0] as AgentExecution) ?? null,
      avg_confidence: avgConf,
      success_rate: successRate,
    });
  }

  return statuses;
};

export const createAgentTask = async (projectId: string, data: AgentTaskCreate): Promise<AgentTask> => {
  const { data: task, error } = await supabase
    .from('agent_task')
    .insert({ project_id: projectId, ...data })
    .select()
    .single();

  if (error) throw error;
  return task as AgentTask;
};

export const listAgentTasks = async (
  projectId: string,
  params?: { status?: string; agent_name?: string; limit?: number },
): Promise<AgentTask[]> => {
  let query = supabase.from('agent_task').select('*').eq('project_id', projectId);

  if (params?.status) query = query.eq('status', params.status);
  if (params?.agent_name) query = query.eq('agent_name', params.agent_name);
  if (params?.limit) query = query.limit(params.limit);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AgentTask[];
};

export const getAgentTask = async (projectId: string, taskId: string): Promise<AgentTask> => {
  const { data, error } = await supabase
    .from('agent_task')
    .select('*')
    .eq('project_id', projectId)
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data as AgentTask;
};

export const runAgentTask = async (projectId: string, taskId: string): Promise<AgentExecution> => {
  const { data: task, error: taskError } = await supabase
    .from('agent_task')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (taskError) throw taskError;
  const t = task as AgentTask;

  const { data: execution, error: execError } = await supabase
    .from('agent_execution')
    .insert({
      project_id: projectId,
      task_id: taskId,
      agent_name: t.agent_name,
      task_type: t.task_type,
      status: 'running',
    })
    .select()
    .single();

  if (execError) throw execError;

  return execution as AgentExecution;
};

export const cancelAgentTask = async (projectId: string, taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('agent_task')
    .update({ status: 'cancelled' })
    .eq('project_id', projectId)
    .eq('id', taskId);

  if (error) throw error;
};

export const listAgentExecutions = async (
  projectId: string,
  params?: { agent_name?: string; limit?: number },
): Promise<AgentExecution[]> => {
  let query = supabase.from('agent_execution').select('*').eq('project_id', projectId);

  if (params?.agent_name) query = query.eq('agent_name', params.agent_name);
  if (params?.limit) query = query.limit(params.limit);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AgentExecution[];
};

export const getAgentExecution = async (projectId: string, executionId: string): Promise<AgentExecution> => {
  const { data, error } = await supabase
    .from('agent_execution')
    .select('*')
    .eq('project_id', projectId)
    .eq('id', executionId)
    .single();

  if (error) throw error;
  return data as AgentExecution;
};

export const createAgentWorkflow = async (projectId: string, data: WorkflowChainCreate): Promise<AgentWorkflow> => {
  const { data: workflow, error } = await supabase
    .from('agent_workflow')
    .insert({ project_id: projectId, ...data })
    .select()
    .single();

  if (error) throw error;
  return workflow as AgentWorkflow;
};

export const listAgentWorkflows = async (projectId: string): Promise<AgentWorkflow[]> => {
  const { data, error } = await supabase
    .from('agent_workflow')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AgentWorkflow[];
};

export const getAgentWorkflow = async (projectId: string, workflowId: string): Promise<AgentWorkflow> => {
  const { data, error } = await supabase
    .from('agent_workflow')
    .select('*')
    .eq('project_id', projectId)
    .eq('id', workflowId)
    .single();

  if (error) throw error;
  return data as AgentWorkflow;
};

export const runAgentWorkflow = async (projectId: string, workflowId: string): Promise<AgentExecution> => {
  const { data: workflow, error: wfError } = await supabase
    .from('agent_workflow')
    .select('*')
    .eq('project_id', projectId)
    .eq('id', workflowId)
    .single();

  if (wfError) throw wfError;
  const wf = workflow as AgentWorkflow;

  const { error: updateError } = await supabase
    .from('agent_workflow')
    .update({
      total_runs: (wf.total_runs ?? 0) + 1,
      last_run_at: new Date().toISOString(),
      last_run_status: 'running',
    })
    .eq('id', workflowId)
    .eq('project_id', projectId);

  if (updateError) throw updateError;

  const taskTitle = `Workflow: ${wf.name}`;
  const { data: task, error: taskError } = await supabase
    .from('agent_task')
    .insert({
      project_id: projectId,
      agent_name: 'system',
      task_type: 'workflow',
      title: taskTitle,
      input_data: { workflow_id: workflowId, steps: wf.steps },
      status: 'running',
      workflow_id: workflowId,
    })
    .select()
    .single();

  if (taskError) throw taskError;

  const { data: execution, error: execError } = await supabase
    .from('agent_execution')
    .insert({
      project_id: projectId,
      task_id: task.id,
      agent_name: 'system',
      task_type: 'workflow',
      status: 'running',
    })
    .select()
    .single();

  if (execError) throw execError;

  return execution as AgentExecution;
};

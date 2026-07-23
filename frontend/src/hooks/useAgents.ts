import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as agentsApi from '../api/agents';
import type { AgentTaskCreate, WorkflowChainCreate } from '../api/agents';

const agentKeys = {
  all: (pid: string) => ['agents', pid] as const,
  dashboard: (pid: string) => ['agents', pid, 'dashboard'] as const,
  tasks: (pid: string) => ['agents', pid, 'tasks'] as const,
  task: (pid: string, id: string) => ['agents', pid, 'tasks', id] as const,
  executions: (pid: string) => ['agents', pid, 'executions'] as const,
  execution: (pid: string, id: string) => ['agents', pid, 'executions', id] as const,
  workflows: (pid: string) => ['agents', pid, 'workflows'] as const,
  workflow: (pid: string, id: string) => ['agents', pid, 'workflows', id] as const,
};

export const useAgentDashboard = (projectId: string) =>
  useQuery({
    queryKey: agentKeys.dashboard(projectId),
    queryFn: () => agentsApi.getAgentDashboard(projectId),
    enabled: !!projectId,
  });

export const useAgentStatuses = (projectId: string) =>
  useQuery({
    queryKey: [...agentKeys.all(projectId), 'statuses'],
    queryFn: () => agentsApi.listAgentStatuses(projectId),
    enabled: !!projectId,
  });

export const useAgentTasks = (projectId: string, params?: { status?: string; agent_name?: string; limit?: number }) =>
  useQuery({
    queryKey: [...agentKeys.tasks(projectId), params],
    queryFn: () => agentsApi.listAgentTasks(projectId, params),
    enabled: !!projectId,
  });

export const useAgentTask = (projectId: string, taskId: string) =>
  useQuery({
    queryKey: agentKeys.task(projectId, taskId),
    queryFn: () => agentsApi.getAgentTask(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });

export const useCreateAgentTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentTaskCreate) => agentsApi.createAgentTask(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard(projectId) });
    },
  });
};

export const useRunAgentTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => agentsApi.runAgentTask(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.executions(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard(projectId) });
    },
  });
};

export const useCancelAgentTask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => agentsApi.cancelAgentTask(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.tasks(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard(projectId) });
    },
  });
};

export const useAgentExecutions = (projectId: string, params?: { agent_name?: string; limit?: number }) =>
  useQuery({
    queryKey: [...agentKeys.executions(projectId), params],
    queryFn: () => agentsApi.listAgentExecutions(projectId, params),
    enabled: !!projectId,
  });

export const useAgentExecution = (projectId: string, executionId: string) =>
  useQuery({
    queryKey: agentKeys.execution(projectId, executionId),
    queryFn: () => agentsApi.getAgentExecution(projectId, executionId),
    enabled: !!projectId && !!executionId,
  });

export const useAgentWorkflows = (projectId: string) =>
  useQuery({
    queryKey: agentKeys.workflows(projectId),
    queryFn: () => agentsApi.listAgentWorkflows(projectId),
    enabled: !!projectId,
  });

export const useCreateAgentWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkflowChainCreate) => agentsApi.createAgentWorkflow(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.workflows(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard(projectId) });
    },
  });
};

export const useRunAgentWorkflow = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workflowId: string) => agentsApi.runAgentWorkflow(projectId, workflowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.workflows(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.executions(projectId) });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard(projectId) });
    },
  });
};

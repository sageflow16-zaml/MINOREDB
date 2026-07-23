import api from '../services/api';
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

export const getAgentDashboard = (projectId: string) =>
  api.get<AgentDashboard>(`/projects/${projectId}/agents/dashboard`).then(r => r.data);

export const listAgentStatuses = (projectId: string) =>
  api.get<AgentStatus[]>(`/projects/${projectId}/agents/agents`).then(r => r.data);

export const createAgentTask = (projectId: string, data: AgentTaskCreate) =>
  api.post<AgentTask>(`/projects/${projectId}/agents/tasks`, data).then(r => r.data);

export const listAgentTasks = (projectId: string, params?: { status?: string; agent_name?: string; limit?: number }) =>
  api.get<AgentTask[]>(`/projects/${projectId}/agents/tasks`, { params }).then(r => r.data);

export const getAgentTask = (projectId: string, taskId: string) =>
  api.get<AgentTask>(`/projects/${projectId}/agents/tasks/${taskId}`).then(r => r.data);

export const runAgentTask = (projectId: string, taskId: string) =>
  api.post<AgentExecution>(`/projects/${projectId}/agents/tasks/${taskId}/run`).then(r => r.data);

export const cancelAgentTask = (projectId: string, taskId: string) =>
  api.post(`/projects/${projectId}/agents/tasks/${taskId}/cancel`).then(r => r.data);

export const listAgentExecutions = (projectId: string, params?: { agent_name?: string; limit?: number }) =>
  api.get<AgentExecution[]>(`/projects/${projectId}/agents/executions`, { params }).then(r => r.data);

export const getAgentExecution = (projectId: string, executionId: string) =>
  api.get<AgentExecution>(`/projects/${projectId}/agents/executions/${executionId}`).then(r => r.data);

export const createAgentWorkflow = (projectId: string, data: WorkflowChainCreate) =>
  api.post<AgentWorkflow>(`/projects/${projectId}/agents/workflows`, data).then(r => r.data);

export const listAgentWorkflows = (projectId: string) =>
  api.get<AgentWorkflow[]>(`/projects/${projectId}/agents/workflows`).then(r => r.data);

export const getAgentWorkflow = (projectId: string, workflowId: string) =>
  api.get<AgentWorkflow>(`/projects/${projectId}/agents/workflows/${workflowId}`).then(r => r.data);

export const runAgentWorkflow = (projectId: string, workflowId: string) =>
  api.post(`/projects/${projectId}/agents/workflows/${workflowId}/run`).then(r => r.data);

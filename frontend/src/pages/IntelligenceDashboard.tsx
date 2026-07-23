import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useAgentDashboard, useAgentTasks, useAgentExecutions, useAgentWorkflows,
  useCreateAgentTask, useRunAgentTask, useCancelAgentTask, useRunAgentWorkflow,
} from '../hooks/useAgents';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { Select } from '../components/ui/select';
import {
  Bot, BarChart3, BookOpen, Brain, Target, Network, Eye, Sparkles,
  Activity, Clock, CheckCircle, XCircle, TrendingUp, Database, Search,
  Workflow, Layers, Play,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { AgentStatus, AgentExecution, AgentTask, AgentWorkflow } from '../api/types';

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  market_analyst: TrendingUp,
  journal_review: BookOpen,
  performance_monitor: BarChart3,
  coach: Brain,
  curator: Database,
  watcher: Eye,
  learner: Network,
  researcher: Search,
};

const statusToBadgeVariant = (s: string) => {
  if (s === 'completed') return 'success' as const;
  if (s === 'failed') return 'destructive' as const;
  if (s === 'running') return 'info' as const;
  return 'warning' as const;
};

const statusToColor = (s: string) => {
  if (s === 'completed') return 'text-success';
  if (s === 'failed') return 'text-destructive';
  if (s === 'running') return 'text-primary';
  return 'text-warning';
};

export default function IntelligenceDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = projectId!;
  const { data: dashboard, isLoading, error } = useAgentDashboard(pid);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [taskFormAgent, setTaskFormAgent] = useState('');
  const [taskFormType, setTaskFormType] = useState('analyze');
  const [taskFormTitle, setTaskFormTitle] = useState('');

  const createTask = useCreateAgentTask(pid);
  const runTask = useRunAgentTask(pid);
  const cancelTask = useCancelAgentTask(pid);
  const runWorkflow = useRunAgentWorkflow(pid);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load intelligence dashboard" />;

  const agents = dashboard?.agents || [];
  const pendingTasks = dashboard?.pending_tasks || [];
  const recentExecutions = dashboard?.recent_executions || [];
  const workflows = dashboard?.workflows || [];

  const filteredExecutions = selectedAgent === 'all'
    ? recentExecutions
    : recentExecutions.filter(e => e.agent_name === selectedAgent);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            Intelligence OS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-agent system — autonomous research, analysis, and coaching
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Agents"
          value={agents.length}
          icon={Bot}
          trend={{ value: 0, positive: true }}
        />
        <KpiCard
          title="Tasks Today"
          value={dashboard?.total_tasks_today || 0}
          icon={Activity}
          trend={{ value: 0, positive: true }}
        />
        <KpiCard
          title="Discoveries"
          value={dashboard?.total_discoveries || 0}
          icon={Sparkles}
          trend={{ value: 0, positive: true }}
        />
        <KpiCard
          title="Avg Confidence"
          value={dashboard?.avg_confidence ? `${(dashboard.avg_confidence * 100).toFixed(0)}%` : '—'}
          icon={Activity}
          trend={{
            value: dashboard?.success_rate || 0,
            positive: (dashboard?.success_rate || 0) >= 70,
          }}
        />
      </div>

      {/* Agent Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Agent Fleet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const Icon = agentIcons[agent.agent_name] || Bot;
              return (
                <div
                  key={agent.agent_name}
                  className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className={cn('h-2.5 w-2.5 rounded-full', agent.is_available ? 'bg-success' : 'bg-destructive')} />
                      {agent.is_available && (
                        <span className="absolute h-2.5 w-2.5 rounded-full animate-ping bg-success/50" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{agent.display_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {cap.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">{agent.total_tasks_run} runs</span>
                    <span className={cn(
                      'text-xs font-medium',
                      (agent.success_rate || 0) >= 70 ? 'text-success' : (agent.success_rate || 0) >= 40 ? 'text-warning' : 'text-destructive'
                    )}>
                      {agent.success_rate?.toFixed(0) || '—'}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Pending Tasks + Quick Create */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Task Queue
              </div>
              <span className="text-xs text-muted-foreground">{pendingTasks.length} pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 text-success" />
                <p className="text-sm">No pending tasks</p>
                <p className="text-xs">All agents are caught up</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 10).map((task) => {
                  const Icon = agentIcons[task.agent_name] || Bot;
                  return (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.task_type} · {task.agent_name}
                            {task.workflow_id && ' · Workflow'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                          {task.priority > 0 ? `P${task.priority}` : 'Normal'}
                        </Badge>
                        <button
                          onClick={() => runTask.mutate(task.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Run now"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => cancelTask.mutate(task.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Cancel"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Create Task */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Create Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select
                value={taskFormAgent}
                onChange={setTaskFormAgent}
                options={agents.map(a => ({ value: a.agent_name, label: a.display_name }))}
                placeholder="Select agent..."
              />
              <Select
                value={taskFormType}
                onChange={setTaskFormType}
                options={[
                  { value: 'analyze', label: 'Analyze' },
                  { value: 'review', label: 'Review' },
                  { value: 'monitor', label: 'Monitor' },
                  { value: 'curate', label: 'Curate' },
                  { value: 'learn', label: 'Learn' },
                  { value: 'generate', label: 'Generate' },
                ]}
              />
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                <input
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  placeholder="e.g., Weekly performance analysis"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <Button
                className="w-full"
                size="sm"
                disabled={!taskFormAgent || !taskFormTitle}
                onClick={() => {
                  createTask.mutate({
                    agent_name: taskFormAgent,
                    task_type: taskFormType,
                    title: taskFormTitle,
                  });
                  setTaskFormAgent('');
                  setTaskFormType('analyze');
                  setTaskFormTitle('');
                }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Queue Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Executions
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="all">All Agents</option>
                {agents.map(a => (
                  <option key={a.agent_name} value={a.agent_name}>{a.display_name}</option>
                ))}
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredExecutions}
            columns={[
              {
                id: 'agent',
                header: 'Agent',
                accessor: (row: AgentExecution) => {
                  const Icon = agentIcons[row.agent_name] || Bot;
                  const agent = agents.find(a => a.agent_name === row.agent_name);
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">{agent?.display_name || row.agent_name}</span>
                    </div>
                  );
                },
              },
              {
                id: 'task_type',
                header: 'Type',
                accessor: (row: AgentExecution) => (
                  <span className="text-xs text-muted-foreground capitalize">{row.task_type}</span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                accessor: (row: AgentExecution) => (
                  <Badge variant={statusToBadgeVariant(row.status)} className="text-[10px] px-2 py-0.5">
                    {row.status}
                  </Badge>
                ),
              },
              {
                id: 'confidence',
                header: 'Confidence',
                accessor: (row: AgentExecution) => (
                  <span className={cn(
                    'text-xs font-mono',
                    (row.confidence || 0) >= 0.7 ? 'text-success' : (row.confidence || 0) >= 0.4 ? 'text-warning' : 'text-destructive'
                  )}>
                    {row.confidence ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
                  </span>
                ),
              },
              {
                id: 'output_summary',
                header: 'Summary',
                accessor: (row: AgentExecution) => (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {row.output_summary || '—'}
                  </span>
                ),
              },
              {
                id: 'duration',
                header: 'Duration',
                accessor: (row: AgentExecution) => (
                  <span className="text-xs text-muted-foreground font-mono">
                    {row.duration_ms ? `${(row.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </span>
                ),
              },
              {
                id: 'time',
                header: 'Time',
                accessor: (row: AgentExecution) => (
                  <span className="text-xs text-muted-foreground">
                    {row.created_at ? new Date(row.created_at).toLocaleTimeString() : '—'}
                  </span>
                ),
              },
              {
                id: 'discoveries',
                header: 'Discoveries',
                accessor: (row: AgentExecution) => (
                  <span className="text-xs font-medium text-foreground">
                    {row.discoveries?.length || 0}
                  </span>
                ),
              },
            ]}
            searchable={false}
            pageSize={10}
            compact
          />
        </CardContent>
      </Card>

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            Workflow Chains
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Layers className="h-8 w-8 mb-2" />
              <p className="text-sm">No workflows created yet</p>
              <p className="text-xs mt-1">Create a workflow to chain multiple agents together</p>
            </div>
          ) : (
            <DataTable
              data={workflows}
              columns={[
                {
                  id: 'name',
                  header: 'Name',
                  accessor: (row: AgentWorkflow) => (
                    <div>
                      <span className="text-sm font-medium text-foreground">{row.name}</span>
                      {row.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">{row.description}</p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  accessor: (row: AgentWorkflow) => (
                    <Badge variant={row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : 'info'} className="text-[10px] px-2 py-0.5">
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  id: 'steps',
                  header: 'Steps',
                  accessor: (row: AgentWorkflow) => (
                    <span className="text-xs text-muted-foreground">{row.steps?.length || 0} agents</span>
                  ),
                },
                {
                  id: 'runs',
                  header: 'Runs',
                  accessor: (row: AgentWorkflow) => (
                    <span className="text-xs font-mono text-foreground">{row.total_runs}</span>
                  ),
                },
                {
                  id: 'last_run',
                  header: 'Last Run',
                  accessor: (row: AgentWorkflow) => (
                    <div className="flex items-center gap-2">
                      {row.last_run_status ? (
                        <Badge variant={row.last_run_status === 'completed' ? 'success' : 'destructive'} className="text-[10px] px-2 py-0.5">
                          {row.last_run_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never</span>
                      )}
                      {row.last_run_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(row.last_run_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'actions',
                  header: '',
                  accessor: (row: AgentWorkflow) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runWorkflow.mutate(row.id)}
                      disabled={runWorkflow.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  ),
                },
              ]}
              searchable={false}
              pageSize={10}
              compact
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

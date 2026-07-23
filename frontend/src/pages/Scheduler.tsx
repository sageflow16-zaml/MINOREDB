import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useJobs, useCreateJob, useDeleteJob, useUpdateJob, useExecuteJob, useJobExecutions } from '../hooks/useAutomation';
import { Clock, Plus, Trash2, Play, ToggleLeft, ToggleRight, Calendar, History } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const statusColors: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  running: 'bg-primary/10 text-primary',
  pending: 'bg-muted text-muted-foreground',
};

export default function Scheduler() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: jobs = [], isLoading, error } = useJobs(projectId!);
  const createJob = useCreateJob(projectId!);
  const deleteJob = useDeleteJob(projectId!);
  const updateJob = useUpdateJob(projectId!);
  const execJob = useExecuteJob(projectId!);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', job_type: 'one_time', cron_expression: '', timezone: 'UTC', action_type: '', priority: '0' });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: executions = [] } = useJobExecutions(projectId!, selectedJobId || undefined);

  const handleCreate = () => {
    createJob.mutate({
      name: form.name, job_type: form.job_type, cron_expression: form.cron_expression,
      timezone: form.timezone, action_type: form.action_type, priority: parseInt(form.priority),
    }, { onSuccess: () => { setShowForm(false); setForm({ name: '', job_type: 'one_time', cron_expression: '', timezone: 'UTC', action_type: '', priority: '0' }); } });
  };

  const toggleJob = (job: Record<string, unknown>) => {
    updateJob.mutate({ id: job.id as string, data: { enabled: !job.enabled } });
  };

  const jcols = [
    { id: 'name', header: 'Name', accessor: (row: Record<string, unknown>) => <span className="font-medium">{row.name as string}</span> },
    { id: 'job_type', header: 'Type', accessor: (row: Record<string, unknown>) => <Badge variant="info">{(row.job_type as string).replace(/_/g, ' ')}</Badge> },
    { id: 'enabled', header: 'Active', accessor: (row: Record<string, unknown>) => (
      <Button size="icon" variant="ghost" onClick={() => toggleJob(row)}>
        {row.enabled ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
      </Button>
    )},
    { id: 'cron_expression', header: 'Schedule', accessor: (row: Record<string, unknown>) => row.cron_expression ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.cron_expression as string}</code> : '-' },
    { id: 'last_run_at', header: 'Last Run', accessor: (row: Record<string, unknown>) => row.last_run_at ? new Date(row.last_run_at as string).toLocaleString() : '-' },
    { id: 'next_run_at', header: 'Next Run', accessor: (row: Record<string, unknown>) => row.next_run_at ? new Date(row.next_run_at as string).toLocaleString() : '-' },
    { id: 'total_runs', header: 'Runs', accessor: (row: Record<string, unknown>) => (
      <span>{row.total_runs as number} <span className="text-xs text-muted-foreground">({(row.success_runs as number) || 0}/{(row.failed_runs as number) || 0})</span></span>
    )},
    { id: 'actions', header: 'Actions', accessor: (row: Record<string, unknown>) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => execJob.mutate(row.id as string)} title="Execute now"><Play className="w-3.5 h-3.5 text-success" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setSelectedJobId(selectedJobId === row.id ? null : row.id as string)} title="History"><History className="w-3.5 h-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => deleteJob.mutate(row.id as string)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    )},
  ];

  const ecols = [
    { id: 'status', header: 'Status', accessor: (row: Record<string, unknown>) => <Badge className={statusColors[row.status as string] || ''}>{row.status as string}</Badge> },
    { id: 'started_at', header: 'Started', accessor: (row: Record<string, unknown>) => row.started_at ? new Date(row.started_at as string).toLocaleString() : '-' },
    { id: 'duration_ms', header: 'Duration', accessor: (row: Record<string, unknown>) => row.duration_ms ? `${((row.duration_ms as number) / 1000).toFixed(1)}s` : '-' },
    { id: 'retry_count', header: 'Retries', accessor: 'retry_count' },
    { id: 'error', header: 'Error', accessor: (row: Record<string, unknown>) => row.error ? <span className="text-destructive text-xs">{row.error as string}</span> : '-' },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load scheduled jobs" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Task Scheduler"
        description="Schedule one-time and recurring tasks with cron expressions, timezone support, and retry logic"
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Job</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Scheduled Job</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Daily Report" /></div>
              <div><label className="text-xs font-medium mb-1 block">Type</label>
                <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              {form.job_type === 'recurring' && (
                <div><label className="text-xs font-medium mb-1 block">Cron Expression</label><Input value={form.cron_expression} onChange={(e) => setForm({ ...form, cron_expression: e.target.value })} placeholder="0 8 * * 1-5" /></div>
              )}
              <div><label className="text-xs font-medium mb-1 block">Timezone</label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="UTC" /></div>
              <div><label className="text-xs font-medium mb-1 block">Action Type</label><Input value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value })} placeholder="generate_daily_report" /></div>
              <div><label className="text-xs font-medium mb-1 block">Priority</label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!form.name || createJob.isPending}>Create Job</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {jobs.length > 0 ? (
        <DataTable columns={jcols} data={jobs as unknown as Record<string, unknown>[]} />
      ) : (
        <EmptyState title="No scheduled jobs" message="Create a job to schedule automated tasks" />
      )}

      {selectedJobId && (
        <Card>
          <CardHeader><CardTitle><History className="w-4 h-4 mr-2 inline" />Execution History</CardTitle></CardHeader>
          <CardContent>
            {executions.length > 0 ? <DataTable columns={ecols} data={executions as unknown as Record<string, unknown>[]} /> : <div className="text-sm text-muted-foreground text-center py-4">No executions yet</div>}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

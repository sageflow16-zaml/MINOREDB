import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useAutomationDashboard, useWorkflows, useRules, useJobs, useNotifications, useUnreadCount } from '../hooks/useAutomation';
import {
  Workflow, GitBranch, Shield, Clock, Bell, Activity,
  PlayCircle, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Settings, Zap, BarChart3, Bot,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  running: 'bg-primary/10 text-primary-text',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-warning/10 text-warning',
};

export default function AutomationDashboard() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: dashboard, isLoading, error } = useAutomationDashboard(projectId!);
  const { data: workflows = [] } = useWorkflows(projectId!);
  const { data: rules = [] } = useRules(projectId!);
  const { data: jobs = [] } = useJobs(projectId!);
  const { data: notifications = [] } = useNotifications(projectId!, { unread_only: true });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load automation dashboard" />;
  if (!dashboard) return <EmptyState title="No automation data" message="Create your first workflow to get started" />;

  const executionColumns = [
    { id: 'triggered_by', header: 'Trigger', accessor: (row: Record<string, unknown>) => <Badge variant="info">{row.triggered_by as string}</Badge> },
    { id: 'status', header: 'Status', accessor: (row: Record<string, unknown>) => <Badge className={statusColors[row.status as string] || ''}>{row.status as string}</Badge> },
    { id: 'duration_ms', header: 'Duration', accessor: (row: Record<string, unknown>) => row.duration_ms ? `${((row.duration_ms as number) / 1000).toFixed(1)}s` : '-' },
    { id: 'created_at', header: 'Time', accessor: (row: Record<string, unknown>) => row.created_at ? new Date(row.created_at as string).toLocaleString() : '-' },
  ];

  const auditColumns = [
    { id: 'event_type', header: 'Event', accessor: (row: Record<string, unknown>) => <Badge variant="info">{(row.event_type as string).replace(/_/g, ' ')}</Badge> },
    { id: 'summary', header: 'Summary', accessor: 'summary' },
    { id: 'severity', header: 'Severity', accessor: (row: Record<string, unknown>) => <Badge className={(row.severity as string) === 'error' ? 'bg-destructive/10 text-destructive' : (row.severity as string) === 'warning' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}>{(row.severity as string)}</Badge> },
    { id: 'created_at', header: 'Time', accessor: (row: Record<string, unknown>) => row.created_at ? new Date(row.created_at as string).toLocaleString() : '-' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Automation & Workflow Engine"
        description="Automate trading workflows, rules, scheduling, notifications, and AI-driven tasks"
        actions={
          <Link to={`/projects/${projectId}/automation/workflows/new`}>
            <Button><Zap className="w-4 h-4 mr-2" />New Workflow</Button>
          </Link>
        }
      />

      <motion.div variants={itemAnim} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard title="Workflows" value={dashboard.total_workflows} icon={Workflow} trend={dashboard.active_workflows > 0 ? { value: dashboard.active_workflows, positive: true } : undefined} />
        <KpiCard title="Active" value={dashboard.active_workflows} icon={PlayCircle} variant="success" />
        <KpiCard title="Rules" value={dashboard.total_rules} icon={Shield} trend={dashboard.enabled_rules > 0 ? { value: dashboard.enabled_rules, positive: true } : undefined} />
        <KpiCard title="Jobs" value={dashboard.total_jobs} icon={Clock} variant={dashboard.active_jobs > 0 ? 'info' : 'default'} />
        <KpiCard title="Notifications" value={dashboard.total_notifications} icon={Bell} variant={dashboard.unread_notifications > 0 ? 'warning' : 'default'} />
        <KpiCard title="Unread" value={dashboard.unread_notifications} icon={Bell} variant={dashboard.unread_notifications > 0 ? 'danger' : 'default'} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader><CardTitle><Activity className="w-4 h-4 mr-2 inline" />Recent Executions</CardTitle></CardHeader>
            <CardContent>
              {dashboard.recent_executions?.length > 0 ? (
                <DataTable columns={executionColumns} data={dashboard.recent_executions.slice(0, 5) as unknown as Record<string, unknown>[]} />
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent executions</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader><CardTitle><Activity className="w-4 h-4 mr-2 inline" />Recent Audit Logs</CardTitle></CardHeader>
            <CardContent>
              {dashboard.recent_audit_logs?.length > 0 ? (
                <DataTable columns={auditColumns} data={dashboard.recent_audit_logs.slice(0, 5) as unknown as Record<string, unknown>[]} />
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent audit logs</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemAnim} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to={`/projects/${projectId}/automation/workflows`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-primary/10"><Workflow className="w-5 h-5 text-primary-text" /></div>
              <div><div className="font-medium">Workflows</div><div className="text-xs text-muted-foreground">Build & manage</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/rules`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-success/10"><Shield className="w-5 h-5 text-success" /></div>
              <div><div className="font-medium">Rules</div><div className="text-xs text-muted-foreground">If-then logic</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/jobs`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-warning/10"><Clock className="w-5 h-5 text-warning" /></div>
              <div><div className="font-medium">Scheduler</div><div className="text-xs text-muted-foreground">Cron jobs</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/templates`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-info/10"><GitBranch className="w-5 h-5 text-info" /></div>
              <div><div className="font-medium">Templates</div><div className="text-xs text-muted-foreground">Quick start</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/notifications`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-destructive/10"><Bell className="w-5 h-5 text-destructive" /></div>
              <div><div className="font-medium">Notifications</div><div className="text-xs text-muted-foreground">Alerts & channels</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/connectors`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-muted"><Settings className="w-5 h-5 text-muted-foreground" /></div>
              <div><div className="font-medium">Connectors</div><div className="text-xs text-muted-foreground">Integrations</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/audit`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-muted"><BarChart3 className="w-5 h-5 text-muted-foreground" /></div>
              <div><div className="font-medium">Audit Log</div><div className="text-xs text-muted-foreground">History</div></div>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/projects/${projectId}/automation/reports`} className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary-text" /></div>
              <div><div className="font-medium">Reports</div><div className="text-xs text-muted-foreground">Auto-generated</div></div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  );
}

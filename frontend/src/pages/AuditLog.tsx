import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useAuditLogs, useAuditSummary } from '../hooks/useAutomation';
import { BarChart3, Activity, Filter } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const severityColors: Record<string, string> = {
  info: 'bg-muted text-muted-foreground',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

const eventColors: Record<string, string> = {
  workflow_run: 'bg-primary/10 text-primary',
  workflow_created: 'bg-success/10 text-success',
  rule_triggered: 'bg-warning/10 text-warning',
  notification_sent: 'bg-info/10 text-info',
  job_executed: 'bg-muted text-muted-foreground',
};

export default function AuditLog() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [eventFilter, setEventFilter] = useState<string | undefined>(undefined);
  const { data: logs = [], isLoading, error } = useAuditLogs(projectId!, { event_type: eventFilter, limit: 200 });
  const { data: summary = [] } = useAuditSummary(projectId!);

  const columns = [
    { id: 'created_at', header: 'Time', accessor: (row: Record<string, unknown>) => row.created_at ? new Date(row.created_at as string).toLocaleString() : '-' },
    { id: 'event_type', header: 'Event', accessor: (row: Record<string, unknown>) => {
      const v = row.event_type as string;
      return <Badge className={(eventColors[v] || 'bg-muted text-muted-foreground')}>{v.replace(/_/g, ' ')}</Badge>;
    }},
    { id: 'summary', header: 'Summary', accessor: 'summary' },
    { id: 'actor', header: 'Actor', accessor: 'actor' },
    { id: 'source', header: 'Source', accessor: (row: Record<string, unknown>) => row.source ? <Badge variant="outline" className="text-3xs">{row.source as string}</Badge> : '-' },
    { id: 'severity', header: 'Severity', accessor: (row: Record<string, unknown>) => <Badge className={severityColors[row.severity as string] || ''}>{row.severity as string}</Badge> },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load audit logs" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Complete history of automation events, workflow runs, rule triggers, and system actions"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {(summary as Record<string, unknown>[]).map((s) => (
          <Card key={s.event_type as string} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setEventFilter(eventFilter === s.event_type ? undefined : s.event_type as string)}>
            <CardContent className="py-3 text-center">
              <div className="text-lg font-bold">{(s.count as number) || 0}</div>
              <div className="text-xs text-muted-foreground">{(s.event_type as string).replace(/_/g, ' ')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        {eventFilter ? <span>Filtered by: <Badge variant="info">{eventFilter.replace(/_/g, ' ')}</Badge> <button className="text-primary underline" onClick={() => setEventFilter(undefined)}>Clear</button></span> : <span>All events</span>}
        <span className="ml-auto">{logs.length} entries</span>
      </div>

      {logs.length > 0 ? (
        <DataTable columns={columns} data={logs as unknown as Record<string, unknown>[]} />
      ) : (
        <EmptyState title="No audit logs" message="Audit entries will appear here as automation runs" />
      )}
    </motion.div>
  );
}

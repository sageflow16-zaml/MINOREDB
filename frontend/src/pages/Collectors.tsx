import { useParams } from 'react-router-dom';

import {
  useCollectors, useRunCollector, useToggleCollector, useCollectorLogs,
} from '../hooks/useCollectors';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useState } from 'react';
import { Play, ToggleLeft, ToggleRight, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CollectorsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: collectors, isLoading, error, refetch } = useCollectors(projectId!);
  const { data: logs } = useCollectorLogs(projectId!, 25);
  const runCollector = useRunCollector(projectId!);
  const toggleCollector = useToggleCollector(projectId!);
  const [running, setRunning] = useState<string | null>(null);

  const handleRun = async (name: string) => {
    setRunning(name);
    try {
      await runCollector.mutateAsync(name);
    } catch {
      // mutation error handled by hook toast
    } finally {
      setRunning(null);
    }
  };

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      await toggleCollector.mutateAsync({ name, enabled });
    } catch {
      // mutation error handled by hook toast
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading collectors." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Collectors"
        description="Manage automated data collection pipelines"
      />

      {/* Collectors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Collectors</CardTitle>
        </CardHeader>
        {!collectors || collectors.length === 0 ? (
          <CardContent><EmptyState message="No collectors registered." description="Add a collector in the Collectors page to start gathering market data." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Collector</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Enabled</th>
                  <th className="px-4 py-2.5">Last Run</th>
                  <th className="px-4 py-2.5">Next Run</th>
                  <th className="px-4 py-2.5 text-right">Records</th>
                  <th className="px-4 py-2.5 text-right">Errors</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {collectors.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={c.status === 'success' ? 'success' : c.status === 'error' ? 'destructive' : 'default'}
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.enabled ? 'success' : 'secondary'} size="sm">
                        {c.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {c.last_run_at ? new Date(c.last_run_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {c.next_run_at ? new Date(c.next_run_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{c.records_collected}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {c.errors > 0 ? (
                        <span className="text-destructive flex items-center justify-end gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {c.errors}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleRun(c.name)}
                          disabled={running === c.name || !c.enabled}
                          title="Run"
                        >
                          {running === c.name ? <Activity className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggle(c.name, !c.enabled)}
                          title={c.enabled ? 'Disable' : 'Enable'}
                        >
                          {c.enabled ? <ToggleRight className="h-3.5 w-3.5 text-success" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Execution Logs</CardTitle>
        </CardHeader>
        {!logs || logs.length === 0 ? (
          <CardContent><EmptyState message="No logs yet. Run a collector to see execution logs." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Collector</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Records</th>
                  <th className="px-4 py-2.5 text-right">Errors</th>
                  <th className="px-4 py-2.5 text-right">Duration</th>
                  <th className="px-4 py-2.5">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">{log.collector_name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={log.status === 'success' ? 'success' : 'destructive'} size="sm">{log.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{log.records_count}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {log.errors_count > 0 ? (
                        <span className="text-destructive" title={log.error_message || ''}>{log.errors_count}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{log.duration_ms ?? '—'}ms</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

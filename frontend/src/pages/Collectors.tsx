import { useParams } from 'react-router-dom';
import {
  useCollectors,
  useRunCollector,
  useToggleCollector,
  useCollectorLogs,
} from '../hooks/useCollectors';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useState } from 'react';

export default function CollectorsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: collectors, isLoading, error } = useCollectors(projectId!);
  const { data: logs } = useCollectorLogs(projectId!, 25);
  const runCollector = useRunCollector(projectId!);
  const toggleCollector = useToggleCollector(projectId!);
  const [running, setRunning] = useState<string | null>(null);

  const handleRun = async (name: string) => {
    setRunning(name);
    await runCollector.mutateAsync(name);
    setRunning(null);
  };

  const handleToggle = async (name: string, enabled: boolean) => {
    await toggleCollector.mutateAsync({ name, enabled });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading collectors." />;

  return (
    <div className="space-y-8">
      <PageHeader title="Data Collectors" />

      <div className="bg-white dark:bg-slate-900 rounded shadow overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold">Collectors</h3>
        </div>
        {!collectors || collectors.length === 0 ? (
          <EmptyState message="No collectors registered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Collector</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Enabled</th>
                  <th className="px-4 py-3">Last Run</th>
                  <th className="px-4 py-3">Next Run</th>
                  <th className="px-4 py-3 text-right">Records</th>
                  <th className="px-4 py-3 text-right">Errors</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {collectors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : c.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {c.enabled ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {c.last_run_at
                        ? new Date(c.last_run_at).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {c.next_run_at
                        ? new Date(c.next_run_at).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{c.records_collected}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={c.errors > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                        {c.errors}
                      </span>
                      {c.last_error_message && (
                        <span
                          className="ml-1 cursor-help text-red-500"
                          title={c.last_error_message}
                        >
                          ⚠
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleRun(c.name)}
                          disabled={running === c.name || !c.enabled}
                          className="px-2 py-1 text-xs rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {running === c.name ? '...' : 'Run'}
                        </button>
                        <button
                          onClick={() => handleToggle(c.name, !c.enabled)}
                          className={`px-2 py-1 text-xs rounded border ${
                            c.enabled
                              ? 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400'
                              : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
                          }`}
                        >
                          {c.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded shadow overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold">Execution Logs</h3>
        </div>
        {!logs || logs.length === 0 ? (
          <EmptyState message="No logs yet. Run a collector to see execution logs." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Collector</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Records</th>
                  <th className="px-4 py-3 text-right">Errors</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                  <th className="px-4 py-3">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-medium">{log.collector_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{log.records_count}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {log.errors_count > 0 ? (
                        <span className="text-red-600" title={log.error_message || ''}>
                          {log.errors_count}
                        </span>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{log.duration_ms ?? '—'}ms</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

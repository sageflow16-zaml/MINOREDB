import { useParams } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import {
  useLearningEvents,
  useLearningSnapshots,
  useLearningStatus,
  useLearningRebuild,
} from '../hooks/useLearning';

export default function LearningPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const events = useLearningEvents(projectId!);
  const snapshots = useLearningSnapshots(projectId!);
  const status = useLearningStatus(projectId!);
  const rebuild = useLearningRebuild(projectId!);

  const isLoading = events.isLoading || snapshots.isLoading || status.isLoading;
  const isError = events.isError || snapshots.isError || status.isError;

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Error loading learning data." />;

  const eventData = events.data || [];
  const snapshotData = snapshots.data || [];
  const statusData = status.data;

  const growthTimeline = snapshotData
    .slice()
    .reverse()
    .map((s) => ({
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
      trades: s.total_trades,
      patterns: s.total_patterns,
      claims: s.total_claims,
      concepts: s.total_concepts,
      growth: s.knowledge_growth,
    }));

  const learningRate = (() => {
    const byType: Record<string, number> = {};
    for (const e of eventData) {
      byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    }
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  })();

  const knowledgeExpansion = snapshotData
    .slice()
    .reverse()
    .map((s) => ({
      date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
      total: s.total_trades + s.total_patterns + s.total_claims + s.total_concepts + s.total_sources + s.total_interpretations,
    }));

  const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Continuous Learning" />
        <button
          onClick={() => rebuild.mutate()}
          disabled={rebuild.isPending}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {rebuild.isPending ? 'Rebuilding...' : 'Rebuild Learning'}
        </button>
      </div>

      {rebuild.data && (
        <div className={`rounded-lg border p-4 text-sm ${
          rebuild.data.status === 'SUCCESS' ? 'border-green-200 bg-green-50 text-green-800'
          : rebuild.data.status === 'PARTIAL' ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
          : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          Rebuild {rebuild.data.status} in {rebuild.data.duration_ms}ms — Steps: {rebuild.data.steps_completed.join(', ')}
          {rebuild.data.errors.length > 0 && ` — Errors: ${rebuild.data.errors.join(', ')}`}
        </div>
      )}

      {/* Status Cards */}
      {statusData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Total Trades" value={String(statusData.total_trades)} />
          <StatCard title="Total Patterns" value={String(statusData.total_patterns)} />
          <StatCard title="Total Claims" value={String(statusData.total_claims)} />
          <StatCard title="Total Concepts" value={String(statusData.total_concepts)} />
          <StatCard title="Total Sources" value={String(statusData.total_sources)} />
          <StatCard title="Interpretations" value={String(statusData.total_interpretations)} />
          <StatCard title="Market Structures" value={String(statusData.total_market_structures)} />
          <StatCard title="Learning Events" value={String(statusData.total_events)} />
        </div>
      )}

      {/* Charts */}
      {growthTimeline.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Knowledge Growth</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={growthTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="trades" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="patterns" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Area type="monotone" dataKey="claims" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="concepts" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Trades</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Patterns</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Claims</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Concepts</span>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Knowledge Expansion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={knowledgeExpansion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Learning Rate */}
      {learningRate.length > 0 && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Learning Rate by Event Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={learningRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Events Timeline */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Learning Events</h2>
        </div>
        {eventData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No learning events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {eventData.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{e.event_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {e.entity_type ? `${e.entity_type}${e.entity_id ? ` (${e.entity_id.slice(0, 8)})` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[e.status] || 'bg-slate-100 text-slate-800'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{e.duration_ms != null ? `${e.duration_ms}ms` : '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{e.summary || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshots Table */}
      {snapshotData.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Knowledge Snapshots</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Trades</th>
                  <th className="px-4 py-3">Patterns</th>
                  <th className="px-4 py-3">Claims</th>
                  <th className="px-4 py-3">Concepts</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Expectancy</th>
                  <th className="px-4 py-3">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {snapshotData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">{s.total_trades}</td>
                    <td className="px-4 py-3">{s.total_patterns}</td>
                    <td className="px-4 py-3">{s.total_claims}</td>
                    <td className="px-4 py-3">{s.total_concepts}</td>
                    <td className="px-4 py-3">{s.win_rate}%</td>
                    <td className="px-4 py-3">{s.expectancy}</td>
                    <td className="px-4 py-3">
                      <span className={s.knowledge_growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {s.knowledge_growth >= 0 ? '+' : ''}{s.knowledge_growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

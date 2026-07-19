import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import {
  useLearningEvents, useLearningSnapshots, useLearningStatus, useLearningRebuild,
} from '../hooks/useLearning';
import { Brain, RefreshCw, TrendingUp, TrendingDown, Layers, GitBranch, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const statusBadge = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'destructive'> = {
    SUCCESS: 'success', PARTIAL: 'warning', FAILED: 'destructive',
  };
  return map[status] || 'default';
};

export default function LearningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const events = useLearningEvents(projectId!);
  const snapshots = useLearningSnapshots(projectId!);
  const status = useLearningStatus(projectId!);
  const rebuild = useLearningRebuild(projectId!);

  const isLoading = events.isLoading || snapshots.isLoading || status.isLoading;
  const isError = events.isError || snapshots.isError || status.isError;
  const handleRetry = () => { events.refetch(); snapshots.refetch(); status.refetch(); };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Error loading learning data." onRetry={handleRetry} />;

  const eventData = events.data || [];
  const snapshotData = snapshots.data || [];
  const statusData = status.data;

  const growthTimeline = snapshotData.slice().reverse().map((s) => ({
    date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    trades: s.total_trades, patterns: s.total_patterns, claims: s.total_claims,
    concepts: s.total_concepts, growth: s.knowledge_growth,
  }));

  const learningRate = Object.entries(
    eventData.reduce((acc: Record<string, number>, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {}),
  ).map(([type, count]) => ({ type, count }));

  const knowledgeExpansion = snapshotData.slice().reverse().map((s) => ({
    date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    total: s.total_trades + s.total_patterns + s.total_claims + s.total_concepts + s.total_sources + s.total_interpretations,
  }));

  const chartConfig = { stroke: 'hsl(var(--chart-1))', fill: 'hsl(var(--chart-1))' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continuous Learning"
        description="Track knowledge growth and learning events"
      >
        <Button size="sm" onClick={() => rebuild.mutate()} isLoading={rebuild.isPending}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Rebuild Learning
        </Button>
      </PageHeader>

      {rebuild.data && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={cn(
            'border-success/20 bg-success/5',
            rebuild.data.status === 'PARTIAL' && 'border-warning/20 bg-warning/5',
            rebuild.data.status === 'FAILED' && 'border-destructive/20 bg-destructive/5',
          )}>
            <CardContent className="py-3">
              <p className="text-xs">
                <span className="font-medium">Rebuild {rebuild.data.status}</span>
                <span className="text-muted-foreground"> — {rebuild.data.duration_ms}ms — Steps: {rebuild.data.steps_completed.join(', ')}</span>
                {rebuild.data.errors.length > 0 && <span className="text-destructive"> — Errors: {rebuild.data.errors.join(', ')}</span>}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Cards */}
      {statusData && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard title="Total Trades" value={String(statusData.total_trades)} icon={TrendingUp} />
          <KpiCard title="Total Patterns" value={String(statusData.total_patterns)} icon={GitBranch} />
          <KpiCard title="Total Claims" value={String(statusData.total_claims)} icon={Layers} />
          <KpiCard title="Total Concepts" value={String(statusData.total_concepts)} icon={Brain} />
          <KpiCard title="Total Sources" value={String(statusData.total_sources)} icon={BookOpen} />
          <KpiCard title="Interpretations" value={String(statusData.total_interpretations)} icon={BookOpen} />
          <KpiCard title="Market Structures" value={String(statusData.total_market_structures)} icon={GitBranch} />
          <KpiCard title="Learning Events" value={String(statusData.total_events)} icon={RefreshCw} />
        </div>
      )}

      {/* Charts */}
      {growthTimeline.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={growthTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="trades" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="patterns" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="claims" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="concepts" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} /> Trades</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} /> Patterns</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} /> Claims</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }} /> Concepts</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Expansion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={knowledgeExpansion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {learningRate.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Learning Rate by Event Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={learningRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Learning Events</CardTitle>
        </CardHeader>
        {eventData.length === 0 ? (
          <CardContent><p className="text-center text-xs text-muted-foreground py-8">No learning events yet.</p></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Event</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Summary</th>
                  <th className="px-4 py-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eventData.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">{e.event_type}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {e.entity_type ? `${e.entity_type}${e.entity_id ? ` (${e.entity_id.slice(0, 8)})` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={statusBadge(e.status)} size="sm">{e.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.duration_ms != null ? `${e.duration_ms}ms` : '—'}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground">{e.summary || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Snapshots Table */}
      {snapshotData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Knowledge Snapshots</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Trades</th>
                  <th className="px-4 py-2.5">Patterns</th>
                  <th className="px-4 py-2.5">Claims</th>
                  <th className="px-4 py-2.5">Concepts</th>
                  <th className="px-4 py-2.5">Win Rate</th>
                  <th className="px-4 py-2.5">Expectancy</th>
                  <th className="px-4 py-2.5">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshotData.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{s.total_trades}</td>
                    <td className="px-4 py-2.5 text-foreground">{s.total_patterns}</td>
                    <td className="px-4 py-2.5 text-foreground">{s.total_claims}</td>
                    <td className="px-4 py-2.5 text-foreground">{s.total_concepts}</td>
                    <td className="px-4 py-2.5 text-foreground">{s.win_rate}%</td>
                    <td className="px-4 py-2.5 text-foreground">{s.expectancy}</td>
                    <td className="px-4 py-2.5">
                      <span className={s.knowledge_growth >= 0 ? 'text-success' : 'text-destructive'}>
                        {s.knowledge_growth >= 0 ? '+' : ''}{s.knowledge_growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

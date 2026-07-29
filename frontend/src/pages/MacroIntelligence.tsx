import { motion } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { useMacroState, useMacroRefresh } from '../hooks/useMacro';
import { RefreshCw, TrendingUp, DollarSign, BarChart3, Activity, List, Database, AlertCircle } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

const importanceBadge: Record<string, 'destructive' | 'warning' | 'default'> = { high: 'destructive', medium: 'warning', low: 'default' };

function importanceLabel(v: any): string {
  if (typeof v === 'string') return v;
  const n = Number(v);
  if (n >= 4) return 'high';
  if (n >= 2) return 'medium';
  return 'low';
}

export default function MacroIntelligencePage() {
  const state = useMacroState();
  const refresh = useMacroRefresh();

  if (state.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }
  if (state.isError) return <ErrorState message="Error loading macro data." onRetry={() => state.refetch()} />;

  const data = state.data;
  const snapshot = null;
  const todayEvents = data?.events_today || [];
  const upcoming = data?.upcoming_events || [];
  const recent = data?.recent_releases || [];

  const macroTimeline = (todayEvents as any[]).map((e) => {
    const imp = importanceLabel(e.importance);
    return { name: e.event_name || e.title || 'Unknown', importance: imp === 'high' ? 3 : imp === 'medium' ? 2 : 1, actual: e.actual, forecast: e.forecast };
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <PageHeader title="Macro Intelligence" description="Global market data and economic calendar" />
        <Button variant="outline" size="sm" onClick={() => refresh.mutate()} isLoading={refresh.isPending}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </motion.div>

      {/* Market Dashboard Cards — snapshot currently unavailable */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-warning">Market snapshot data is not available. The <code className="text-3xs bg-warning/10 px-1 rounded">market_snapshot</code> table requires a collector to populate it.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard title="DXY" value="--" icon={DollarSign} variant="info" size="sm" />
          <KpiCard title="US10Y" value="--" icon={TrendingUp} variant="info" size="sm" />
          <KpiCard title="US02Y" value="--" icon={TrendingUp} variant="info" size="sm" />
          <KpiCard title="Yield Curve" value="--" icon={Activity} variant="info" size="sm" />
          <KpiCard title="Gold" value="--" icon={BarChart3} variant="info" size="sm" />
          <KpiCard title="Oil" value="--" icon={BarChart3} variant="info" size="sm" />
          <KpiCard title="VIX" value="--" icon={Activity} variant="info" size="sm" />
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Yield History</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-8 w-8 text-muted mb-2" />
              <p className="text-xs text-muted">Chart data unavailable</p>
              <p className="text-3xs text-muted mt-1">No market snapshot history has been collected yet.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">DXY Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-8 w-8 text-muted mb-2" />
              <p className="text-xs text-muted">Chart data unavailable</p>
              <p className="text-3xs text-muted mt-1">No market snapshot history has been collected yet.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Macro Timeline */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Macro Timeline</CardTitle></CardHeader>
          <CardContent>
            {macroTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={macroTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="importance" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Importance" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="h-8 w-8 text-muted mb-2" />
                <p className="text-xs text-muted">No events today</p>
                <p className="text-3xs text-muted mt-1">Events will appear here after the economic calendar collector runs.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Economic Calendar */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Economic Calendar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-3xs font-medium uppercase text-muted-foreground">
                    <th className="px-4 py-2.5">Event</th>
                    <th className="px-4 py-2.5">Country</th>
                    <th className="px-4 py-2.5">Importance</th>
                    <th className="px-4 py-2.5 text-right">Actual</th>
                    <th className="px-4 py-2.5 text-right">Forecast</th>
                    <th className="px-4 py-2.5 text-right">Previous</th>
                    <th className="px-4 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayEvents.map((event: any) => {
                    const name = event.event_name || event.title || 'Unknown';
                    const imp = importanceLabel(event.importance);
                    const time = event.release_time || event.event_date || '';
                    return (
                      <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{event.country || '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={importanceBadge[imp] || 'default'} size="sm">{imp}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right text-foreground">{event.actual ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{event.forecast ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{event.previous ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    );
                  })}
                  {todayEvents.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs">No events today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Events & Recent Releases */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(upcoming as any[]).slice(0, 5).map((event: any) => {
              const name = event.event_name || event.title || 'Unknown';
              const imp = importanceLabel(event.importance);
              const date = event.release_time || event.event_date || '';
              return (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{name}</p>
                    <p className="text-3xs text-muted-foreground">{event.country || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={importanceBadge[imp] || 'default'} size="sm">{imp}</Badge>
                    <span className="text-3xs text-muted-foreground">{date ? new Date(date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Recent Releases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recent as any[]).slice(0, 5).map((event: any) => {
              const name = event.event_name || event.title || 'Unknown';
              return (
                <div key={event.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{name}</p>
                    <p className="text-3xs text-muted-foreground">{event.country || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-foreground">Actual: {event.actual ?? '—'}</p>
                    <p className="text-3xs text-muted-foreground">Forecast: {event.forecast ?? '—'}</p>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No recent releases</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

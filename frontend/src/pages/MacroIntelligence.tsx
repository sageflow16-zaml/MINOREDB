import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { useMacroState, useMacroRefresh } from '../hooks/useMacro';
import { Globe, RefreshCw, TrendingUp, DollarSign, BarChart3, Activity, List, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' };

const importanceBadge: Record<string, 'destructive' | 'warning' | 'default'> = { high: 'destructive', medium: 'warning', low: 'default' };

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
  const snapshot = data?.snapshot;
  const todayEvents = data?.events_today || [];
  const highImpact = data?.high_impact_events || [];
  const upcoming = data?.upcoming_events || [];
  const recent = data?.recent_releases || [];

  const yieldHistory = [{ name: 'Now', us10y: snapshot?.us10y ?? 0, us02y: snapshot?.us02y ?? 0 }];
  const dxyTrend = [{ name: 'Current', dxy: snapshot?.dxy ?? 0 }];
  const macroTimeline = todayEvents.map((e) => ({ name: e.event_name, importance: e.importance === 'high' ? 3 : e.importance === 'medium' ? 2 : 1, actual: e.actual, forecast: e.forecast }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <PageHeader title="Macro Intelligence" description="Global market data and economic calendar" />
        <Button variant="outline" size="sm" onClick={() => refresh.mutate()} isLoading={refresh.isPending}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </motion.div>

      {/* Market Dashboard Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard title="DXY" value={snapshot?.dxy?.toFixed(2) ?? '--'} icon={DollarSign} variant="info" size="sm" />
        <KpiCard title="US10Y" value={snapshot?.us10y != null ? `${snapshot.us10y.toFixed(2)}%` : '--'} icon={TrendingUp} variant="info" size="sm" />
        <KpiCard title="US02Y" value={snapshot?.us02y != null ? `${snapshot.us02y.toFixed(2)}%` : '--'} icon={TrendingUp} variant="info" size="sm" />
        <KpiCard title="Yield Curve" value={snapshot?.yield_curve != null ? `${snapshot.yield_curve.toFixed(2)}%` : '--'} icon={Activity} variant="info" size="sm" />
        <KpiCard title="Gold" value={snapshot?.gold != null ? `$${snapshot.gold.toFixed(0)}` : '--'} icon={BarChart3} variant="info" size="sm" />
        <KpiCard title="Oil" value={snapshot?.oil != null ? `$${snapshot.oil.toFixed(1)}` : '--'} icon={BarChart3} variant="info" size="sm" />
        <KpiCard title="VIX" value={snapshot?.vix?.toFixed(1) ?? '--'} icon={Activity} variant="info" size="sm" />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Yield History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yieldHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="us10y" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="US 10Y" />
                <Bar dataKey="us02y" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="US 02Y" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">DXY Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dxyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="dxy" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Macro Timeline */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Macro Timeline</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={macroTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="importance" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Importance" />
              </BarChart>
            </ResponsiveContainer>
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
                  <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
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
                  {todayEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{event.event_name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{event.country}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={importanceBadge[event.importance] || 'default'} size="sm">{event.importance}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground">{event.actual ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{event.forecast ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{event.previous ?? '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{event.release_time ? new Date(event.release_time).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
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
            {upcoming.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{event.event_name}</p>
                  <p className="text-[10px] text-muted-foreground">{event.country} | {event.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={importanceBadge[event.importance] || 'default'} size="sm">{event.importance}</Badge>
                  <span className="text-[10px] text-muted-foreground">{event.release_time ? new Date(event.release_time).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            ))}
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
            {recent.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{event.event_name}</p>
                  <p className="text-[10px] text-muted-foreground">{event.country} | {event.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-foreground">Actual: {event.actual ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Forecast: {event.forecast ?? '—'}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No recent releases</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

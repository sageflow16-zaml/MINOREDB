import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useTrades } from '../hooks/useTrades';
import { useLearningEvents } from '../hooks/useLearning';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { Alert } from '../components/ui/alert';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import { chartTooltipStyle } from '../lib/chart';
import {
  TrendingUp, BarChart3, DollarSign, Activity,
  BookOpen, Sparkles, Plus, Eye, Award, ChevronRight, Star, Zap,
  Shield, LineChart, Clock, Calendar, ListTodo, Bookmark,
  Brain, Bot, TrendingDown,
} from 'lucide-react';
import { cn } from '../lib/utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCurrentSession(): { label: string; color: string; icon: string } {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return { label: 'Asian', color: 'bg-chart-3', icon: '🌏' };
  if (hour >= 8 && hour < 12) return { label: 'London Open', color: 'bg-chart-1', icon: '🇬🇧' };
  if (hour >= 12 && hour < 16) return { label: 'London/NY Overlap', color: 'bg-chart-2', icon: '🌐' };
  if (hour >= 16 && hour < 21) return { label: 'New York', color: 'bg-chart-4', icon: '🇺🇸' };
  return { label: 'Sydney', color: 'bg-chart-5', icon: '🇦🇺' };
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const quickActions = [
  { label: 'New Trade', icon: Plus, path: 'trades', color: 'text-primary' },
  { label: 'Open Journal', icon: BookOpen, path: 'learning', color: 'text-success' },
  { label: 'Start Replay', icon: Clock, path: 'replay', color: 'text-chart-1' },
  { label: 'Review Trades', icon: Eye, path: 'trades', color: 'text-warning' },
  { label: 'Analyze Performance', icon: TrendingUp, path: 'statistics', color: 'text-chart-2' },
  { label: 'Open Research', icon: Sparkles, path: 'research', color: 'text-chart-3' },
];

const tooltipStyle = chartTooltipStyle.contentStyle;

const economicEvents = [
  { time: '08:30', event: 'US CPI (MoM)', impact: 'high' as const, forecast: '0.3%', previous: '0.2%' },
  { time: '10:00', event: 'US Retail Sales', impact: 'high' as const, forecast: '0.5%', previous: '0.1%' },
  { time: '14:00', event: 'FOMC Minutes', impact: 'high' as const, forecast: '-', previous: '-' },
  { time: '19:00', event: 'API Crude Oil', impact: 'medium' as const, forecast: '-1.2M', previous: '-0.8M' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const trades = useTrades(projectId!);
  const { data: learningEvents } = useLearningEvents(projectId!, 5);

  if (stats.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-2 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ErrorState
          message="Error loading dashboard."
          description="There was a problem fetching your data."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const s = stats.data;
  const isPnlPositive = (s?.total_pnl ?? 0) > 0;
  const winRate = s?.win_rate ?? 0;
  const session = getCurrentSession();
  const today = new Date();

  const equityData = Array.from({ length: 20 }, (_, i) => ({
    day: `Day ${i + 1}`,
    value: (s?.total_pnl ?? 1000) * (1 + Math.sin(i / 3) * 0.2 + Math.random() * 0.1),
  }));

  const weeklyData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    pnl: (Math.random() - 0.3) * 500,
  }));

  const recentTrades = trades.data?.slice(0, 5) ?? [];
  const openTrades = trades.data?.filter((t: any) => t.status === 'OPEN') ?? [];
  const weekPnl = (trades.data ?? [])
    .filter((t: any) => {
      const d = new Date(t.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((sum: number, t: any) => sum + (t.pnl ?? 0), 0);

  return (
    <PageLayout>

      {/* ── Header + Session Sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main header */}
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(today)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
                <div className={cn('h-2 w-2 rounded-full shadow-sm animate-pulse-subtle', session.color)} />
                <span className="text-xs font-medium text-muted-foreground">{session.label} Session</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50 animate-pulse-subtle" />
                <span className="text-xs font-medium text-muted-foreground">Market Open</span>
              </div>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <PageSection title="Quick Actions" description="Common trading tasks" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(`/projects/${projectId}/${action.path}`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all hover:shadow-sm"
                  >
                    <Icon className={cn('h-3.5 w-3.5', action.color)} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </PageSection>
        </div>

        {/* ── Session Sidebar Card ── */}
        <Card className="lg:w-56 shrink-0">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn('h-2.5 w-2.5 rounded-full shadow-sm animate-pulse-subtle', session.color)} />
              <span className="text-xs font-semibold text-foreground">{session.icon} {session.label}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Date</span>
                <span className="text-[11px] font-medium text-foreground">{formatDate(today)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Open Trades</span>
                <span className={cn('text-[11px] font-semibold', openTrades.length > 0 ? 'text-warning' : 'text-muted-foreground')}>
                  {openTrades.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Win Rate</span>
                <span className={cn('text-[11px] font-semibold', winRate >= 50 ? 'text-success' : 'text-destructive')}>
                  {winRate ? `${winRate}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Drawdown</span>
                <span className="text-[11px] font-semibold text-destructive">
                  {s?.max_drawdown != null ? `${s.max_drawdown.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <p className="text-[11px] font-medium text-foreground">Notifications</p>
              <div className="flex items-center gap-2">
                {openTrades.length > 0 && <Badge variant="warning" size="sm">{openTrades.length} open</Badge>}
                {(s?.total_trades ?? 0) > 0 && <Badge variant="info" size="sm">{s?.total_trades} total</Badge>}
                {!openTrades.length && !(s?.total_trades) && (
                  <span className="text-[11px] text-muted-foreground">No notifications</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════ ROW 1: Account KPIs ═══════════════════ */}
      <PageGrid cols={6}>
        <KpiCard
          title="Account Summary"
          value={formatCurrency(s?.total_pnl)}
          icon={DollarSign}
          variant={isPnlPositive ? 'success' : 'danger'}
          trend={s?.total_pnl ? { value: Math.round(Math.abs(s.total_pnl) / 100), positive: isPnlPositive } : undefined}
          onClick={() => navigate(`/projects/${projectId}/statistics`)}
        />
        <KpiCard
          title="Today's PnL"
          value={formatCurrency(
            (trades.data ?? [])
              .filter((t: any) => {
                const d = new Date(t.created_at);
                return d.toDateString() === today.toDateString();
              })
              .reduce((sum: number, t: any) => sum + (t.pnl ?? 0), 0)
          )}
          icon={TrendingUp}
          variant={
            ((trades.data ?? []).filter((t: any) => {
              const d = new Date(t.created_at);
              return d.toDateString() === today.toDateString();
            }).reduce((sum: number, t: any) => sum + (t.pnl ?? 0), 0)) >= 0 ? 'success' : 'danger'
          }
          size="sm"
        />
        <KpiCard
          title="Weekly Performance"
          value={formatCurrency(weekPnl)}
          icon={Activity}
          variant={weekPnl >= 0 ? 'success' : 'danger'}
          size="sm"
          subtitle={s?.total_trades ? `${s.total_trades} trades this period` : undefined}
        />
        <KpiCard
          title="Open Positions"
          value={openTrades.length}
          icon={BarChart3}
          variant={openTrades.length > 0 ? 'warning' : 'default'}
          size="sm"
          subtitle={openTrades.length > 0 ? 'Positions active' : 'No active positions'}
        />
        <KpiCard
          title="Risk Used"
          value={s?.max_drawdown != null ? `${s.max_drawdown.toFixed(1)}%` : '—'}
          icon={Shield}
          variant={(s?.max_drawdown ?? 0) > 20 ? 'danger' : (s?.max_drawdown ?? 0) > 10 ? 'warning' : 'success'}
          size="sm"
          subtitle="Max Drawdown"
        />
        <KpiCard
          title="Win Rate"
          value={winRate ? `${winRate}%` : '0%'}
          icon={Award}
          variant={winRate >= 50 ? 'success' : 'danger'}
          size="sm"
        />
      </PageGrid>

      {/* ═══════════════════ ROW 2: Charts & Economic Calendar ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Equity Curve — 2/4 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {['1W', '1M', '3M', 'All'].map((period) => (
                <button
                  key={period}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                    period === 'All'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Performance — 1/4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">This Week | P&L</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L'] as any} />
                  <Bar dataKey="pnl" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Economic Calendar — 1/4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Economic Calendar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {economicEvents.map((evt, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">{evt.time}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{evt.event}</p>
                    <p className="text-[10px] text-muted-foreground">F: {evt.forecast} | P: {evt.previous}</p>
                  </div>
                </div>
                <Badge
                  variant={evt.impact === 'high' ? 'destructive' : 'warning'}
                  size="sm"
                  className="shrink-0 mt-0.5"
                >
                  {evt.impact}
                </Badge>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}/tradingview`)}>
              View Full Calendar
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════ ROW 3: Active Trades + Recent Journal + Checklist ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trades — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              {openTrades.length > 0 && (
                <Badge variant="warning" size="sm">{openTrades.length} open</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTrades.length > 0 ? (
              <DataTable
                data={recentTrades}
                columns={[
                  { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
                  { id: 'direction', header: 'Dir', accessor: (row: any) => (
                    <span className={cn(row.direction === 'BUY' ? 'text-success' : 'text-destructive')}>
                      {row.direction || '-'}
                    </span>
                  ), width: '40px' },
                  { id: 'pnl', header: 'P&L', accessor: (row: any) => {
                    if (row.pnl == null) return '-';
                    return (
                      <span className={cn('font-medium', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                        {row.pnl >= 0 ? '+' : ''}${row.pnl?.toFixed(2)}
                      </span>
                    );
                  }, width: '100px' },
                  { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '-', width: '60px', hideOnMobile: true },
                  { id: 'result', header: 'Result', accessor: (row: any) => {
                    if (!row.result) return '-';
                    return (
                      <Badge variant={row.result === 'WIN' ? 'success' : row.result === 'LOSS' ? 'destructive' : 'warning'} size="sm">
                        {row.result}
                      </Badge>
                    );
                  }, width: '70px' },
                  { id: 'date', header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), width: '90px', hideOnMobile: true },
                ]}
                searchable={false}
                pageSize={5}
                onRowClick={(row: any) => navigate(`/projects/${projectId}/trades`)}
              />
            ) : (
              <EmptyState
                title="No trades yet"
                description="Create your first trade to start tracking."
                action={<Button size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>New Trade</Button>}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column: Recent Journal + Today's Checklist */}
        <div className="space-y-4">
          {/* Recent Journal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Recent Journal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {learningEvents && learningEvents.length > 0 ? (
                <div className="space-y-2">
                  {learningEvents.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2.5">
                      <div className={cn(
                        'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        event.status === 'completed' ? 'bg-success' : event.status === 'in_progress' ? 'bg-chart-1' : 'bg-muted-foreground/30'
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{event.summary || event.event_type}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={event.status === 'completed' ? 'success' : event.status === 'in_progress' ? 'info' : 'default'} size="sm">
                            {event.status}
                          </Badge>
                          {event.created_at && (
                            <span className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {learningEvents.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}/learning`)}>
                      View All Entries <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No journal entries"
                  description="Start journaling your trades to track your learning."
                  action={<Button size="sm" onClick={() => navigate(`/projects/${projectId}/learning`)}>Open Journal</Button>}
                />
              )}
            </CardContent>
          </Card>

          {/* Today's Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Today's Checklist</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Review open positions', done: openTrades.length > 0 },
                { label: 'Check economic calendar', done: false },
                { label: 'Set stop losses', done: false },
                { label: 'Journal recent trades', done: (learningEvents?.length ?? 0) > 0 },
                { label: 'Review risk limits', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    item.done ? 'bg-primary border-primary' : 'border-input'
                  )}>
                    {item.done && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('text-xs', item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {item.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════ ROW 4: Brief + Research + Knowledge ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Daily Brief — 2/4 */}
        <Card className="lg:col-span-2 cursor-pointer transition-all hover:shadow-md" onClick={() => navigate(`/projects/${projectId}/analyst`)}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">AI Daily Brief</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gradient-to-r from-primary/5 to-chart-2/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Good {getGreeting().toLowerCase().split(' ')[1]}, here's your trading snapshot.
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-success" />
                      {s?.total_trades ? (
                        <>{s?.total_trades} total trades — {winRate}% win rate</>
                      ) : 'No trades yet — start your first trade to generate insights'}
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-chart-1" />
                      {s?.total_collectors ? `${s.active_collectors ?? 0}/${s.total_collectors} collectors active` : 'Configure data collectors in settings'}
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-chart-3" />
                      {s?.graph_nodes ? `${s.graph_nodes} knowledge nodes, ${s.graph_edges} connections` : 'Knowledge graph is empty — add sources to build it'}
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {s?.expectancy != null ? `Expectancy: ${formatCurrency(s.expectancy)} per trade` : 'No expectancy data yet'}
                    </li>
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/analyst`); }}>
                      <Bot className="h-3 w-3 mr-1" /> Full Analysis
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/statistics`); }}>
                      <TrendingUp className="h-3 w-3 mr-1" /> Statistics
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Research Summary — 1/4 */}
        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => navigate(`/projects/${projectId}/research`)}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Research Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Questions</span>
                <span className="text-xs font-semibold text-foreground">{s?.questions ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Concepts</span>
                <span className="text-xs font-semibold text-foreground">{s?.concepts ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Claims</span>
                <span className="text-xs font-semibold text-foreground">{s?.claims ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sources</span>
                <span className="text-xs font-semibold text-foreground">{s?.sources ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interpretations</span>
                <span className="text-xs font-semibold text-foreground">{s?.interpretations ?? '—'}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}/research`)}>
              Go to Research <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Knowledge Highlights + Strategy Performance — 1/4 */}
        <div className="space-y-4">
          {s?.top_knowledge_rule ? (
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/projects/${projectId}/knowledge`)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Top Strategy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="mb-3 text-sm font-semibold text-foreground">{s.top_knowledge_rule.title}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{s.top_knowledge_rule.occurrences}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-lg font-bold text-success">
                      {s.top_knowledge_rule.win_rate != null ? (s.top_knowledge_rule.win_rate * 100).toFixed(0) : '—'}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-lg font-bold text-chart-1">{s.top_knowledge_rule.avg_rr?.toFixed(2) ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">Avg R:R</div>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2 text-center">
                    <div className="text-lg font-bold text-chart-3">{s.top_knowledge_rule.confidence?.toFixed(0) ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Strategy Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">No strategies generated yet. Add more trades to generate insights.</p>
              </CardContent>
            </Card>
          )}

          {/* Knowledge Highlights mini card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Knowledge Highlights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg bg-muted/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Graph Nodes</span>
                  <span className="text-xs font-medium text-foreground">{s?.graph_nodes ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Connections</span>
                  <span className="text-xs font-medium text-foreground">{s?.graph_edges ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Hypotheses</span>
                  <span className="text-xs font-medium text-foreground">{s?.hypotheses ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Conflicts</span>
                  <span className="text-xs font-medium text-foreground">{s?.conflicts ?? '—'}</span>
                </div>
              </div>
              <Alert variant="info" title="Upcoming" className="mt-2">
                NFP Friday — High Impact Economic Release
              </Alert>
              <Alert variant="warning" title="Weekly Review" className="mt-2">
                Your weekly review is due. Review your trades to maintain your journal.
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── AI Insights Banner ── */}
      <button
        onClick={() => navigate(`/projects/${projectId}/analyst`)}
        className="group relative w-full overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-chart-1/5 via-card to-chart-3/5 p-4 text-left transition-all hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Ask the AI Analyst</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Analyze your trading data, discover patterns, or ask anything about your performance.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </button>

    </PageLayout>
  );
}

import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useTrades } from '../hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { Alert } from '../components/ui/alert';
import {
  TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Target,
  BookOpen, Sparkles, ArrowUpRight, Plus, Eye,
  Wallet, Percent, Award, ChevronRight, Star, Zap,
  Shield, LineChart, Clock, Users, Layers,
} from 'lucide-react';
import { cn } from '../lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const quickActions = [
  { label: 'New Trade', icon: Plus, path: 'trades', color: 'text-primary' },
  { label: 'Journal Entry', icon: BookOpen, path: 'learning', color: 'text-success' },
  { label: 'Run Research', icon: Sparkles, path: 'research', color: 'text-chart-3' },
  { label: 'View Charts', icon: Eye, path: 'tradingview', color: 'text-warning' },
];

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: 'var(--shadow-lg)',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const trades = useTrades(projectId!);

  if (stats.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
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

  const equityData = Array.from({ length: 20 }, (_, i) => ({
    day: `Day ${i + 1}`,
    value: (s?.total_pnl ?? 1000) * (1 + Math.sin(i / 3) * 0.2 + Math.random() * 0.1),
  }));

  const recentTrades = trades.data?.slice(0, 5) ?? [];

  return (
    <div className="p-4 md:p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ── */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-success shadow-sm shadow-success/50 animate-pulse-subtle" />
              <span className="text-xs font-medium text-muted-foreground">Market Open</span>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={item} className="flex flex-wrap gap-2">
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
        </motion.div>

        {/* ── Global KPIs ── */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            title="Total P&L"
            value={formatCurrency(s?.total_pnl)}
            icon={DollarSign}
            variant={isPnlPositive ? 'success' : 'danger'}
            trend={s?.total_pnl ? { value: Math.round(Math.abs(s.total_pnl) / 100), positive: isPnlPositive } : undefined}
            onClick={() => navigate(`/projects/${projectId}/statistics`)}
          />
          <KpiCard
            title="Win Rate"
            value={winRate ? `${winRate}%` : '0%'}
            icon={Award}
            variant={winRate >= 50 ? 'success' : 'danger'}
            size="sm"
          />
          <KpiCard
            title="Profit Factor"
            value={s?.profit_factor?.toFixed(2) ?? '—'}
            icon={Activity}
            variant={(s?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'}
            size="sm"
          />
          <KpiCard
            title="Avg R:R"
            value={s?.avg_rr?.toFixed(2) ?? '0.00'}
            icon={Target}
            variant={(s?.avg_rr ?? 0) >= 1.5 ? 'success' : 'info'}
            size="sm"
          />
          <KpiCard
            title="Expectancy"
            value={s?.expectancy != null ? `$${s.expectancy.toFixed(2)}` : '—'}
            icon={TrendingUp}
            variant={(s?.expectancy ?? 0) > 0 ? 'success' : 'danger'}
            size="sm"
          />
          <KpiCard
            title="Open Trades"
            value={s?.open_trades ?? 0}
            icon={BarChart3}
            variant={(s?.open_trades ?? 0) > 0 ? 'warning' : 'default'}
            size="sm"
          />
        </motion.div>

        {/* ── Performance & Risk Row ── */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance (equity curve) — 2/3 */}
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
                      'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
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
              <div className="h-64">
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
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#equityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk panel — 1/3 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Risk Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Max Drawdown</span>
                  <span className="text-sm font-semibold text-destructive">
                    {s?.max_drawdown != null ? `${s.max_drawdown.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
                  <span className="text-sm font-semibold text-foreground">
                    {s?.sharpe_ratio?.toFixed(2) ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Recovery Factor</span>
                  <span className="text-sm font-semibold text-foreground">
                    {s?.recovery_factor?.toFixed(2) ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                  <span className={cn('text-sm font-semibold', winRate >= 50 ? 'text-success' : 'text-destructive')}>
                    {winRate ? `${winRate}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Collector Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Data Collectors</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Macro', status: 'active' as const },
                    { name: 'TV', status: 'active' as const },
                    { name: 'MT5', status: 'idle' as const },
                    { name: 'News', status: 'active' as const },
                    { name: 'Sentiment', status: 'error' as const },
                  ].map((c) => (
                    <div key={c.name} className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 p-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          c.status === 'active' && 'bg-success',
                          c.status === 'idle' && 'bg-muted-foreground/30',
                          c.status === 'error' && 'bg-destructive'
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Activity & Knowledge Row ── */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trades — 2/3 */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/trades`)}
              >
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
                  onRowClick={(row: any) => {
                    navigate(`/projects/${projectId}/trades`);
                  }}
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

          {/* Knowledge & AI — 1/3 */}
          <div className="space-y-4">
            {/* Top Knowledge Rule */}
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
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-foreground">{s.top_knowledge_rule.occurrences}</div>
                      <div className="text-[9px] text-muted-foreground">Trades</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-success">
                        {s.top_knowledge_rule.win_rate != null ? (s.top_knowledge_rule.win_rate * 100).toFixed(0) : '—'}%
                      </div>
                      <div className="text-[9px] text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-chart-1">{s.top_knowledge_rule.avg_rr?.toFixed(2) ?? '—'}</div>
                      <div className="text-[9px] text-muted-foreground">Avg R:R</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-chart-3">{s.top_knowledge_rule.confidence?.toFixed(0) ?? '—'}</div>
                      <div className="text-[9px] text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Knowledge Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">No rules generated yet. Add more trades to generate insights.</p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events / Alerts */}
            <Alert variant="info" title="Upcoming">
              NFP Friday — High Impact Economic Release
            </Alert>

            {/* Quick journal entry reminder */}
            <Alert variant="warning" title="Weekly Review">
              Your weekly review is due. Review your trades to maintain your journal.
            </Alert>
          </div>
        </motion.div>

        {/* ── AI Insights Banner ── */}
        <motion.div variants={item}>
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
        </motion.div>

      </motion.div>
    </div>
  );
}

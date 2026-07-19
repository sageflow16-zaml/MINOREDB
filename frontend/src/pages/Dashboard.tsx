import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useSources } from '../hooks/useSources';
import { useClaims } from '../hooks/useClaims';
import { useTrades } from '../hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import {
  TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Target,
  BookOpen, MessageSquare, Brain, GitBranch, Database, AlertTriangle,
  Sparkles, Clock, Calendar, ArrowUpRight, ArrowDownRight, Plus,
  Search, Eye, LineChart, PieChart as PieChartIcon, Wallet,
  TrendingUp as TrendingUpIcon, Percent, Award, ListTodo,
  Lightbulb, AlertCircle, ChevronRight, Star, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickActions = [
  { label: 'New Trade', icon: Plus, path: 'trades', color: 'text-blue-500' },
  { label: 'Journal Entry', icon: BookOpen, path: 'learning', color: 'text-emerald-500' },
  { label: 'Run Research', icon: Sparkles, path: 'research', color: 'text-purple-500' },
  { label: 'View Charts', icon: Eye, path: 'tradingview', color: 'text-amber-500' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const recentSources = useSources(projectId!);
  const recentClaims = useClaims(projectId!);
  const trades = useTrades(projectId!);

  if (stats.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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
        <ErrorState message="Error loading dashboard." description="There was a problem fetching your data." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const s = stats.data;
  const isPnlPositive = (s?.total_pnl ?? 0) > 0;
  const winRate = s?.win_rate ?? 0;

  const chartData = [
    { name: 'Sources', value: s?.sources || 0 },
    { name: 'Claims', value: s?.claims || 0 },
    { name: 'Concepts', value: s?.concepts || 0 },
    { name: 'Interpretations', value: s?.interpretations || 0 },
  ];

  const sessionData = [
    { name: 'London', trades: Math.round((s?.total_trades ?? 0) * 0.4), wins: Math.round((s?.total_trades ?? 0) * 0.4 * ((s?.win_rate ?? 50) / 100)) },
    { name: 'New York', trades: Math.round((s?.total_trades ?? 0) * 0.35), wins: Math.round((s?.total_trades ?? 0) * 0.35 * ((s?.win_rate ?? 50) / 100)) },
    { name: 'Asian', trades: Math.round((s?.total_trades ?? 0) * 0.25), wins: Math.round((s?.total_trades ?? 0) * 0.25 * ((s?.win_rate ?? 50) / 100)) },
  ];

  return (
    <div className="p-4 md:p-6">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatTime(new Date())} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse-subtle" />
              <span className="text-xs font-medium text-muted-foreground">Market Open</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5">
              <span className="text-[10px] text-muted-foreground">DXY</span>
              <span className="text-xs font-semibold">104.32</span>
              <span className="text-[10px] text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5" />0.12%</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(`/projects/${projectId}/${action.path}`)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all hover:shadow-sm'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', action.color)} />
                {action.label}
              </button>
            );
          })}
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <KpiCard title="Total P&L" value={s?.total_pnl != null ? `$${s.total_pnl.toFixed(2)}` : '—'} icon={DollarSign} variant={isPnlPositive ? 'success' : 'danger'} />
          <KpiCard title="Win Rate" value={winRate ? `${winRate}%` : '0%'} icon={Percent} variant={winRate >= 50 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Profit Factor" value={s?.profit_factor?.toFixed(2) ?? '—'} icon={Activity} variant={(s?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
          <KpiCard title="Avg R:R" value={s?.avg_rr?.toFixed(2) ?? '0.00'} icon={Target} variant="info" size="sm" />
          <KpiCard title="Expectancy" value={s?.expectancy != null ? `$${s.expectancy.toFixed(2)}` : '—'} icon={TrendingUp} variant={(s?.expectancy ?? 0) > 0 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Open Trades" value={s?.open_trades ?? 0} icon={BarChart3} variant={(s?.open_trades ?? 0) > 0 ? 'warning' : 'default'} size="sm" />
        </motion.div>

        {/* Main Grid: 2-column layout */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Research Pipeline</CardTitle>
                </div>
                <Badge variant="secondary" size="sm">Last 30 days</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                          boxShadow: 'var(--shadow-lg)',
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card>
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
                {trades.data && trades.data.length > 0 ? (
                  <DataTable
                    data={trades.data.slice(0, 5)}
                    columns={[
                      { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
                      { id: 'direction', header: 'Dir', accessor: (row: any) => (
                        <span className={row.direction === 'BUY' ? 'text-emerald-500' : 'text-red-500'}>
                          {row.direction || '-'}
                        </span>
                      ), width: '40px' },
                      { id: 'entry', header: 'Entry', accessor: (row: any) => row.entry_price?.toFixed(5) ?? '-', width: '100px', hideOnMobile: true },
                      { id: 'pnl', header: 'P&L', accessor: (row: any) => {
                        if (!row.pnl) return '-';
                        return <span className={row.pnl >= 0 ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>${row.pnl?.toFixed(2)}</span>;
                      }, width: '80px' },
                      { id: 'result', header: 'Result', accessor: (row: any) => {
                        if (!row.result) return '-';
                        const colors: Record<string, string> = { WIN: 'text-emerald-500', LOSS: 'text-red-500', BE: 'text-yellow-500' };
                        return <Badge variant={row.result === 'WIN' ? 'success' : row.result === 'LOSS' ? 'destructive' : 'warning'} size="sm">{row.result}</Badge>;
                      }, width: '70px' },
                      { id: 'date', header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), width: '90px', hideOnMobile: true },
                    ]}
                    searchable={false}
                    pageSize={5}
                  />
                ) : (
                  <EmptyState title="No trades yet" description="Create your first trade to start tracking." />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Insights Panel */}
          <div className="space-y-6">
            {/* Session Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Session Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="trades" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={16} />
                      <Bar dataKey="wins" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] text-muted-foreground">Trades</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="text-[10px] text-muted-foreground">Wins</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Context */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Market Context</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Bullish Bias</span>
                    <span className="text-sm font-semibold text-emerald-500">{s?.bullish_bias ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Bearish Bias</span>
                    <span className="text-sm font-semibold text-red-500">{s?.bearish_bias ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Phase</span>
                    <Badge variant="secondary" size="sm">{s?.current_market_phase || '—'}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <Badge variant="secondary" size="sm">{s?.current_trend || '—'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Knowledge Rule */}
            {s?.top_knowledge_rule && (
              <Card
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => navigate(`/projects/${projectId}/knowledge`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Top Rule</CardTitle>
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
                      <div className="text-lg font-bold text-emerald-500">{s.top_knowledge_rule.win_rate != null ? (s.top_knowledge_rule.win_rate * 100).toFixed(0) : '—'}%</div>
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
            )}

            {/* Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Distribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {chartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[9px] text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Bottom: Collectors + Graph Stats */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Collectors" value={s?.total_collectors ?? 0} icon={Database} variant="info" size="sm" />
            <KpiCard title="Active" value={s?.active_collectors ?? 0} icon={Activity} variant="success" size="sm" />
            <KpiCard title="Records" value={s?.collector_records ?? 0} icon={Database} variant="info" size="sm" />
            <KpiCard title="Errors" value={s?.collector_errors ?? 0} icon={AlertTriangle} variant={(s?.collector_errors ?? 0) > 0 ? 'danger' : 'default'} size="sm" />
            <KpiCard title="Graph Nodes" value={s?.graph_nodes ?? 0} icon={GitBranch} variant="info" size="sm" />
            <KpiCard title="Graph Edges" value={s?.graph_edges ?? 0} icon={GitBranch} variant="info" size="sm" />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Recent Sources</CardTitle>
              </div>
              <Badge variant="secondary" size="sm">{recentSources.data?.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {recentSources.data && recentSources.data.length > 0 ? (
                <DataTable
                  data={recentSources.data.slice(0, 5)}
                  columns={[
                    { id: 'title', header: 'Title', accessor: (row: any) => (row as { title?: string }).title || (row as { id?: string }).id?.substring(0, 8) || '-' },
                    { id: 'date', header: 'Date', accessor: (row: any) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                  ]}
                  keyExtractor={(row: any) => (row as { id?: string }).id || String(Math.random())}
                  searchable={false}
                  pageSize={5}
                />
              ) : (
                <EmptyState title="No sources yet" description="Add one to get started." icon={<BookOpen className="h-6 w-6" />} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Recent Claims</CardTitle>
              </div>
              <Badge variant="secondary" size="sm">{recentClaims.data?.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {recentClaims.data && recentClaims.data.length > 0 ? (
                <DataTable
                  data={recentClaims.data.slice(0, 5)}
                  columns={[
                    { id: 'text', header: 'Verbatim', accessor: (row: any) => {
                      const text = (row as { verbatim_text?: string }).verbatim_text || '';
                      return text.length > 40 ? text.substring(0, 40) + '...' : text || '-';
                    }},
                    { id: 'date', header: 'Date', accessor: (row: any) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                  ]}
                  keyExtractor={(row: any) => (row as { id?: string }).id || String(Math.random())}
                  searchable={false}
                  pageSize={5}
                />
              ) : (
                <EmptyState title="No claims extracted yet." icon={<MessageSquare className="h-6 w-6" />} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

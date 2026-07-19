import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboard';
import { useSources } from '../hooks/useSources';
import { useClaims } from '../hooks/useClaims';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Target, BookOpen, MessageSquare, Brain, GitBranch, Database, AlertTriangle, Sparkles, Clock, Calendar, ArrowUpRight, ArrowDownRight, Plus, Search, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

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
  { label: 'New Trade', icon: Plus, path: 'trades', color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Journal Entry', icon: BookOpen, path: 'journal', color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Add Source', icon: Search, path: 'sources', color: 'text-purple-500 bg-purple-500/10' },
  { label: 'Run Analysis', icon: Sparkles, path: 'analyst', color: 'text-amber-500 bg-amber-500/10' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const recentSources = useSources(projectId!);
  const recentClaims = useClaims(projectId!);

  if (stats.isLoading || recentSources.isLoading || recentClaims.isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (stats.isError || recentSources.isError || recentClaims.isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ErrorState message="Error loading dashboard." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const chartData = [
    { name: 'Sources', value: stats.data?.sources || 0 },
    { name: 'Claims', value: stats.data?.claims || 0 },
    { name: 'Concepts', value: stats.data?.concepts || 0 },
    { name: 'Interpretations', value: stats.data?.interpretations || 0 },
  ];

  const s = stats.data;
  const isPnlPositive = (s?.total_pnl ?? 0) > 0;
  const pnlColor = isPnlPositive ? 'text-emerald-500' : 'text-red-500';
  const winRate = s?.win_rate ?? 0;

  const sessionData = [
    { name: 'London', trades: Math.round((s?.total_trades ?? 0) * 0.4), wins: Math.round((s?.total_trades ?? 0) * 0.4 * ((s?.win_rate ?? 50) / 100)) },
    { name: 'New York', trades: Math.round((s?.total_trades ?? 0) * 0.35), wins: Math.round((s?.total_trades ?? 0) * 0.35 * ((s?.win_rate ?? 50) / 100)) },
    { name: 'Asian', trades: Math.round((s?.total_trades ?? 0) * 0.25), wins: Math.round((s?.total_trades ?? 0) * 0.25 * ((s?.win_rate ?? 50) / 100)) },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6">
        {/* Greeting + Market Status */}
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatTime(new Date())} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse-subtle" />
              <span className="text-xs font-medium text-muted-foreground">Market Open</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2">
              <span className="text-xs text-muted-foreground">DXY</span>
              <span className="text-xs font-semibold">104.32</span>
              <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />0.12%</span>
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
                  'flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium transition-all hover:shadow-sm',
                  action.color.replace('bg-', 'hover:bg-').replace('/10', '/20')
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </motion.div>

        {/* Performance KPI Cards */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total P&L" value={s?.total_pnl != null ? `$${s.total_pnl.toFixed(2)}` : '—'} icon={DollarSign} variant={isPnlPositive ? 'success' : 'danger'} />
            <KpiCard title="Win Rate" value={winRate ? `${winRate}%` : '0%'} icon={Target} variant={winRate >= 50 ? 'success' : 'danger'} />
            <KpiCard title="Profit Factor" value={s?.profit_factor?.toFixed(2) ?? '—'} icon={Activity} variant={(s?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'} />
            <KpiCard title="Avg R:R" value={s?.avg_rr?.toFixed(2) ?? '0.00'} icon={BarChart3} variant="info" />
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Expectancy" value={s?.expectancy != null ? `$${s.expectancy.toFixed(2)}` : '—'} icon={Activity} variant={(s?.expectancy ?? 0) > 0 ? 'success' : 'danger'} />
            <KpiCard title="Max Drawdown" value={s?.max_drawdown?.toFixed(2) ?? '—'} icon={TrendingDown} variant={(s?.max_drawdown ?? 0) < 0 ? 'danger' : 'default'} />
            <KpiCard title="Total Trades" value={s?.total_trades ?? 0} icon={BarChart3} variant="info" />
            <KpiCard title="Open Trades" value={s?.open_trades ?? 0} icon={Activity} variant={(s?.open_trades ?? 0) > 0 ? 'warning' : 'default'} />
          </div>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Research Pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Research Pipeline</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Last 30 days</Badge>
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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={4}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {chartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Session Performance + Market Context */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Session Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Session Performance</CardTitle>
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
                    <Bar dataKey="trades" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    <Bar dataKey="wins" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} maxBarSize={20} />
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Market Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Bullish Bias</span>
                  <span className="text-sm font-semibold text-emerald-500">{s?.bullish_bias ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Bearish Bias</span>
                  <span className="text-sm font-semibold text-red-500">{s?.bearish_bias ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Current Phase</span>
                  <Badge variant="secondary">{s?.current_market_phase ?? '—'}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Current Trend</span>
                  <Badge variant="secondary">{s?.current_trend ?? '—'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Knowledge Rule */}
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => navigate(`/projects/${projectId}/knowledge`)}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Knowledge Rule</CardTitle>
            </CardHeader>
            <CardContent>
              {s?.top_knowledge_rule ? (
                <>
                  <h4 className="mb-3 text-base font-semibold text-foreground">{s.top_knowledge_rule.title}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-foreground">{s.top_knowledge_rule.occurrences}</div>
                      <div className="text-[10px] text-muted-foreground">Trades</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-emerald-500">{s.top_knowledge_rule.win_rate != null ? (s.top_knowledge_rule.win_rate * 100).toFixed(0) : '—'}%</div>
                      <div className="text-[10px] text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-blue-500">{s.top_knowledge_rule.avg_rr?.toFixed(2) ?? '—'}</div>
                      <div className="text-[10px] text-muted-foreground">Avg R:R</div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <div className="text-lg font-bold text-purple-500">{s.top_knowledge_rule.confidence?.toFixed(0) ?? '—'}</div>
                      <div className="text-[10px] text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">No rules generated yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Collectors + Graph Stats */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <KpiCard title="Collectors" value={s?.total_collectors ?? 0} icon={Database} variant="info" />
            <KpiCard title="Active" value={s?.active_collectors ?? 0} icon={Activity} variant="success" />
            <KpiCard title="Records" value={s?.collector_records ?? 0} icon={Database} variant="info" />
            <KpiCard title="Errors" value={s?.collector_errors ?? 0} icon={AlertTriangle} variant={(s?.collector_errors ?? 0) > 0 ? 'danger' : 'default'} />
            <KpiCard title="Graph Nodes" value={s?.graph_nodes ?? 0} icon={GitBranch} variant="info" />
            <KpiCard title="Graph Edges" value={s?.graph_edges ?? 0} icon={GitBranch} variant="info" />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Sources */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Sources</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">{recentSources.data?.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {recentSources.data && recentSources.data.length > 0 ? (
                <DataTable
                  data={recentSources.data.slice(0, 5)}
                  columns={[
                    { header: 'Title', accessor: (row) => (row as { title?: string }).title || (row as { id?: string }).id?.substring(0, 8) || '-' },
                    { header: 'Date', accessor: (row) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                  ]}
                  keyExtractor={(row) => (row as { id?: string }).id || String(Math.random())}
                  searchable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No sources yet. Add one to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Claims */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Claims</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">{recentClaims.data?.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {recentClaims.data && recentClaims.data.length > 0 ? (
                <DataTable
                  data={recentClaims.data.slice(0, 5)}
                  columns={[
                    { header: 'Verbatim', accessor: (row) => {
                      const text = (row as { verbatim_text?: string }).verbatim_text || '';
                      return text.length > 40 ? text.substring(0, 40) + '...' : text || '-';
                    }},
                    { header: 'Date', accessor: (row) => (row as { created_at?: string }).created_at || '-', hideOnMobile: true },
                  ]}
                  keyExtractor={(row) => (row as { id?: string }).id || String(Math.random())}
                  searchable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No claims extracted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDashboardStats } from '../hooks/useDashboard';
import { useTrades } from '../hooks/useTrades';
import { useLearningEvents } from '../hooks/useLearning';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  TrendingUp, BarChart3, DollarSign, Activity,
  BookOpen, Sparkles, Plus, Award,
  Brain, Bot, ChevronRight, ArrowUpRight, ArrowDownRight,
  CalendarDays,
} from 'lucide-react';
import { cn } from '../lib/utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getCurrentSession(): { label: string; dot: string } {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return { label: 'Asian', dot: 'bg-[#22C55E]' };
  if (hour >= 8 && hour < 12) return { label: 'London Open', dot: 'bg-[#4F46E5]' };
  if (hour >= 12 && hour < 16) return { label: 'London/NY Overlap', dot: 'bg-[#F59E0B]' };
  if (hour >= 16 && hour < 21) return { label: 'New York', dot: 'bg-[#EF4444]' };
  return { label: 'Sydney', dot: 'bg-[#A1A1AA]' };
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function KpiCard({ title, value, icon: Icon, trend, subtitle, variant = 'default', onClick }: {
  title: string; value: string | number; icon?: any; trend?: { value: number; positive?: boolean };
  subtitle?: string; variant?: 'default' | 'success' | 'warning' | 'danger'; onClick?: () => void;
}) {
  const accentMap = {
    default: { bg: 'bg-[#4F46E5]/10', text: 'text-[#4F46E5]' },
    success: { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]' },
    warning: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]' },
    danger: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]' },
  };
  const accent = accentMap[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        'relative overflow-hidden rounded-xl border border-[#27272A] bg-[#18181B] p-4 transition-all',
        onClick && 'cursor-pointer hover:border-[#27272A]/80 hover:bg-[#18181B]/80'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-medium text-[#71717A] tracking-wide">{title}</p>
          <p className="text-xl font-bold tracking-tight text-[#FAFAFA] font-mono">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-[#71717A]">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-0.5">
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3 text-[#22C55E]" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-[#EF4444]" />
              )}
              <span className={cn('text-xs font-medium', trend.positive ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent.bg)}>
            <Icon className={cn('h-4 w-4', accent.text)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

const tooltipStyle = chartTooltipStyle.contentStyle;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const stats = useDashboardStats(projectId!);
  const trades = useTrades(projectId!);
  const { data: learningEvents } = useLearningEvents(projectId!, 5);
  const [equityPeriod, setEquityPeriod] = useState('1M');

  if (stats.isLoading) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Skeleton className="h-72 rounded-xl col-span-3" />
          <Skeleton className="h-72 rounded-xl col-span-1" />
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10">
            <TrendingUp className="h-6 w-6 text-[#EF4444]" />
          </div>
          <p className="text-sm font-medium text-[#FAFAFA]">Error loading dashboard</p>
          <p className="text-xs text-[#71717A]">There was a problem fetching your data.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const s = stats.data;
  const isPnlPositive = (s?.total_pnl ?? 0) > 0;
  const winRate = s?.win_rate ?? 0;
  const session = getCurrentSession();
  const today = new Date();

  const periodDays: Record<string, number> = { '1W': 7, '1M': 20, '3M': 60, 'All': 100 };
  const days = periodDays[equityPeriod] ?? 20;
  const equityData = Array.from({ length: days }, (_, i) => ({
    day: equityPeriod === '1W' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7] || `Day ${i + 1}`
      : equityPeriod === 'All' ? `W${Math.floor(i / 5) + 1}`
      : `Day ${i + 1}`,
    value: (s?.total_pnl ?? 1000) * (1 + Math.sin(i / (days / 4)) * 0.2 + (Math.random() - 0.5) * 0.1),
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

  const todayPnl = (trades.data ?? [])
    .filter((t: any) => {
      const d = new Date(t.created_at);
      return d.toDateString() === today.toDateString();
    })
    .reduce((sum: number, t: any) => sum + (t.pnl ?? 0), 0);

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">{getGreeting()}</h1>
          <p className="text-sm text-[#71717A] mt-0.5">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5">
            <span className={cn('h-2 w-2 rounded-full', session.dot)} />
            <span className="text-xs font-medium text-[#A1A1AA]">{session.label} Session</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <span className="text-xs font-medium text-[#A1A1AA]">Market Open</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Total P&L"
          value={formatCurrency(s?.total_pnl)}
          icon={DollarSign}
          variant={isPnlPositive ? 'success' : 'danger'}
          trend={s?.total_pnl ? { value: Math.round(Math.abs(s.total_pnl) / 100), positive: isPnlPositive } : undefined}
          onClick={() => navigate(`/projects/${projectId}/statistics`)}
        />
        <KpiCard
          title="Today's P&L"
          value={formatCurrency(todayPnl)}
          icon={TrendingUp}
          variant={todayPnl >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          title="Weekly P&L"
          value={formatCurrency(weekPnl)}
          icon={Activity}
          variant={weekPnl >= 0 ? 'success' : 'danger'}
          subtitle={s?.total_trades ? `${s.total_trades} trades` : undefined}
        />
        <KpiCard
          title="Open Positions"
          value={openTrades.length}
          icon={BarChart3}
          variant={openTrades.length > 0 ? 'warning' : 'default'}
          subtitle={openTrades.length > 0 ? 'Active positions' : 'No positions'}
        />
        <KpiCard
          title="Max Drawdown"
          value={s?.max_drawdown != null ? `${s.max_drawdown.toFixed(1)}%` : '—'}
          icon={Award}
          variant={(s?.max_drawdown ?? 0) > 20 ? 'danger' : (s?.max_drawdown ?? 0) > 10 ? 'warning' : 'success'}
        />
        <KpiCard
          title="Win Rate"
          value={winRate ? `${winRate}%` : '0%'}
          icon={Award}
          variant={winRate >= 50 ? 'success' : 'danger'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Equity Curve */}
        <div className="lg:col-span-3 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#71717A]" />
              <h3 className="text-sm font-medium text-[#FAFAFA]">Equity Curve</h3>
            </div>
            <div className="flex items-center gap-1">
              {(['1W', '1M', '3M', 'All'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setEquityPeriod(period)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    equityPeriod === period
                      ? 'bg-[#4F46E5]/10 text-[#4F46E5]'
                      : 'text-[#71717A] hover:text-[#A1A1AA]'
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} {...chartDefaultProps}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fill="url(#equityGradient)" dot={false} activeDot={{ r: 4, fill: '#4F46E5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly P&L Mini Chart */}
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">This Week</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} {...chartDefaultProps}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                <Bar
                  dataKey="pnl"
                  shape={(props: any) => {
                    const { x, y, width, height, fill } = props;
                    const isPositive = height < 0;
                    return (
                      <rect
                        x={x}
                        y={isPositive ? y + height : y}
                        width={width}
                        height={Math.abs(height)}
                        fill={isPositive ? '#22C55E' : '#EF4444'}
                        rx={3}
                        ry={3}
                      />
                    );
                  }}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Trades + AI Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Trades */}
        <div className="lg:col-span-2 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#71717A]" />
              <h3 className="text-sm font-medium text-[#FAFAFA]">Active Trades</h3>
              {openTrades.length > 0 && (
                <Badge variant="warning" size="sm">{openTrades.length} open</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {recentTrades.length > 0 ? (
            <DataTable
              data={recentTrades}
              columns={[
                { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
                { id: 'direction', header: 'Dir', accessor: (row: any) => (
                  <span className={cn(row.direction === 'BUY' ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                    {row.direction || '-'}
                  </span>
                ), width: '40px' },
                { id: 'pnl', header: 'P&L', accessor: (row: any) => {
                  if (row.pnl == null) return '-';
                  return (
                    <span className={cn('font-medium font-mono', row.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]">
                <BarChart3 className="h-5 w-5 text-[#71717A]" />
              </div>
              <p className="text-sm font-medium text-[#A1A1AA]">No trades yet</p>
              <p className="text-xs text-[#71717A] mt-1">Create your first trade to start tracking.</p>
              <Button size="sm" className="mt-4" onClick={() => navigate(`/projects/${projectId}/trades`)}>
                <Plus className="h-3 w-3 mr-1.5" /> New Trade
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel: AI Brief + Quick Actions */}
        <div className="space-y-4">
          {/* AI Daily Brief */}
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5 cursor-pointer transition-all hover:border-[#27272A]/80" onClick={() => navigate(`/projects/${projectId}/analyst`)}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-[#4F46E5]" />
              <h3 className="text-sm font-medium text-[#FAFAFA]">AI Daily Brief</h3>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-[#4F46E5]/5 to-[#22C55E]/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F46E5]/10">
                  <Bot className="h-4 w-4 text-[#4F46E5]" />
                </div>
                <div className="text-xs text-[#A1A1AA] space-y-1.5 leading-relaxed">
                  <p>{s?.total_trades ? `${s.total_trades} total trades with ${winRate}% win rate` : 'No trades yet — add your first trade to generate insights.'}</p>
                  <p>{s?.expectancy != null ? `Expectancy: ${formatCurrency(s.expectancy)} per trade` : 'No expectancy data yet'}</p>
                  <p>{s?.graph_nodes ? `${s.graph_nodes} knowledge nodes, ${s.graph_edges} connections` : 'Knowledge graph is empty — add sources to build it'}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/analyst`); }}>
                <Bot className="h-3 w-3 mr-1" /> Full Analysis
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/statistics`); }}>
                Statistics
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#71717A]" />
              <h3 className="text-sm font-medium text-[#FAFAFA]">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Trade', icon: Plus, path: 'trades' },
                { label: 'Journal', icon: BookOpen, path: 'learning' },
                { label: 'Analyze', icon: TrendingUp, path: 'statistics' },
                { label: 'Research', icon: Sparkles, path: 'research' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(`/projects/${projectId}/${action.path}`)}
                    className="flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#27272A]/80 transition-all"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#4F46E5]" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Journal */}
          {(learningEvents?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-[#71717A]" />
                <h3 className="text-sm font-medium text-[#FAFAFA]">Recent Journal</h3>
              </div>
              <div className="space-y-2">
                {learningEvents!.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex items-start gap-2.5 rounded-lg bg-[#111113] p-2.5">
                    <span className={cn(
                      'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                      event.status === 'completed' ? 'bg-[#22C55E]' : event.status === 'in_progress' ? 'bg-[#4F46E5]' : 'bg-[#71717A]'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#A1A1AA] truncate">{event.summary || event.event_type}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={event.status === 'completed' ? 'success' : event.status === 'in_progress' ? 'info' : 'default'} size="sm">
                          {event.status}
                        </Badge>
                        {event.created_at && (
                          <span className="text-[10px] text-[#71717A]">{new Date(event.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {learningEvents!.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}/learning`)}>
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

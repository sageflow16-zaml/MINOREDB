import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import {
  useStatisticsOverview,
  useStatisticsBySession,
  useStatisticsByWeekday,
  useStatisticsByPair,
  useStatisticsByStrategy,
  useEquityCurve,
  useMonthlyReturns,
  useWeeklyReturns,
  useRiskAnalytics,
  usePsychologyAnalytics,
} from '../hooks/useStatistics';
import { useTrades } from '../hooks/useTrades';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/Feedback';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  TrendingUp, BarChart3, DollarSign, Target, Award, Shield,
  Brain, Sparkles, ChevronRight, Clock, CalendarDays, Download,
  Activity, Search, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const tooltipStyle = chartTooltipStyle.contentStyle;

function MetricCard({ label, value, icon: Icon, accent, sub, trend }: { label: string; value: string; icon: any; accent?: 'success' | 'danger' | 'warning' | 'default'; sub?: string; trend?: { value: number; positive: boolean } }) {
  const accentColors = { default: 'text-foreground', success: 'text-success', danger: 'text-danger-text', warning: 'text-warning' };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-2xs font-medium text-muted tracking-wide">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accent === 'success' ? 'bg-success/10' : accent === 'danger' ? 'bg-danger/10' : 'bg-primary/10')}>
          <Icon className={cn('h-3.5 w-3.5', accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger-text' : 'text-primary-text')} />
        </div>
      </div>
      <p className={cn('text-xl font-bold font-mono tracking-tight', accentColors[accent || 'default'])}>{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={cn('text-3xs font-medium flex items-center gap-0.5', trend.positive ? 'text-success' : 'text-danger-text')}>
            {trend.positive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {trend.value}%
          </span>
        )}
        {sub && <span className="text-3xs text-muted">{sub}</span>}
      </div>
    </motion.div>
  );
}

function InsightBadge({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
      <span className="text-xs text-secondary">{label}</span>
      <span className={cn('text-xs font-mono font-medium', good === undefined ? 'text-foreground' : good ? 'text-success' : 'text-danger-text')}>{value}</span>
    </div>
  );
}

function BreakdownBar({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} {...chartDefaultProps}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function PerformancePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('1Y');

  const overview = useStatisticsOverview(projectId!);
  const equityCurve = useEquityCurve(projectId!);
  const sessionData = useStatisticsBySession(projectId!);
  const weekdayData = useStatisticsByWeekday(projectId!);
  const pairData = useStatisticsByPair(projectId!);
  const strategyData = useStatisticsByStrategy(projectId!);
  const monthlyReturns = useMonthlyReturns(projectId!);
  const weeklyReturns = useWeeklyReturns(projectId!);
  const riskAnalytics = useRiskAnalytics(projectId!);
  const psychData = usePsychologyAnalytics(projectId!);
  const trades = useTrades(projectId!);

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  const handleRetry = useCallback(() => {
    overview.refetch(); equityCurve.refetch(); sessionData.refetch(); weekdayData.refetch();
    pairData.refetch(); strategyData.refetch(); monthlyReturns.refetch(); weeklyReturns.refetch();
    riskAnalytics.refetch(); psychData.refetch(); trades.refetch();
  }, []);

  const equityData = useMemo(() => (equityCurve.data ?? []).map((p: any) => ({ date: p.date ? new Date(p.date).toLocaleDateString() : '', equity: p.equity })), [equityCurve.data]);

  const monthlyChartData = useMemo(() => (monthlyReturns.data ?? []).slice(-12).map((m: any) => ({ label: m.month ? m.month.substring(0, 7) : '', pnl: m.pnl || 0 })), [monthlyReturns.data]);

  const weeklyChartData = useMemo(() => (weeklyReturns.data ?? []).slice(-26).map((w: any) => ({ label: w.week?.substring(5, 10) || '', pnl: w.pnl || 0 })), [weeklyReturns.data]);

  const sessionStats = useMemo(() => {
    if (!sessionData.data) return [];
    return Object.entries(sessionData.data).map(([key, val]: any) => ({ label: key, winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0 }));
  }, [sessionData.data]);

  const weekdayStats = useMemo(() => {
    if (!weekdayData.data) return [];
    return Object.entries(weekdayData.data).map(([key, val]: any) => ({ label: key.substring(0, 3), winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0 }));
  }, [weekdayData.data]);

  const pairStats = useMemo(() => {
    if (!pairData.data) return [];
    return Object.entries(pairData.data).map(([key, val]: any) => ({ label: key, pnl: val.pnl || 0, trades: val.trades || 0 }));
  }, [pairData.data]);

  const strategyStats = useMemo(() => {
    if (!strategyData.data) return [];
    return Object.entries(strategyData.data).map(([key, val]: any) => ({ label: key, pnl: val.pnl || 0, trades: val.trades || 0, winRate: val.win_rate || 0 }));
  }, [strategyData.data]);

  const exportCSV = useCallback(() => {
    const o = overview.data?.overview;
    if (!o) return;
    const rows = [['Metric', 'Value'], ['Total Trades', String(o.total_trades)], ['Win Rate', `${o.win_rate}%`], ['Total P&L', String(o.total_pnl)], ['Avg R:R', String(o.avg_rr)], ['Expectancy', String(o.expectancy)], ['Profit Factor', String(overview.data?.risk?.profit_factor ?? '')], ['Max Drawdown', String(overview.data?.risk?.max_drawdown ?? '')]];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'performance.csv'; a.click(); URL.revokeObjectURL(url);
  }, [overview.data]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-60" /></div><Skeleton className="h-8 w-28 rounded-lg" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-24" /></div>))}</div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div>
      </div>
    );
  }

  if (isError) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10"><TrendingUp className="h-6 w-6 text-danger-text" /></div><p className="text-sm font-medium text-foreground">Error loading performance</p><p className="text-xs text-muted">There was a problem fetching performance data.</p><Button variant="outline" size="sm" onClick={handleRetry}>Try Again</Button></div></div>);
  }

  const o = overview.data?.overview;
  const r = overview.data?.risk;
  const ra = riskAnalytics.data;
  const p = psychData.data;

  if (!o || o.total_trades === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-xl font-semibold text-foreground tracking-tight">Performance</h1><p className="text-sm text-muted mt-0.5">Institutional performance reporting</p></div></div>
        <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="No performance data yet" description="Complete trades to unlock institutional-grade performance reporting and analytics." action={<Button size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>Start Trading</Button>} />
      </div>
    );
  }

  const isPnlPositive = o.total_pnl >= 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Performance</h1><p className="text-sm text-muted mt-0.5">Institutional performance reporting</p></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            {['1M', '3M', '6M', '1Y', 'All'].map((p) => (<button key={p} onClick={() => setDateRange(p)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', dateRange === p ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>{p}</button>))}
          </div>
          <Button variant="ghost" size="icon" onClick={exportCSV} aria-label="Export"><Download className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {/* Executive Summary — 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Net Return" value={formatCurrency(o.total_pnl)} icon={DollarSign} accent={isPnlPositive ? 'success' : 'danger'} trend={o.win_rate ? { value: o.win_rate, positive: o.win_rate >= 50 } : undefined} />
        <MetricCard label="Total P&L" value={formatCurrency(o.total_pnl)} icon={TrendingUp} accent={isPnlPositive ? 'success' : 'danger'} sub={`${o.total_trades} trades`} />
        <MetricCard label="Win Rate" value={`${o.win_rate}%`} icon={Target} accent={o.win_rate >= 50 ? 'success' : 'danger'} sub={`${o.wins}W / ${o.losses}L`} />
        <MetricCard label="Profit Factor" value={r?.profit_factor ? r.profit_factor.toFixed(2) : '—'} icon={Shield} accent={(r?.profit_factor ?? 0) >= 1.5 ? 'success' : (r?.profit_factor ?? 0) >= 1 ? 'warning' : 'danger'} />
        <MetricCard label="Avg R:R" value={o.avg_rr ? o.avg_rr.toFixed(2) : '—'} icon={Activity} accent={o.avg_rr >= 1.5 ? 'success' : o.avg_rr >= 1 ? 'warning' : 'danger'} />
        <MetricCard label="Expectancy" value={formatCurrency(o.expectancy)} icon={Target} accent={o.expectancy >= 0 ? 'success' : 'danger'} sub="per trade" />
        <MetricCard label="Max Drawdown" value={r?.max_drawdown ? `${Math.abs(r.max_drawdown).toFixed(1)}%` : '—'} icon={TrendingDown} accent={Math.abs(r?.max_drawdown ?? 0) > 20 ? 'danger' : Math.abs(r?.max_drawdown ?? 0) > 10 ? 'warning' : 'success'} />
        <MetricCard label="CAGR" value={r?.sharpe_ratio ? `${(r.sharpe_ratio * 10).toFixed(1)}%` : '—'} icon={Award} accent={(r?.sharpe_ratio ?? 0) >= 1 ? 'success' : 'warning'} />
      </div>

      {/* Hero Equity Curve */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Equity Curve</h3></div>
          <div className="flex items-center gap-1">
            {['1W', '1M', '3M', 'All'].map((p) => (<button key={p} onClick={() => setDateRange(p)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', dateRange === p ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>{p}</button>))}
          </div>
        </div>
        <div className="h-72">
          {equityData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Wallet className="mx-auto h-6 w-6 text-muted mb-2" />
                <p className="text-sm text-muted">Equity curve not available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} {...chartDefaultProps}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Equity']} />
                <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.08)" dot={false} activeDot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
      </motion.div>

      {/* Monthly + Weekly Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Monthly Returns</h3></div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} {...chartDefaultProps}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" shape={(p: any) => { const h = Math.abs(p.height); return <rect x={p.x} y={p.height < 0 ? p.y + p.height : p.y} width={p.width} height={h} fill={p.height < 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} rx={3} ry={3} />; }} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Weekly Returns</h3></div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} {...chartDefaultProps}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" shape={(p: any) => { const h = Math.abs(p.height); return <rect x={p.x} y={p.height < 0 ? p.y + p.height : p.y} width={p.width} height={h} fill={p.height < 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} rx={3} ry={3} />; }} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Breakdown Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Session */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Clock className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">By Session</h3></div>
          {sessionStats.length > 0 ? (<div className="h-44"><BreakdownBar data={sessionStats} dataKey="winRate" color="hsl(var(--primary))" /></div>) : (<div className="flex h-44 items-center justify-center"><p className="text-xs text-muted">No session data</p></div>)}
        </motion.div>

        {/* By Day */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><CalendarDays className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">By Day of Week</h3></div>
          {weekdayStats.length > 0 ? (<div className="h-44"><BreakdownBar data={weekdayStats} dataKey="winRate" color="hsl(var(--success))" /></div>) : (<div className="flex h-44 items-center justify-center"><p className="text-xs text-muted">No weekday data</p></div>)}
        </motion.div>

        {/* By Symbol */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">By Symbol</h3></div>
          {pairStats.length > 0 ? (
            <div className="space-y-1">
              {pairStats.slice(0, 8).map((p: any) => (
                <div key={p.label} className="flex items-center justify-between rounded-md bg-background px-3 py-1.5"><span className="text-xs text-secondary">{p.label}</span><span className={cn('text-xs font-mono font-medium', p.pnl >= 0 ? 'text-success' : 'text-danger-text')}>{formatCurrency(p.pnl)}</span></div>
              ))}
            </div>
          ) : (<div className="flex h-44 items-center justify-center"><p className="text-xs text-muted">No symbol data</p></div>)}
        </motion.div>

        {/* By Strategy */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Target className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">By Strategy</h3></div>
          {strategyStats.length > 0 ? (
            <div className="space-y-1">
              {strategyStats.slice(0, 8).map((s: any) => (
                <div key={s.label} className="flex items-center justify-between rounded-md bg-background px-3 py-1.5"><span className="text-xs text-secondary truncate flex-1">{s.label}</span><span className={cn('text-xs font-mono font-medium ml-2', s.winRate >= 50 ? 'text-success' : 'text-danger-text')}>{s.winRate}%</span></div>
              ))}
            </div>
          ) : (<div className="flex h-44 items-center justify-center"><p className="text-xs text-muted">No strategy data</p></div>)}
        </motion.div>
      </div>

      {/* Advanced Metrics + Risk Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Award className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Risk Analytics</h3></div>
          <div className="grid grid-cols-2 gap-2">
            <InsightBadge label="Avg Risk/Trade" value={ra?.avg_risk_percent ? `${ra.avg_risk_percent.toFixed(1)}%` : '—'} good={ra ? ra.avg_risk_percent <= 2 : undefined} />
            <InsightBadge label="Max Position" value={ra?.max_position_size ? formatCurrency(ra.max_position_size) : '—'} />
            <InsightBadge label="Rule Violations" value={String(ra?.rule_violations ?? 0)} good={!ra?.rule_violations} />
            <InsightBadge label="Drawdown Duration" value={ra?.drawdown_analysis?.avg_dd_duration_days ? `${ra.drawdown_analysis.avg_dd_duration_days}d` : '—'} good={false} />
            <InsightBadge label="Total Exposure" value={ra?.total_exposure ? formatCurrency(ra.total_exposure) : '—'} />
            <InsightBadge label="Consecutive Wins" value={String(o.wins)} good />
            <InsightBadge label="Consecutive Losses" value={String(o.losses)} good={false} />
            <InsightBadge label="Recovery Factor" value={r?.recovery_factor?.toFixed(2) ?? '—'} good={(r?.recovery_factor ?? 0) >= 1} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Brain className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Psychology</h3></div>
          {p ? (
            <div className="grid grid-cols-2 gap-2">
              <InsightBadge label="FOMO Entries" value={String(p.fomo_frequency)} good={p.fomo_frequency <= 2} />
              <InsightBadge label="Revenge Trades" value={String(p.revenge_trades)} good={!p.revenge_trades} />
              <InsightBadge label="Early Exits" value={String(p.early_exits)} good={p.early_exits <= 3} />
              <InsightBadge label="Late Entries" value={String(p.late_entries)} good={p.late_entries <= 3} />
              <InsightBadge label="Missed Setups" value={String(p.missed_setups)} />
              <InsightBadge label="Overtrading Days" value={String(p.overtrading_days)} good={p.overtrading_days <= 3} />
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center"><p className="text-xs text-muted">No psychology data yet. Add more trades.</p></div>
          )}
        </motion.div>
      </div>

      {/* AI Summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-primary-text" /><h3 className="text-sm font-medium text-foreground">Performance Summary</h3></div>
        <div className="rounded-lg bg-gradient-to-r from-primary/5 to-success/5 p-4">
          <p className="text-sm text-secondary leading-relaxed">
            {o.total_trades > 0
              ? `Across ${o.total_trades} trades (${o.wins}W / ${o.losses}L), your win rate is ${o.win_rate}% with an average R:R of ${o.avg_rr?.toFixed(2) ?? 'N/A'}. `
              + `Your profit factor of ${r?.profit_factor?.toFixed(2) ?? 'N/A'} indicates ${(r?.profit_factor ?? 0) >= 1.5 ? 'strong risk-adjusted returns.' : 'room for improvement in risk management.'} `
              + `Expectancy of ${formatCurrency(o.expectancy)} per trade means your strategy is ${o.expectancy >= 0 ? 'profitable overall.' : 'losing money on average.'} `
              + `${ra?.drawdown_analysis?.num_drawdowns ? `${ra.drawdown_analysis.num_drawdowns} drawdown periods with avg duration of ${ra.drawdown_analysis.avg_dd_duration_days?.toFixed(0) ?? 'N/A'} days.` : ''}`
              : 'No trading activity yet. Start trading to generate performance insights.'
            }
          </p>
        </div>
      </motion.div>

      {/* Trade Detail Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Search className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Trade History</h3><span className="text-2xs text-muted font-mono">({o.total_trades})</span></div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>View All <ChevronRight className="ml-1 h-3 w-3" /></Button>
        </div>
        {trades.data && trades.data.length > 0 ? (
          <DataTable
            data={trades.data.slice(0, 15)}
            columns={[
              { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
              { id: 'direction', header: 'Dir', accessor: (row: any) => (<span className={cn(row.direction === 'BUY' ? 'text-success' : 'text-danger-text')}>{row.direction || '-'}</span>), width: '40px' },
              { id: 'pnl', header: 'P&L', accessor: (row: any) => row.pnl != null ? (<span className={cn('font-medium font-mono', row.pnl >= 0 ? 'text-success' : 'text-danger-text')}>{row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}</span>) : '-', width: '100px' },
              { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '-', width: '60px' },
              { id: 'session', header: 'Session', accessor: (row: any) => row.session || '-', width: '80px', hideOnMobile: true },
              { id: 'result', header: 'Result', accessor: (row: any) => row.result ? <Badge variant={row.result === 'WIN' ? 'success' : row.result === 'LOSS' ? 'destructive' : 'warning'} size="sm">{row.result}</Badge> : '-', width: '70px' },
              { id: 'date', header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), width: '90px', hideOnMobile: true },
            ]}
            searchable={true}
            pageSize={15}
            onRowClick={(row: any) => navigate(`/projects/${projectId}/trades`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-elevated"><BarChart3 className="h-5 w-5 text-muted" /></div>
            <p className="text-sm font-medium text-secondary">No trades to display</p>
            <Button size="sm" className="mt-3" onClick={() => navigate(`/projects/${projectId}/trades`)}>Create Trade</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

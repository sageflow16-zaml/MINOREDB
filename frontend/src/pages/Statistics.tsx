import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import {
  useStatisticsOverview,
  useStatisticsBySession,
  useStatisticsByWeekday,
  useEquityCurve,
  useMonthlyReturns,
  useRollingStats,
  useRrDistribution,
} from '../hooks/useStatistics';
import { useTrades } from '../hooks/useTrades';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  TrendingUp, BarChart3, DollarSign, Target, Award, Shield,
  Brain, Sparkles, ChevronRight, Clock, CalendarDays, Download,
  AlertTriangle, Zap, Activity, Search, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, TrendingDown, Wallet,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const tooltipStyle = chartTooltipStyle.contentStyle;
const CHART_COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#A1A1AA'];

function StatCard({ label, value, icon: Icon, accent, sub }: { label: string; value: string; icon: any; accent?: 'success' | 'danger' | 'warning' | 'default'; sub?: string }) {
  const accentColors = { default: 'text-[#FAFAFA]', success: 'text-[#22C55E]', danger: 'text-[#EF4444]', warning: 'text-[#F59E0B]' };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-medium text-[#71717A] tracking-wide">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accent === 'success' ? 'bg-[#22C55E]/10' : accent === 'danger' ? 'bg-[#EF4444]/10' : 'bg-[#4F46E5]/10')}>
          <Icon className={cn('h-3.5 w-3.5', accent === 'success' ? 'text-[#22C55E]' : accent === 'danger' ? 'text-[#EF4444]' : 'text-[#4F46E5]')} />
        </div>
      </div>
      <p className={cn('text-lg font-bold font-mono tracking-tight', accentColors[accent || 'default'])}>{value}</p>
      {sub && <p className="text-[10px] text-[#71717A] mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function InsightBadge({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2">
      <span className="text-xs text-[#A1A1AA]">{label}</span>
      <span className={cn('text-xs font-mono font-medium', good === undefined ? 'text-[#FAFAFA]' : good ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{value}</span>
    </div>
  );
}

function MiniBarChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} {...chartDefaultProps}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717A' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function StatisticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const overview = useStatisticsOverview(projectId!);
  const equityCurve = useEquityCurve(projectId!);
  const sessionData = useStatisticsBySession(projectId!);
  const weekdayData = useStatisticsByWeekday(projectId!);
  const monthlyReturns = useMonthlyReturns(projectId!);
  const rolling10 = useRollingStats(projectId!, 10);
  const rolling50 = useRollingStats(projectId!, 50);
  const rrDist = useRrDistribution(projectId!);
  const trades = useTrades(projectId!);
  const [timeRange, setTimeRange] = useState('all');

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  const handleRetry = () => {
    overview.refetch();
    equityCurve.refetch();
    sessionData.refetch();
    weekdayData.refetch();
    monthlyReturns.refetch();
    rolling10.refetch();
    rolling50.refetch();
    rrDist.refetch();
    trades.refetch();
  };

  const equityData = useMemo(() => (equityCurve.data ?? []).map((p: any) => ({ date: p.date ? new Date(p.date).toLocaleDateString() : '', equity: p.equity })), [equityCurve.data]);

  const sessionChartData = useMemo(() => {
    if (!sessionData.data) return [];
    return Object.entries(sessionData.data).map(([key, val]: any) => ({ label: key, winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0 }));
  }, [sessionData.data]);

  const weekdayChartData = useMemo(() => {
    if (!weekdayData.data) return [];
    return Object.entries(weekdayData.data).map(([key, val]: any) => ({ label: key.substring(0, 3), winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0 }));
  }, [weekdayData.data]);

  const monthlyChartData = useMemo(() => (monthlyReturns.data ?? []).slice(-12).map((m: any) => ({ label: m.month ? m.month.substring(0, 7) : '', pnl: m.pnl || 0 })), [monthlyReturns.data]);

  const rrChartData = useMemo(() => {
    const d = rrDist.data;
    if (!d || !d.bins || d.bins.length === 0) return [];
    return d.bins.slice(0, -1).map((bin: number, i: number) => ({ label: bin.toFixed(1), count: (d.counts?.[i] ?? 0) }));
  }, [rrDist.data]);

  const winLossData = useMemo(() => {
    const o = overview.data?.overview;
    if (!o) return [];
    return [
      { name: 'Wins', value: o.wins, color: '#22C55E' },
      { name: 'Losses', value: o.losses, color: '#EF4444' },
      { name: 'Breakeven', value: o.breakevens, color: '#71717A' },
    ].filter(d => d.value > 0);
  }, [overview.data]);

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 space-y-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-24" /></div>))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-56 rounded-xl" /><Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"><BarChart3 className="h-6 w-6 text-[#EF4444]" /></div>
          <p className="text-sm font-medium text-[#FAFAFA]">Error loading statistics</p>
          <p className="text-xs text-[#71717A]">There was a problem fetching statistics.</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>Try Again</Button>
        </div>
      </div>
    );
  }

  const o = overview.data?.overview;
  const r = overview.data?.risk;

  const isPnlPositive = (o?.total_pnl ?? 0) >= 0;
  const hasData = o && o.total_trades > 0;

  if (!hasData) {
    return (
      <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Statistics</h1><p className="text-sm text-[#71717A] mt-0.5">Comprehensive trading metrics</p></div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#27272A]"><BarChart3 className="h-6 w-6 text-[#71717A]" /></div>
          <p className="text-sm font-medium text-[#A1A1AA]">No statistics yet</p>
          <p className="text-xs text-[#71717A] mt-1 max-w-sm">Complete some trades to see your performance statistics and unlock quantitative insights.</p>
          <Button size="sm" className="mt-5" onClick={() => navigate(`/projects/${projectId}/trades`)}>Create First Trade</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Statistics</h1>
          <p className="text-sm text-[#71717A] mt-0.5">Quantitative analysis of your trading data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#27272A] bg-[#111113] p-0.5">
            {['1M', '3M', '6M', 'All'].map((p) => (<button key={p} onClick={() => setTimeRange(p.toLowerCase())} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', timeRange === p.toLowerCase() ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>{p}</button>))}
          </div>
          <Button variant="ghost" size="icon" aria-label="Export"><Download className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Trades" value={String(o.total_trades)} icon={BarChart3} sub={`${o.closed_trades} closed, ${o.open_trades} open`} />
        <StatCard label="Win Rate" value={`${o.win_rate}%`} icon={Target} accent={o.win_rate >= 50 ? 'success' : 'danger'} sub={`${o.wins}W / ${o.losses}L`} />
        <StatCard label="Avg R:R" value={o.avg_rr ? o.avg_rr.toFixed(2) : '—'} icon={Activity} accent={o.avg_rr >= 1.5 ? 'success' : o.avg_rr >= 1 ? 'warning' : 'danger'} />
        <StatCard label="Profit Factor" value={r?.profit_factor ? Number(r.profit_factor).toFixed(2) : '—'} icon={Shield} accent={(r?.profit_factor ?? 0) >= 1.5 ? 'success' : (r?.profit_factor ?? 0) >= 1 ? 'warning' : 'danger'} />
        <StatCard label="Expectancy" value={formatCurrency(o.expectancy)} icon={TrendingUp} accent={o.expectancy >= 0 ? 'success' : 'danger'} sub="per trade" />
        <StatCard label="Net P&L" value={formatCurrency(o.total_pnl)} icon={DollarSign} accent={isPnlPositive ? 'success' : 'danger'} />
      </div>

      {/* Equity Curve + Win/Loss Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-3 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#71717A]" />
              <h3 className="text-sm font-medium text-[#FAFAFA]">Equity Curve</h3>
            </div>
            <div className="flex items-center gap-1">
              {['1W', '1M', '3M', 'All'].map((p) => (<button key={p} onClick={() => setTimeRange(p.toLowerCase())} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', timeRange === p.toLowerCase() ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>{p}</button>))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData.length > 0 ? equityData : [{ date: 'No data', equity: 0 }]} {...chartDefaultProps}>
                <defs><linearGradient id="statEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="equity" stroke="#4F46E5" strokeWidth={2} fill="url(#statEquity)" dot={false} activeDot={{ r: 4, fill: '#4F46E5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Win/Loss Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Win / Loss</h3>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={36} outerRadius={56} dataKey="value" paddingAngle={3}>
                  {winLossData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Trades']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {winLossData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-[10px] text-[#71717A]">{d.name}: {d.value}</span></div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <InsightBadge label="Avg Winner" value={formatCurrency(o.avg_win)} good />
            <InsightBadge label="Avg Loser" value={formatCurrency(Math.abs(o.avg_loss))} good={false} />
          </div>
        </motion.div>
      </div>

      {/* Main Analytics Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Returns */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Monthly Returns</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} {...chartDefaultProps}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                <Bar dataKey="pnl" shape={(p: any) => { const h = Math.abs(p.height); const y = p.height < 0 ? p.y + p.height : p.y; return <rect x={p.x} y={y} width={p.width} height={h} fill={p.height < 0 ? '#22C55E' : '#EF4444'} rx={3} ry={3} />; }} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* RR Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">R:R Distribution</h3>
          </div>
          {rrChartData.length > 0 ? (
            <div className="h-48"><MiniBarChart data={rrChartData} dataKey="count" color="#F59E0B" /></div>
          ) : (
            <div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No R:R distribution data available</p></div>
          )}
        </motion.div>

        {/* Session Performance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Session Performance</h3>
          </div>
          {sessionChartData.length > 0 ? (
            <div className="h-48"><MiniBarChart data={sessionChartData} dataKey="winRate" color="#4F46E5" /></div>
          ) : (<div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No session data</p></div>)}
          {sessionChartData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sessionChartData.map((s: any) => (<div key={s.label} className="flex items-center gap-1.5 rounded-md bg-[#111113] px-2 py-1"><span className="text-[10px] text-[#A1A1AA]">{s.label}</span><span className={cn('text-[10px] font-mono font-medium', s.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{s.winRate}%</span></div>))}
            </div>
          )}
        </motion.div>

        {/* Day of Week */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Day of Week</h3>
          </div>
          {weekdayChartData.length > 0 ? (
            <div className="h-48"><MiniBarChart data={weekdayChartData} dataKey="winRate" color="#22C55E" /></div>
          ) : (<div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No weekday data</p></div>)}
          {weekdayChartData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weekdayChartData.map((d: any) => (<div key={d.label} className="flex items-center gap-1.5 rounded-md bg-[#111113] px-2 py-1"><span className="text-[10px] text-[#A1A1AA]">{d.label}</span><span className={cn('text-[10px] font-mono font-medium', d.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{d.winRate}%</span></div>))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Advanced Statistics */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-4 w-4 text-[#71717A]" />
          <h3 className="text-sm font-medium text-[#FAFAFA]">Advanced Metrics</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InsightBadge label="Largest Win" value={formatCurrency(o.avg_win)} good />
          <InsightBadge label="Largest Loss" value={formatCurrency(Math.abs(o.avg_loss))} good={false} />
          <InsightBadge label="Avg Winner" value={formatCurrency(o.avg_win)} good />
          <InsightBadge label="Avg Loser" value={formatCurrency(Math.abs(o.avg_loss))} good={false} />
          <InsightBadge label="Win Rate" value={`${o.win_rate}%`} good={o.win_rate >= 50} />
          <InsightBadge label="Sharpe Ratio" value={r?.sharpe_ratio?.toFixed(2) ?? '—'} good={(r?.sharpe_ratio ?? 0) >= 1} />
          <InsightBadge label="Recovery Factor" value={r?.recovery_factor?.toFixed(2) ?? '—'} good={(r?.recovery_factor ?? 0) >= 1} />
          <InsightBadge label="Max Drawdown" value={r?.max_drawdown ? formatCurrency(Math.abs(r.max_drawdown)) : '—'} good={false} />
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-[#71717A]">
          <span>Breakevens: {o.breakevens}</span>
          <span className="h-1 w-1 rounded-full bg-[#27272A]" />
          <span>Closed: {o.closed_trades}</span>
          <span className="h-1 w-1 rounded-full bg-[#27272A]" />
          <span>Open: {o.open_trades}</span>
        </div>
      </motion.div>

      {/* Rolling Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Last 10 Trades</h3>
          </div>
          {rolling10.data?.available ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className="text-lg font-bold text-[#FAFAFA] font-mono">{rolling10.data.trades}</p><p className="text-[10px] text-[#71717A] mt-0.5">Trades</p></div>
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className="text-lg font-bold text-[#22C55E] font-mono">{rolling10.data.win_rate}%</p><p className="text-[10px] text-[#71717A] mt-0.5">Win Rate</p></div>
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className={cn('text-lg font-bold font-mono', rolling10.data.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{rolling10.data.pnl >= 0 ? '+' : ''}{rolling10.data.pnl.toFixed(0)}</p><p className="text-[10px] text-[#71717A] mt-0.5">P&L</p></div>
            </div>
          ) : (<p className="py-6 text-center text-xs text-[#71717A]">Need {rolling10.data?.trades_needed ?? 10} more trades</p>)}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Last 50 Trades</h3>
          </div>
          {rolling50.data?.available ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className="text-lg font-bold text-[#FAFAFA] font-mono">{rolling50.data.trades}</p><p className="text-[10px] text-[#71717A] mt-0.5">Trades</p></div>
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className="text-lg font-bold text-[#22C55E] font-mono">{rolling50.data.win_rate}%</p><p className="text-[10px] text-[#71717A] mt-0.5">Win Rate</p></div>
              <div className="rounded-lg bg-[#111113] p-3 text-center"><p className={cn('text-lg font-bold font-mono', rolling50.data.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{rolling50.data.pnl >= 0 ? '+' : ''}{rolling50.data.pnl.toFixed(0)}</p><p className="text-[10px] text-[#71717A] mt-0.5">P&L</p></div>
            </div>
          ) : (<p className="py-6 text-center text-xs text-[#71717A]">Need {rolling50.data?.trades_needed ?? 50} more trades</p>)}
        </motion.div>
      </div>

      {/* Trade Detail Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">All Trades</h3>
            <span className="text-[11px] text-[#71717A] font-mono">({o.total_trades})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>View All <ChevronRight className="ml-1 h-3 w-3" /></Button>
        </div>
        {trades.data && trades.data.length > 0 ? (
          <DataTable
            data={trades.data.slice(0, 15)}
            columns={[
              { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
              { id: 'direction', header: 'Dir', accessor: (row: any) => (<span className={cn(row.direction === 'BUY' ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{row.direction || '-'}</span>), width: '40px' },
              { id: 'pnl', header: 'P&L', accessor: (row: any) => row.pnl != null ? (<span className={cn('font-medium font-mono', row.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}</span>) : '-', width: '100px' },
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
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><BarChart3 className="h-5 w-5 text-[#71717A]" /></div>
            <p className="text-sm font-medium text-[#A1A1AA]">No trades to display</p>
            <Button size="sm" className="mt-3" onClick={() => navigate(`/projects/${projectId}/trades`)}>Create Trade</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

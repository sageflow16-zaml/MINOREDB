import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { useFullStatistics, useEquityCurve, useStatisticsBySession, useStatisticsByWeekday, useMonthlyReturns, usePsychologyAnalytics } from '../hooks/useStatistics';
import { useTrades } from '../hooks/useTrades';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  TrendingUp, BarChart3, DollarSign, Target, Award, Shield,
  Brain, Sparkles, ChevronRight, Clock, CalendarDays, Download,
  AlertTriangle, Zap, Activity, Search,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const tooltipStyle = chartTooltipStyle.contentStyle;
const CHART_COLORS = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#A1A1AA'];
const CHART_COLORS_5 = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];

function HeroCard({ label, value, icon: Icon, accent, sub }: { label: string; value: string; icon: any; accent?: 'success' | 'danger' | 'warning' | 'default'; sub?: string }) {
  const accentColors = {
    default: 'text-[#FAFAFA]', success: 'text-[#22C55E]', danger: 'text-[#EF4444]', warning: 'text-[#F59E0B]',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-medium text-[#71717A] tracking-wide">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accent === 'success' ? 'bg-[#22C55E]/10' : accent === 'danger' ? 'bg-[#EF4444]/10' : 'bg-[#4F46E5]/10')}>
          <Icon className={cn('h-3.5 w-3.5', accent === 'success' ? 'text-[#22C55E]' : accent === 'danger' ? 'text-[#EF4444]' : 'text-[#4F46E5]')} />
        </div>
      </div>
      <p className={cn('text-xl font-bold font-mono tracking-tight', accentColors[accent || 'default'])}>{value}</p>
      {sub && <p className="text-[10px] text-[#71717A] mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function InsightCard({ title, description, icon: Icon, action }: { title: string; description: string; icon: any; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-lg border border-[#27272A] bg-gradient-to-r from-[#4F46E5]/5 to-transparent p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F46E5]/10">
          <Icon className="h-4 w-4 text-[#4F46E5]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#FAFAFA]">{title}</p>
          <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-relaxed">{description}</p>
          {action && (
            <button onClick={action.onClick} className="mt-1.5 text-[11px] font-medium text-[#4F46E5] hover:text-[#4F46E5]/80 transition-colors">
              {action.label} <ChevronRight className="h-2.5 w-2.5 inline" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} {...chartDefaultProps}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717A' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const stats = useFullStatistics(projectId!);
  const equityCurve = useEquityCurve(projectId!);
  const sessionData = useStatisticsBySession(projectId!);
  const weekdayData = useStatisticsByWeekday(projectId!);
  const monthlyReturns = useMonthlyReturns(projectId!);
  const psychData = usePsychologyAnalytics(projectId!);
  const trades = useTrades(projectId!);
  const [timeRange, setTimeRange] = useState('all');

  const isLoading = stats.isLoading || equityCurve.isLoading;
  const isError = stats.isError;

  const kpiData = useMemo(() => {
    if (!stats.data) return null;
    const o = stats.data.overview;
    const r = stats.data.risk;
    return { o, r };
  }, [stats.data]);

  const equityData = useMemo(() => {
    return (equityCurve.data ?? []).map((p: any) => ({
      date: p.date ? new Date(p.date).toLocaleDateString() : '',
      equity: p.equity,
    }));
  }, [equityCurve.data]);

  const sessionChartData = useMemo(() => {
    if (!sessionData.data) return [];
    return Object.entries(sessionData.data).map(([key, val]: any) => ({
      label: key, winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0,
    }));
  }, [sessionData.data]);

  const weekdayChartData = useMemo(() => {
    if (!weekdayData.data) return [];
    return Object.entries(weekdayData.data).map(([key, val]: any) => ({
      label: key.substring(0, 3), winRate: val.win_rate || 0, trades: val.trades || 0, pnl: val.pnl || 0,
    }));
  }, [weekdayData.data]);

  const monthlyChartData = useMemo(() => {
    return (monthlyReturns.data ?? []).slice(-12).map((m: any) => ({
      label: m.month ? m.month.substring(0, 7) : '',
      pnl: m.pnl || 0,
    }));
  }, [monthlyReturns.data]);

  const insightCards = useMemo(() => {
    const cards: { title: string; description: string; icon: any; action?: { label: string; onClick: () => void } }[] = [];
    const o = stats.data?.overview;
    const s = sessionData.data;
    const w = weekdayData.data;
    if (o && o.total_trades > 0) {
      if (s) {
        const bestSession = Object.entries(s).sort((a: any, b: any) => b[1].win_rate - a[1].win_rate)[0];
        if (bestSession) cards.push({ title: 'Best Session', description: `Your ${bestSession[0]} session has a ${bestSession[1].win_rate}% win rate with ${bestSession[1].trades} trades.`, icon: Clock, action: { label: 'Analyze Sessions', onClick: () => navigate(`/projects/${projectId}/statistics`) } });
      }
      if (w) {
        const bestDay = Object.entries(w).sort((a: any, b: any) => b[1].win_rate - a[1].win_rate)[0];
        if (bestDay) cards.push({ title: 'Best Trading Day', description: `${bestDay[0]} is your strongest day with ${bestDay[1].win_rate}% win rate.`, icon: CalendarDays });
      }
      cards.push({ title: 'Profit Factor', description: o.profit_factor >= 1.5 ? `Your profit factor of ${o.profit_factor.toFixed(2)} indicates strong risk-adjusted returns.` : `Your profit factor of ${o.profit_factor.toFixed(2)} needs improvement. Focus on cutting losses early.`, icon: Shield });
      if (psychData.data) {
        const p = psychData.data;
        if (p.fomo_frequency > 2) cards.push({ title: 'FOMO Alert', description: `FOMO entries detected ${p.fomo_frequency} times. Consider sticking to your plan more strictly.`, icon: AlertTriangle });
        if (p.revenge_trades > 0) cards.push({ title: 'Revenge Trading', description: `${p.revenge_trades} revenge trades identified. Take a break after losses.`, icon: Zap });
      }
    }
    return cards;
  }, [stats.data, sessionData.data, weekdayData.data, psychData.data, projectId, navigate]);

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
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"><Brain className="h-6 w-6 text-[#EF4444]" /></div>
          <p className="text-sm font-medium text-[#FAFAFA]">Error loading analytics</p>
          <p className="text-xs text-[#71717A]">There was a problem fetching analytics data.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const o = stats.data!.overview;
  const r = stats.data!.risk;
  const isPnlPositive = o.total_pnl >= 0;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Analytics</h1>
          <p className="text-sm text-[#71717A] mt-0.5">Discover why you&apos;re making or losing money</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#27272A] bg-[#111113] p-0.5">
            {['1W', '1M', '3M', 'All'].map((p) => (
              <button key={p} onClick={() => setTimeRange(p.toLowerCase())} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', timeRange === p.toLowerCase() ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>{p}</button>
            ))}
          </div>
          <Button variant="ghost" size="icon" aria-label="Export"><Download className="h-4 w-4" /></Button>
        </div>
      </motion.div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <HeroCard label="Net P&L" value={formatCurrency(o.total_pnl)} icon={DollarSign} accent={isPnlPositive ? 'success' : 'danger'} sub={`${o.total_trades} trades`} />
        <HeroCard label="Win Rate" value={`${o.win_rate}%`} icon={Award} accent={o.win_rate >= 50 ? 'success' : 'danger'} sub={`${o.wins}W / ${o.losses}L`} />
        <HeroCard label="Expectancy" value={formatCurrency(o.expectancy)} icon={Target} accent={o.expectancy >= 0 ? 'success' : 'danger'} sub="per trade" />
        <HeroCard label="Profit Factor" value={r.profit_factor ? r.profit_factor.toFixed(2) : '—'} icon={Shield} accent={r.profit_factor >= 1.5 ? 'success' : r.profit_factor >= 1 ? 'warning' : 'danger'} />
        <HeroCard label="Avg R:R" value={o.avg_rr ? o.avg_rr.toFixed(2) : '—'} icon={Activity} accent={o.avg_rr >= 1.5 ? 'success' : o.avg_rr >= 1 ? 'warning' : 'danger'} />
        <HeroCard label="Sharpe Ratio" value={r.sharpe_ratio ? r.sharpe_ratio.toFixed(2) : '—'} icon={BarChart3} accent={r.sharpe_ratio >= 1 ? 'success' : r.sharpe_ratio >= 0.5 ? 'warning' : 'default'} />
      </div>

      {/* Large Equity Curve */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Equity Curve</h3>
          </div>
          <div className="flex items-center gap-1">
            {['1W', '1M', '3M', 'All'].map((p) => (
              <button key={p} onClick={() => setTimeRange(p.toLowerCase())} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-all', timeRange === p.toLowerCase() ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-[#71717A] hover:text-[#A1A1AA]')}>{p}</button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData.length > 0 ? equityData : [{ date: 'No data', equity: 0 }]} {...chartDefaultProps}>
              <defs>
                <linearGradient id="analyticsEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="equity" stroke="#4F46E5" strokeWidth={2} fill="url(#analyticsEquityGradient)" dot={false} activeDot={{ r: 4, fill: '#4F46E5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Analytics Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Session Performance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Session Performance</h3>
          </div>
          {sessionChartData.length > 0 ? (
            <div className="h-48"><MiniBarChart data={sessionChartData} dataKey="winRate" color="#4F46E5" /></div>
          ) : (
            <div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No session data available</p></div>
          )}
          {sessionChartData.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {sessionChartData.map((s: any) => (
                <div key={s.label} className="flex items-center justify-between rounded-md bg-[#111113] px-2.5 py-1.5">
                  <span className="text-[10px] text-[#A1A1AA]">{s.label}</span>
                  <span className={cn('text-[10px] font-mono font-medium', s.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{s.winRate}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Day of Week Performance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Day of Week</h3>
          </div>
          {weekdayChartData.length > 0 ? (
            <div className="h-48"><MiniBarChart data={weekdayChartData} dataKey="winRate" color="#22C55E" /></div>
          ) : (
            <div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No weekday data available</p></div>
          )}
          {weekdayChartData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weekdayChartData.map((d: any) => (
                <div key={d.label} className="flex items-center gap-1.5 rounded-md bg-[#111113] px-2 py-1">
                  <span className="text-[10px] text-[#A1A1AA]">{d.label}</span>
                  <span className={cn('text-[10px] font-mono font-medium', d.winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{d.winRate}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Returns */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Monthly Returns</h3>
          </div>
          {monthlyChartData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} {...chartDefaultProps}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717A' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'P&L']} />
                  <Bar dataKey="pnl" shape={(props: any) => {
                    const { x, y, width, height } = props;
                    const isPositive = height < 0;
                    return <rect x={x} y={isPositive ? y + height : y} width={width} height={Math.abs(height)} fill={isPositive ? '#22C55E' : '#EF4444'} rx={3} ry={3} />;
                  }} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No monthly data available</p></div>
          )}
        </motion.div>

        {/* Psychology Summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Behavior Analysis</h3>
          </div>
          {psychData.data ? (
            <div className="space-y-2">
              {[
                { label: 'FOMO Entries', value: psychData.data.fomo_frequency, threshold: 2 },
                { label: 'Revenge Trades', value: psychData.data.revenge_trades, threshold: 0 },
                { label: 'Early Exits', value: psychData.data.early_exits, threshold: 3 },
                { label: 'Late Entries', value: psychData.data.late_entries, threshold: 3 },
                { label: 'Missed Setups', value: psychData.data.missed_setups, threshold: 3 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md bg-[#111113] px-3 py-2">
                  <span className="text-xs text-[#A1A1AA]">{item.label}</span>
                  <span className={cn('text-xs font-mono font-medium', item.value <= item.threshold ? 'text-[#22C55E]' : 'text-[#F59E0B]')}>{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center"><p className="text-xs text-[#71717A]">No behavior data yet. Add more trades to generate insights.</p></div>
          )}
        </motion.div>
      </div>

      {/* AI Insights */}
      {insightCards.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#4F46E5]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Intelligence</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insightCards.map((card, i) => (
              <InsightCard key={i} title={card.title} description={card.description} icon={card.icon} action={card.action} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Trade Explorer */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#71717A]" />
            <h3 className="text-sm font-medium text-[#FAFAFA]">Trade Explorer</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/trades`)}>
            View All <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        {trades.data && trades.data.length > 0 ? (
          <DataTable
            data={trades.data.slice(0, 10)}
            columns={[
              { id: 'pair', header: 'Pair', accessor: (row: any) => row.pair || '-', width: '80px' },
              { id: 'direction', header: 'Dir', accessor: (row: any) => (<span className={cn(row.direction === 'BUY' ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{row.direction || '-'}</span>), width: '40px' },
              { id: 'pnl', header: 'P&L', accessor: (row: any) => row.pnl != null ? (<span className={cn('font-medium font-mono', row.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{row.pnl >= 0 ? '+' : ''}${row.pnl.toFixed(2)}</span>) : '-', width: '100px' },
              { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '-', width: '60px', hideOnMobile: true },
              { id: 'session', header: 'Session', accessor: (row: any) => row.session || '-', width: '80px', hideOnMobile: true },
              { id: 'result', header: 'Result', accessor: (row: any) => row.result ? <Badge variant={row.result === 'WIN' ? 'success' : row.result === 'LOSS' ? 'destructive' : 'warning'} size="sm">{row.result}</Badge> : '-', width: '70px' },
              { id: 'date', header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), width: '90px', hideOnMobile: true },
            ]}
            searchable={true}
            pageSize={10}
            onRowClick={(row: any) => navigate(`/projects/${projectId}/trades`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]"><BarChart3 className="h-5 w-5 text-[#71717A]" /></div>
            <p className="text-sm font-medium text-[#A1A1AA]">No trades yet</p>
            <p className="text-xs text-[#71717A] mt-1">Add trades to unlock analytics and insights.</p>
            <Button size="sm" className="mt-4" onClick={() => navigate(`/projects/${projectId}/trades`)}>Start Trading</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

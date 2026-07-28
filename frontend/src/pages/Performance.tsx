import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { CalendarHeatmap, ScatterPlot } from '../components/ui';
import { cn } from '../lib/utils';
import {
  useStatisticsOverview,
  useStatisticsRisk,
  useStatisticsByPair,
  useStatisticsByDirection,
  useStatisticsBySession,
  useStatisticsByMarketPhase,
  useStatisticsByTrend,
  useMonthlyReturns,
  useEquityCurve,
  usePnlDistribution,
  useRrDistribution,
  useStatisticsByStrategy,
  useStatisticsByWeekday,
  useStatisticsByTimeframe,
  useStatisticsByMarketCondition,
  useStatisticsByVolatility,
  useStatisticsByNews,
  useStatisticsBySetup,
  useWeeklyReturns,
  useYearlyReturns,
  useRiskAnalytics,
  usePsychologyAnalytics,
  useCalendarHeatmap,
  useScatterData,
} from '../hooks/useStatistics';
import type {
  StatisticsOverview,
  StatisticsRisk,
  StatisticsByField,
  MonthlyReturn,
  EquityPoint,
  DistributionData,
  StrategyStats,
  RiskAnalytics,
  PsychologyAnalytics,
  CalendarHeatmap as CalendarHeatmapType,
  ScatterData,
} from '../api/types';
import {
  DollarSign, Target, TrendingUp, TrendingDown, Activity, BarChart3,
  Wallet, Award, AlertTriangle, Clock, Flame, Brain, Zap,
  Calendar, Filter, Download, FileText, ArrowUpRight, ArrowDownRight,
  TrendingUpIcon, Percent, Hash, Timer, Shield, AlertCircle,
  CheckCircle, XCircle, MinusCircle, ChevronDown, Eye, EyeOff,
  RotateCcw, SkipForward, Crosshair, TargetIcon, BarChart2,
  Globe,
} from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

type TabType = 'executive' | 'equity' | 'risk' | 'strategy' | 'psychology' | 'journal' | 'reports';

interface FilterState {
  dateRange: { start: string; end: string } | null;
  strategy: string;
  pair: string;
  session: string;
  direction: string;
}

function GlobalFilters({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date Range</label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => onChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value, end: filters.dateRange?.end || '' } })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => onChange({ ...filters, dateRange: { ...filters.dateRange, start: filters.dateRange?.start || '', end: e.target.value } })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
              <select
                value={filters.direction}
                onChange={(e) => onChange({ ...filters, direction: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Strategy</label>
              <input
                type="text"
                placeholder="Filter by strategy..."
                value={filters.strategy}
                onChange={(e) => onChange({ ...filters, strategy: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onChange({ dateRange: null, strategy: '', pair: '', session: '', direction: '' })}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, data, icon: Icon }: { title: string; data: StatisticsByField; icon: React.ElementType }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Trades</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Wins</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Win Rate</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">P&L</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, stats], i) => (
                <tr key={key} className={cn('border-b border-border/50 last:border-b-0', i % 2 === 0 && 'bg-muted/20')}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{key}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{stats.trades}</td>
                  <td className="px-4 py-2.5 text-right text-success">{stats.wins}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{stats.win_rate}%</td>
                  <td className={cn('px-4 py-2.5 text-right font-mono', stats.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                    {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyAnalyticsCard({ strategy, data }: { strategy: string; data: StrategyStats }) {
  const [expanded, setExpanded] = useState(false);
  const safe: StrategyStats = { trades: 0, wins: 0, losses: 0, pnl: 0, win_rate: 0, expectancy: 0, avg_rr: 0 };
  Object.assign(safe, data);
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', safe.pnl >= 0 ? 'bg-success/10' : 'bg-destructive/10')}>
              <Target className={cn('h-5 w-5', safe.pnl >= 0 ? 'text-success' : 'text-destructive')} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{strategy}</h3>
              <p className="text-xs text-muted-foreground">{safe.trades} trades • {safe.win_rate}% win rate</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={cn('text-lg font-bold font-mono', safe.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                {safe.pnl >= 0 ? '+' : ''}${safe.pnl.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Expectancy: ${safe.expectancy.toFixed(2)}</p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 pt-4 border-t border-border"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-lg font-bold text-foreground">{safe.win_rate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-lg font-bold text-foreground">{safe.avg_rr.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Avg R:R</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className={cn('text-lg font-bold', safe.expectancy >= 0 ? 'text-success' : 'text-warning')}>
                  ${safe.expectancy.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Expectancy</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className={cn('text-lg font-bold', safe.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {safe.pnl >= 0 ? '+' : ''}{safe.pnl.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Net P&L</div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PerformancePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: null,
    strategy: '',
    pair: '',
    session: '',
    direction: '',
  });

  const overview = useStatisticsOverview(projectId!);
  const risk = useStatisticsRisk(projectId!);
  const byPair = useStatisticsByPair(projectId!);
  const byDirection = useStatisticsByDirection(projectId!);
  const bySession = useStatisticsBySession(projectId!);
  const byMarketPhase = useStatisticsByMarketPhase(projectId!);
  const byTrend = useStatisticsByTrend(projectId!);
  const monthlyReturns = useMonthlyReturns(projectId!);
  const equityCurve = useEquityCurve(projectId!);
  const pnlDistribution = usePnlDistribution(projectId!);
  const rrDistribution = useRrDistribution(projectId!);
  const byStrategy = useStatisticsByStrategy(projectId!);
  const byWeekday = useStatisticsByWeekday(projectId!);
  const byTimeframe = useStatisticsByTimeframe(projectId!);
  const byMarketCondition = useStatisticsByMarketCondition(projectId!);
  const byVolatility = useStatisticsByVolatility(projectId!);
  const byNews = useStatisticsByNews(projectId!);
  const bySetup = useStatisticsBySetup(projectId!);
  const weeklyReturns = useWeeklyReturns(projectId!);
  const yearlyReturns = useYearlyReturns(projectId!);
  const riskAnalytics = useRiskAnalytics(projectId!);
  const psychologyAnalytics = usePsychologyAnalytics(projectId!);
  const calendarHeatmap = useCalendarHeatmap(projectId!);
  const scatterData = useScatterData(projectId!);

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  const handleRetry = () => {
    overview.refetch();
    risk.refetch();
    byPair.refetch();
    byDirection.refetch();
    bySession.refetch();
    byMarketPhase.refetch();
    byTrend.refetch();
    monthlyReturns.refetch();
    equityCurve.refetch();
    pnlDistribution.refetch();
    rrDistribution.refetch();
    byStrategy.refetch();
    byWeekday.refetch();
    byTimeframe.refetch();
    byMarketCondition.refetch();
    byVolatility.refetch();
    byNews.refetch();
    bySetup.refetch();
    weeklyReturns.refetch();
    yearlyReturns.refetch();
    riskAnalytics.refetch();
    psychologyAnalytics.refetch();
    calendarHeatmap.refetch();
    scatterData.refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Error loading performance analytics." onRetry={handleRetry} />;

  const o = overview.data?.overview as StatisticsOverview | undefined;
  const r = overview.data?.risk as StatisticsRisk | undefined;

  if (!o || o.total_trades === 0) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <PageHeader title="Performance Intelligence" description="Advanced analytics and decision support system" />
        <EmptyState
          message="No trading data yet"
          description="Complete some trades to unlock powerful performance analytics."
        />
      </motion.div>
    );
  }

  const eq = equityCurve.data as EquityPoint[] | undefined || [];
  const pnlDist = pnlDistribution.data as DistributionData | undefined;
  const rrDist = rrDistribution.data as DistributionData | undefined;
  const monthly = monthlyReturns.data as MonthlyReturn[] | undefined || [];
  const pairData = byPair.data as StatisticsByField | undefined || {};
  const directionData = byDirection.data as StatisticsByField | undefined || {};
  const sessionData = bySession.data as StatisticsByField | undefined || {};
  const strategyData = byStrategy.data as Record<string, StrategyStats> | undefined || {};
  const weekdayData = byWeekday.data || {};
  const timeframeData = byTimeframe.data as StatisticsByField | undefined || {};
  const marketConditionData = byMarketCondition.data as StatisticsByField | undefined || {};
  const volatilityData = byVolatility.data as StatisticsByField | undefined || {};
  const newsData = byNews.data || {};
  const setupData = bySetup.data as StatisticsByField | undefined || {};
  const weekly = weeklyReturns.data || [];
  const yearly = yearlyReturns.data || [];
  const riskAnalyticsData = riskAnalytics.data as RiskAnalytics | undefined;
  const psychData = psychologyAnalytics.data as PsychologyAnalytics | undefined;
  const heatmapData = calendarHeatmap.data as CalendarHeatmapType | undefined;
  const scatter = scatterData.data as ScatterData | undefined;

  const pnlColor = (o?.total_pnl ?? 0) >= 0 ? 'success' : 'danger';

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'executive', label: 'Executive', icon: BarChart3 },
    { id: 'equity', label: 'Equity', icon: Wallet },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'psychology', label: 'Psychology', icon: Brain },
    { id: 'journal', label: 'Journal', icon: FileText },
    { id: 'reports', label: 'Reports', icon: Calendar },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Performance Intelligence"
        description="Advanced analytics and decision support system"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Executive Dashboard */}
      {activeTab === 'executive' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <GlobalFilters filters={filters} onChange={setFilters} />

          {/* Primary KPIs */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Total Trades" value={o.total_trades} icon={Hash} variant="info" size="sm" />
            <KpiCard title="Win Rate" value={`${o.win_rate}%`} icon={Target} variant={(o.win_rate ?? 0) >= 50 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Net P&L" value={`$${o.total_pnl.toFixed(2)}`} icon={DollarSign} variant={pnlColor} size="sm" />
            <KpiCard title="Profit Factor" value={r?.profit_factor?.toFixed(2) ?? '0.00'} icon={Activity} variant={(r?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
            <KpiCard title="Expectancy" value={`$${o.expectancy.toFixed(2)}`} icon={TrendingUp} variant={(o.expectancy ?? 0) > 0 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Avg R:R" value={o.avg_rr?.toFixed(2) ?? '0.00'} icon={Crosshair} variant={(o.avg_rr ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
          </motion.div>

          {/* Secondary KPIs */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Breakevens" value={o.breakevens ?? 0} icon={MinusCircle} variant="info" size="sm" />
            <KpiCard title="Open Trades" value={o.open_trades ?? 0} icon={Clock} variant="info" size="sm" />
            <KpiCard title="Avg Win" value={o.avg_win ? `$${o.avg_win.toFixed(2)}` : '$0.00'} icon={TrendingUp} variant="success" size="sm" />
            <KpiCard title="Avg Loss" value={o.avg_loss ? `$${Math.abs(o.avg_loss).toFixed(2)}` : '$0.00'} icon={TrendingDown} variant="danger" size="sm" />
            <KpiCard title="Recovery Factor" value={r?.recovery_factor?.toFixed(2) ?? '0.00'} icon={RotateCcw} variant="info" size="sm" />
            <KpiCard title="Sharpe Ratio" value={r?.sharpe_ratio?.toFixed(2) ?? '0.00'} icon={Award} variant={(r?.sharpe_ratio ?? 0) >= 1 ? 'success' : 'warning'} size="sm" />
          </motion.div>

          {/* Tertiary KPIs */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Total Trades" value={o.total_trades} icon={Hash} variant="info" size="sm" />
            <KpiCard title="Wins" value={o.wins} icon={CheckCircle} variant="success" size="sm" />
            <KpiCard title="Losses" value={o.losses} icon={XCircle} variant="danger" size="sm" />
            <KpiCard title="Win Rate" value={`${o.win_rate}%`} icon={Target} variant={(o.win_rate ?? 0) >= 50 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Expectancy" value={`$${o.expectancy.toFixed(2)}`} icon={TrendingUp} variant={(o.expectancy ?? 0) > 0 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Avg R:R" value={o.avg_rr?.toFixed(2) ?? '0.00'} icon={Crosshair} variant={(o.avg_rr ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
          </motion.div>

          {/* Equity Curve & Monthly Returns */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eq}>
                      <defs>
                        <linearGradient id="equityGradPerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']} />
                      <Area type="monotone" dataKey="equity" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#equityGradPerf)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Monthly Returns</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                      <Bar dataKey="pnl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* P&L & R:R Distribution */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">P&L Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlDist ? (pnlDist.bins ?? []).slice(0, -1).map((bin, i) => ({ bin: bin.toFixed(2), count: pnlDist.counts[i] || 0 })) : []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="bin" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [v, 'Count']} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">R:R Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rrDist ? (rrDist.bins ?? []).slice(0, -1).map((bin, i) => ({ bin: bin.toFixed(2), count: rrDist.counts[i] || 0 })) : []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="bin" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [v, 'Count']} />
                      <Bar dataKey="count" fill="hsl(var(--warning))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Breakdowns */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownTable title="By Pair" data={pairData} icon={BarChart3} />
            <BreakdownTable title="By Direction" data={directionData} icon={TrendingUp} />
            <BreakdownTable title="By Session" data={sessionData} icon={Clock} />
            <BreakdownTable title="By Market Phase" data={byMarketPhase.data as StatisticsByField || {}} icon={Activity} />
            <BreakdownTable title="By Trend" data={byTrend.data as StatisticsByField || {}} icon={TrendingUp} />
            <BreakdownTable title="By Timeframe" data={timeframeData} icon={Timer} />
            <BreakdownTable title="By Market Condition" data={marketConditionData} icon={Globe} />
            <BreakdownTable title="By Setup" data={setupData} icon={Target} />
          </motion.div>

          {/* Calendar Heatmap */}
          {heatmapData && Object.keys(heatmapData.daily_pnl).length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Daily P&L Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarHeatmap data={heatmapData.daily_pnl} minDate={heatmapData.min_date} maxDate={heatmapData.max_date} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Scatter Plots */}
          {scatter && scatter.pnl_vs_rr.length > 0 && (
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Risk:Reward vs P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScatterPlot
                    data={scatter.pnl_vs_rr as unknown as Array<Record<string, unknown>>}
                    xKey="x"
                    yKey="y"
                    xLabel="Risk:Reward"
                    yLabel="P&L"
                    height={300}
                    showQuadrants
                    xThreshold={1}
                    yThreshold={0}
                    quadrantLabels={{
                      topLeft: 'High RR, Loss',
                      topRight: 'High RR, Profit',
                      bottomLeft: 'Low RR, Loss',
                      bottomRight: 'Low RR, Profit',
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Confidence vs P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScatterPlot
                    data={scatter.confidence_vs_pnl as unknown as Array<Record<string, unknown>>}
                    xKey="x"
                    yKey="y"
                    xLabel="Confidence"
                    yLabel="P&L"
                    height={300}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Equity Analytics Tab */}
      {activeTab === 'equity' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eq}>
                      <defs>
                        <linearGradient id="equityGradDetail" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']} />
                      <Area type="monotone" dataKey="equity" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#equityGradDetail)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Drawdown Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eq}>
                      <defs>
                        <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Drawdown']} />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#drawdownGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Weekly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                      <Bar dataKey="pnl" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Yearly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                      <Bar dataKey="pnl" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Risk Analytics Tab */}
      {activeTab === 'risk' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Avg Risk %" value={riskAnalyticsData?.avg_risk_percent ? `${riskAnalyticsData.avg_risk_percent.toFixed(2)}%` : 'N/A'} icon={Shield} variant="info" size="sm" />
            <KpiCard title="Max Drawdown" value={r?.max_drawdown ? `$${Math.abs(r.max_drawdown).toFixed(2)}` : '$0.00'} icon={TrendingDown} variant="danger" size="sm" />
            <KpiCard title="Profit Factor" value={r?.profit_factor?.toFixed(2) ?? '0.00'} icon={Activity} variant={(r?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
            <KpiCard title="Recovery Factor" value={r?.recovery_factor?.toFixed(2) ?? '0.00'} icon={RotateCcw} variant="info" size="sm" />
            <KpiCard title="Sharpe Ratio" value={r?.sharpe_ratio?.toFixed(2) ?? '0.00'} icon={Award} variant={(r?.sharpe_ratio ?? 0) >= 1 ? 'success' : 'warning'} size="sm" />
            <KpiCard title="Rule Violations" value={riskAnalyticsData?.rule_violations ?? 0} icon={AlertTriangle} variant="warning" size="sm" />
          </motion.div>

          {riskAnalyticsData && (
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Risk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Position Size</span>
                      <span className="text-sm font-medium">{riskAnalyticsData.avg_position_size?.toFixed(2) ?? 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Exposure</span>
                      <span className="text-sm font-medium">{riskAnalyticsData.total_exposure?.toFixed(2) ?? 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rule Violations</span>
                      <span className="text-sm font-medium text-destructive">{riskAnalyticsData.rule_violations ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">RR Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskAnalyticsData.rr_distribution ? (riskAnalyticsData.rr_distribution.bins ?? []).slice(0, -1).map((bin, i) => ({ bin: bin.toFixed(2), count: riskAnalyticsData.rr_distribution.counts[i] || 0 })) : []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                        <XAxis dataKey="bin" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Strategy Analytics Tab */}
      {activeTab === 'strategy' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="space-y-4">
            {Object.entries(strategyData).length > 0 ? (
              Object.entries(strategyData).map(([strategy, data]) => (
                <StrategyAnalyticsCard key={strategy} strategy={strategy} data={data} />
              ))
            ) : (
              <EmptyState
                message="No strategy data"
                description="Assign trades to strategies to see detailed analytics."
              />
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Psychology Analytics Tab */}
      {activeTab === 'psychology' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {psychData ? (
            <>
              <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard title="FOMO Trades" value={psychData.fomo_frequency ?? 0} icon={Flame} variant="warning" size="sm" />
                <KpiCard title="Revenge Trades" value={psychData.revenge_trades ?? 0} icon={AlertCircle} variant="danger" size="sm" />
                <KpiCard title="Early Exits" value={psychData.early_exits ?? 0} icon={SkipForward} variant="info" size="sm" />
                <KpiCard title="Late Entries" value={psychData.late_entries ?? 0} icon={Clock} variant="info" size="sm" />
                <KpiCard title="Overtrading Days" value={psychData.overtrading_days ?? 0} icon={Zap} variant="warning" size="sm" />
                <KpiCard title="Missed Setups" value={psychData.missed_setups ?? 0} icon={EyeOff} variant="info" size="sm" />
              </motion.div>

              <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Confidence vs Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={psychData.confidence_vs_results || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                          <XAxis dataKey="confidence_range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="trades" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                          <Bar yAxisId="right" dataKey="avg_pnl" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Psychology Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={psychData.psychology_trend || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                          <Legend />
                          <Line type="monotone" dataKey="avg_confidence" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Avg Confidence" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <EmptyState
              message="No psychology data"
              description="Track your emotions and mental state to see psychology analytics."
            />
          )}
        </motion.div>
      )}

      {/* Journal Insights Tab */}
      {activeTab === 'journal' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownTable title="By Weekday" data={Object.fromEntries(Object.entries(weekdayData).map(([k, v]: [string, { trades: number; wins: number; losses: number; pnl: number; win_rate: number }]) => [k, { trades: v.trades, wins: v.wins, losses: v.losses, pnl: v.pnl, win_rate: v.win_rate }]))} icon={Calendar} />
            <BreakdownTable title="By Volatility" data={volatilityData} icon={Activity} />
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">News Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">News Status</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Trades</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Wins</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Win Rate</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(newsData).map(([key, stats], i) => (
                        <tr key={key} className={cn('border-b border-border/50 last:border-b-0', i % 2 === 0 && 'bg-muted/20')}>
                          <td className="px-4 py-2.5 font-medium text-foreground">{key}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">{stats.trades}</td>
                          <td className="px-4 py-2.5 text-right text-success">{stats.wins}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">{stats.win_rate}%</td>
                          <td className={cn('px-4 py-2.5 text-right font-mono', stats.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                            {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Report Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'].map((period) => (
                    <Button key={period} variant="outline" className="h-24 flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm">{period} Report</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { format: 'CSV', icon: FileText, desc: 'Comma-separated values' },
                    { format: 'Excel', icon: FileText, desc: 'Spreadsheet format' },
                    { format: 'PDF', icon: FileText, desc: 'Portable document' },
                    { format: 'JSON', icon: FileText, desc: 'Structured data' },
                  ].map(({ format, icon: Icon, desc }) => (
                    <Button key={format} variant="outline" className="h-20 flex flex-col items-center gap-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{format}</span>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
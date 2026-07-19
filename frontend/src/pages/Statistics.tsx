import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import {
  useStatisticsOverview,
  useStatisticsByPair,
  useStatisticsByDirection,
  useStatisticsByBias,
  useStatisticsBySession,
  useStatisticsByMarketPhase,
  useStatisticsByTrend,
  useMonthlyReturns,
  useRollingStats,
  useEquityCurve,
  usePnlDistribution,
  useRrDistribution,
} from '../hooks/useStatistics';
import type { StatisticsOverview, StatisticsRisk, StatisticsByField, MonthlyReturn, RollingStats, EquityPoint, DistributionData } from '../api/types';
import { DollarSign, Target, TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, TrendingDown, Wallet, Percent, Award, LineChart } from 'lucide-react';

import { cn } from '../lib/utils';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function BreakdownTable({ title, data }: { title: string; data: StatisticsByField }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader>
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
                  <td className={cn('px-4 py-2.5 text-right font-mono', stats.pnl >= 0 ? 'text-success' : 'text-destructive')}>{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const overview = useStatisticsOverview(projectId!);
  const byPair = useStatisticsByPair(projectId!);
  const byDirection = useStatisticsByDirection(projectId!);
  const bySession = useStatisticsBySession(projectId!);
  const byMarketPhase = useStatisticsByMarketPhase(projectId!);
  const byTrend = useStatisticsByTrend(projectId!);
  const monthlyReturns = useMonthlyReturns(projectId!);
  const rolling10 = useRollingStats(projectId!, 10);
  const rolling50 = useRollingStats(projectId!, 50);
  const equityCurve = useEquityCurve(projectId!);
  const pnlDistribution = usePnlDistribution(projectId!);
  const rrDistribution = useRrDistribution(projectId!);

  const isLoading = overview.isLoading;
  const isError = overview.isError;

  const handleRetry = () => {
    overview.refetch();
    byPair.refetch();
    byDirection.refetch();
    bySession.refetch();
    byMarketPhase.refetch();
    byTrend.refetch();
    monthlyReturns.refetch();
    rolling10.refetch();
    rolling50.refetch();
    equityCurve.refetch();
    pnlDistribution.refetch();
    rrDistribution.refetch();
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
  if (isError) return <ErrorState message="Error loading statistics." onRetry={handleRetry} />;

  const o = overview.data?.overview as StatisticsOverview | undefined;
  const r = overview.data?.risk as StatisticsRisk | undefined;
  const eq = equityCurve.data as EquityPoint[] | undefined || [];
  const pnlDist = pnlDistribution.data as DistributionData | undefined;
  const rrDist = rrDistribution.data as DistributionData | undefined;
  const monthly = monthlyReturns.data as MonthlyReturn[] | undefined || [];
  const pairData = byPair.data as StatisticsByField | undefined || {};
  const directionData = byDirection.data as StatisticsByField | undefined || {};
  const sessionData = bySession.data as StatisticsByField | undefined || {};

  const pnlColor = (o?.total_pnl ?? 0) >= 0 ? 'success' : 'danger';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader title="Statistics" description="Comprehensive trading performance metrics" />

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total P&L" value={o?.total_pnl ? `$${o.total_pnl.toFixed(2)}` : '$0.00'} icon={DollarSign} variant={pnlColor} size="sm" />
        <KpiCard title="Win Rate" value={o?.win_rate ? `${o.win_rate}%` : '0%'} icon={Target} variant={(o?.win_rate ?? 0) >= 50 ? 'success' : 'danger'} size="sm" />
        <KpiCard title="Expectancy" value={o?.expectancy ? `$${o.expectancy.toFixed(2)}` : '$0.00'} icon={TrendingUp} variant={(o?.expectancy ?? 0) > 0 ? 'success' : 'danger'} size="sm" />
        <KpiCard title="Profit Factor" value={r?.profit_factor?.toFixed(2) ?? '0.00'} icon={Activity} variant={(r?.profit_factor ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
        <KpiCard title="Max Drawdown" value={r?.max_drawdown ? `$${Math.abs(r.max_drawdown).toFixed(2)}` : '$0.00'} icon={TrendingDown} variant="danger" size="sm" />
        <KpiCard title="Sharpe Ratio" value={r?.sharpe_ratio?.toFixed(2) ?? '0.00'} icon={Award} variant={(r?.sharpe_ratio ?? 0) >= 1 ? 'success' : 'warning'} size="sm" />
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Trades" value={o?.total_trades ?? 0} icon={BarChart3} variant="info" size="sm" />
        <KpiCard title="Wins" value={o?.wins ?? 0} icon={Target} variant="success" size="sm" />
        <KpiCard title="Losses" value={o?.losses ?? 0} icon={Target} variant="danger" size="sm" />
        <KpiCard title="Avg Win" value={o?.avg_win ? `$${o.avg_win.toFixed(2)}` : '$0.00'} icon={TrendingUp} variant="success" size="sm" />
        <KpiCard title="Avg Loss" value={o?.avg_loss ? `$${Math.abs(o.avg_loss).toFixed(2)}` : '$0.00'} icon={TrendingDown} variant="danger" size="sm" />
        <KpiCard title="Avg R:R" value={o?.avg_rr?.toFixed(2) ?? '0.00'} icon={Activity} variant={(o?.avg_rr ?? 0) >= 1.5 ? 'success' : 'warning'} size="sm" />
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
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
                  />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#equityGrad)" />
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
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribution Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">P&L Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlDist ? pnlDist.bins.slice(0, -1).map((bin, i) => ({ bin: bin.toFixed(2), count: pnlDist.counts[i] || 0 })) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="bin" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [v, 'Count']}
                  />
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
                <BarChart data={rrDist ? rrDist.bins.slice(0, -1).map((bin, i) => ({ bin: bin.toFixed(2), count: rrDist.counts[i] || 0 })) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="bin" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [v, 'Count']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--warning))" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rolling Windows */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last 10 Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {rolling10.data?.available ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{rolling10.data.trades}</div>
                  <div className="text-[10px] text-muted-foreground">Trades</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className="text-lg font-bold text-success">{rolling10.data.win_rate}%</div>
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className={cn('text-lg font-bold', rolling10.data.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                    {rolling10.data.pnl >= 0 ? '+' : ''}{rolling10.data.pnl.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">P&L</div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">Need {rolling10.data?.trades_needed} more trades</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last 50 Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {rolling50.data?.available ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{rolling50.data.trades}</div>
                  <div className="text-[10px] text-muted-foreground">Trades</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className="text-lg font-bold text-success">{rolling50.data.win_rate}%</div>
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-center">
                  <div className={cn('text-lg font-bold', rolling50.data.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                    {rolling50.data.pnl >= 0 ? '+' : ''}{rolling50.data.pnl.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">P&L</div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">Need {rolling50.data?.trades_needed} more trades</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakdown Tables */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownTable title="By Pair" data={pairData} />
        <BreakdownTable title="By Direction" data={directionData} />
        <BreakdownTable title="By Session" data={sessionData} />
        <BreakdownTable title="By Market Phase" data={byMarketPhase.data as StatisticsByField || {}} />
        <BreakdownTable title="By Trend" data={byTrend.data as StatisticsByField || {}} />
      </motion.div>
    </motion.div>
  );
}

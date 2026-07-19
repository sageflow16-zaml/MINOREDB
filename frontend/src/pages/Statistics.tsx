import { useParams } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
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

export default function StatisticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const overview = useStatisticsOverview(projectId!);
  const byPair = useStatisticsByPair(projectId!);
  const byDirection = useStatisticsByDirection(projectId!);
  const byBias = useStatisticsByBias(projectId!);
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
    byBias.refetch();
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

  if (isLoading) return <LoadingSpinner />;
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
  const phaseData = byMarketPhase.data as StatisticsByField | undefined || {};
  const trendData = byTrend.data as StatisticsByField | undefined || {};
  const biasData = byBias.data as StatisticsByField | undefined || {};

  const biasColors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#84cc16'];
  const getColor = (index: number) => biasColors[index % biasColors.length];

  return (
    <div className="space-y-8">
      <PageHeader title="Statistics" />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total P&L" value={o?.total_pnl ? `$${o.total_pnl.toFixed(2)}` : '$0.00'} />
        <StatCard title="Win Rate" value={o?.win_rate ? `${o.win_rate}%` : '0%'} />
        <StatCard title="Expectancy" value={o?.expectancy ? `$${o.expectancy.toFixed(2)}` : '$0.00'} />
        <StatCard title="Profit Factor" value={r?.profit_factor ? r.profit_factor.toFixed(2) : '0.00'} />
        <StatCard title="Max Drawdown" value={r?.max_drawdown ? `$${r.max_drawdown.toFixed(2)}` : '$0.00'} />
        <StatCard title="Sharpe Ratio" value={r?.sharpe_ratio ? r.sharpe_ratio.toFixed(2) : '0.00'} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Trades" value={o?.total_trades ?? 0} />
        <StatCard title="Wins" value={o?.wins ?? 0} />
        <StatCard title="Losses" value={o?.losses ?? 0} />
        <StatCard title="Avg Win" value={o?.avg_win ? `$${o.avg_win.toFixed(2)}` : '$0.00'} />
        <StatCard title="Avg Loss" value={o?.avg_loss ? `$${o.avg_loss.toFixed(2)}` : '$0.00'} />
        <StatCard title="Avg R:R" value={o?.avg_rr ? o.avg_rr.toFixed(2) : '0.00'} />
      </div>

      {/* Equity Curve & Monthly Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Equity Curve</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eq}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEquity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Monthly Returns</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                <Bar dataKey="pnl" name="P&L" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* P&L Distribution & R:R Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">P&L Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlDist ? pnlDist.bins.slice(0, -1).map((bin, i) => ({
                bin: bin.toFixed(2),
                count: pnlDist.counts[i] || 0,
              })) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin" tickFormatter={(v) => `$${v}`} />
                <YAxis />
                <Tooltip formatter={(v: number) => [v, 'Count']} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">R:R Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrDist ? rrDist.bins.slice(0, -1).map((bin, i) => ({
                bin: bin.toFixed(2),
                count: rrDist.counts[i] || 0,
              })) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin" />
                <YAxis />
                <Tooltip formatter={(v: number) => [v, 'Count']} />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* By Pair */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">By Pair</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-2">Pair</th>
                  <th className="text-right pb-2">Trades</th>
                  <th className="text-right pb-2">Wins</th>
                  <th className="text-right pb-2">Win Rate</th>
                  <th className="text-right pb-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pairData).map(([pair, stats]) => (
                  <tr key={pair} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{pair}</td>
                    <td className="py-2 text-right">{stats.trades}</td>
                    <td className="py-2 text-right text-green-600">{stats.wins}</td>
                    <td className="py-2 text-right">{stats.win_rate}%</td>
                    <td className="py-2 text-right font-mono">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Direction */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">By Direction</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-2">Direction</th>
                  <th className="text-right pb-2">Trades</th>
                  <th className="text-right pb-2">Wins</th>
                  <th className="text-right pb-2">Win Rate</th>
                  <th className="text-right pb-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(directionData).map(([dir, stats]) => (
                  <tr key={dir} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{dir}</td>
                    <td className="py-2 text-right">{stats.trades}</td>
                    <td className="py-2 text-right text-green-600">{stats.wins}</td>
                    <td className="py-2 text-right">{stats.win_rate}%</td>
                    <td className="py-2 text-right font-mono">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Session */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">By Session</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-2">Session</th>
                  <th className="text-right pb-2">Trades</th>
                  <th className="text-right pb-2">Wins</th>
                  <th className="text-right pb-2">Win Rate</th>
                  <th className="text-right pb-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sessionData).map(([session, stats]) => (
                  <tr key={session} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{session}</td>
                    <td className="py-2 text-right">{stats.trades}</td>
                    <td className="py-2 text-right text-green-600">{stats.wins}</td>
                    <td className="py-2 text-right">{stats.win_rate}%</td>
                    <td className="py-2 text-right font-mono">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Market Phase */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">By Market Phase</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-2">Phase</th>
                  <th className="text-right pb-2">Trades</th>
                  <th className="text-right pb-2">Wins</th>
                  <th className="text-right pb-2">Win Rate</th>
                  <th className="text-right pb-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(phaseData).map(([phase, stats]) => (
                  <tr key={phase} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{phase}</td>
                    <td className="py-2 text-right">{stats.trades}</td>
                    <td className="py-2 text-right text-green-600">{stats.wins}</td>
                    <td className="py-2 text-right">{stats.win_rate}%</td>
                    <td className="py-2 text-right font-mono">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Trend */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">By Trend</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-2">Trend</th>
                  <th className="text-right pb-2">Trades</th>
                  <th className="text-right pb-2">Wins</th>
                  <th className="text-right pb-2">Win Rate</th>
                  <th className="text-right pb-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(trendData).map(([trend, stats]) => (
                  <tr key={trend} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{trend}</td>
                    <td className="py-2 text-right">{stats.trades}</td>
                    <td className="py-2 text-right text-green-600">{stats.wins}</td>
                    <td className="py-2 text-right">{stats.win_rate}%</td>
                    <td className="py-2 text-right font-mono">{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rolling Stats */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Rolling Windows</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Last 10 Trades</h4>
              <div className="mt-2 space-y-1">
                {rolling10.data?.available ? (
                  <>
                    <div className="flex justify-between text-sm"><span>Trades</span><span className="font-mono">{rolling10.data.trades}</span></div>
                    <div className="flex justify-between text-sm"><span>Win Rate</span><span className="font-mono">{rolling10.data.win_rate}%</span></div>
                    <div className="flex justify-between text-sm"><span>P&L</span><span className="font-mono">{rolling10.data.pnl >= 0 ? '+' : ''}{rolling10.data.pnl.toFixed(2)}</span></div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Need {rolling10.data?.trades_needed} more trades</p>
                )}
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Last 50 Trades</h4>
              <div className="mt-2 space-y-1">
                {rolling50.data?.available ? (
                  <>
                    <div className="flex justify-between text-sm"><span>Trades</span><span className="font-mono">{rolling50.data.trades}</span></div>
                    <div className="flex justify-between text-sm"><span>Win Rate</span><span className="font-mono">{rolling50.data.win_rate}%</span></div>
                    <div className="flex justify-between text-sm"><span>P&L</span><span className="font-mono">{rolling50.data.pnl >= 0 ? '+' : ''}{rolling50.data.pnl.toFixed(2)}</span></div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Need {rolling50.data?.trades_needed} more trades</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
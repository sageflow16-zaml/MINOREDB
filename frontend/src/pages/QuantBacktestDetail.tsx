import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ChartCard, AreaChartCard, BarChartCard, PieChartCard } from '../components/ui/chart';
import { cn } from '../lib/utils';
import { useBacktest, useBacktestTrades, useEquityCurve, useBacktestMetrics } from '../hooks/useQuantResearch';
import {
  TrendingUp, BarChart3, Activity, DollarSign, Target,
  Percent, Zap, ArrowLeft, Download,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantBacktestDetail() {
  const { projectId, backtestId } = useParams<{ projectId: string; backtestId: string }>()!;
  const { data: bt, isLoading, error } = useBacktest(projectId!, backtestId);
  const { data: tradesData } = useBacktestTrades(projectId!, backtestId);
  const { data: equityCurve } = useEquityCurve(projectId!, backtestId);
  const { data: metrics } = useBacktestMetrics(projectId!, backtestId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !bt) return <ErrorState message="Backtest not found" />;

  const trades = tradesData?.trades || [];
  const eqCurve = equityCurve || bt.equity_curve || [];
  const monthlyReturns = bt.monthly_returns || [];
  const tradeDist = bt.trade_distribution || {};
  const regimePerf = bt.regime_performance || [];
  const rollingMetrics = bt.rolling_metrics || {};

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title={bt.name}
        description={`${bt.start_date} → ${bt.end_date} | ${bt.symbols?.join(', ') || 'N/A'} | ${bt.total_trades || 0} trades`}
        actions={
          <Link to={`/projects/${projectId}/quant-research/backtests`}>
            <Button variant="ghost" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
        }
      />

      {/* Status Bar */}
      <div className="flex items-center gap-3">
        <Badge variant={bt.status === 'completed' ? 'success' : bt.status === 'running' ? 'info' : 'destructive'} className="text-sm px-3 py-1">{bt.status}</Badge>
        {bt.duration_seconds != null && <span className="text-xs text-muted-foreground">Completed in {bt.duration_seconds.toFixed(1)}s</span>}
        {bt.error && <span className="text-xs text-destructive">{bt.error}</span>}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard title="Net Profit" value={bt.net_profit != null ? `$${bt.net_profit.toFixed(0)}` : '—'} icon={DollarSign} variant={(bt.net_profit ?? 0) > 0 ? 'success' : 'danger'} />
        <KpiCard title="Win Rate" value={bt.win_rate != null ? `${(bt.win_rate * 100).toFixed(1)}%` : '—'} icon={Target} variant={(bt.win_rate ?? 0) > 0.5 ? 'success' : 'warning'} />
        <KpiCard title="Profit Factor" value={bt.profit_factor?.toFixed(2) ?? '—'} icon={TrendingUp} variant={(bt.profit_factor ?? 0) > 1.5 ? 'success' : (bt.profit_factor ?? 0) > 1 ? 'warning' : 'danger'} />
        <KpiCard title="Sharpe Ratio" value={bt.sharpe_ratio?.toFixed(2) ?? '—'} icon={Activity} variant={(bt.sharpe_ratio ?? 0) > 1.5 ? 'success' : (bt.sharpe_ratio ?? 0) > 0.5 ? 'warning' : 'danger'} />
        <KpiCard title="Max Drawdown" value={bt.max_drawdown_pct != null ? `${(bt.max_drawdown_pct * 100).toFixed(1)}%` : '—'} icon={Percent} variant={(bt.max_drawdown_pct ?? 0) < 0.15 ? 'success' : (bt.max_drawdown_pct ?? 0) < 0.3 ? 'warning' : 'danger'} />
        <KpiCard title="Expectancy" value={bt.expectancy != null ? `$${bt.expectancy.toFixed(2)}` : '—'} icon={Zap} variant={(bt.expectancy ?? 0) > 0 ? 'success' : 'danger'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2">
          <ChartCard title="Equity Curve">
            <AreaChartCard data={eqCurve} dataKey="equity" xKey="date" color="hsl(var(--chart-1))" gradient />
          </ChartCard>
        </div>

        {/* Statistics Summary */}
        <Card>
          <CardHeader><CardTitle><BarChart3 className="w-4 h-4 mr-2 inline" />Statistics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Gross Profit', value: bt.gross_profit != null ? `$${bt.gross_profit.toFixed(0)}` : '—' },
                { label: 'Gross Loss', value: bt.gross_loss != null ? `$${bt.gross_loss.toFixed(0)}` : '—' },
                { label: 'Avg Win', value: bt.avg_win != null ? `$${bt.avg_win.toFixed(2)}` : '—' },
                { label: 'Avg Loss', value: bt.avg_loss != null ? `$${bt.avg_loss.toFixed(2)}` : '—' },
                { label: 'Avg R:R', value: bt.avg_rr?.toFixed(2) ?? '—' },
                { label: 'Largest Win', value: bt.largest_win != null ? `$${bt.largest_win.toFixed(2)}` : '—' },
                { label: 'Largest Loss', value: bt.largest_loss != null ? `$${bt.largest_loss.toFixed(2)}` : '—' },
                { label: 'Sortino Ratio', value: bt.sortino_ratio?.toFixed(2) ?? '—' },
                { label: 'Calmar Ratio', value: bt.calmar_ratio?.toFixed(2) ?? '—' },
                { label: 'Recovery Factor', value: bt.recovery_factor?.toFixed(2) ?? '—' },
                { label: 'Std Deviation', value: bt.std_dev?.toFixed(2) ?? '—' },
                { label: 'Z-Score', value: bt.z_score?.toFixed(2) ?? '—' },
                { label: 'Edge Stability', value: bt.edge_stability?.toFixed(2) ?? '—' },
                { label: 'P-Value', value: bt.p_value != null ? bt.p_value.toFixed(4) : '—' },
                { label: 'Sample Adequacy', value: bt.sample_size_adequacy != null ? `${(bt.sample_size_adequacy * 100).toFixed(1)}%` : '—' },
              ].map((s) => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Returns + Trade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monthlyReturns.length > 0 && (
          <ChartCard title="Monthly Returns">
            <BarChartCard data={monthlyReturns} dataKey="return" xKey="month" color="hsl(var(--chart-2))" />
          </ChartCard>
        )}
        {Object.keys(tradeDist).length > 0 && (
          <ChartCard title="Trade Distribution">
            <PieChartCard data={Object.entries(tradeDist).map(([k, v]) => ({ name: k, value: v as number }))} dataKey="value" nameKey="name" />
          </ChartCard>
        )}
      </div>

      {/* Regime Performance */}
      {regimePerf.length > 0 && (
        <Card>
          <CardHeader><CardTitle><Activity className="w-4 h-4 mr-2 inline" />Regime Performance</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              data={regimePerf}
              columns={[
                { id: 'regime', header: 'Regime', accessor: (row: any) => <Badge variant="outline">{row.regime}</Badge> },
                { id: 'num_trades', header: 'Trades', accessor: 'num_trades' },
                { id: 'win_rate', header: 'Win Rate', accessor: (row: any) => row.win_rate != null ? `${(row.win_rate * 100).toFixed(1)}%` : '—' },
                { id: 'profit_factor', header: 'PF', accessor: (row: any) => row.profit_factor?.toFixed(2) ?? '—' },
                { id: 'net_profit', header: 'Net Profit', accessor: (row: any) => row.net_profit != null ? `$${row.net_profit.toFixed(0)}` : '—' },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader><CardTitle><BarChart3 className="w-4 h-4 mr-2 inline" />Trades ({trades.length})</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={trades}
            columns={[
              { id: 'entry_date', header: 'Entry', accessor: 'entry_date' },
              { id: 'exit_date', header: 'Exit', accessor: 'exit_date' },
              { id: 'symbol', header: 'Symbol', accessor: 'symbol' },
              { id: 'direction', header: 'Direction', accessor: (row: any) => <Badge variant={row.direction === 'long' ? 'success' : 'destructive'}>{row.direction}</Badge> },
              { id: 'pnl', header: 'P&L', accessor: (row: any) => <span className={cn('font-medium', (row.pnl ?? 0) > 0 ? 'text-success' : 'text-destructive')}>{row.pnl != null ? `$${row.pnl.toFixed(2)}` : '—'}</span> },
              { id: 'rr', header: 'R:R', accessor: (row: any) => row.rr?.toFixed(2) ?? '—' },
              { id: 'exit_reason', header: 'Exit', accessor: (row: any) => <Badge variant="outline">{row.exit_reason || '—'}</Badge> },
              { id: 'regime_at_entry', header: 'Regime', accessor: (row: any) => row.regime_at_entry ? <Badge variant="outline">{row.regime_at_entry}</Badge> : '—' },
            ]}
            searchable
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

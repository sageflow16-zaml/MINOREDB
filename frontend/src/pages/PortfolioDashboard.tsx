import { useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { SkeletonCard } from '../components/ui/skeleton';
import { usePortfolioDashboard } from '../hooks/usePortfolio';
import { DollarSign, TrendingUp, Activity, TrendingDown, Wallet, Award, Users, PieChart as PieChartIcon, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { chartTooltipStyle } from '../lib/chart';

const tooltipStyle = chartTooltipStyle.contentStyle;
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function PortfolioDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, isError, refetch } = usePortfolioDashboard(projectId!);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-muted rounded-xl col-span-2" />
          <div className="h-72 bg-muted rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <ErrorState message="Error loading portfolio dashboard." description="There was a problem fetching your data." onRetry={() => refetch()} />
        </div>
      </PageLayout>
    );
  }

  const { summary, risk, allocations, account_breakdown, history } = data!;
  const isPnlPositive = summary.daily_pnl >= 0;
  const equityData = (history.equity_curve ?? []).map((p) => ({ ...p, date: new Date(p.date).toLocaleDateString() }));
  const allocationData = allocations.allocations.map((a) => ({ name: a.entity_name || a.entity_type, value: a.current_percentage || 0 }));
  const unallocated = allocations.unallocated ?? 0;
  if (unallocated > 0) allocationData.push({ name: 'Unallocated', value: unallocated });

  return (
    <PageLayout>
      <PageSection title="Portfolio Dashboard" description="Multi-account portfolio overview and performance">
        <PageGrid cols={6}>
          <KpiCard title="Total Portfolio Value" value={formatCurrency(summary.total_balance)} icon={DollarSign} variant="default" size="sm" />
          <KpiCard title="Combined Equity" value={formatCurrency(summary.total_equity)} icon={Wallet} variant="default" size="sm" />
          <KpiCard title="Daily PnL" value={formatCurrency(summary.daily_pnl)} icon={TrendingUp} variant={isPnlPositive ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Weekly PnL" value={formatCurrency(summary.weekly_pnl)} icon={Activity} variant={summary.weekly_pnl >= 0 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Monthly PnL" value={formatCurrency(summary.monthly_pnl)} icon={TrendingDown} variant={summary.monthly_pnl >= 0 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Portfolio Drawdown" value={formatPercent(summary.max_drawdown_pct)} icon={Shield} variant={summary.max_drawdown_pct > 20 ? 'danger' : summary.max_drawdown_pct > 10 ? 'warning' : 'success'} size="sm" />
        </PageGrid>
      </PageSection>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard title="Total Accounts" value={summary.account_count} icon={Users} variant="default" size="sm" />
        <KpiCard title="Active Accounts" value={summary.active_account_count} icon={Users} variant="success" size="sm" subtitle={`${summary.active_account_count} of ${summary.account_count}`} />
        <KpiCard title="Win Rate" value={summary.win_rate ? `${summary.win_rate}%` : '—'} icon={Award} variant={summary.win_rate >= 50 ? 'success' : 'danger'} size="sm" />
        <KpiCard title="Profit Factor" value={summary.profit_factor?.toFixed(2) ?? '—'} icon={TrendingUp} variant={summary.profit_factor >= 1.5 ? 'success' : summary.profit_factor >= 1 ? 'warning' : 'danger'} size="sm" />
        <KpiCard title="Risk Score" value={risk.risk_score != null ? `${risk.risk_score}/100` : '—'} icon={Shield} variant={risk.risk_score > 70 ? 'danger' : risk.risk_score > 40 ? 'warning' : 'success'} size="sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#equityGrad)" name="Equity" />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="none" name="Balance" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                        {allocationData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {allocationData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="font-medium text-foreground">{entry.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No allocation data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Account Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={account_breakdown}
            columns={[
              { id: 'name', header: 'Name', accessor: (row: any) => row.name || '-', width: '140px' },
              { id: 'type', header: 'Type', accessor: (row: any) => <Badge variant="info" size="sm">{row.account_type}</Badge>, width: '90px' },
              { id: 'balance', header: 'Balance', accessor: (row: any) => formatCurrency(row.current_balance), width: '100px' },
              { id: 'equity', header: 'Equity', accessor: (row: any) => formatCurrency(row.current_equity), width: '100px' },
              { id: 'pnl', header: 'PnL', accessor: (row: any) => (
                <span className={cn('font-medium', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatCurrency(row.pnl)}</span>
              ), width: '100px' },
              { id: 'trades', header: 'Trades', accessor: (row: any) => row.trade_count ?? '-', width: '70px', hideOnMobile: true },
              { id: 'win_rate', header: 'Win Rate', accessor: (row: any) => row.win_rate != null ? `${row.win_rate}%` : '-', width: '80px', hideOnMobile: true },
            ]}
            searchable={false}
            pageSize={10}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Exposure</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(risk.total_exposure)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Used Margin</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(risk.used_margin)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Free Margin</span>
              <span className="text-xs font-medium text-foreground">{formatCurrency(risk.free_margin)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Margin Level</span>
              <span className={cn('text-xs font-medium', risk.margin_level > 200 ? 'text-success' : risk.margin_level > 100 ? 'text-warning' : 'text-destructive')}>
                {risk.margin_level?.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Open Positions</span>
              <span className="text-xs font-medium text-foreground">{risk.total_open_positions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Concentration Risk</span>
              <span className={cn('text-xs font-medium', risk.concentration_risk > 50 ? 'text-destructive' : risk.concentration_risk > 25 ? 'text-warning' : 'text-success')}>
                {risk.concentration_risk?.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-2xl font-bold text-foreground">{summary.total_trades ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Trades</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-2xl font-bold text-success">{summary.win_count ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Wins</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-2xl font-bold text-destructive">{summary.loss_count ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Losses</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(summary.avg_rr != null ? summary.avg_rr : 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">Avg R:R</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(summary.total_deposits)}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Deposits</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-lg font-bold text-foreground">{formatCurrency(summary.total_withdrawals)}</div>
              <div className="text-xs text-muted-foreground mt-1">Withdrawals</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

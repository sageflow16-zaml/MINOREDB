import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { usePortfolioDashboard } from '../hooks/usePortfolio';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  DollarSign, TrendingUp, Activity, TrendingDown, Wallet, Award,
  PieChart as PieChartIcon, Shield, ArrowUpRight, ArrowDownRight,
  BookOpen, Sparkles, Plus, ChevronRight, Download, Users,
  BarChart3, Target, Brain,
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

const tooltipStyle = chartTooltipStyle.contentStyle;
const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))', 'hsl(var(--secondary))', 'hsl(var(--info))'];

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'success' | 'danger' | 'warning' | 'default' }) {
  const accentColors = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-danger-text',
    warning: 'text-warning',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-2xs font-medium text-muted tracking-wide">{label}</p>
      <p className={cn('text-lg font-bold font-mono tracking-tight mt-1', accentColors[accent || 'default'])}>{value}</p>
      {sub && <p className="text-2xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <p className="text-3xs text-muted tracking-wide">{label}</p>
      <p className={cn('text-sm font-bold font-mono mt-1', positive === undefined ? 'text-foreground' : positive ? 'text-success' : 'text-danger-text')}>{value}</p>
    </div>
  );
}

export default function PortfolioDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePortfolioDashboard(projectId!);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <Wallet className="h-6 w-6 text-danger-text" />
          </div>
          <p className="text-sm font-medium text-foreground">Error loading portfolio</p>
          <p className="text-xs text-muted">There was a problem fetching your portfolio data.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { summary, risk, allocations, account_breakdown, history } = data!;
  const isDailyPnlPositive = summary.daily_pnl >= 0;
  const equityData = (history.equity_curve ?? []).map((p) => ({ ...p, date: new Date(p.date).toLocaleDateString() }));
  const allocationData = allocations.allocations.map((a) => ({ name: a.entity_name || a.entity_type, value: a.current_percentage || 0 }));
  const unallocated = allocations.unallocated ?? 0;
  if (unallocated > 0) allocationData.push({ name: 'Unallocated', value: unallocated });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Top Section — Title + Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted mt-0.5">Multi-account overview and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
            <span className={cn('h-2 w-2 rounded-full', risk.risk_score > 70 ? 'bg-success' : risk.risk_score > 40 ? 'bg-warning' : 'bg-danger')} />
            <span className="text-xs font-medium text-secondary">
              {risk.risk_score > 70 ? 'Healthy' : risk.risk_score > 40 ? 'Moderate' : 'At Risk'}
            </span>
          </div>
          <Button variant="ghost" size="icon" aria-label="Export">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* KPI Grid — 6 cards: Balance, Equity, Daily/Weekly/Monthly PnL, Drawdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Balance" value={formatCurrency(summary.total_balance)} sub={`${summary.account_count} accounts`} />
        <StatCard label="Combined Equity" value={formatCurrency(summary.total_equity)} sub={summary.total_open_pnl ? `${formatCurrency(summary.total_open_pnl)} open P&L` : undefined} />
        <StatCard label="Daily P&L" value={formatCurrency(summary.daily_pnl)} accent={isDailyPnlPositive ? 'success' : 'danger'} />
        <StatCard label="Weekly P&L" value={formatCurrency(summary.weekly_pnl)} accent={summary.weekly_pnl >= 0 ? 'success' : 'danger'} />
        <StatCard label="Monthly P&L" value={formatCurrency(summary.monthly_pnl)} accent={summary.monthly_pnl >= 0 ? 'success' : 'danger'} />
        <StatCard
          label="Max Drawdown"
          value={formatPercent(summary.max_drawdown_pct)}
          accent={summary.max_drawdown_pct > 20 ? 'danger' : summary.max_drawdown_pct > 10 ? 'warning' : 'success'}
        />
      </motion.div>

      {/* Large Equity Curve */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">Equity Curve</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-3xs text-muted">Equity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-3xs text-muted">Balance</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} {...chartDefaultProps}>
              <defs>
                <linearGradient id="equityGradientPortfolio" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
<stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
<XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
<YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="equity" stroke="#4F46E5" strokeWidth={2} fill="url(#equityGradientPortfolio)" name="Equity" dot={false} activeDot={{ r: 4, fill: '#4F46E5' }} />
              <Area type="monotone" dataKey="balance" stroke="hsl(var(--success))" strokeWidth={1.5} fill="none" name="Balance" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Four KPI Cards — Balance, Equity, Drawdown, Risk Exposure */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <DollarSign className="h-3.5 w-3.5 text-primary-text" />
            </div>
            <span className="text-2xs font-medium text-muted">Balance</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(summary.total_balance)}</p>
          <p className="text-3xs text-muted mt-0.5">Across {summary.account_count} accounts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/10">
              <Wallet className="h-3.5 w-3.5 text-success" />
            </div>
            <span className="text-2xs font-medium text-muted">Equity</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(summary.total_equity)}</p>
          <p className={cn('text-3xs mt-0.5', summary.total_open_pnl >= 0 ? 'text-success' : 'text-danger-text')}>
            {formatCurrency(summary.total_open_pnl)} open P&L
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warning/10">
              <TrendingDown className="h-3.5 w-3.5 text-warning" />
            </div>
            <span className="text-2xs font-medium text-muted">Drawdown</span>
          </div>
          <p className={cn('text-lg font-bold font-mono', summary.max_drawdown_pct > 20 ? 'text-danger-text' : summary.max_drawdown_pct > 10 ? 'text-warning' : 'text-foreground')}>
            {formatPercent(summary.max_drawdown_pct)}
          </p>
          <p className="text-3xs text-muted mt-0.5">Max portfolio drawdown</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
<div className="flex h-7 w-7 items-center justify-center rounded-md bg-info/10">
<Shield className="h-3.5 w-3.5 text-info" />
            </div>
            <span className="text-2xs font-medium text-muted">Risk Exposure</span>
          </div>
          <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(risk.total_exposure)}</p>
          <p className="text-3xs text-muted mt-0.5">
            Margin: {risk.margin_level?.toFixed(0)}% &middot; {risk.total_open_positions} positions
          </p>
        </div>
      </motion.div>

      {/* Allocation + Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allocation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">Allocation</h3>
          </div>
          {allocationData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={3} dataKey="value">
                      {allocationData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {allocationData.slice(0, 6).map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-secondary truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className="font-medium text-foreground font-mono ml-2">{entry.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-elevated">
                <PieChartIcon className="h-5 w-5 text-muted" />
              </div>
              <p className="text-sm font-medium text-secondary">No allocation data</p>
              <p className="text-xs text-muted mt-1">Set up allocations to see your portfolio breakdown.</p>
            </div>
          )}
        </motion.div>

        {/* Performance Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">Performance</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Total Trades" value={String(summary.total_trades ?? 0)} />
            <MiniStat label="Wins" value={String(summary.win_count ?? 0)} positive />
            <MiniStat label="Losses" value={String(summary.loss_count ?? 0)} positive={false} />
            <MiniStat label="Win Rate" value={summary.win_rate ? `${summary.win_rate}%` : '—'} positive={summary.win_rate >= 50} />
            <MiniStat label="Avg R:R" value={summary.avg_rr ? summary.avg_rr.toFixed(2) : '—'} positive={summary.avg_rr >= 1.5} />
            <MiniStat label="Profit Factor" value={summary.profit_factor ? summary.profit_factor.toFixed(2) : '—'} positive={summary.profit_factor >= 1.5} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-background p-3">
              <p className="text-3xs text-muted tracking-wide">Deposits</p>
              <p className="text-sm font-bold font-mono text-foreground mt-1">{formatCurrency(summary.total_deposits)}</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-3xs text-muted tracking-wide">Withdrawals</p>
              <p className="text-sm font-bold font-mono text-foreground mt-1">{formatCurrency(summary.total_withdrawals)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Account Breakdown Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">Account Breakdown</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/portfolio/accounts`)}>
            Manage <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <DataTable
          data={account_breakdown}
          columns={[
            { id: 'name', header: 'Name', accessor: (row: any) => row.name || '-', width: '140px' },
            { id: 'type', header: 'Type', accessor: (row: any) => <Badge variant="info" size="sm">{row.account_type}</Badge>, width: '80px' },
            { id: 'balance', header: 'Balance', accessor: (row: any) => formatCurrency(row.current_balance), width: '100px' },
            { id: 'equity', header: 'Equity', accessor: (row: any) => formatCurrency(row.current_equity), width: '100px' },
            { id: 'pnl', header: 'P&L', accessor: (row: any) => (
              <span className={cn('font-medium font-mono', row.pnl >= 0 ? 'text-success' : 'text-danger-text')}>{formatCurrency(row.pnl)}</span>
            ), width: '90px' },
            { id: 'trades', header: 'Trades', accessor: (row: any) => row.trade_count ?? '-', width: '70px' },
            { id: 'win_rate', header: 'Win Rate', accessor: (row: any) => row.win_rate != null ? `${row.win_rate}%` : '-', width: '80px' },
          ]}
          searchable={false}
          pageSize={10}
        />
      </motion.div>

      {/* Recent Activity — Trades + Journal + Insights */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">Quick Links</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Accounts', icon: Users, path: 'portfolio/accounts' },
              { label: 'Allocations', icon: PieChartIcon, path: 'portfolio/allocations' },
              { label: 'Analytics', icon: TrendingUp, path: 'portfolio/analytics' },
              { label: 'Risk', icon: Shield, path: 'portfolio/risk' },
              { label: 'Transfers', icon: ArrowUpRight, path: 'portfolio/transfers' },
              { label: 'Goals', icon: Target, path: 'portfolio/goals' },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(`/projects/${projectId}/${link.path}`)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium text-secondary hover:text-foreground hover:border-border/80 transition-all"
                >
                  <Icon className="h-3.5 w-3.5 text-primary-text" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-medium text-foreground">AI Insights</h3>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-success/5 p-4">
            <p className="text-xs text-secondary leading-relaxed">
              {summary.total_trades > 0
                ? `Your portfolio spans ${summary.account_count} accounts with ${summary.total_trades} total trades. Win rate is ${summary.win_rate}% with a profit factor of ${summary.profit_factor?.toFixed(2) ?? 'N/A'}.`
                : 'No trading activity yet. Start trading to generate portfolio insights.'}
            </p>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(`/projects/${projectId}/portfolio/analytics`)}>
              <Sparkles className="h-3 w-3 mr-1.5" /> View Full Analytics
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

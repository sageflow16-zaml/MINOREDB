import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  useRiskDashboard, useRiskDrawdown, useRiskHistory, useRiskRules,
  useCreateRiskRule, useDeleteRiskRule, useRiskAlerts, useDismissAlert,
  useValidateTrade, useCalculatePositionSize, useRiskViolations,
} from '../hooks/useRisk';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/DataTable';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/Feedback';
import { chartTooltipStyle, chartDefaultProps } from '../lib/chart';
import {
  Shield, AlertTriangle, TrendingDown, Wallet, Activity, Target,
  Plus, Trash2, CheckCircle, XCircle, AlertCircle, Clock,
  Calculator, ShieldCheck, ArrowUpRight, ArrowDownRight,
  BarChart3, Bell, AlertOctagon, Info, RotateCcw,
  DollarSign, Hash, TrendingUp, EyeOff,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { RiskRule, RiskAlert, RuleViolation, TradeValidationResult, PositionSizeResult } from '../api/types';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const tooltipStyle = chartTooltipStyle.contentStyle;

function MetricCard({ label, value, icon: Icon, accent, sub }: { label: string; value: string; icon: any; accent?: 'success' | 'danger' | 'warning' | 'default'; sub?: string }) {
  const accentColors = { default: 'text-foreground', success: 'text-success', danger: 'text-danger-text', warning: 'text-warning' };
  const accentBg = { default: 'bg-primary/10', success: 'bg-success/10', danger: 'bg-danger/10', warning: 'bg-warning/10' };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-2xs font-medium text-muted tracking-wide">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', accentBg[accent || 'default'])}>
          <Icon className={cn('h-3.5 w-3.5', accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger-text' : accent === 'warning' ? 'text-warning' : 'text-primary-text')} />
        </div>
      </div>
      <p className={cn('text-xl font-bold font-mono tracking-tight', accentColors[accent || 'default'])}>{value}</p>
      {sub && <p className="text-3xs text-muted mt-1">{sub}</p>}
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

function CreateRuleDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createRule = useCreateRiskRule(projectId);
  const [form, setForm] = useState({ name: '', rule_type: 'max_daily_loss', description: '', limit_value: 5, severity: 'warning' });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createRule.mutate(form, { onSuccess: onClose }); };

  const ruleTypes = [
    { value: 'max_daily_loss', label: 'Max Daily Loss' },
    { value: 'max_weekly_loss', label: 'Max Weekly Loss' },
    { value: 'max_monthly_loss', label: 'Max Monthly Loss' },
    { value: 'max_risk_per_trade', label: 'Max Risk Per Trade' },
    { value: 'max_open_trades', label: 'Max Open Trades' },
    { value: 'max_correlated_trades', label: 'Max Correlated Trades' },
    { value: 'max_exposure', label: 'Max Total Exposure' },
    { value: 'max_consecutive_losses', label: 'Max Consecutive Losses' },
    { value: 'session_restriction', label: 'Session Restriction' },
    { value: 'news_restriction', label: 'News Restriction' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-4">
      <h4 className="text-sm font-medium text-foreground mb-4">Create Risk Rule</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-2xs text-muted mb-1 block">Rule Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary" placeholder="e.g. Max Daily Loss" required />
          </div>
          <div>
            <label className="text-2xs text-muted mb-1 block">Rule Type</label>
            <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              {ruleTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-2xs text-muted mb-1 block">Limit Value</label>
            <input type="number" step="0.1" value={form.limit_value}
              onChange={(e) => setForm({ ...form, limit_value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-2xs text-muted mb-1 block">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-2xs text-muted mb-1 block">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary" placeholder="Optional..." />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={createRule.isPending}>{createRule.isPending ? 'Creating...' : 'Create Rule'}</Button>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function PositionSizeCalculator({ projectId }: { projectId: string }) {
  const calc = useCalculatePositionSize(projectId);
  const [form, setForm] = useState({ account_balance: 10000, risk_percent: 1.0, entry_price: 1.1000, stop_loss: 1.0950, take_profit: 1.1100, pip_value: 10, instrument: 'forex' });
  const [result, setResult] = useState<PositionSizeResult | null>(null);
  const handleCalc = () => { calc.mutate(form, { onSuccess: (data) => setResult(data) }); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ k: 'account_balance', l: 'Balance ($)' }, { k: 'risk_percent', l: 'Risk %' }, { k: 'entry_price', l: 'Entry' }, { k: 'stop_loss', l: 'Stop Loss' }, { k: 'take_profit', l: 'Take Profit' }, { k: 'pip_value', l: 'Pip Value ($)' }].map(({ k, l }) => (
          <div key={k}>
            <label className="text-2xs text-muted mb-1 block">{l}</label>
            <input type="number" step="0.0001" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
        ))}
        <div>
          <label className="text-2xs text-muted mb-1 block">Instrument</label>
          <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="stocks">Stocks</option>
            <option value="futures">Futures</option>
          </select>
        </div>
        <div className="flex items-end"><Button onClick={handleCalc} disabled={calc.isPending} className="w-full">{calc.isPending ? 'Calculating...' : 'Calculate'}</Button></div>
      </div>
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Position Size', value: result.position_size.toLocaleString(), color: 'text-foreground' },
            { label: 'Lot Size', value: result.lot_size, color: 'text-foreground' },
            { label: 'Dollar Risk', value: `-$${result.dollar_risk}`, color: 'text-danger-text' },
            { label: 'Expected R:R', value: `${result.expected_rr}R`, color: result.expected_rr >= 1 ? 'text-success' : 'text-warning' },
            { label: 'Potential Profit', value: `+$${result.potential_profit}`, color: 'text-success' },
            { label: 'Potential Loss', value: `-$${result.potential_loss}`, color: 'text-danger-text' },
            { label: 'Stop Distance', value: `${result.stop_distance_pips} pips`, color: 'text-foreground' },
            { label: 'Risk/Pip', value: `$${result.risk_per_pip}`, color: 'text-foreground' },
          ].map((r) => (
            <div key={r.label} className="rounded-lg bg-background p-3 text-center">
              <p className={cn('text-lg font-bold font-mono', r.color)}>{r.value}</p>
              <p className="text-3xs text-muted mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TradeValidator({ projectId }: { projectId: string }) {
  const validate = useValidateTrade(projectId);
  const [form, setForm] = useState({ pair: 'EURUSD', direction: 'LONG', entry_price: 1.1000, stop_loss: 1.0950, take_profit: 1.1100, risk_percent: 1.0 });
  const [result, setResult] = useState<TradeValidationResult | null>(null);
  const handleValidate = () => { validate.mutate(form, { onSuccess: (data) => setResult(data) }); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="text-2xs text-muted mb-1 block">Pair</label>
          <input value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-2xs text-muted mb-1 block">Direction</label>
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
        </div>
        {[{ k: 'entry_price', l: 'Entry' }, { k: 'stop_loss', l: 'Stop Loss' }, { k: 'take_profit', l: 'Take Profit' }, { k: 'risk_percent', l: 'Risk %' }].map(({ k, l }) => (
          <div key={k}>
            <label className="text-2xs text-muted mb-1 block">{l}</label>
            <input type="number" step="0.0001" value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
        ))}
        <div className="flex items-end"><Button onClick={handleValidate} disabled={validate.isPending} className="w-full">{validate.isPending ? 'Validating...' : 'Validate Trade'}</Button></div>
      </div>
      {result && (
        <div className={cn('rounded-xl border p-5', result.status === 'approved' ? 'border-success/50 bg-success/5' : result.status === 'warning' ? 'border-warning/50 bg-warning/5' : 'border-danger/50 bg-danger/5')}>
          <div className="flex items-center gap-3 mb-4">
            {result.status === 'approved' ? <CheckCircle className="h-5 w-5 text-success" /> : result.status === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> : <XCircle className="h-5 w-5 text-danger-text" />}
            <span className={cn('text-sm font-medium capitalize', result.status === 'approved' ? 'text-success' : result.status === 'warning' ? 'text-warning' : 'text-danger-text')}>{result.status}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {result.risk_amount != null && <InsightBadge label="Risk Amount" value={`$${result.risk_amount}`} />}
            {result.potential_profit != null && <InsightBadge label="Potential Profit" value={`+$${result.potential_profit}`} good />}
            {result.potential_loss != null && <InsightBadge label="Potential Loss" value={`-$${result.potential_loss}`} good={false} />}
            {result.rr_ratio != null && <InsightBadge label="R:R Ratio" value={`${result.rr_ratio}R`} good={result.rr_ratio >= 1} />}
          </div>
          <div className="space-y-2">
            {result.checks.map((check, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-background px-3 py-2">
                {check.passed ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> : check.severity === 'critical' ? <XCircle className="h-4 w-4 text-danger-text shrink-0" /> : <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                <span className="text-xs text-secondary flex-1">{check.check_name}: {check.message}</span>
                <Badge variant={check.passed ? 'success' : check.severity === 'critical' ? 'destructive' : 'warning'} size="sm">{check.passed ? 'Pass' : check.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showValidator, setShowValidator] = useState(false);

  const dashboard = useRiskDashboard(projectId!);
  const drawdown = useRiskDrawdown(projectId!);
  const history = useRiskHistory(projectId!);
  const rules = useRiskRules(projectId!);
  const alerts = useRiskAlerts(projectId!);
  const violations = useRiskViolations(projectId!);
  const deleteRule = useDeleteRiskRule(projectId!);
  const dismissAlert = useDismissAlert(projectId!);

  const isLoading = dashboard.isLoading;
  const isError = dashboard.isError;

  const handleRetry = useCallback(() => {
    dashboard.refetch(); drawdown.refetch(); history.refetch();
    rules.refetch(); alerts.refetch(); violations.refetch();
  }, []);

  const dd = useMemo(() => (drawdown.data ?? []).map((p: any) => ({ date: p.date ? new Date(p.date).toLocaleDateString() : '', drawdown: p.drawdown })), [drawdown.data]);

  const hist = useMemo(() => (history.data ?? []).slice(-30).map((p: any) => ({ date: p.date ? new Date(p.date).toLocaleDateString() : '', daily_pnl: p.daily_pnl, drawdown: p.drawdown, risk_percent: p.risk_percent })), [history.data]);

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
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10"><Shield className="h-6 w-6 text-danger-text" /></div><p className="text-sm font-medium text-foreground">Error loading risk data</p><p className="text-xs text-muted">There was a problem fetching risk data.</p><Button variant="outline" size="sm" onClick={handleRetry}>Try Again</Button></div></div>);
  }

  const d = dashboard.data;
  const ruleList = (rules.data ?? []) as RiskRule[];
  const alertList = (alerts.data ?? []) as RiskAlert[];
  const violationList = (violations.data ?? []) as RuleViolation[];

  if (!d) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-xl font-semibold text-foreground tracking-tight">Risk Management</h1><p className="text-sm text-muted mt-0.5">Risk control center</p></div></div>
        <EmptyState icon={<Shield className="h-6 w-6" />} title="No risk data yet" description="Start trading to see risk management analytics and exposure data." />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Risk Management</h1><p className="text-sm text-muted mt-0.5">Risk control center</p></div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRetry}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
        </div>
      </motion.div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Account Balance" value={`$${(d.account_balance ?? 0).toLocaleString()}`} icon={Wallet} accent={(d.account_balance ?? 0) > 0 ? 'success' : 'default'} />
        <MetricCard label="Equity" value={`$${(d.equity ?? 0).toLocaleString()}`} icon={DollarSign} accent={(d.equity ?? 0) >= (d.account_balance ?? 0) ? 'success' : 'danger'} />
        <MetricCard label="Daily P&L" value={`$${(d.daily_pnl ?? 0).toFixed(2)}`} icon={TrendingUp} accent={(d.daily_pnl ?? 0) >= 0 ? 'success' : 'danger'} />
        <MetricCard label="Weekly P&L" value={`$${(d.weekly_pnl ?? 0).toFixed(2)}`} icon={BarChart3} accent={(d.weekly_pnl ?? 0) >= 0 ? 'success' : 'danger'} />
        <MetricCard label="Monthly P&L" value={`$${(d.monthly_pnl ?? 0).toFixed(2)}`} icon={Activity} accent={(d.monthly_pnl ?? 0) >= 0 ? 'success' : 'danger'} />
        <MetricCard label="Current Risk" value={`${(d.current_risk_percent ?? 0).toFixed(2)}%`} icon={Target} accent={(d.current_risk_percent ?? 0) > 5 ? 'danger' : (d.current_risk_percent ?? 0) > 2 ? 'warning' : 'success'} />
        <MetricCard label="Max Drawdown" value={`${(d.max_drawdown ?? 0).toFixed(2)}%`} icon={TrendingDown} accent={(d.max_drawdown ?? 0) > 20 ? 'danger' : (d.max_drawdown ?? 0) > 10 ? 'warning' : 'success'} />
        <MetricCard label="Open Positions" value={String(d.open_positions ?? 0)} icon={Hash} sub={`${(d.total_exposure ?? 0).toFixed(1)}% exposure`} />
      </div>

      {/* Alert Banner */}
      {((d.active_alerts ?? 0) > 0 || (d.rule_violations ?? 0) > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn('rounded-xl border p-4 flex items-center gap-4', (d.active_alerts ?? 0) > 0 ? 'border-danger/50 bg-danger/5' : 'border-warning/50 bg-warning/5')}>
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', (d.active_alerts ?? 0) > 0 ? 'bg-danger/10' : 'bg-warning/10')}>
              {(d.active_alerts ?? 0) > 0 ? <AlertOctagon className="h-5 w-5 text-danger-text" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{(d.active_alerts ?? 0)} Active Alert{(d.active_alerts ?? 0) !== 1 ? 's' : ''} &bull; {(d.rule_violations ?? 0)} Rule Violation{(d.rule_violations ?? 0) !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted">Review your risk settings and open positions</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Drawdown Timeline + Risk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingDown className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Drawdown Timeline</h3></div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dd.length > 0 ? dd : [{ date: '', drawdown: 0 }]} {...chartDefaultProps}>
                <defs><linearGradient id="riskDDGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
                <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--danger))" strokeWidth={2} fill="url(#riskDDGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Risk Metrics</h3></div>
          <div className="space-y-2">
            <InsightBadge label="Open Risk" value={`${(d.open_risk ?? 0).toFixed(2)}%`} good={(d.open_risk ?? 0) < 3} />
            <InsightBadge label="Available Risk" value={`${(d.available_risk ?? 0).toFixed(2)}%`} good={(d.available_risk ?? 0) > 2} />
            <InsightBadge label="Daily Risk Left" value={`${(d.daily_risk_remaining ?? 0).toFixed(2)}%`} good={(d.daily_risk_remaining ?? 0) > 1} />
            <InsightBadge label="Current Drawdown" value={`${(d.current_drawdown ?? 0).toFixed(2)}%`} good={(d.current_drawdown ?? 0) < 5} />
            <InsightBadge label="Recovery Progress" value={`${(d.recovery_progress ?? 0).toFixed(1)}%`} good={(d.recovery_progress ?? 0) > 50} />
            <InsightBadge label="Total Exposure" value={`${(d.total_exposure ?? 0).toFixed(2)}%`} good={(d.total_exposure ?? 0) < 10} />
          </div>
        </motion.div>
      </div>

      {/* Exposure Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[{ title: 'Exposure by Pair', key: 'by_pair', data: d.exposure?.by_pair || [] },
          { title: 'Exposure by Direction', key: 'by_direction', data: d.exposure?.by_direction || [] }].map((section) => (
          <motion.div key={section.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">{section.title}</h3></div>
            {section.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left px-3 py-2 text-2xs font-medium text-muted">Name</th><th className="text-right px-3 py-2 text-2xs font-medium text-muted">Positions</th><th className="text-right px-3 py-2 text-2xs font-medium text-muted">Risk</th></tr></thead>
                  <tbody>
                    {section.data.map((p: any, i: number) => (
                      <tr key={p.name || i} className="border-b border-border/50">
                        <td className="px-3 py-2 text-xs text-secondary">{p.name}</td>
                        <td className="px-3 py-2 text-xs text-right font-mono text-secondary">{p.count}</td>
                        <td className="px-3 py-2 text-xs text-right font-mono text-foreground">{p.risk.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-muted py-8 text-center">No exposure data</p>}
          </motion.div>
        ))}
      </div>

      {/* Risk History */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Clock className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Risk History (30 Days)</h3></div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hist} {...chartDefaultProps}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="daily_pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Daily P&L" />
              <Line type="monotone" dataKey="drawdown" stroke="hsl(var(--danger))" strokeWidth={2} dot={false} name="Drawdown %" />
              <Line type="monotone" dataKey="risk_percent" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Risk %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk Rules */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Risk Rules ({ruleList.length})</h3></div>
          <Button size="sm" onClick={() => setShowCreateRule(!showCreateRule)}><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
        </div>
        {showCreateRule && <CreateRuleDialog projectId={projectId!} onClose={() => setShowCreateRule(false)} />}
        {ruleList.length > 0 ? (
          <div className="space-y-2">
            {ruleList.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', rule.severity === 'critical' ? 'bg-danger/10' : rule.severity === 'warning' ? 'bg-warning/10' : 'bg-primary/10')}>
                    {rule.severity === 'critical' ? <Shield className="h-4 w-4 text-danger-text" /> : rule.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> : <Info className="h-4 w-4 text-primary-text" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{rule.name}</p>
                    <p className="text-xs text-muted">{rule.rule_type.replace(/_/g, ' ')} &bull; Limit: {rule.limit_value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.is_active ? 'success' : 'secondary'} size="sm">{rule.is_active ? 'Active' : 'Inactive'}</Badge>
                  {rule.violation_count > 0 && <Badge variant="warning" size="sm">{rule.violation_count} violations</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)}><Trash2 className="h-4 w-4 text-danger-text" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted py-6 text-center">No risk rules. Create one to protect your capital.</p>}
      </motion.div>

      {/* Alerts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Alerts ({alertList.length})</h3></div>
        {alertList.length > 0 ? (
          <div className="space-y-2">
            {alertList.map((alert) => (
              <div key={alert.id} className={cn('flex items-center justify-between rounded-lg px-4 py-3', alert.severity === 'critical' ? 'bg-danger/5 border border-danger/20' : alert.severity === 'warning' ? 'bg-warning/5 border border-warning/20' : 'bg-background')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', alert.severity === 'critical' ? 'bg-danger/10' : alert.severity === 'warning' ? 'bg-warning/10' : 'bg-primary/10')}>
                    {alert.severity === 'critical' ? <AlertOctagon className="h-4 w-4 text-danger-text" /> : alert.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> : <Info className="h-4 w-4 text-primary-text" />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted">{alert.message} &bull; {new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'warning' : 'default'} size="sm">{alert.severity}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => dismissAlert.mutate(alert.id)}><XCircle className="h-4 w-4 text-muted" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted py-6 text-center">No active alerts</p>}
      </motion.div>

      {/* Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-border bg-card p-5">
          <button onClick={() => setShowCalculator(!showCalculator)} className="flex items-center gap-2 w-full mb-4">
            <Calculator className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Position Size Calculator</h3>
          </button>
          {showCalculator && <PositionSizeCalculator projectId={projectId!} />}
          {!showCalculator && <p className="text-xs text-muted">Expand to calculate optimal position sizes based on risk parameters.</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
          <button onClick={() => setShowValidator(!showValidator)} className="flex items-center gap-2 w-full mb-4">
            <ShieldCheck className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Trade Validator</h3>
          </button>
          {showValidator && <TradeValidator projectId={projectId!} />}
          {!showValidator && <p className="text-xs text-muted">Expand to validate trade ideas against active risk rules.</p>}
        </motion.div>
      </div>

      {/* Rule Violations */}
      {violationList.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><AlertOctagon className="h-4 w-4 text-muted" /><h3 className="text-sm font-medium text-foreground">Rule Violations ({violationList.length})</h3></div>
          <DataTable
            data={violationList}
            columns={[
              { id: 'rule', header: 'Rule', accessor: (row: RuleViolation) => row.rule_name, width: '120px' },
              { id: 'type', header: 'Type', accessor: (row: RuleViolation) => row.rule_type.replace(/_/g, ' '), width: '120px', hideOnMobile: true },
              { id: 'limit', header: 'Limit', accessor: (row: RuleViolation) => String(row.limit_value), width: '60px', hideOnMobile: true },
              { id: 'actual', header: 'Actual', accessor: (row: RuleViolation) => (<span className="text-danger-text">{row.actual_value}</span>), width: '60px' },
              { id: 'severity', header: 'Severity', accessor: (row: RuleViolation) => (<Badge variant={row.severity === 'critical' ? 'destructive' : 'warning'} size="sm">{row.severity}</Badge>), width: '80px' },
              { id: 'time', header: 'Time', accessor: (row: RuleViolation) => row.timestamp ? new Date(row.timestamp).toLocaleString() : '-', width: '140px', hideOnMobile: true },
            ]}
            pageSize={10}
          />
        </motion.div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useRiskDashboard,
  useRiskDrawdown,
  useRiskHistory,
  useRiskRules,
  useCreateRiskRule,
  useDeleteRiskRule,
  useRiskAlerts,
  useDismissAlert,
  useValidateTrade,
  useCalculatePositionSize,
  useRiskViolations,
} from '../hooks/useRisk';
import type {
  RiskDashboard,
  RiskRule,
  RiskAlert,
  DrawdownPoint,
  RiskHistoryPoint,
  TradeValidationResult,
  PositionSizeResult,
  RuleViolation,
} from '../api/types';
import {
  Shield, AlertTriangle, TrendingDown, Wallet, Activity, Target,
  Plus, Trash2, CheckCircle, XCircle, AlertCircle, Clock,
  Calculator, ShieldCheck, ShieldAlert, Ban, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, BarChart3, Bell, BellOff,
  FileText, Zap, AlertOctagon, Info, ChevronDown, Settings,
  DollarSign, Percent, Hash, Crosshair, RotateCcw,
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

type TabType = 'dashboard' | 'calculator' | 'rules' | 'exposure' | 'alerts' | 'validation' | 'history';

function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  if (!data || data.length === 0) return <EmptyState message="No drawdown data" />;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#ddGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExposurePie({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  if (!data || data.length === 0) return <EmptyState message={`No ${label} data`} />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function CreateRuleDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createRule = useCreateRiskRule(projectId);
  const [form, setForm] = useState({ name: '', rule_type: 'max_daily_loss', description: '', limit_value: 5, severity: 'warning' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRule.mutate(form, { onSuccess: onClose });
  };

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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Create Risk Rule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rule Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Max Daily Loss"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rule Type</label>
              <select
                value={form.rule_type}
                onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {ruleTypes.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Limit Value</label>
              <input
                type="number"
                step="0.1"
                value={form.limit_value}
                onChange={(e) => setForm({ ...form, limit_value: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional description..."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RiskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showCreateRule, setShowCreateRule] = useState(false);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Error loading risk data." onRetry={() => dashboard.refetch()} />;

  const d = dashboard.data as RiskDashboard | undefined;
  const dd = drawdown.data as DrawdownPoint[] | undefined || [];
  const hist = history.data as RiskHistoryPoint[] | undefined || [];
  const ruleList = rules.data as RiskRule[] | undefined || [];
  const alertList = alerts.data as RiskAlert[] | undefined || [];
  const violationList = violations.data as RuleViolation[] | undefined || [];

  if (!d) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <PageHeader title="Risk Management" description="Central hub for controlling trading risk" />
        <EmptyState message="No risk data" description="Start trading to see risk management analytics." />
      </motion.div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'exposure', label: 'Exposure', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'validation', label: 'Validate', icon: ShieldCheck },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const pnlColor = (val: number) => val >= 0 ? 'text-success' : 'text-destructive';
  const pnlBg = (val: number) => val >= 0 ? 'bg-success/10' : 'bg-destructive/10';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Risk Management"
        description="Central hub for controlling trading risk before, during, and after execution"
        actions={
          <Button variant="outline" size="sm" onClick={() => dashboard.refetch()}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
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
                activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'alerts' && alertList.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive/20 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  {alertList.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {/* Account & P&L */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard title="Account Balance" value={`$${d.account_balance.toLocaleString()}`} icon={Wallet} variant="info" size="sm" />
            <KpiCard title="Equity" value={`$${d.equity.toLocaleString()}`} icon={DollarSign} variant="info" size="sm" />
            <KpiCard title="Daily P&L" value={`$${d.daily_pnl.toFixed(2)}`} icon={TrendingDown} variant={d.daily_pnl >= 0 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Weekly P&L" value={`$${d.weekly_pnl.toFixed(2)}`} icon={BarChart3} variant={d.weekly_pnl >= 0 ? 'success' : 'danger'} size="sm" />
            <KpiCard title="Monthly P&L" value={`$${d.monthly_pnl.toFixed(2)}`} icon={Activity} variant={d.monthly_pnl >= 0 ? 'success' : 'danger'} size="sm" />
          </motion.div>

          {/* Risk Usage */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard title="Current Risk %" value={`${d.current_risk_percent.toFixed(2)}%`} icon={Target} variant={d.current_risk_percent > 5 ? 'danger' : 'warning'} size="sm" />
            <KpiCard title="Open Risk" value={`${d.open_risk.toFixed(2)}%`} icon={AlertTriangle} variant="warning" size="sm" />
            <KpiCard title="Available Risk" value={`${d.available_risk.toFixed(2)}%`} icon={ShieldCheck} variant="success" size="sm" />
            <KpiCard title="Daily Risk Left" value={`${d.daily_risk_remaining.toFixed(2)}%`} icon={Clock} variant={d.daily_risk_remaining < 1 ? 'danger' : 'info'} size="sm" />
            <KpiCard title="Open Positions" value={d.open_positions} icon={Hash} variant="info" size="sm" />
          </motion.div>

          {/* Drawdown */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            <KpiCard title="Max Drawdown" value={`${d.max_drawdown.toFixed(2)}%`} icon={TrendingDown} variant="danger" size="sm" />
            <KpiCard title="Current Drawdown" value={`${d.current_drawdown.toFixed(2)}%`} icon={AlertOctagon} variant={d.current_drawdown > 5 ? 'danger' : 'warning'} size="sm" />
            <KpiCard title="Recovery Progress" value={`${d.recovery_progress.toFixed(1)}%`} icon={RotateCcw} variant={d.recovery_progress > 50 ? 'success' : 'warning'} size="sm" />
          </motion.div>

          {/* Alert & Violation Banner */}
          {(d.active_alerts > 0 || d.rule_violations > 0) && (
            <motion.div variants={item}>
              <Card className={cn(d.active_alerts > 0 ? 'border-destructive/50' : 'border-warning/50')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', d.active_alerts > 0 ? 'bg-destructive/10' : 'bg-warning/10')}>
                      {d.active_alerts > 0 ? <AlertOctagon className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        {d.active_alerts} Active Alert{d.active_alerts !== 1 ? 's' : ''} • {d.rule_violations} Rule Violation{d.rule_violations !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-muted-foreground">Review your risk settings and open positions</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('alerts')} className="ml-auto">
                      View Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Drawdown Chart */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Drawdown Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <DrawdownChart data={dd} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Exposure Breakdown */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Exposure by Pair</CardTitle>
              </CardHeader>
              <CardContent>
                <ExposurePie
                  data={(d.exposure?.by_pair || []).map((p) => ({ name: p.name, value: p.risk }))}
                  label="pair"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Exposure by Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <ExposurePie
                  data={(d.exposure?.by_direction || []).map((p) => ({ name: p.name, value: p.risk }))}
                  label="direction"
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Calculator Tab */}
      {activeTab === 'calculator' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <PositionSizeCalculator projectId={projectId!} />
        </motion.div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {showCreateRule && <CreateRuleDialog projectId={projectId!} onClose={() => setShowCreateRule(false)} />}

          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-foreground">Risk Rules ({ruleList.length})</h3>
            <Button size="sm" onClick={() => setShowCreateRule(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </motion.div>

          {ruleList.length > 0 ? (
            <motion.div variants={item} className="space-y-3">
              {ruleList.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', rule.is_active ? 'bg-primary/10' : 'bg-muted')}>
                          {rule.severity === 'critical' ? <ShieldAlert className="h-5 w-5 text-destructive" /> :
                           rule.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
                           <Info className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{rule.name}</h4>
                          <p className="text-xs text-muted-foreground">{rule.rule_type.replace(/_/g, ' ')} • Limit: {rule.limit_value}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {rule.violation_count > 0 && (
                          <Badge variant="destructive">{rule.violation_count} violations</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule.mutate(rule.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <EmptyState message="No risk rules" description="Create rules to protect your capital." />
          )}
        </motion.div>
      )}

      {/* Exposure Tab */}
      {activeTab === 'exposure' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard title="Total Exposure" value={`${d.total_exposure.toFixed(2)}%`} icon={Activity} variant="warning" size="sm" />
            <KpiCard title="Open Positions" value={d.open_positions} icon={Hash} variant="info" size="sm" />
            <KpiCard title="Max Single" value={`${(d.exposure?.max_single_exposure || 0).toFixed(2)}%`} icon={Target} variant="info" size="sm" />
            <KpiCard title="Correlation Risk" value={`${(d.exposure?.correlation_risk || 0).toFixed(2)}%`} icon={AlertTriangle} variant="warning" size="sm" />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">By Pair</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Pair</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Positions</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.exposure?.by_pair || []).map((p, i) => (
                        <tr key={p.name} className={cn('border-b border-border/50', i % 2 === 0 && 'bg-muted/20')}>
                          <td className="px-4 py-2.5 font-medium">{p.name}</td>
                          <td className="px-4 py-2.5 text-right">{p.count}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{p.risk.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">By Direction</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Direction</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Positions</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.exposure?.by_direction || []).map((p, i) => (
                        <tr key={p.name} className={cn('border-b border-border/50', i % 2 === 0 && 'bg-muted/20')}>
                          <td className="px-4 py-2.5 font-medium">{p.name}</td>
                          <td className="px-4 py-2.5 text-right">{p.count}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{p.risk.toFixed(2)}%</td>
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

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {alertList.length > 0 ? (
            <motion.div variants={item} className="space-y-3">
              {alertList.map((alert) => (
                <Card key={alert.id} className={cn(
                  alert.severity === 'critical' && 'border-destructive/50',
                  alert.severity === 'warning' && 'border-warning/50'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', pnlBg(alert.severity === 'critical' ? -1 : 0))}>
                          {alert.severity === 'critical' ? <AlertOctagon className="h-5 w-5 text-destructive" /> :
                           alert.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
                           <Info className="h-5 w-5 text-info" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'secondary' : 'outline'}>
                          {alert.severity}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => dismissAlert.mutate(alert.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <EmptyState message="No active alerts" description="Your risk alerts will appear here." />
          )}
        </motion.div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <TradeValidator projectId={projectId!} />
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Risk History (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="daily_pnl" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Daily P&L" />
                      <Line type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Drawdown %" />
                      <Line type="monotone" dataKey="risk_percent" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Risk %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {violationList.length > 0 && (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Rule Violations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Rule</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Limit</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actual</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Severity</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {violationList.map((v, i) => (
                          <tr key={i} className={cn('border-b border-border/50', i % 2 === 0 && 'bg-muted/20')}>
                            <td className="px-4 py-2.5 font-medium">{v.rule_name}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{v.rule_type.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2.5 text-right font-mono">{v.limit_value}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-destructive">{v.actual_value}</td>
                            <td className="px-4 py-2.5"><Badge variant={v.severity === 'critical' ? 'destructive' : 'secondary'}>{v.severity}</Badge></td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function PositionSizeCalculator({ projectId }: { projectId: string }) {
  const calc = useCalculatePositionSize(projectId);
  const [form, setForm] = useState({
    account_balance: 10000,
    risk_percent: 1.0,
    entry_price: 1.1000,
    stop_loss: 1.0950,
    take_profit: 1.1100,
    pip_value: 10,
    instrument: 'forex',
  });
  const [result, setResult] = useState<PositionSizeResult | null>(null);

  const handleCalc = () => {
    calc.mutate(form, { onSuccess: (data) => setResult(data) });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Position Size Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Account Balance ($)</label>
              <input type="number" value={form.account_balance} onChange={(e) => setForm({ ...form, account_balance: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Risk %</label>
              <input type="number" step="0.1" value={form.risk_percent} onChange={(e) => setForm({ ...form, risk_percent: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entry Price</label>
              <input type="number" step="0.0001" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
              <input type="number" step="0.0001" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
              <input type="number" step="0.0001" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pip Value ($)</label>
              <input type="number" step="0.1" value={form.pip_value} onChange={(e) => setForm({ ...form, pip_value: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Instrument</label>
              <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="futures">Futures</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCalc} disabled={calc.isPending} className="w-full">
                {calc.isPending ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{result.position_size.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Position Size (units)</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{result.lot_size}</div>
                <div className="text-xs text-muted-foreground mt-1">Lot Size</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className={cn('text-2xl font-bold', 'text-destructive')}>${result.dollar_risk}</div>
                <div className="text-xs text-muted-foreground mt-1">Dollar Risk</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className={cn('text-2xl font-bold', result.expected_rr >= 1 ? 'text-success' : 'text-warning')}>{result.expected_rr}R</div>
                <div className="text-xs text-muted-foreground mt-1">Expected R:R</div>
              </div>
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <div className="text-2xl font-bold text-success">+${result.potential_profit}</div>
                <div className="text-xs text-muted-foreground mt-1">Potential Profit</div>
              </div>
              <div className="rounded-lg bg-destructive/10 p-4 text-center">
                <div className="text-2xl font-bold text-destructive">-${result.potential_loss}</div>
                <div className="text-xs text-muted-foreground mt-1">Potential Loss</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{result.stop_distance_pips}</div>
                <div className="text-xs text-muted-foreground mt-1">Stop Distance (pips)</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">${result.risk_per_pip}</div>
                <div className="text-xs text-muted-foreground mt-1">Risk Per Pip</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function TradeValidator({ projectId }: { projectId: string }) {
  const validate = useValidateTrade(projectId);
  const [form, setForm] = useState({ pair: 'EURUSD', direction: 'LONG', entry_price: 1.1000, stop_loss: 1.0950, take_profit: 1.1100, risk_percent: 1.0 });
  const [result, setResult] = useState<TradeValidationResult | null>(null);

  const handleValidate = () => {
    validate.mutate(form, { onSuccess: (data) => setResult(data) });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Trade Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pair</label>
              <input value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entry Price</label>
              <input type="number" step="0.0001" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
              <input type="number" step="0.0001" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
              <input type="number" step="0.0001" value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Risk %</label>
              <input type="number" step="0.1" value={form.risk_percent} onChange={(e) => setForm({ ...form, risk_percent: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleValidate} disabled={validate.isPending} className="w-full">
                {validate.isPending ? 'Validating...' : 'Validate Trade'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={cn(
          result.status === 'approved' && 'border-success/50',
          result.status === 'warning' && 'border-warning/50',
          result.status === 'rejected' && 'border-destructive/50'
        )}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.status === 'approved' ? <CheckCircle className="h-5 w-5 text-success" /> :
               result.status === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
               <XCircle className="h-5 w-5 text-destructive" />}
              <CardTitle className={cn('text-sm font-medium capitalize', result.status === 'approved' ? 'text-success' : result.status === 'warning' ? 'text-warning' : 'text-destructive')}>
                {result.status}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-lg font-bold text-foreground">{result.risk_amount ? `$${result.risk_amount}` : 'N/A'}</div>
                <div className="text-xs text-muted-foreground">Risk Amount</div>
              </div>
              <div className="rounded-lg bg-success/10 p-3 text-center">
                <div className="text-lg font-bold text-success">{result.potential_profit ? `+$${result.potential_profit}` : 'N/A'}</div>
                <div className="text-xs text-muted-foreground">Potential Profit</div>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3 text-center">
                <div className="text-lg font-bold text-destructive">{result.potential_loss ? `-$${result.potential_loss}` : 'N/A'}</div>
                <div className="text-xs text-muted-foreground">Potential Loss</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 text-center">
                <div className="text-lg font-bold text-foreground">{result.rr_ratio ? `${result.rr_ratio}R` : 'N/A'}</div>
                <div className="text-xs text-muted-foreground">R:R Ratio</div>
              </div>
            </div>

            <div className="space-y-2">
              {result.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  {check.passed ? <CheckCircle className="h-4 w-4 text-success shrink-0" /> :
                   check.severity === 'critical' ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> :
                   <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                  <div className="flex-1">
                    <span className="text-sm font-medium">{check.check_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{check.message}</span>
                  </div>
                  <Badge variant={check.passed ? 'default' : check.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {check.passed ? 'Pass' : check.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

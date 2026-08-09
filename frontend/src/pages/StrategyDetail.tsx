import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Skeleton } from '../components/ui/skeleton';
import { Alert } from '../components/ui/alert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/input';
import {
  useStrategy, useDeleteStrategy, useDuplicateStrategy,
  useStrategyAnalytics, useStrategyVersions, useCreateStrategyVersion,
} from '../hooks/useStrategies';
import {ArrowLeft, Edit, Trash2, Copy, Layers, TrendingUp, DollarSign, Award, Activity, Target, Shield, LineChart, BookOpen, BarChart3, Clock, Star, TrendingDown, CheckCircle2, XCircle, AlertTriangle, Zap, Brain} from 'lucide-react';
import { cn } from '../lib/utils';
import { chartTooltipStyle } from '../lib/chart';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'destructive'> = {
  Draft: 'default', Active: 'success', Archived: 'warning',
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--warning))'];

function formatCurrency(v: number | undefined | null): string {
  if (v == null) return '—';
  const p = v >= 0 ? '+' : '';
  return `${p}$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Section({ title, icon: Icon, children, delay = 0 }: { title: string; icon?: any; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export default function StrategyDetailPage() {
  const navigate = useNavigate();
  const { projectId, strategyId } = useParams<{ projectId: string; strategyId: string }>();
  const { data: strategy, isLoading, error, refetch } = useStrategy(projectId!, strategyId!);
  const analytics = useStrategyAnalytics(projectId!, strategyId!);
  const versions = useStrategyVersions(projectId!, strategyId!);
  const deleteStrategy = useDeleteStrategy(projectId!);
  const duplicateStrategy = useDuplicateStrategy(projectId!);
  const createVersion = useCreateStrategyVersion(projectId!);

  const [showDelete, setShowDelete] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newChangelog, setNewChangelog] = useState('');

  const handleCreateVersion = () => {
    if (!newVersion.trim()) return;
    createVersion.mutate({ id: strategyId!, data: { version: newVersion.trim(), change_log: newChangelog } });
    setNewVersion('');
    setNewChangelog('');
    setShowVersionDialog(false);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading strategy." onRetry={refetch} />;
  if (!strategy) return <EmptyState title="Strategy not found" description="This strategy may have been deleted." />;

  const a = analytics.data;
  const v = versions.data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(`/projects/${projectId}/strategies`)} className="mt-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{strategy.name || 'Untitled Strategy'}</h1>
              <Badge variant={statusColors[strategy.status || 'Draft'] || 'default'}>{strategy.status || 'Draft'}</Badge>
              {strategy.version && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Layers className="h-3 w-3" /> v{strategy.version}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {strategy.category && `${strategy.category}`}{strategy.category && strategy.market ? ' · ' : ''}{strategy.market || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowVersionDialog(true)}>
            <Layers className="h-3.5 w-3.5 mr-1" /> New Version
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/strategies/${strategyId}/edit`)}>
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => duplicateStrategy.mutate(strategyId!)}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* ── Description ── */}
      {strategy.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{strategy.description}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Performance KPIs ── */}
      <Section title="Performance" icon={TrendingUp}>
        {analytics.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : a ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard title="Total Trades" value={a.total_trades} icon={BarChart3} variant="default" size="sm" />
              <KpiCard title="Win Rate" value={`${a.win_rate.toFixed(1)}%`} icon={Award} variant={a.win_rate >= 50 ? 'success' : 'danger'} size="sm" />
              <KpiCard title="Total P&L" value={formatCurrency(a.total_pnl)} icon={DollarSign} variant={a.total_pnl >= 0 ? 'success' : 'danger'} size="sm" />
              <KpiCard title="Avg R:R" value={a.avg_rr.toFixed(2)} icon={Target} variant={a.avg_rr >= 1.5 ? 'success' : 'warning'} size="sm" />
              <KpiCard title="Expectancy" value={formatCurrency(a.expectancy)} icon={Activity} variant={a.expectancy > 0 ? 'success' : 'danger'} size="sm" />
              <KpiCard title="Profit Factor" value={a.profit_factor.toFixed(2)} icon={Zap} variant={a.profit_factor >= 1.5 ? 'success' : 'warning'} size="sm" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equity Curve */}
              {a.equity_curve && a.equity_curve.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium"><LineChart className="h-4 w-4 inline mr-1" /> Equity Curve</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={a.equity_curve}>
                          <defs>
                            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="trade" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={chartTooltipStyle.contentStyle} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#eqGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* P&L Distribution */}
              {a.distribution && a.distribution.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium"><BarChart3 className="h-4 w-4 inline mr-1" /> P&L Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={a.distribution}>
                          <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={chartTooltipStyle.contentStyle} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {a.distribution.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Monthly Performance */}
            {a.monthly_performance && a.monthly_performance.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium"><BarChart3 className="h-4 w-4 inline mr-1" /> Monthly Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={a.monthly_performance}>
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltipStyle.contentStyle} />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session & Pair Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {a.session_analysis && a.session_analysis.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium"><Clock className="h-4 w-4 inline mr-1" /> Session Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {a.session_analysis.map((s) => (
                        <div key={s.session} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                          <span className="text-xs font-medium text-foreground">{s.session}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{s.trades} trades</span>
                            <span className={cn('text-xs font-medium', s.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                              {s.pnl >= 0 ? '+' : ''}{s.pnl.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {a.pair_analysis && a.pair_analysis.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium"><Star className="h-4 w-4 inline mr-1" /> Pair Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {a.pair_analysis.map((p) => (
                        <div key={p.pair} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                          <span className="text-xs font-medium text-foreground">{p.pair}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{p.trades} trades</span>
                            <span className={cn('text-xs font-medium', p.pnl >= 0 ? 'text-success' : 'text-destructive')}>
                              {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {a.best_session && (
              <div className="flex flex-wrap gap-2">
                <Alert variant="success" title="Best Session" className="flex-1 min-w-[200px]">{a.best_session}</Alert>
                {a.worst_session && <Alert variant="error" title="Worst Session" className="flex-1 min-w-[200px]">{a.worst_session}</Alert>}
                {a.best_pair && <Alert variant="success" title="Best Pair" className="flex-1 min-w-[200px]">{a.best_pair}</Alert>}
                {a.worst_pair && <Alert variant="error" title="Worst Pair" className="flex-1 min-w-[200px]">{a.worst_pair}</Alert>}
              </div>
            )}
          </div>
        ) : (
          <EmptyState title="No performance data" description="Link trades to this strategy to see performance analytics." />
        )}
      </Section>

      {/* ── Trading Rules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Market Bias" icon={TrendingUp} delay={0.1}>
          <p className="text-sm text-muted-foreground">{strategy.market_bias || 'Not specified'}</p>
        </Section>

        {strategy.entry_conditions && (
          <Section title="Entry Conditions" icon={Activity} delay={0.15}>
            <div className="space-y-2">
              {Object.entries(strategy.entry_conditions).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <p className="text-xs text-muted-foreground">{String(val)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {strategy.confirmation_rules && strategy.confirmation_rules.length > 0 && (
          <Section title="Confirmation Rules" icon={CheckCircle2} delay={0.2}>
            <ul className="space-y-1.5">
              {strategy.confirmation_rules.map((rule: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary-text mt-0.5">•</span> {rule}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {strategy.invalidation_rules && strategy.invalidation_rules.length > 0 && (
          <Section title="Invalidation Rules" icon={XCircle} delay={0.25}>
            <ul className="space-y-1.5">
              {strategy.invalidation_rules.map((rule: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-destructive mt-0.5">•</span> {rule}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {strategy.exit_rules && (
          <Section title="Exit Rules" icon={TrendingDown} delay={0.3}>
            <div className="space-y-2">
              {Object.entries(strategy.exit_rules).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-xs font-medium text-foreground capitalize min-w-[100px]">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-muted-foreground">{String(val)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {strategy.risk_rules && (
          <Section title="Risk Rules" icon={Shield} delay={0.35}>
            <div className="space-y-2">
              {Object.entries(strategy.risk_rules).map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <p className="text-xs text-muted-foreground">{String(val)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ── Execution Model ── */}
      <Section title="Execution Model" icon={Zap} delay={0.4}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Entry Model</div>
            <div className="text-sm font-semibold text-foreground mt-1">{strategy.entry_model || 'Not set'}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Stop Loss</div>
            <div className="text-sm font-semibold text-foreground mt-1">{strategy.stop_loss_model || 'Not set'}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Take Profit</div>
            <div className="text-sm font-semibold text-foreground mt-1">{strategy.take_profit_model || 'Not set'}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Volatility Req.</div>
            <div className="text-sm font-semibold text-foreground mt-1">{strategy.volatility_requirements || 'Not set'}</div>
          </div>
        </div>
        {strategy.partial_close_rules && strategy.partial_close_rules.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Partial Close Rules</h4>
            <ul className="space-y-1">
              {strategy.partial_close_rules.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="text-primary-text mt-0.5">•</span>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {strategy.trade_management_rules && strategy.trade_management_rules.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Trade Management Rules</h4>
            <ul className="space-y-1">
              {strategy.trade_management_rules.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="text-primary-text mt-0.5">•</span>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* ── Context & Psychology ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Trading Context" icon={Clock} delay={0.45}>
          <div className="space-y-3">
            {strategy.preferred_sessions && strategy.preferred_sessions.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Preferred Sessions</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {strategy.preferred_sessions.map((s: string) => (
                    <Badge key={s} variant="info" size="sm">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {strategy.preferred_market_conditions && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Market Conditions</span>
                <p className="text-xs text-foreground mt-0.5">{strategy.preferred_market_conditions}</p>
              </div>
            )}
            {strategy.news_restrictions && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">News Restrictions</span>
                <p className="text-xs text-foreground mt-0.5">{strategy.news_restrictions}</p>
              </div>
            )}
            {strategy.timeframes && strategy.timeframes.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Timeframes</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {strategy.timeframes.map((tf: string) => (
                    <Badge key={tf} variant="default" size="sm">{tf}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Trading Psychology" icon={Brain} delay={0.5}>
          <div className="space-y-3">
            {strategy.required_mindset && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Required Mindset</span>
                <p className="text-xs text-foreground mt-0.5">{strategy.required_mindset}</p>
              </div>
            )}
            {strategy.discipline_rules && strategy.discipline_rules.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Discipline Rules</span>
                <ul className="space-y-1 mt-1">
                  {strategy.discipline_rules.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><span className="text-primary-text mt-0.5">•</span>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.common_mistakes && strategy.common_mistakes.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Common Mistakes</span>
                <ul className="space-y-1 mt-1">
                  {strategy.common_mistakes.map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-destructive"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.things_to_avoid && strategy.things_to_avoid.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Things to Avoid</span>
                <ul className="space-y-1 mt-1">
                  {strategy.things_to_avoid.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><XCircle className="h-3 w-3 mt-0.5 shrink-0" />{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Checklist ── */}
      {strategy.checklist_items && strategy.checklist_items.length > 0 && (
        <Section title="Pre-Trade Checklist" icon={CheckCircle2} delay={0.55}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strategy.checklist_items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input">
                  {item.optional ? (
                    <span className="text-3xs text-muted-foreground">?</span>
                  ) : null}
                </div>
                <span className="text-xs text-foreground">{item.label}</span>
                {item.category && <span className="text-3xs text-muted-foreground ml-auto">{item.category}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Documentation ── */}
      {strategy.documentation && (
        <Section title="Documentation" icon={BookOpen} delay={0.6}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{strategy.documentation}</p>
          </div>
        </Section>
      )}

      {/* ── Tags ── */}
      {strategy.tags && strategy.tags.length > 0 && (
        <Section title="Tags" delay={0.65}>
          <div className="flex flex-wrap gap-1.5">
            {strategy.tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary-text">
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Version History ── */}
      <Section title="Version History" icon={Layers} delay={0.7}>
        {versions.isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : v && v.length > 0 ? (
          <div className="space-y-2">
            {v.map((ver) => (
              <div key={ver.id} className="flex items-start justify-between rounded-lg bg-muted/30 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">v{ver.version}</span>
                    {ver.author && <span className="text-3xs text-muted-foreground">by {ver.author}</span>}
                  </div>
                  {ver.change_log && <p className="text-xs text-muted-foreground mt-0.5">{ver.change_log}</p>}
                  <span className="text-3xs text-muted-foreground mt-1 block">{new Date(ver.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No version history yet. Create a version to track changes.</p>
        )}
      </Section>

      {/* ── Change Log ── */}
      {strategy.change_log && strategy.change_log.length > 0 && (
        <Section title="Change Log" delay={0.75}>
          <div className="space-y-2">
            {strategy.change_log.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Layers className="h-3 w-3 text-primary-text" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">v{entry.version}</span>
                    {entry.author && <span className="text-3xs text-muted-foreground">by {entry.author}</span>}
                    <span className="text-3xs text-muted-foreground ml-auto">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''}</span>
                  </div>
                  {entry.change_log && <p className="text-xs text-muted-foreground mt-0.5">{entry.change_log}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Delete Dialog ── */}
      <ConfirmDialog isOpen={showDelete} onCancel={() => setShowDelete(false)}
        title="Delete Strategy" message="This permanently deletes the strategy. Trades linked to it will not be affected."
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { deleteStrategy.mutate(strategyId!); navigate(`/projects/${projectId}/strategies`); }}
      />

      {/* ── New Version Modal ── */}
      {showVersionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowVersionDialog(false)}>
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Create New Version</h2>
            <p className="text-sm text-muted-foreground">Create a snapshot of the current strategy state.</p>
            <Input placeholder="Version (e.g. 2.0.0)" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} />
            <Input placeholder="Change log (optional)" value={newChangelog} onChange={(e) => setNewChangelog(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVersionDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateVersion} disabled={!newVersion.trim() || createVersion.isPending}>
                {createVersion.isPending ? 'Creating...' : 'Create Version'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { useAIProfile, useUpdateAIProfile, useAnalyzeProfile, useEvaluations, useEvaluateTrade } from '../hooks/useAIFoundation';
import {
  Brain, TrendingUp, Target, Shield, Activity, BarChart3,
  RefreshCw, ChevronDown, CheckCircle, AlertTriangle,
} from 'lucide-react';
import type { AIProfile, TradeEvaluation, PsychologicalPattern } from '../api/types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const scoreColor = (s: number) => s >= 70 ? 'text-success' : s >= 50 ? 'text-warning' : 'text-destructive';
const scoreVariant = (s: number) => s >= 70 ? 'success' : s >= 50 ? 'warning' : 'destructive';

export default function AIProfilePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tradeId, setTradeId] = useState('');

  const profile = useAIProfile(projectId!);
  const analyzeProfile = useAnalyzeProfile(projectId!);
  const evaluations = useEvaluations(projectId!);
  const evalTrade = useEvaluateTrade(projectId!);

  const data = profile.data;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Trader Intelligence Profile"
          description="Your trading archetype, strengths, weaknesses, and learning progress"
          actions={
            <Button size="sm" onClick={() => analyzeProfile.mutate()} disabled={analyzeProfile.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${analyzeProfile.isPending ? 'animate-spin' : ''}`} />
              Re-Analyze Profile
            </Button>
          }
        />
      </motion.div>

      {profile.isLoading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : profile.error ? (
        <ErrorState message="Failed to load profile" description={profile.error?.message || 'An unexpected error occurred'} onRetry={() => profile.refetch()} />
      ) : data ? (
        <>
          {/* Score Banner */}
          <motion.div variants={item}>
            <div className="flex items-center gap-6 rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-3xl font-bold text-primary">{data.overall_score?.toFixed(0) ?? '—'}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">Overall Score</h3>
                <p className="text-sm text-muted-foreground">
                  Based on {data.total_trades_analyzed} trades analyzed
                  {data.last_analyzed_at && ` · Last analyzed ${new Date(data.last_analyzed_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-lg font-bold">{data.trading_style || '—'}</p>
                  <p className="text-3xs text-muted-foreground">Style</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{data.risk_profile || '—'}</p>
                  <p className="text-3xs text-muted-foreground">Risk</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{data.avg_rr?.toFixed(1) ?? '—'}</p>
                  <p className="text-3xs text-muted-foreground">Avg R:R</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Preferences */}
            <motion.div variants={item}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4" />Trading Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Preferred Sessions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.preferred_sessions?.map((s) => <Badge key={s} variant="info">{s}</Badge>) || <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Preferred Pairs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.preferred_pairs?.map((p) => <Badge key={p} variant="secondary">{p}</Badge>) || <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Timeframes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.preferred_timeframes?.map((tf) => <Badge key={tf} variant="outline">{tf}</Badge>) || <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Markets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.preferred_markets?.map((m) => <Badge key={m} variant="secondary">{m}</Badge>) || <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risk Metrics */}
            <motion.div variants={item}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" />Risk Profile</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Avg R:R', value: data.avg_rr?.toFixed(2) },
                      { label: 'Avg Risk/Trade', value: data.avg_risk_per_trade ? `${data.avg_risk_per_trade}%` : null },
                      { label: 'Avg Holding', value: data.avg_holding_time_min ? `${data.avg_holding_time_min} min` : null },
                      { label: 'Max Drawdown', value: data.max_drawdown_pct ? `${data.max_drawdown_pct.toFixed(1)}%` : null },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-muted/20 p-3 text-center">
                        <p className="text-lg font-bold">{m.value || '—'}</p>
                        <p className="text-3xs text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Best / Worst Conditions */}
            <motion.div variants={item}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-success" />Best Conditions</CardTitle></CardHeader>
                <CardContent>
                  {data.best_conditions ? (
                    <div className="space-y-2">
                      {Object.entries(data.best_conditions).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No data yet</p>}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-warning" />Worst Conditions</CardTitle></CardHeader>
                <CardContent>
                  {data.worst_conditions ? (
                    <div className="space-y-2">
                      {Object.entries(data.worst_conditions).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No data yet</p>}
                </CardContent>
              </Card>
            </motion.div>

            {/* Psychological Patterns */}
            <motion.div variants={item} className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4" />Psychological Patterns</CardTitle></CardHeader>
                <CardContent>
                  {data.psychological_patterns && data.psychological_patterns.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {data.psychological_patterns.map((p: PsychologicalPattern, i: number) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            p.impact === 'positive' ? 'bg-success/10' : 'bg-destructive/10'
                          }`}>
                            <Activity className={`h-4 w-4 ${p.impact === 'positive' ? 'text-success' : 'text-destructive'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.pattern}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.frequency} occurrences
                              {p.win_rate != null && ` · ${p.win_rate}% WR`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Analyze profile to detect psychological patterns</p>}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Trade Evaluator */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />Trade Evaluator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter Trade ID to evaluate..."
                    value={tradeId}
                    onChange={(e) => setTradeId(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => { if (tradeId) evalTrade.mutate(tradeId); }}
                    disabled={!tradeId || evalTrade.isPending}
                  >
                    Evaluate
                  </Button>
                </div>

                {evaluations.data && evaluations.data.length > 0 && (
                  <div className="space-y-3">
                    {(evaluations.data ?? []).slice(0, 5).map((ev: TradeEvaluation) => (
                      <div key={ev.id} className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-sm font-bold text-primary">{ev.overall_quality?.toFixed(0) ?? '—'}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-2 text-center text-xs">
                          <div><p className={`font-bold ${scoreColor(ev.strength_score ?? 0)}`}>{ev.strength_score?.toFixed(0) ?? '—'}</p><p className="text-muted-foreground">Strength</p></div>
                          <div><p className={`font-bold ${scoreColor(ev.execution_score ?? 0)}`}>{ev.execution_score?.toFixed(0) ?? '—'}</p><p className="text-muted-foreground">Execution</p></div>
                          <div><p className={`font-bold ${scoreColor(ev.psychology_score ?? 0)}`}>{ev.psychology_score?.toFixed(0) ?? '—'}</p><p className="text-muted-foreground">Psychology</p></div>
                          <div><p className={`font-bold ${scoreColor(ev.discipline_score ?? 0)}`}>{ev.discipline_score?.toFixed(0) ?? '—'}</p><p className="text-muted-foreground">Discipline</p></div>
                        </div>
                        <Badge variant={scoreVariant(ev.overall_quality ?? 0) as 'success'} className="text-3xs">{ev.provider}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <EmptyState message="No profile data. Click 'Re-Analyze Profile' to generate your trader profile." />
      )}
    </motion.div>
  );
}

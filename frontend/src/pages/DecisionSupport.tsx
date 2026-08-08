import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { useDecisionCurrent, useDecisionTrade, useDecisionHistory } from '../hooks/useDecision';
import { BarChart3, TrendingUp, Target, Scale, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { FormField } from '../components/ui/form-field';
import type { DecisionResponse, DecisionEnvironment } from '../api/types';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function DecisionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [env, setEnv] = useState<DecisionEnvironment>({
    pair: '', direction: '', weekly_bias: '', daily_bias: '', h4_bias: '',
    market_phase: '', trend: '', asian_session: false, london_session: false,
    newyork_session: false, liquidity_sweep: '', mss: '', fvg: '',
  });
  const [compareMode, setCompareMode] = useState<'current' | 'trade'>('current');
  const [tradeIdInput, setTradeIdInput] = useState('');

  const currentMutation = useDecisionCurrent(projectId!);
  const tradeMutation = useDecisionTrade(projectId!);
  const history = useDecisionHistory(projectId!);

  const result: DecisionResponse | null = currentMutation.data || tradeMutation.data || null;
  const isLoading = currentMutation.isPending || tradeMutation.isPending;
  const isError = currentMutation.isError || tradeMutation.isError;
  const handleRetry = () => { if (compareMode === 'current') currentMutation.mutate(env); else if (compareMode === 'trade' && tradeIdInput) tradeMutation.mutate(tradeIdInput); };

  const handleEvaluate = () => {
    if (compareMode === 'current') currentMutation.mutate(env);
    else if (compareMode === 'trade' && tradeIdInput) tradeMutation.mutate(tradeIdInput);
  };

  const conf = result?.confidence;
  const exec = result?.execution;
  const sim = result?.similarity;
  const pat = result?.pattern_match;
  const ma = result?.market_alignment;
  const ict = result?.ict_components;
  const sa = result?.session_alignment;
  const st = result?.statistics;

  const confGaugeData = conf ? [{ name: 'Confidence', value: conf.score, fill: conf.score >= 75 ? 'hsl(var(--success))' : conf.score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }] : [];

  const evidenceDist = result ? [
    { name: 'Market', value: ma?.score || 0 },
    { name: 'ICT', value: ict?.score || 0 },
    { name: 'Session', value: sa?.score || 0 },
    { name: 'Pattern', value: pat?.match_score || 0 },
  ] : [];

  const patternContrib = pat && pat.found ? [
    { name: 'Win Rate', value: pat.win_rate },
    { name: 'Confidence', value: pat.confidence },
    { name: 'Match Score', value: pat.match_score },
  ] : [];

  const simTimeline = sim?.top_matches?.slice(0, 10).map((m: any, i) => ({
    index: i + 1, similarity: m.similarity_score || 0, rr: m.rr || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision Support"
        description="Evaluate trading environments against historical data"
      />

      {/* Input */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Evaluate Environment</CardTitle>
            <div className="flex gap-2">
              {(['current', 'trade'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={compareMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareMode(mode)}
                >
                  {mode === 'current' ? 'Current Env' : 'By Trade ID'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {compareMode === 'current' && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              <FormField label="Pair" value={env.pair || ''} onChange={(v) => setEnv({ ...env, pair: v })} options={['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF']} />
              <FormField label="Direction" value={env.direction || ''} onChange={(v) => setEnv({ ...env, direction: v })} options={['BUY', 'SELL']} />
              <FormField label="Weekly Bias" value={env.weekly_bias || ''} onChange={(v) => setEnv({ ...env, weekly_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
              <FormField label="Daily Bias" value={env.daily_bias || ''} onChange={(v) => setEnv({ ...env, daily_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
              <FormField label="H4 Bias" value={env.h4_bias || ''} onChange={(v) => setEnv({ ...env, h4_bias: v })} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
              <FormField label="Market Phase" value={env.market_phase || ''} onChange={(v) => setEnv({ ...env, market_phase: v })} options={['ACCUMULATION', 'MARKUP', 'DISTRIBUTION', 'MARKDOWN']} />
              <FormField label="Trend" value={env.trend || ''} onChange={(v) => setEnv({ ...env, trend: v })} options={['UPTREND', 'DOWNTREND', 'RANGING']} />
              <FormField label="Liquidity Sweep" value={env.liquidity_sweep || ''} onChange={(v) => setEnv({ ...env, liquidity_sweep: v })} options={['YES', 'NO']} />
              <FormField label="MSS" value={env.mss || ''} onChange={(v) => setEnv({ ...env, mss: v })} options={['YES', 'NO']} />
              <FormField label="FVG" value={env.fvg || ''} onChange={(v) => setEnv({ ...env, fvg: v })} options={['YES', 'NO']} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Sessions</label>
                <div className="flex gap-2">
                  {(['Asian', 'London', 'NY'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-input" checked={s === 'Asian' ? (env.asian_session || false) : s === 'London' ? (env.london_session || false) : (env.newyork_session || false)}
                        onChange={(e) => setEnv({ ...env, [s === 'Asian' ? 'asian_session' : s === 'London' ? 'london_session' : 'newyork_session']: e.target.checked })}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {compareMode === 'trade' && (
            <div className="flex gap-3">
              <input type="text" placeholder="Trade ID (UUID)" value={tradeIdInput} onChange={(e) => setTradeIdInput(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          <Button onClick={handleEvaluate} disabled={isLoading || (compareMode === 'trade' && !tradeIdInput)} isLoading={isLoading}>
            <BarChart3 className="mr-1.5 h-4 w-4" /> Evaluate
          </Button>
        </CardContent>
      </Card>

      {isError && <ErrorState message="Error running decision evaluation." onRetry={handleRetry} />}

      {result && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Confidence */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width={140} height={140}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={confGaugeData} startAngle={180} endAngle={0}>
                      <RadialBar dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div>
                    <div className={cn('text-4xl font-bold', conf?.score != null && (conf.score >= 75 ? 'text-success' : conf.score >= 50 ? 'text-warning' : 'text-destructive'))}>
                      {conf?.score || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">{conf?.level || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Execution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Execution Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant={exec?.status === 'SATISFIED' ? 'success' : exec?.status === 'PARTIALLY_SATISFIED' ? 'warning' : 'destructive'}>
                  {exec?.status?.replace('_', ' ') || 'NOT EVALUATED'}
                </Badge>
                <div className="space-y-1.5">
                  {exec?.criteria?.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className={cn('h-2 w-2 rounded-full', c.met ? 'bg-success' : 'bg-destructive')} />
                        {c.name}
                      </span>
                      <span className={c.met ? 'text-success' : 'text-destructive'}>{c.detail}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3.5 w-3.5 text-primary-text" />
                  <p className="text-xs text-muted-foreground">Market Alignment</p>
                </div>
                <p className="text-lg font-bold text-foreground">{ma?.score || 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-primary-text" />
                  <p className="text-xs text-muted-foreground">Similar Trades</p>
                </div>
                <p className="text-lg font-bold text-foreground">{String(sim?.matches_found || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <p className="text-xs text-muted-foreground">Hist. Win Rate</p>
                </div>
                <p className="text-lg font-bold text-foreground">{sim?.average_win_rate || 0}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="h-3.5 w-3.5 text-chart-1" />
                  <p className="text-xs text-muted-foreground">Hist. RR</p>
                </div>
                <p className="text-lg font-bold text-foreground">{(sim?.average_rr || 0).toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Evidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={evidenceDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {patternContrib.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pattern Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={patternContrib}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pattern Match</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[200px] items-center justify-center">
                  <p className="text-xs text-muted-foreground">No matching pattern found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {simTimeline.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Similarity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={simTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="similarity" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {result.explanation?.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {pat?.found && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Matched Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div><span className="text-xs text-muted-foreground">Name</span><div className="text-sm font-medium text-foreground">{pat.name}</div></div>
                  <div><span className="text-xs text-muted-foreground">Win Rate</span><div className="text-sm font-medium text-foreground">{pat.win_rate}%</div></div>
                  <div><span className="text-xs text-muted-foreground">Expectancy</span><div className="text-sm font-medium text-foreground">{pat.expectancy}</div></div>
                  <div><span className="text-xs text-muted-foreground">Occurrences</span><div className="text-sm font-medium text-foreground">{pat.occurrences}</div></div>
                  <div><span className="text-xs text-muted-foreground">Avg RR</span><div className="text-sm font-medium text-foreground">{pat.avg_rr}</div></div>
                  <div><span className="text-xs text-muted-foreground">Profit Factor</span><div className="text-sm font-medium text-foreground">{pat.profit_factor}</div></div>
                  <div><span className="text-xs text-muted-foreground">Confidence</span><div className="text-sm font-medium text-foreground">{pat.confidence}%</div></div>
                  <div><span className="text-xs text-muted-foreground">Match Score</span><div className="text-sm font-medium text-foreground">{pat.match_score}%</div></div>
                </div>
              </CardContent>
            </Card>
          )}

          {st && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Statistics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div><span className="text-xs text-muted-foreground">Overall Win Rate</span><div className="text-sm font-medium text-foreground">{st.overall_win_rate}%</div></div>
                  <div><span className="text-xs text-muted-foreground">Avg RR</span><div className="text-sm font-medium text-foreground">{st.overall_avg_rr}</div></div>
                  <div><span className="text-xs text-muted-foreground">Expectancy</span><div className="text-sm font-medium text-foreground">{st.overall_expectancy}</div></div>
                  <div><span className="text-xs text-muted-foreground">Total Trades</span><div className="text-sm font-medium text-foreground">{st.overall_total_trades}</div></div>
                  <div><span className="text-xs text-muted-foreground">Profit Factor</span><div className="text-sm font-medium text-foreground">{st.overall_profit_factor}</div></div>
                  <div><span className="text-xs text-muted-foreground">Max Drawdown</span><div className="text-sm font-medium text-foreground">{st.overall_max_drawdown}</div></div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {result && !result.market_alignment?.score && !result.similarity?.matches_found && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-xs text-muted-foreground">No historical data available. Add trades and market structure to enable decision support.</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.data && history.data.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Evaluations</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-4 py-2.5">Pair</th>
                  <th className="px-4 py-2.5">Direction</th>
                  <th className="px-4 py-2.5">Result</th>
                  <th className="px-4 py-2.5">RR</th>
                  <th className="px-4 py-2.5">PnL</th>
                  <th className="px-4 py-2.5">Alignment</th>
                  <th className="px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(history.data ?? []).map((h) => (
                  <tr key={h.trade_id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium text-foreground">{h.pair || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{h.direction || '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={h.result === 'WIN' ? 'success' : h.result === 'LOSS' ? 'destructive' : 'default'} size="sm">
                        {h.result || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{h.rr != null ? h.rr.toFixed(2) : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={h.pnl != null && h.pnl >= 0 ? 'text-success' : 'text-destructive'}>
                        {h.pnl != null ? h.pnl.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{h.market_alignment}%</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

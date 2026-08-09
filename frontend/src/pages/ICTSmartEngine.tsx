import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTelemetry } from '../hooks/usePageTelemetry';
import { useAnalyzeICT, useICTAIContext } from '../hooks/useICT';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { cn } from '../lib/utils';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import {Brain, TrendingUp, TrendingDown, Activity, Layers, Zap, Target, CheckCircle2, Gauge, BarChart3, Globe, RefreshCw, Sparkles, ArrowUpRight, ArrowDownRight} from 'lucide-react';
import type { ICTAnalysisResponse } from '../api/types';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'BTCUSD'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

function generateEmptyBars(count = 100) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 3600000).toISOString(),
    open: 0, high: 0, low: 0, close: 0, volume: 0,
  }));
}

function normalizeICT(data: ICTAnalysisResponse | null): ICTAnalysisResponse | null {
  if (!data) return null;
  return {
    symbol: data.symbol ?? '',
    timeframe: data.timeframe ?? '',
    analysis_time_ms: data.analysis_time_ms ?? 0,
    structure: {
      swing_points: data.structure?.swing_points ?? [],
      structures: data.structure?.structures ?? [],
      trend: data.structure?.trend ?? 'neutral',
      current_high: data.structure?.current_high ?? null,
      current_low: data.structure?.current_low ?? null,
      protected_high: data.structure?.protected_high ?? null,
      protected_low: data.structure?.protected_low ?? null,
      last_bos: data.structure?.last_bos ?? null,
      last_mss: data.structure?.last_mss ?? null,
    },
    fvg: {
      fvgs: data.fvg?.fvgs ?? [],
      bullish_count: data.fvg?.bullish_count ?? 0,
      bearish_count: data.fvg?.bearish_count ?? 0,
      best_fvg: data.fvg?.best_fvg ?? null,
    },
    order_blocks: {
      order_blocks: data.order_blocks?.order_blocks ?? [],
      bullish_count: data.order_blocks?.bullish_count ?? 0,
      bearish_count: data.order_blocks?.bearish_count ?? 0,
      best_block: data.order_blocks?.best_block ?? null,
    },
    liquidity: {
      zones: data.liquidity?.zones ?? [],
      buy_side_liquidity: data.liquidity?.buy_side_liquidity ?? [],
      sell_side_liquidity: data.liquidity?.sell_side_liquidity ?? [],
      equal_highs: data.liquidity?.equal_highs ?? [],
      equal_lows: data.liquidity?.equal_lows ?? [],
      recent_sweeps: data.liquidity?.recent_sweeps ?? [],
    },
    sessions: {
      id: '',
      project_id: '',
      date: '',
      session_name: '',
      sessions: data.sessions?.sessions ?? [],
      current_session: data.sessions?.current_session ?? null,
      current_kill_zone: data.sessions?.current_kill_zone ?? null,
      is_silver_bullet_window: data.sessions?.is_silver_bullet_window ?? false,
      opening_range_high: data.sessions?.opening_range_high ?? null,
      opening_range_low: data.sessions?.opening_range_low ?? null,
    },
    models: data.models ?? [],
    multi_timeframe: {
      weekly: data.multi_timeframe?.weekly ?? '',
      daily: data.multi_timeframe?.daily ?? '',
      h4: data.multi_timeframe?.h4 ?? '',
      h1: data.multi_timeframe?.h1 ?? '',
      m15: data.multi_timeframe?.m15 ?? '',
      htf_bias: data.multi_timeframe?.htf_bias ?? 'neutral',
      ltf_confirmation: data.multi_timeframe?.ltf_confirmation ?? 'neutral',
      confluence_score: data.multi_timeframe?.confluence_score ?? 0,
      premium_discount: data.multi_timeframe?.premium_discount ?? 'neutral',
    },
    scores: {
      structure_score: data.scores?.structure_score ?? 0,
      liquidity_score: data.scores?.liquidity_score ?? 0,
      fvg_score: data.scores?.fvg_score ?? 0,
      order_block_score: data.scores?.order_block_score ?? 0,
      risk_score: data.scores?.risk_score ?? 0,
      session_score: data.scores?.session_score ?? 0,
      confluence_score: data.scores?.confluence_score ?? 0,
      overall_quality: data.scores?.overall_quality ?? 0,
    },
    execution: {
      status: data.execution?.status ?? 'unknown',
      direction: data.execution?.direction ?? null,
      entry: data.execution?.entry ?? null,
      stop_loss: data.execution?.stop_loss ?? null,
      take_profit: data.execution?.take_profit ?? null,
      risk_amount: data.execution?.risk_amount ?? null,
      reasoning: data.execution?.reasoning ?? '',
      scores: {
        structure_score: data.execution?.scores?.structure_score ?? 0,
        liquidity_score: data.execution?.scores?.liquidity_score ?? 0,
        fvg_score: data.execution?.scores?.fvg_score ?? 0,
        order_block_score: data.execution?.scores?.order_block_score ?? 0,
        risk_score: data.execution?.scores?.risk_score ?? 0,
        session_score: data.execution?.scores?.session_score ?? 0,
        confluence_score: data.execution?.scores?.confluence_score ?? 0,
        overall_quality: data.execution?.scores?.overall_quality ?? 0,
      },
    },
    market_context: {
      symbol: data.market_context?.symbol ?? '',
      current_price: data.market_context?.current_price ?? 0,
      htf_bias: data.market_context?.htf_bias ?? '',
      ltf_bias: data.market_context?.ltf_bias ?? '',
      current_structure: data.market_context?.current_structure ?? null,
      best_setup: data.market_context?.best_setup ?? null,
      premium_discount: data.market_context?.premium_discount ?? '',
      key_levels: data.market_context?.key_levels ?? [],
      weak_areas: data.market_context?.weak_areas ?? [],
      invalidation_levels: data.market_context?.invalidation_levels ?? [],
      confluence: data.market_context?.confluence ?? 0,
      session_info: data.market_context?.session_info ?? null,
      recent_events: data.market_context?.recent_events ?? [],
      reasoning: data.market_context?.reasoning ?? '',
    },
  };
}

export default function ICTSmartEngine() {
  usePageTelemetry('ict_open');
  const { projectId } = useParams<{ projectId: string }>();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');
  const [includeModels] = useState(true);

  const analyzeMutation = useAnalyzeICT(projectId || '');
  const { data: aiCtx, isLoading: aiLoading } = useICTAIContext(projectId || '', symbol);

  const [analysis, setAnalysis] = useState<ICTAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!projectId) return;
    setAnalyzing(true);
    try {
      const bars = generateEmptyBars(200);
      const result = await analyzeMutation.mutateAsync({
        symbol,
        timeframe,
        bars,
        include_fvg: true,
        include_order_blocks: true,
        include_liquidity: true,
        include_sessions: true,
        include_models: includeModels,
      });
      setAnalysis(normalizeICT(result));
      toast.success('ICT analysis complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [projectId, symbol, timeframe, includeModels, analyzeMutation]);

  if (!projectId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState icon={<Brain className="h-6 w-6" />} title="No project selected" description="Select a project to open the ICT Smart Engine." />
      </div>
    );
  }

  if (aiLoading) {
    return <LoadingSpinner message="Loading ICT analysis..." />;
  }

  if (!analysis) {
    return <EmptyState icon={<Brain className="h-6 w-6" />} title="No analysis available" description="Upload trading data to generate ICT analysis" />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ICT Smart Engine</h1>
          <p className="text-sm text-muted-foreground">Institutional Market Structure Intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:border-primary/50"
          >
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:border-primary/50"
          >
            {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {analysis ? (
        <div className="space-y-6">
          {/* Bias Bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">HTF Bias:</span>
                  <Badge variant={analysis.multi_timeframe.htf_bias === 'bullish' ? 'success' : analysis.multi_timeframe.htf_bias === 'bearish' ? 'destructive' : 'secondary'}>
                    {analysis.multi_timeframe.htf_bias.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">LTF Confirmation:</span>
                  <Badge variant={analysis.multi_timeframe.ltf_confirmation === 'bullish' ? 'success' : analysis.multi_timeframe.ltf_confirmation === 'bearish' ? 'destructive' : 'secondary'}>
                    {analysis.multi_timeframe.ltf_confirmation.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confluence:</span>
                  <span className="text-sm font-bold font-mono">{analysis.multi_timeframe.confluence_score.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Premium/Discount:</span>
                  <Badge variant={analysis.multi_timeframe.premium_discount === 'premium' ? 'warning' : 'info'}>
                    {analysis.multi_timeframe.premium_discount.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  analysis.execution.status === 'ready' ? 'success' :
                  analysis.execution.status === 'wait' ? 'warning' : 'destructive'
                } className="text-xs">
                  {analysis.execution.status.toUpperCase()}
                </Badge>
                <span className="text-3xs text-muted-foreground">{analysis.analysis_time_ms.toFixed(0)}ms</span>
              </div>
            </div>
            {analysis.execution.reasoning && (
              <p className="text-xs text-muted-foreground mt-2">{analysis.execution.reasoning}</p>
            )}
          </Card>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <KpiCard
              title="Swing Points"
              value={analysis.structure.swing_points.length}
              icon={Activity}
              trend={analysis.structure.trend === 'bullish' ? { value: 5, positive: true } : analysis.structure.trend === 'bearish' ? { value: -5, positive: false } : undefined}
            />
            <KpiCard
              title="Structure Events"
              value={analysis.structure.structures.length}
              icon={Layers}
            />
            <KpiCard
              title="Bullish FVGs"
              value={analysis.fvg.bullish_count}
              icon={TrendingUp}
              subtitle={`Best: ${analysis.fvg.best_fvg?.probability_score.toFixed(0) ?? 'N/A'}%`}
            />
            <KpiCard
              title="Bearish FVGs"
              value={analysis.fvg.bearish_count}
              icon={TrendingDown}
            />
            <KpiCard
              title="Liquidity Zones"
              value={analysis.liquidity.zones.length}
              icon={Target}
              subtitle={`${analysis.liquidity.recent_sweeps.length} sweeps`}
            />
            <KpiCard
              title="Quality Score"
              value={analysis.scores.overall_quality.toFixed(1)}
              icon={Gauge}
              trend={analysis.scores.overall_quality >= 7 ? { value: 8, positive: true } : analysis.scores.overall_quality >= 4 ? { value: 0, positive: true } : { value: -8, positive: false }}
            />
          </div>

          {/* Detected ICT Models */}
          {analysis.models.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Detected Setups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {analysis.models.map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-3">
                        {m.direction === 'bullish' ? (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                        <div>
                          <span className="text-sm font-medium capitalize">{m.model_type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">({m.direction})</span>
                          <span className="text-3xs text-muted-foreground ml-2">{m.components.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', m.quality_score >= 7 ? 'bg-success' : m.quality_score >= 4 ? 'bg-warning' : 'bg-destructive')}
                            style={{ width: `${(m.quality_score / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{m.quality_score.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Component Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'structure_score', label: 'Structure' },
                  { key: 'liquidity_score', label: 'Liquidity' },
                  { key: 'fvg_score', label: 'FVG' },
                  { key: 'order_block_score', label: 'Order Blocks' },
                  { key: 'risk_score', label: 'Risk' },
                  { key: 'session_score', label: 'Session' },
                ].map(({ key, label }) => {
                  const val = (analysis.scores as unknown as Record<string, number>)[key] || 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize">{label}</span>
                        <span className="text-xs font-mono">{val.toFixed(1)}/10</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn(
                          'h-full rounded-full',
                          val >= 7 ? 'bg-success' : val >= 4 ? 'bg-warning' : 'bg-destructive'
                        )} style={{ width: `${val * 10}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* AI Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Market Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : aiCtx ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{aiCtx.summary}</p>
                    {aiCtx.best_setup && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 text-xs">
                        <Zap className="w-3 h-3 text-primary-text" />
                        <span>Best: {(aiCtx.best_setup as Record<string, unknown>).type as string}</span>
                      </div>
                    )}
                    {aiCtx.active_signal && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-success/10 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        <span>Active: {aiCtx.active_signal.status}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Run analysis to generate AI context</p>
                )}
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Session Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1 rounded bg-card/50 text-xs">
                  <span>Current Session</span>
                  <Badge variant="outline">{analysis.sessions.current_session || 'N/A'}</Badge>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-card/50 text-xs">
                  <span>Kill Zone</span>
                  <Badge variant="outline">{analysis.sessions.current_kill_zone || 'N/A'}</Badge>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-card/50 text-xs">
                  <span>Silver Bullet</span>
                  <Badge variant={analysis.sessions.is_silver_bullet_window ? 'success' : 'secondary'}>
                    {analysis.sessions.is_silver_bullet_window ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Structure + Order Blocks breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Trend</span>
                    <Badge variant={
                      analysis.structure.trend === 'bullish' ? 'success' :
                      analysis.structure.trend === 'bearish' ? 'destructive' : 'secondary'
                    }>
                      {analysis.structure.trend.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Swing Points</span>
                    <span className="font-mono">{analysis.structure.swing_points.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Structure Events</span>
                    <span className="font-mono">{analysis.structure.structures.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Protected High</span>
                    <span className="font-mono">{analysis.structure.protected_high?.toFixed(5) ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Protected Low</span>
                    <span className="font-mono">{analysis.structure.protected_low?.toFixed(5) ?? 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Bullish OBs</span>
                    <span className="font-mono text-success">{analysis.order_blocks.bullish_count}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Bearish OBs</span>
                    <span className="font-mono text-destructive">{analysis.order_blocks.bearish_count}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Best Quality</span>
                    <span className="font-mono">{analysis.order_blocks.best_block?.quality_score.toFixed(1) ?? 'N/A'}/10</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span>Total Blocks</span>
                    <span className="font-mono">{analysis.order_blocks.order_blocks.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Market Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1"><Brain className="w-4 h-4" /> AI Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.market_context.reasoning}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16">
          <Brain className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">ICT Smart Engine</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Analyze market structure, liquidity, FVGs, order blocks, and ICT models with institutional-grade detection algorithms.
          </p>
          <Button onClick={handleAnalyze} disabled={analyzing} size="lg" className="gap-2">
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
      )}
    </div>
  );
}

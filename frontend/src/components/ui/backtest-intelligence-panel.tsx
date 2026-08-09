import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Sparkles, Lightbulb} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

import { Button } from './Button';

import { cn } from '../../lib/utils';
import { callEdgeFunction } from '../../lib/edgeFunctions';
import { useReducedMotion } from '../../lib/animate';

type BacktestMetrics = {
  total_trades?: number;
  win_rate?: number;
  profit_factor?: number;
  sharpe_ratio?: number;
  max_drawdown_pct?: number;
  net_profit?: number;
  avg_win?: number;
  avg_loss?: number;
  avg_rr?: number;
  sortino_ratio?: number;
  calmar_ratio?: number;
  recovery_factor?: number;
  edge_stability?: number;
  p_value?: number;
  sample_size_adequacy?: number;
  expectancy?: number;
};

function analyzeStrengthsAndWeaknesses(m: BacktestMetrics) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const observations: string[] = [];

  if (m.total_trades && m.total_trades < 30) {
    observations.push(`Small sample size (${m.total_trades} trades) — results may not be statistically significant`);
  }
  if (m.total_trades && m.total_trades >= 100) {
    strengths.push(`Large sample size (${m.total_trades} trades) increases statistical confidence`);
  }
  if (m.win_rate != null) {
    if (m.win_rate > 0.6) strengths.push(`High win rate (${(m.win_rate * 100).toFixed(0)}%) suggests strong edge`);
    else if (m.win_rate < 0.35) weaknesses.push(`Low win rate (${(m.win_rate * 100).toFixed(0)}%) may impact psychological resilience`);
  }
  if (m.profit_factor != null) {
    if (m.profit_factor > 2) strengths.push(`Excellent profit factor (${m.profit_factor.toFixed(2)}) — high reward per unit risk`);
    else if (m.profit_factor < 1.2) weaknesses.push(`Low profit factor (${m.profit_factor.toFixed(2)}) — barely profitable`);
  }
  if (m.sharpe_ratio != null) {
    if (m.sharpe_ratio > 1.5) strengths.push(`Strong Sharpe ratio (${m.sharpe_ratio.toFixed(2)}) — good risk-adjusted returns`);
    else if (m.sharpe_ratio < 0.5) weaknesses.push(`Sharpe ratio (${m.sharpe_ratio.toFixed(2)}) indicates poor risk-adjusted returns`);
  }
  if (m.max_drawdown_pct != null) {
    if (m.max_drawdown_pct < 0.1) strengths.push(`Controlled drawdown (${(m.max_drawdown_pct * 100).toFixed(0)}%) — capital preservation`);
    else if (m.max_drawdown_pct > 0.25) weaknesses.push(`High drawdown (${(m.max_drawdown_pct * 100).toFixed(0)}%) — elevated risk`);
  }
  if (m.sortino_ratio != null && m.sortino_ratio > 1.5) {
    strengths.push(`Sortino (${m.sortino_ratio.toFixed(2)}) confirms strong downside risk management`);
  }
  if (m.calmar_ratio != null && m.calmar_ratio > 1) {
    strengths.push(`Calmar ratio (${m.calmar_ratio.toFixed(2)}) shows healthy return relative to max drawdown`);
  }
  if (m.recovery_factor != null && m.recovery_factor > 2) {
    strengths.push(`Fast recovery factor (${m.recovery_factor.toFixed(2)}) after drawdowns`);
  }
  if (m.edge_stability != null) {
    if (m.edge_stability > 0.7) strengths.push(`Stable edge (${m.edge_stability.toFixed(2)}) — consistent performance across periods`);
    else if (m.edge_stability < 0.35) weaknesses.push(`Unstable edge (${m.edge_stability.toFixed(2)}) — performance varies significantly`);
  }
  if (m.p_value != null && m.p_value <= 0.05) {
    strengths.push(`Statistically significant (p=${m.p_value.toFixed(4)}) — edge is unlikely due to chance`);
  } else if (m.p_value != null && m.p_value > 0.05) {
    observations.push(`Not statistically significant (p=${m.p_value.toFixed(4)}) — more data needed`);
  }
  if (m.expectancy != null && m.expectancy > 0) {
    strengths.push(`Positive expectancy ($${m.expectancy.toFixed(2)}) — each trade adds expected value`);
  } else if (m.expectancy != null) {
    weaknesses.push(`Negative expectancy ($${m.expectancy.toFixed(2)}) — strategy loses money on average`);
  }

  return { strengths, weaknesses, observations };
}

function generateRecommendations(m: BacktestMetrics): string[] {
  const recs: string[] = [];
  if (m.profit_factor != null && m.profit_factor < 1.5 && m.win_rate && m.win_rate > 0.5) {
    recs.push('Consider increasing risk per trade on high-probability setups to improve profit factor');
  }
  if (m.max_drawdown_pct != null && m.max_drawdown_pct > 0.2) {
    recs.push('Implement tighter stop-loss or reduce position sizing during adverse regimes');
  }
  if (m.sharpe_ratio != null && m.sharpe_ratio < 0.5 && m.avg_rr && m.avg_rr < 1.5) {
    recs.push('Improve reward-to-risk ratio by letting winners run longer or tightening stops');
  }
  if (m.total_trades && m.total_trades < 50) {
    recs.push('Backtest over longer period or more symbols to increase statistical confidence');
  }
  if (m.edge_stability != null && m.edge_stability < 0.5) {
    recs.push('Investigate which market regimes cause instability and consider regime filters');
  }
  if (m.net_profit != null && m.net_profit < 0) {
    recs.push('Strategy is unprofitable — consider re-evaluating the core hypothesis');
  }
  if (m.sortino_ratio && m.sharpe_ratio && m.sortino_ratio < m.sharpe_ratio) {
    recs.push('Downside volatility exceeds total volatility — focus on tail risk management');
  }
  if (recs.length === 0) {
    recs.push('Maintain current approach, continue monitoring performance across different market regimes');
  }
  return recs;
}

export function BacktestIntelligencePanel({ projectId, backtestId, metrics }: {
  projectId: string;
  backtestId: string;
  metrics: BacktestMetrics;
}) {
  const [view, setView] = useState<'overview' | 'insights' | 'recommendations'>('overview');
  const [aiLoading, setAiLoading] = useState(false);
  const [, setAiAnalysis] = useState<any>(null);
  const prefersReduced = useReducedMotion();

  const analysis = useMemo(() => {
    const { strengths, weaknesses, observations } = analyzeStrengthsAndWeaknesses(metrics);
    const recommendations = generateRecommendations(metrics);
    const overallScore = computeOverallScore(metrics);
    return { strengths, weaknesses, observations, recommendations, overallScore };
  }, [metrics]);

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      const result = await callEdgeFunction('ai', {
        operation: 'evaluate-backtest',
        project_id: projectId,
        data: { backtest_id: backtestId, metrics },
      });
      setAiAnalysis(result);
    } catch {
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary-text" />
          <CardTitle className="text-xs font-medium">Backtest Intelligence</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={handleAIAnalyze} disabled={aiLoading} aria-label="AI Analysis">
            <Sparkles className={cn('h-3.5 w-3.5', aiLoading && 'animate-pulse')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Score Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-3xs text-muted-foreground uppercase tracking-wider">Strategy Score</span>
              <span className={cn(
                'text-xs font-bold',
                analysis.overallScore >= 70 ? 'text-success' : analysis.overallScore >= 40 ? 'text-warning' : 'text-danger-text'
              )}>{analysis.overallScore}/100</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={prefersReduced ? { width: `${analysis.overallScore}%` } : { width: 0 }}
                animate={{ width: `${analysis.overallScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  analysis.overallScore >= 70 ? 'bg-success' : analysis.overallScore >= 40 ? 'bg-warning' : 'bg-danger'
                )}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/20 p-0.5">
          {(['overview', 'insights', 'recommendations'] as const).map((tab) => (
            <button key={tab} onClick={() => setView(tab)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-3xs font-medium transition-all',
                view === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              {tab === 'overview' ? 'Overview' : tab === 'insights' ? 'Insights' : 'Recommendations'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {view === 'overview' && (
          <div className="space-y-2">
            {analysis.strengths.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-success mb-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Strengths
                </p>
                {analysis.strengths.map((s, i) => (
                  <motion.div key={i}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-1.5 mb-1 last:mb-0"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-success/50 mt-1.5 shrink-0" />
                    <p className="text-3xs text-muted-foreground">{s}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {analysis.weaknesses.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-danger-text mb-1.5 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Weaknesses
                </p>
                {analysis.weaknesses.map((w, i) => (
                  <motion.div key={i}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-1.5 mb-1 last:mb-0"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-danger/50 mt-1.5 shrink-0" />
                    <p className="text-3xs text-muted-foreground">{w}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {analysis.observations.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-warning mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Observations
                </p>
                {analysis.observations.map((o, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning/50 mt-1.5 shrink-0" />
                    <p className="text-3xs text-muted-foreground">{o}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {view === 'insights' && (
          <div className="space-y-2">
            {analysis.strengths.length === 0 && analysis.weaknesses.length === 0 ? (
              <p className="text-3xs text-muted-foreground text-center py-4">Not enough data to generate insights</p>
            ) : (
              <>
                {analysis.strengths.slice(0, 3).map((s, i) => (
                  <motion.div key={i}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 rounded-lg bg-success/5 border border-success/10 p-2.5"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                      <Lightbulb className="h-3 w-3 text-success" />
                    </div>
                    <p className="text-3xs text-muted-foreground">{s}</p>
                  </motion.div>
                ))}
                {analysis.weaknesses.slice(0, 3).map((w, i) => (
                  <motion.div key={i}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i + analysis.strengths.length) * 0.05 }}
                    className="flex items-start gap-2 rounded-lg bg-danger/5 border border-danger/10 p-2.5"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10">
                      <AlertTriangle className="h-3 w-3 text-danger-text" />
                    </div>
                    <p className="text-3xs text-muted-foreground">{w}</p>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {view === 'recommendations' && (
          <div className="space-y-2">
            {analysis.recommendations.map((r, i) => (
              <motion.div key={i}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 rounded-lg bg-chart-4/5 border border-chart-4/10 p-2.5"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chart-4/10">
                  <Target className="h-3 w-3 text-chart-4" />
                </div>
                <p className="text-3xs text-muted-foreground">{r}</p>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function computeOverallScore(m: BacktestMetrics): number {
  let score = 50;
  if (m.win_rate != null) score += (m.win_rate - 0.5) * 40;
  if (m.profit_factor != null) score += Math.min((m.profit_factor - 1) * 10, 15);
  if (m.sharpe_ratio != null) score += Math.min(m.sharpe_ratio * 5, 15);
  if (m.max_drawdown_pct != null) score -= m.max_drawdown_pct * 50;
  if (m.sortino_ratio != null) score += Math.min(m.sortino_ratio * 3, 10);
  if (m.edge_stability != null) score += (m.edge_stability - 0.5) * 20;
  if (m.expectancy != null && m.expectancy > 0) score += 5;
  if (m.total_trades && m.total_trades < 30) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {Brain, TrendingUp, TrendingDown, BookOpen, RefreshCw, Sparkles, Eye} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './badge';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../lib/animate';
import { usePatterns, useDetectPatterns, useEvaluations } from '../../hooks/useAIFoundation';

type PatternDisplay = {
  id: string;
  type: string;
  key: string;
  value?: string;
  confidence: number;
  sampleSize: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
};

function classifyPattern(type: string, key: string, value?: string): { direction: 'positive' | 'negative' | 'neutral'; description: string } {
  const negativeKeys = ['overtrade', 'revenge', 'fomo', 'deviation', 'skip_stop', 'oversize', 'early_exit', 'late_exit'];
  const positiveKeys = ['follow_plan', 'proper_size', 'stop_loss', 'patience', 'regime_align', 'rr_target'];

  const isNegative = negativeKeys.some((k) => key.includes(k) || key === k);
  const isPositive = positiveKeys.some((k) => key.includes(k) || key === k);

  let description = `${key.replace(/_/g, ' ')} detected in trading behavior`;
  if (value) description += `: ${value}`;

  if (isNegative) return { direction: 'negative' as const, description };
  if (isPositive) return { direction: 'positive' as const, description };

  if (type === 'bias') return { direction: 'negative' as const, description: `${key.replace(/_/g, ' ')} bias detected` };
  if (type === 'strength') return { direction: 'positive' as const, description: `${key.replace(/_/g, ' ')} behavior pattern` };
  return { direction: 'neutral' as const, description };
}

export function JournalIntelligencePanel({ projectId }: { projectId: string }) {
  const [view, setView] = useState<'patterns' | 'evaluations' | 'insights'>('patterns');
  const prefersReduced = useReducedMotion();

  const { data: patterns, isLoading: patternsLoading } = usePatterns(projectId);
  const { data: evaluations, isLoading: evalsLoading } = useEvaluations(projectId);
  const detectPatterns = useDetectPatterns(projectId);

  const displayPatterns: PatternDisplay[] = useMemo(() => {
    if (!patterns?.length) return [];
    return patterns.map((p: any) => {
      const { direction, description } = classifyPattern(p.pattern_type, p.pattern_key, p.pattern_value);
      return {
        id: p.id, type: p.pattern_type, key: p.pattern_key,
        value: p.pattern_value, confidence: p.confidence ?? 50,
        sampleSize: p.sample_size ?? 1, direction, description,
      };
    });
  }, [patterns]);

  const positivePatterns = displayPatterns.filter((p) => p.direction === 'positive');
  const negativePatterns = displayPatterns.filter((p) => p.direction === 'negative');
  const neutralPatterns = displayPatterns.filter((p) => p.direction === 'neutral');

  const avgConfidence = displayPatterns.length > 0
    ? Math.round(displayPatterns.reduce((s, p) => s + p.confidence, 0) / displayPatterns.length)
    : 0;

  const positiveRatio = displayPatterns.length > 0
    ? Math.round((positivePatterns.length / displayPatterns.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary-text" />
          <CardTitle className="text-xs font-medium">Journal Intelligence</CardTitle>
          {displayPatterns.length > 0 && (
            <Badge variant="secondary" size="sm">{displayPatterns.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost" size="icon-xs"
          onClick={() => detectPatterns.mutate()}
          disabled={detectPatterns.isPending}
          aria-label="Detect patterns"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', detectPatterns.isPending && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Summary bar */}
        {displayPatterns.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-success/5 border border-success/10 p-2 text-center">
              <p className="text-xs font-bold text-success">{positivePatterns.length}</p>
              <p className="text-3xs text-muted-foreground">Strengths</p>
            </div>
            <div className="rounded-lg bg-danger/5 border border-danger/10 p-2 text-center">
              <p className="text-xs font-bold text-danger-text">{negativePatterns.length}</p>
              <p className="text-3xs text-muted-foreground">Weaknesses</p>
            </div>
            <div className="rounded-lg bg-chart-1/5 border border-chart-1/10 p-2 text-center">
              <p className="text-xs font-bold text-chart-1">{avgConfidence}%</p>
              <p className="text-3xs text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/20 p-0.5">
          {(['patterns', 'evaluations', 'insights'] as const).map((tab) => (
            <button key={tab} onClick={() => setView(tab)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-3xs font-medium transition-all',
                view === tab ? 'bg-background text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
              )}>
              {tab === 'patterns' ? 'Patterns' : tab === 'evaluations' ? 'Evaluations' : 'Insights'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {(patternsLoading || evalsLoading) && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 rounded-lg bg-muted/20 p-2.5">
                <div className="h-6 w-6 rounded-full bg-muted/40" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 w-3/4 rounded bg-muted/40" />
                  <div className="h-2 w-1/2 rounded bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!patternsLoading && !evalsLoading && displayPatterns.length === 0 && (
          <div className="flex flex-col items-center py-4 text-center">
            <Brain className="h-6 w-6 text-muted-foreground/30 mb-1" />
            <p className="text-xs text-muted-foreground">No behavioral patterns detected yet</p>
            <Button variant="outline" size="xs" className="mt-2" onClick={() => detectPatterns.mutate()}>
              <Sparkles className="h-3 w-3 mr-1" /> Detect Patterns
            </Button>
          </div>
        )}

        {/* Patterns View */}
        {view === 'patterns' && !patternsLoading && displayPatterns.length > 0 && (
          <div className="space-y-2">
            {negativePatterns.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-danger-text mb-1.5 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Areas to Improve
                </p>
                {negativePatterns.slice(0, 4).map((p) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            )}
            {positivePatterns.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-success mb-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Trading Strengths
                </p>
                {positivePatterns.slice(0, 4).map((p) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            )}
            {neutralPatterns.length > 0 && (
              <div>
                <p className="text-3xs font-medium text-muted-foreground mb-1.5">Other Patterns</p>
                {neutralPatterns.slice(0, 3).map((p) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evaluations View */}
        {view === 'evaluations' && (
          <div className="space-y-2">
            {!evaluations?.length ? (
              <p className="text-3xs text-muted-foreground text-center py-4">No trade evaluations yet</p>
            ) : (
              evaluations.slice(0, 10).map((e: any) => (
                <motion.div key={e.id}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border/50 bg-background/50 p-2.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-3xs font-medium text-foreground">
                      {e.trade_id?.slice(0, 8)}...
                    </span>
                    {e.strength_score != null && (
                      <span className={cn(
                        'text-3xs font-medium',
                        e.strength_score >= 70 ? 'text-success' : e.strength_score >= 40 ? 'text-warning' : 'text-danger-text'
                      )}>
                        {e.strength_score}/100
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-3xs text-muted-foreground">
                    {e.execution_score != null && <span>Exec: {e.execution_score}</span>}
                    {e.risk_score != null && <span>Risk: {e.risk_score}</span>}
                    {e.psychology_score != null && <span>Psych: {e.psychology_score}</span>}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Insights View */}
        {view === 'insights' && (
          <div className="space-y-2">
            {positiveRatio > 0 && (
              <div className="rounded-lg bg-chart-4/5 border border-chart-4/10 p-2.5">
                <p className="text-3xs font-medium text-chart-4 mb-1">Pattern Ratio</p>
                <p className="text-3xs text-muted-foreground">
                  {positiveRatio}% of detected patterns are positive —
                  {positiveRatio >= 60 ? ' healthy trading habits are forming' : positiveRatio >= 40 ? ' mixed trading behavior' : ' opportunities to build better habits'}
                </p>
              </div>
            )}
            {negativePatterns.length > 2 && (
              <div className="rounded-lg bg-warning/5 border border-warning/10 p-2.5">
                <p className="text-3xs font-medium text-warning mb-1">Concerning Trend</p>
                <p className="text-3xs text-muted-foreground">
                  Multiple negative patterns detected ({negativePatterns.length}) — review recent trades for common triggers
                </p>
              </div>
            )}
            {displayPatterns.length > 5 && avgConfidence > 60 && (
              <div className="rounded-lg bg-success/5 border border-success/10 p-2.5">
                <p className="text-3xs font-medium text-success mb-1">High Confidence Pattern Set</p>
                <p className="text-3xs text-muted-foreground">
                  {displayPatterns.length} patterns with {avgConfidence}% avg confidence — trading behavior is well-characterized
                </p>
              </div>
            )}
            {displayPatterns.length === 0 && (
              <p className="text-3xs text-muted-foreground text-center py-4">Detect patterns to generate insights</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: PatternDisplay }) {
  const [expanded, setExpanded] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-2.5 transition-all hover:shadow-sm',
        pattern.direction === 'positive' ? 'bg-success/5 border-success/10' :
        pattern.direction === 'negative' ? 'bg-danger/5 border-danger/10' :
        'bg-background/50 border-border/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          pattern.direction === 'positive' ? 'bg-success/10' :
          pattern.direction === 'negative' ? 'bg-danger/10' : 'bg-muted/30'
        )}>
          {pattern.direction === 'positive' ? <TrendingUp className="h-3 w-3 text-success" /> :
           pattern.direction === 'negative' ? <TrendingDown className="h-3 w-3 text-danger-text" /> :
           <Eye className="h-3 w-3 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-3xs font-medium text-foreground capitalize">{pattern.key.replace(/_/g, ' ')}</span>
            <span className={cn(
              'text-3xs font-medium',
              pattern.confidence >= 70 ? 'text-success' : pattern.confidence >= 40 ? 'text-warning' : 'text-muted-foreground'
            )}>
              {pattern.confidence}%
            </span>
          </div>
          <p className={cn(
            'text-3xs text-muted-foreground leading-relaxed',
            !expanded && 'line-clamp-1'
          )}>
            {pattern.description}
          </p>
          {pattern.description.length > 80 && (
            <button onClick={() => setExpanded(!expanded)} className="text-3xs text-primary-text hover:underline mt-0.5">
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTradeMemories } from '../hooks/useTradeMemory';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Brain, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TradeMemoryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: memories, isLoading, error, refetch } = useTradeMemories(projectId!);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading trade memories." onRetry={refetch} />;
  if (!memories || memories.length === 0) return (
    <EmptyState
      message="No trade memories yet"
      description="Create a trade to generate one."
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Memory Engine"
        description="Structured learning memories generated from every trade"
      />
      <div className="grid gap-4">
        {memories.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary-text" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {m.pair || 'Unknown'} — {m.direction || 'N/A'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.session && `Session: ${m.session.replace(/_/g, ' / ')}`}
                        {m.created_at && ` — ${new Date(m.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.confidence != null && (
                      <Badge variant="default" size="sm">Confidence: {m.confidence}%</Badge>
                    )}
                    <Badge variant={m.result === 'WIN' ? 'success' : m.result === 'LOSS' ? 'destructive' : 'default'} size="sm">
                      {m.result || 'OPEN'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {m.summary && (
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">R:R</span>
                    <p className="font-medium text-foreground mt-0.5">{m.rr != null ? m.rr.toFixed(2) : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">P&L</span>
                    <p className={cn('font-medium mt-0.5', (m.pnl || 0) >= 0 ? 'text-success' : 'text-destructive')}>
                      {m.pnl != null ? m.pnl.toFixed(2) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Risk</span>
                    <p className="font-medium text-foreground mt-0.5">{m.risk_percent != null ? `${m.risk_percent.toFixed(2)}%` : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Entry Model</span>
                    <p className="font-medium text-foreground mt-0.5">{m.entry_model || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Execution</span>
                    <p className="font-medium text-foreground mt-0.5">{m.execution_model || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Liquidity</span>
                    <p className="font-medium text-foreground mt-0.5">{m.liquidity_type || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Market Phase</span>
                    <p className="font-medium text-foreground mt-0.5">{m.market_phase || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-muted-foreground">Market Trend</span>
                    <p className="font-medium text-foreground mt-0.5">{m.market_trend || '—'}</p>
                  </div>
                  {m.similarity_score != null && (
                    <div className="rounded-lg bg-muted/30 p-2.5">
                      <span className="text-muted-foreground">Similarity</span>
                      <p className="font-medium text-foreground mt-0.5">{m.similarity_score}%</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {m.strengths && m.strengths.length > 0 && (
                    <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                        <h4 className="text-xs font-semibold text-success">Strengths</h4>
                      </div>
                      <ul className="space-y-1">
                        {m.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.weaknesses && m.weaknesses.length > 0 && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        <h4 className="text-xs font-semibold text-destructive">Weaknesses</h4>
                      </div>
                      <ul className="space-y-1">
                        {m.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.mistakes && m.mistakes.length > 0 && (
                    <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <h4 className="text-xs font-semibold text-warning">Mistakes</h4>
                      </div>
                      <ul className="space-y-1">
                        {m.mistakes.map((mist, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                            {mist}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.lessons && m.lessons.length > 0 && (
                    <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="h-3.5 w-3.5 text-chart-1" />
                        <h4 className="text-xs font-semibold text-chart-1">Lessons</h4>
                      </div>
                      <ul className="space-y-1">
                        {m.lessons.map((l, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 text-chart-1 shrink-0 mt-0.5" />
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {m.tags && m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" size="sm">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

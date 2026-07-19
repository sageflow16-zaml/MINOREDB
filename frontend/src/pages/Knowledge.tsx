import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKnowledgeRules } from '../hooks/useKnowledgeRules';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ChevronDown, Lightbulb, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import type { KnowledgeRule } from '../api/types';

function RuleCard({ rule }: { rule: KnowledgeRule }) {
  const [expanded, setExpanded] = useState(false);

  const wr = rule.win_rate != null ? (rule.win_rate * 100).toFixed(1) : '—';
  const confidence = rule.confidence != null ? rule.confidence.toFixed(1) : '—';

  return (
    <motion.div
      layout
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
              <Lightbulb className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{rule.title}</h3>
              {rule.category && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{rule.category}</p>
              )}
            </div>
          </div>
          <Badge
            variant={rule.confidence != null && rule.confidence >= 60 ? 'success' : rule.confidence != null && rule.confidence >= 30 ? 'warning' : 'default'}
            size="sm"
          >
            Confidence: {confidence}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-bold text-foreground">{rule.occurrences}</div>
            <div className="text-[10px] text-muted-foreground">Occurrences</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-bold text-success">{wr}%</div>
            <div className="text-[10px] text-muted-foreground">Win Rate</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-bold text-chart-1">{rule.avg_rr != null ? rule.avg_rr.toFixed(2) : '—'}</div>
            <div className="text-[10px] text-muted-foreground">Avg R:R</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="text-lg font-bold text-chart-4">{rule.expectancy != null ? rule.expectancy.toFixed(2) : '—'}</div>
            <div className="text-[10px] text-muted-foreground">Expectancy</div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between rounded-lg bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <span>Details & Evidence</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {rule.description && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence</h4>
                    {rule.description.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-success/10 p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-success font-medium">Wins</span>
                    </div>
                    <div className="text-lg font-bold text-success">{rule.wins}</div>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingDown className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] text-destructive font-medium">Losses</span>
                    </div>
                    <div className="text-lg font-bold text-destructive">{rule.losses}</div>
                  </div>
                </div>
                {rule.signature && (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <span className="text-[10px] text-muted-foreground font-medium">Signature</span>
                    <p className="mt-1 font-mono text-[10px] text-foreground/70 break-all">{rule.signature}</p>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground">
                  Created: {new Date(rule.created_at).toLocaleDateString()} — Updated: {new Date(rule.updated_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function KnowledgePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: rules, isLoading, error, refetch } = useKnowledgeRules(projectId!);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading knowledge rules." onRetry={refetch} />;
  if (!rules || rules.length === 0) return (
    <EmptyState
      message="No knowledge rules yet"
      description="Create at least 5 similar trades to generate a rule."
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Rules"
        description="Reusable trading knowledge derived from historical trade memories"
      />
      <div className="grid gap-4">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <RuleCard rule={rule} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Lightbulb, ListChecks, ScrollText, BarChart3, ArrowRight, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Badge } from './badge';
import { ConfidenceBadge } from './confidence-badge';
import { EvidencePanel } from './evidence-panel';
import { ReasoningTrace } from './reasoning-trace';
import { FeedbackButtons } from './feedback-buttons';
import { cn } from '../../lib/utils';
import type { AIExplanation } from '../../lib/trust/types';

interface ExplainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explanation: AIExplanation | null;
  source?: string;
  targetType?: string;
  targetId?: string;
}

export function ExplainDialog({ open, onOpenChange, explanation, source, targetType, targetId }: ExplainDialogProps) {
  const [tab, setTab] = useState('summary');

  const confidenceVariant = useMemo(() => {
    if (!explanation) return 'destructive' as const;
    if (explanation.confidence >= 80) return 'success' as const;
    if (explanation.confidence >= 60) return 'info' as const;
    if (explanation.confidence >= 40) return 'warning' as const;
    return 'destructive' as const;
  }, [explanation]);

  if (!explanation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <DialogTitle className="text-sm">{explanation.metadata.source}</DialogTitle>
            <ConfidenceBadge score={explanation.confidence} />
          </div>
          <DialogDescription className="text-xs">{explanation.summary}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="summary" className="text-xs gap-1">
              <Lightbulb className="h-3 w-3" /> Summary
            </TabsTrigger>
            <TabsTrigger value="reasoning" className="text-xs gap-1">
              <ScrollText className="h-3 w-3" /> Reasoning
            </TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs gap-1">
              <ListChecks className="h-3 w-3" /> Evidence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 mt-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h4>
              <p className="text-sm text-foreground">{explanation.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-3xs text-muted-foreground uppercase">Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    'h-2 rounded-full flex-1',
                    explanation.confidenceLevel === 'very_high' ? 'bg-success' :
                    explanation.confidenceLevel === 'high' ? 'bg-chart-4' :
                    explanation.confidenceLevel === 'medium' ? 'bg-warning' :
                    'bg-danger'
                  )} style={{ width: `${explanation.confidence}%`, maxWidth: '100%' }} />
                  <span className="text-xs font-medium text-foreground">{explanation.confidence}%</span>
                </div>
                <p className="text-3xs text-muted-foreground mt-1 capitalize">{explanation.confidenceLevel.replace('_', ' ')}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <p className="text-3xs text-muted-foreground uppercase">Generated</p>
                <p className="text-xs text-foreground mt-1">{new Date(explanation.metadata.generatedAt).toLocaleString()}</p>
                <p className="text-3xs text-muted-foreground mt-0.5">Source: {explanation.metadata.source}</p>
              </div>
            </div>

            {explanation.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</h4>
                <div className="space-y-1.5">
                  {explanation.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-chart-4/5 p-2.5">
                      <ArrowRight className="h-3 w-3 text-chart-4 mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {explanation.relatedItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Related Items</h4>
                <div className="flex flex-wrap gap-1.5">
                  {explanation.relatedItems.map((item, i) => (
                    <Badge key={i} variant="secondary" size="sm" className="gap-1">
                      {item.type.replace('_', ' ')}
                      <span className="text-3xs text-muted-foreground">{item.title}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reasoning" className="mt-3">
            <ReasoningTrace steps={explanation.reasoningSteps} />
          </TabsContent>

          <TabsContent value="evidence" className="mt-3">
            {explanation.evidence.length > 0 ? (
              <EvidencePanel items={explanation.evidence.map((e) => ({
                title: e.title,
                content: e.content,
                source: e.source,
                confidence: e.confidence,
                sourceUrl: e.sourceUrl,
              }))} title="Supporting Evidence" maxItems={10} />
            ) : (
              <div className="flex flex-col items-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground mt-2">No specific evidence available for this item</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {explanation.timeline.length > 0 && (
          <div className="mt-2 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historical Trend</h4>
            <div className="flex items-end gap-0.5 h-8">
              {explanation.timeline.slice(-14).map((point, i) => {
                const maxVal = Math.max(...explanation.timeline.map((p) => p.value), 1);
                const height = (point.value / maxVal) * 100;
                return (
                  <div
                    key={i}
                    title={`${point.label || ''}: ${point.value}`}
                    className="flex-1 rounded-sm bg-primary/30 last:bg-primary transition-all"
                    style={{ height: `${Math.max(6, height)}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <FeedbackButtons
            source={source || explanation.metadata.source}
            targetType={targetType || explanation.metadata.targetType}
            targetId={targetId || explanation.metadata.targetId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

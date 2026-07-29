import { motion } from 'framer-motion';
import { Brain, Sparkles, Quote, CheckCircle } from 'lucide-react';
import { EvidenceSource } from './types';
import { EvidencePanel } from './evidence-panel';

interface AISummaryPanelProps {
  summary: string;
  reasoning: string[];
  evidence: EvidenceSource[];
  confidence: number;
  loading: boolean;
}

export function AISummaryPanel({ summary, reasoning, evidence, confidence, loading }: AISummaryPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-full rounded bg-muted/30" />
          <div className="h-4 w-5/6 rounded bg-muted/30" />
          <div className="h-4 w-4/6 rounded bg-muted/30" />
        </div>
        <div className="animate-pulse space-y-1.5 pt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-full rounded bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary && !reasoning.length && !evidence.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center px-4">
        <Brain className="h-6 w-6 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Select a connection to see AI analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* AI Explanation */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-chart-4/5 border border-chart-4/10 p-3"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="h-3.5 w-3.5 text-chart-4" />
            <span className="text-2xs font-medium text-chart-4">AI Analysis</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Reasoning Steps */}
      {reasoning.length > 0 && (
        <div>
          <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Reasoning
          </p>
          <div className="space-y-1.5">
            {reasoning.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 rounded-lg bg-background/50 p-2"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted/30 text-3xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <p className="text-3xs text-muted-foreground leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {evidence.length > 0 && (
        <div>
          <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Quote className="h-3 w-3" /> Supporting Evidence
          </p>
          <EvidencePanel evidence={evidence} loading={false} aiConfidence={confidence} />
        </div>
      )}
    </div>
  );
}

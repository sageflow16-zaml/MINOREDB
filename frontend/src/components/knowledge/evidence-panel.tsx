import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { EvidenceSource } from './types';

interface EvidencePanelProps {
  evidence: EvidenceSource[];
  loading: boolean;
  aiConfidence?: number;
}

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 70 ? 'text-success bg-success/10 border-success/20' :
    value >= 40 ? 'text-warning bg-warning/10 border-warning/20' :
    'text-danger-text bg-danger/10 border-danger/20';
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-3xs font-medium ${color}`}>
      {value}%
    </span>
  );
}

export function EvidencePanel({ evidence, loading, aiConfidence }: EvidencePanelProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-muted/20 p-3">
            <div className="h-3 w-3/4 rounded bg-muted/40 mb-2" />
            <div className="h-2 w-full rounded bg-muted/20 mb-1" />
            <div className="h-2 w-2/3 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  if (!evidence.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center px-4">
        <AlertTriangle className="h-5 w-5 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No evidence available for this connection</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {aiConfidence != null && (
        <div className="flex items-center justify-between rounded-lg bg-muted/20 p-2.5">
          <span className="text-xs text-muted-foreground">AI Confidence</span>
          <ConfidenceBadge value={aiConfidence} />
        </div>
      )}
      {evidence.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-lg border border-border/50 bg-background/50 p-3"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.confidence >= 70 ? (
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground truncate">{item.title}</span>
            </div>
            <ConfidenceBadge value={item.confidence} />
          </div>
          <p className="text-3xs text-muted-foreground leading-relaxed mb-1.5">{item.content}</p>
          <div className="flex items-center gap-2 text-3xs text-muted">
            <span>Source: {item.source}</span>
            {item.relevance > 0 && (
              <span>· Relevance: {Math.round(item.relevance * 100)}%</span>
            )}
            {item.documentId && <ExternalLink className="h-3 w-3" />}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

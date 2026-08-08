import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, TrendingUp, Target, Shield, Lightbulb, X, ChevronDown, RefreshCw, FileText, BookOpen, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from './badge';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Separator } from './separator';
import { useReducedMotion } from '../../lib/animate';

type IntelligenceItem = {
  id: string;
  type: 'insight' | 'pattern' | 'recommendation' | 'observation';
  title: string;
  description?: string;
  confidence?: number;
  category?: string;
  data?: Record<string, unknown>;
  source?: string;
  actionable?: boolean;
};

interface IntelligencePanelProps {
  items: IntelligenceItem[];
  title?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onDismiss?: (id: string) => void;
  onAction?: (item: IntelligenceItem) => void;
  maxItems?: number;
  className?: string;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return 'text-success bg-success/10 border-success/20';
  if (confidence >= 40) return 'text-warning bg-warning/10 border-warning/20';
  return 'text-danger-text bg-danger/10 border-danger/20';
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'insight': return Lightbulb;
    case 'pattern': return TrendingUp;
    case 'recommendation': return Target;
    case 'observation': return AlertTriangle;
    default: return Brain;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'insight': return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
    case 'pattern': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
    case 'recommendation': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
    case 'observation': return 'bg-chart-5/10 text-chart-5 border-chart-5/20';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
}

export function IntelligenceCard({ item, onDismiss, onAction }: {
  item: IntelligenceItem;
  onDismiss?: (id: string) => void;
  onAction?: (item: IntelligenceItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getTypeIcon(item.type);
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative rounded-lg border p-3 transition-all hover:shadow-sm',
        getTypeColor(item.type)
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', getTypeColor(item.type))}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              {item.category && (
                <span className="text-3xs text-muted-foreground uppercase tracking-wider">{item.category}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.confidence != null && (
                <span className={cn(
                  'inline-flex items-center rounded-full border px-1.5 py-0.5 text-3xs font-medium',
                  getConfidenceColor(item.confidence)
                )}>
                  {item.confidence}%
                </span>
              )}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          {item.description && (
            <>
              <p className={cn(
                'text-xs text-muted-foreground mt-1 leading-relaxed',
                !expanded && 'line-clamp-2'
              )}>
                {item.description}
              </p>
              {item.description.length > 120 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-0.5 text-3xs text-primary-text mt-1 hover:underline"
                >
                  {expanded ? 'Show less' : 'Show more'}
                  <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
                </button>
              )}
            </>
          )}
          {item.actionable && onAction && (
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 text-primary-text"
              onClick={() => onAction(item)}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Apply
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function IntelligencePanel({
  items, title = 'AI Intelligence', icon, loading, error, onRefresh, onDismiss, onAction, maxItems = 10, className,
}: IntelligencePanelProps) {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          {icon || <Brain className="h-4 w-4 text-primary-text" />}
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          {items.length > 0 && (
            <Badge variant="secondary" size="sm">{items.length}</Badge>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh intelligence"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted/50" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted/50" />
                    <div className="h-2 w-1/2 rounded bg-muted/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="h-6 w-6 text-danger-text mb-2" />
            <p className="text-xs text-muted-foreground">{error}</p>
            {onRefresh && (
              <Button variant="outline" size="xs" className="mt-3" onClick={onRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Brain className="h-6 w-6 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No intelligence data yet</p>
            {onRefresh && (
              <Button variant="outline" size="xs" className="mt-3" onClick={onRefresh}>
                <Sparkles className="h-3 w-3 mr-1" /> Generate Insights
              </Button>
            )}
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <AnimatePresence>
            {displayItems.map((item) => (
              <IntelligenceCard key={item.id} item={item} onDismiss={onDismiss} onAction={onAction} />
            ))}
          </AnimatePresence>
        )}
        {hasMore && (
          <p className="text-center text-3xs text-muted-foreground pt-1">
            +{items.length - maxItems} more
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentIntelligencePanel({ projectId, documentId, onRefresh }: {
  projectId: string;
  documentId: string;
  onRefresh?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<IntelligenceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    try {
      const { useExtractRules } = await import('../../hooks/useResearchV3');
      const { researchV3Service } = await import('../../api/researchV3');
      const result = await researchV3Service.extractRules(projectId, documentId);
      if (result?.rules) {
        setExtracted(result.rules.map((r: any, i: number) => ({
          id: `rule-${i}`,
          type: 'insight' as const,
          title: r.title || r.rule || 'Extracted Rule',
          description: r.description || r.content,
          confidence: r.confidence,
          category: r.category || 'rule',
          data: r,
        })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-text" />
          <CardTitle className="text-xs font-medium">Document Intelligence</CardTitle>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={handleExtract} disabled={loading} aria-label="Extract intelligence">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted/30 p-3">
                <div className="h-3 w-3/4 rounded bg-muted/50 mb-2" />
                <div className="h-2 w-full rounded bg-muted/30" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center py-4 text-center">
            <AlertTriangle className="h-5 w-5 text-danger-text mb-1" />
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}
        {!loading && !error && extracted.length === 0 && (
          <div className="flex flex-col items-center py-4 text-center">
            <Brain className="h-6 w-6 text-muted-foreground/30 mb-1" />
            <p className="text-xs text-muted-foreground">Extract trading rules and concepts from this document</p>
            <Button variant="outline" size="xs" className="mt-2" onClick={handleExtract}>
              <Sparkles className="h-3 w-3 mr-1" /> Extract Intelligence
            </Button>
          </div>
        )}
        {extracted.map((item) => (
          <IntelligenceCard key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

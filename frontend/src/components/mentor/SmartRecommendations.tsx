import { motion, AnimatePresence } from 'framer-motion';
import {Sparkles, BookOpen, BarChart3, Target, FileText, TrendingUp, Brain, X} from 'lucide-react';
import { useSmartRecommendations } from '../../hooks/useAIWorkflow';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { SmartRecommendation } from '../../lib/ai/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
  note: <FileText className="h-3.5 w-3.5" />,
  backtest: <BarChart3 className="h-3.5 w-3.5" />,
  strategy: <Target className="h-3.5 w-3.5" />,
  journal_review: <BookOpen className="h-3.5 w-3.5" />,
  model: <Brain className="h-3.5 w-3.5" />,
  chart: <TrendingUp className="h-3.5 w-3.5" />,
  concept: <Brain className="h-3.5 w-3.5" />,
};

function RecommendationCard({ rec, onDismiss }: { rec: SmartRecommendation; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative rounded-lg border border-chart-4/20 bg-chart-4/5 p-2.5 transition-all hover:border-chart-4/40"
    >
      <button
        onClick={() => onDismiss(rec.id)}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="flex items-start gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-4/10">
          {TYPE_ICONS[rec.type] || <Sparkles className="h-3.5 w-3.5 text-chart-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium text-foreground truncate">{rec.title}</span>
            {rec.confidence >= 70 && <Badge variant="success" size="sm">High confidence</Badge>}
          </div>
          <p className="text-3xs text-muted line-clamp-1">{rec.description}</p>
          <p className="text-3xs text-chart-4 mt-0.5 italic">{rec.reason}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function SmartRecommendations({ className, projectId }: { className?: string; projectId?: string }) {
  const { recommendations, dismiss } = useSmartRecommendations(projectId);
  if (!recommendations.length) return null;
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-chart-4" />
        <span className="text-2xs font-medium text-foreground">Smart Recommendations</span>
        <span className="text-3xs text-muted-foreground">({recommendations.length})</span>
      </div>
      <AnimatePresence>
        {recommendations.slice(0, 5).map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

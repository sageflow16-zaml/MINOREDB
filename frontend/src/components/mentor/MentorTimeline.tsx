import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {Brain, FileText, BookOpen, BarChart3, Target, TrendingUp, Zap, Sparkles, Lightbulb} from 'lucide-react';
import { useMentorTimeline } from '../../hooks/useAIWorkflow';
import { cn } from '../../lib/utils';
import type { TimelineEntry } from '../../lib/ai/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  DOCUMENT_UPLOADED: <FileText className="h-3.5 w-3.5" />,
  DOCUMENT_PROCESSED: <FileText className="h-3.5 w-3.5" />,
  BACKTEST_CREATED: <BarChart3 className="h-3.5 w-3.5" />,
  BACKTEST_COMPLETED: <BarChart3 className="h-3.5 w-3.5" />,
  RULE_EXTRACTED: <Target className="h-3.5 w-3.5" />,
  PATTERN_DETECTED: <TrendingUp className="h-3.5 w-3.5" />,
  JOURNAL_CREATED: <BookOpen className="h-3.5 w-3.5" />,
  TRADE_RECORDED: <Zap className="h-3.5 w-3.5" />,
  RECOMMENDATION_GENERATED: <Sparkles className="h-3.5 w-3.5" />,
  DAILY_BRIEF_GENERATED: <Lightbulb className="h-3.5 w-3.5" />,
  MENTOR_MESSAGE: <Brain className="h-3.5 w-3.5" />,
  default: <Brain className="h-3.5 w-3.5" />,
};

const COLOR_MAP: Record<string, string> = {
  action: 'text-chart-1 bg-chart-1/10',
  event: 'text-chart-2 bg-chart-2/10',
  milestone: 'text-chart-4 bg-chart-4/10',
  recommendation: 'text-chart-3 bg-chart-3/10',
  observation: 'text-warning bg-warning/10',
  task: 'text-primary-text bg-primary/10',
  alert: 'text-danger-text bg-danger/10',
  default: 'text-muted-foreground bg-muted/20',
};

function EntryIcon({ entry }: { entry: TimelineEntry }) {
  const icon = ICON_MAP[entry.eventType] || ICON_MAP.default;
  const color = COLOR_MAP[entry.type] || COLOR_MAP.default;
  return <div className={cn('flex h-6 w-6 items-center justify-center rounded-full shrink-0', color)}>{icon}</div>;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TimelineEntryRow({ entry, isLatest }: { entry: TimelineEntry; isLatest: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 group"
    >
      <div className="flex flex-col items-center shrink-0">
        <EntryIcon entry={entry} />
        {!isLatest && <div className="w-px h-full min-h-[24px] bg-border/30 mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground truncate">{entry.title}</span>
          <span className="text-3xs text-muted-foreground shrink-0">{timeAgo(entry.timestamp)}</span>
        </div>
        <p className="text-3xs text-muted line-clamp-1">{entry.description}</p>
      </div>
    </motion.div>
  );
}

export function MentorTimeline({ className, maxEntries = 20 }: { className?: string; maxEntries?: number }) {
  const entries = useMentorTimeline(maxEntries);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (!entries.length) {
    return (
      <div className={cn('flex flex-col items-center py-6 text-center', className)}>
        <Brain className="h-5 w-5 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Waiting for activity...</p>
        <p className="text-3xs text-muted mt-1">Actions you perform will appear here</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      <AnimatePresence mode="popLayout">
        {entries.slice(0, maxEntries).map((entry, i) => (
          <TimelineEntryRow key={entry.id} entry={entry} isLatest={i === 0} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

import { motion } from 'framer-motion';
import { Calendar, FileText, BookOpen, BarChart3, Target, Brain } from 'lucide-react';
import { KnowledgeEntity, ENTITY_COLORS, ENTITY_LABELS } from './types';

interface TimelineViewProps {
  entities: KnowledgeEntity[];
  loading: boolean;
  onNavigate: (entity: KnowledgeEntity) => void;
}

type TimeGroup = { label: string; entities: KnowledgeEntity[] };

function groupByTime(entities: KnowledgeEntity[]): TimeGroup[] {
  const groups: Record<string, KnowledgeEntity[]> = {};
  const now = Date.now();
  entities.forEach((e) => {
    if (!e.timestamp) {
      if (!groups['Unknown']) groups['Unknown'] = [];
      groups['Unknown'].push(e);
      return;
    }
    const d = new Date(e.timestamp).getTime();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    let label: string;
    if (diffDays < 1) label = 'Today';
    else if (diffDays < 7) label = 'This Week';
    else if (diffDays < 30) label = 'This Month';
    else if (diffDays < 90) label = 'Last 3 Months';
    else label = 'Older';
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  const order = ['Today', 'This Week', 'This Month', 'Last 3 Months', 'Older', 'Unknown'];
  return order.filter((l) => groups[l]).map((label) => ({ label, entities: groups[label] }));
}

function EntityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    document: <FileText className="h-3.5 w-3.5" />,
    journal_entry: <BookOpen className="h-3.5 w-3.5" />,
    backtest: <BarChart3 className="h-3.5 w-3.5" />,
    strategy: <Target className="h-3.5 w-3.5" />,
    concept: <Brain className="h-3.5 w-3.5" />,
  };
  return icons[type] || <Calendar className="h-3.5 w-3.5" />;
}

export function TimelineView({ entities, loading, onNavigate }: TimelineViewProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-px bg-muted/30" />
            <div className="flex-1 space-y-1 pb-4">
              <div className="h-3 w-24 rounded bg-muted/40" />
              <div className="h-2 w-full rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const grouped = groupByTime(entities);

  if (!grouped.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center px-4">
        <Calendar className="h-5 w-5 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {grouped.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
          <div className="relative pl-4 border-l border-border/50 space-y-2">
            {group.entities.map((entity) => (
              <motion.button
                key={entity.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onNavigate(entity)}
                className="w-full flex items-start gap-2.5 text-left group"
              >
                <div
                  className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ background: ENTITY_COLORS[entity.type] }}
                />
                <div className="flex-1 min-w-0 rounded-lg border border-border/30 bg-background/30 p-2 transition-colors group-hover:bg-background/60">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-3xs text-muted-foreground">{ENTITY_LABELS[entity.type]}</span>
                    {entity.timestamp && (
                      <span className="text-3xs text-muted">{new Date(entity.timestamp).toLocaleDateString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground truncate">{entity.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

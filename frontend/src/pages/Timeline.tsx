import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLearningEvents } from '../hooks/useLearning';
import { useSources } from '../hooks/useSources';
import { useTrades } from '../hooks/useTrades';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import {
  Clock, FileText, TrendingUp, Brain, BookOpen, CheckCircle,
  XCircle, AlertTriangle, Lightbulb, MessageCircle, Layers,
  Sparkles, Zap, Activity, LucideIcon,
} from 'lucide-react';

const EVENT_ICONS: Record<string, LucideIcon> = {
  document_uploaded: FileText,
  document_ingested: Layers,
  document_analysis: Brain,
  trade_recorded: TrendingUp,
  trade_analyzed: Activity,
  learning: BookOpen,
  rebuild: Zap,
  insight_generated: Lightbulb,
  pattern_detected: AlertTriangle,
  coaching: MessageCircle,
  research: Sparkles,
  SUCCESS: CheckCircle,
  failed: XCircle,
};

const EVENT_COLORS: Record<string, string> = {
  document_uploaded: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  document_ingested: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  document_analysis: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  trade_recorded: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  trade_analyzed: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  learning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  rebuild: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  insight_generated: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  pattern_detected: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  coaching: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  research: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  SUCCESS: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type EventFilter = 'all' | 'documents' | 'trades' | 'analysis' | 'insights';

export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: events, isLoading, error, refetch } = useLearningEvents(projectId!, 100);
  const { data: sources } = useSources(projectId!);
  const { data: trades } = useTrades(projectId!);
  const [filter, setFilter] = useState<EventFilter>('all');

  const mergedTimeline = useMemo(() => {
    const items: Array<{
      id: string; date: string; type: string; status?: string;
      summary?: string; entityType?: string; source?: string;
    }> = [];

    if (events) {
      for (const e of events) {
        items.push({
          id: e.id,
          date: (e as any).created_at,
          type: (e as any).event_type || 'learning',
          status: (e as any).status,
          summary: (e as any).summary,
          entityType: (e as any).entity_type,
        });
      }
    }

    if (sources) {
      for (const s of sources) {
        items.push({
          id: `src-${s.id}`,
          date: (s as any).created_at,
          type: 'document_uploaded',
          summary: `Uploaded document: ${((s as any).source_metadata?.original_name || s.id).substring(0, 50)}`,
          entityType: 'source',
        });
      }
    }

    if (trades) {
      for (const t of trades) {
        items.push({
          id: `tr-${(t as any).id}`,
          date: (t as any).created_at,
          type: 'trade_recorded',
          summary: `Trade: ${(t as any).pair} ${(t as any).direction} - ${(t as any).result || (t as any).status}`,
          entityType: 'trade',
          source: `${(t as any).pair} ${(t as any).result || ''}`,
        });
      }
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, sources, trades]);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return mergedTimeline;
    const typeMap: Record<EventFilter, string[]> = {
      'all': [],
      'documents': ['document_uploaded', 'document_ingested', 'document_analysis'],
      'trades': ['trade_recorded', 'trade_analyzed'],
      'analysis': ['learning', 'insight_generated', 'pattern_detected'],
      'insights': ['coaching', 'research', 'rebuild', 'insight_generated'],
    };
    const types = typeMap[filter];
    return mergedTimeline.filter(item => types.includes(item.type));
  }, [mergedTimeline, filter]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-screen-2xl mx-auto">
      <PageHeader
        title="Project Timeline"
        description="Chronological feed of all project activity"
      />

      <div className="flex gap-2 flex-wrap">
        {(['all', 'documents', 'trades', 'analysis', 'insights'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <ErrorState message="Failed to load timeline" onRetry={refetch} />}

      {!isLoading && !error && filteredTimeline.length === 0 && (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No timeline events"
          description="Activity will appear here as you upload documents, record trades, and use the AI."
        />
      )}

      {!isLoading && !error && filteredTimeline.length > 0 && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-2">
            {filteredTimeline.map((item, i) => {
              const Icon = EVENT_ICONS[item.type] || Clock;
              const colorClass = EVENT_COLORS[item.type] || 'bg-muted/30 text-muted border-muted/20';
              const statusColor = item.status === 'failed' || item.status === 'ERROR'
                ? 'border-l-red-500' : 'border-l-emerald-500';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`relative flex items-start gap-4 pl-14 ${i > 0 ? 'pt-1' : ''}`}
                >
                  <div className={`absolute left-4 top-2 flex h-5 w-5 items-center justify-center rounded-full border ${colorClass}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                  <div className={`flex-1 min-w-0 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-sm ${statusColor} border-l-2`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-3xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                        {item.status && (
                          <Badge variant={item.status === 'SUCCESS' || item.status === 'completed' ? 'success' : item.status === 'failed' || item.status === 'ERROR' ? 'danger' : 'default'} size="sm">
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <span className="text-3xs text-muted-foreground shrink-0">{formatTimeAgo(item.date)}</span>
                    </div>
                    {item.summary && (
                      <p className="text-xs text-secondary mt-1 leading-relaxed">{item.summary}</p>
                    )}
                    {item.source && (
                      <p className="text-3xs text-muted-foreground mt-1">{item.source}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

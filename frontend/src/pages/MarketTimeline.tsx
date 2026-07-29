import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useTimeline, useCreateTimelineEvent, useAutoPopulateTimeline,
} from '../hooks/useMarketIntelligence';
import type { MarketTimelineEvent } from '../api/types';
import { Clock, Plus, X, RefreshCw, Zap, Calendar } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const EVENT_TYPES = ['All', 'economic', 'market', 'trade', 'personal'];
const TYPE_COLORS: Record<string, string> = {
  economic: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  market: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  trade: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  personal: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};
const IMPACT_DOT: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-zinc-400',
};

export default function MarketTimelinePage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [eventType, setEventType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'economic', event_date: new Date().toISOString().split('T')[0],
    event_time: '', title: '', symbol: '', impact: 'medium', notes: '',
  });

  const { data: events = [], isLoading } = useTimeline(
    projectId!,
    startDate || undefined,
    endDate || undefined,
    eventType === 'All' ? undefined : eventType,
  );
  const createMutation = useCreateTimelineEvent(projectId!);
  const autoPopulateMutation = useAutoPopulateTimeline(projectId!);

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      event_time: formData.event_time || undefined,
      symbol: formData.symbol || undefined,
      notes: formData.notes || undefined,
    });
    setShowForm(false);
    setFormData({ event_type: 'economic', event_date: new Date().toISOString().split('T')[0], event_time: '', title: '', symbol: '', impact: 'medium', notes: '' });
  };

  // Group events by date
  const grouped = useMemo(() => {
    const map = new Map<string, MarketTimelineEvent[]>();
    events.forEach((e: MarketTimelineEvent) => {
      const date = e.event_date;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Timeline"
        description="Chronological view of market events, economic releases and trade activity"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => autoPopulateMutation.mutate()} disabled={autoPopulateMutation.isPending}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', autoPopulateMutation.isPending && 'animate-spin')} /> Auto-populate
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Event
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border-b border-border/50">
          {EVENT_TYPES.map((t) => (
            <button key={t} onClick={() => setEventType(t)}
              className={cn('px-3 py-1.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px',
                eventType === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>{t}</button>
          ))}
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs" placeholder="From" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs" placeholder="To" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {grouped.length === 0 && <EmptyState />}

        {grouped.map(([date, dayEvents]) => (
          <motion.div key={date} variants={item}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{date}</h3>
              <span className="text-xs text-muted-foreground">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="ml-4 border-l-2 border-border/50 pl-6 space-y-3">
              {dayEvents.map((ev: MarketTimelineEvent) => (
                <div key={ev.id} className="relative flex items-start gap-3">
                  <div className={cn('absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background', IMPACT_DOT[ev.impact ?? 'low'] ?? 'bg-zinc-400')} />
                  <Card className="flex-1 hover:border-border/80 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn('border text-3xs', TYPE_COLORS[ev.event_type] ?? TYPE_COLORS.economic)}>{ev.event_type}</Badge>
                        {ev.event_time && <span className="text-3xs text-muted-foreground">{ev.event_time}</span>}
                        {ev.symbol && <span className="text-3xs font-mono text-muted-foreground">{ev.symbol}</span>}
                        {ev.impact && (
                          <Badge variant={ev.impact === 'high' ? 'destructive' : ev.impact === 'medium' ? 'warning' : 'info'} className="text-3xs">
                            {ev.impact}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      {ev.notes && <p className="text-xs text-muted-foreground mt-1">{ev.notes}</p>}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Create dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Timeline Event</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <input placeholder="Title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {EVENT_TYPES.filter((t) => t !== 'All').map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="time" value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input placeholder="Symbol (optional)" value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              <textarea placeholder="Notes (optional)" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-16 resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.title}>Create</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

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
  useMarketEvents, useCreateMarketEvent, useUpdateMarketEvent, useDeleteMarketEvent,
  useToggleEventFavorite, useFavorites,
} from '../hooks/useMarketIntelligence';
import type { EconomicEvent } from '../api/types';
import {
  Calendar, Star, Filter, Plus, Trash2, Edit3, X, Clock, Globe, Zap,
  ChevronLeft, ChevronRight, Search,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const COUNTRIES = ['All', 'US', 'EU', 'UK', 'JP', 'AU', 'CA', 'CH', 'CN'];
const IMPACTS = ['All', 'high', 'medium', 'low'];
const IMPACT_VARIANT: Record<string, 'destructive' | 'warning' | 'info'> = {
  high: 'destructive', medium: 'warning', low: 'info',
};

type TabType = 'calendar' | 'favorites';

export default function EconomicCalendarPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [tab, setTab] = useState<TabType>('calendar');
  const [country, setCountry] = useState<string>('All');
  const [impact, setImpact] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<EconomicEvent | null>(null);
  const [formData, setFormData] = useState({
    event_name: '', event_date: '', event_time: '', country: 'US',
    currency: 'USD', category: 'employment', impact: 'medium',
    forecast: '', previous: '', actual: '',
  });

  const { data: events = [], isLoading } = useMarketEvents(projectId!, undefined, undefined, country === 'All' ? undefined : country, impact === 'All' ? undefined : impact);
  const { data: favorites = [] } = useFavorites(projectId!);
  const createMutation = useCreateMarketEvent(projectId!);
  const updateMutation = useUpdateMarketEvent(projectId!);
  const deleteMutation = useDeleteMarketEvent(projectId!);
  const toggleFavMutation = useToggleEventFavorite(projectId!);

  const filteredEvents = useMemo(() => {
    const list = tab === 'favorites' ? favorites : events;
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((e: EconomicEvent) =>
      e.event_name.toLowerCase().includes(q) || e.country.toLowerCase().includes(q)
    );
  }, [events, favorites, tab, search]);

  const handleSubmit = () => {
    const payload = {
      ...formData,
      forecast: formData.forecast ? parseFloat(formData.forecast) : undefined,
      previous: formData.previous ? parseFloat(formData.previous) : undefined,
      actual: formData.actual ? parseFloat(formData.actual) : undefined,
    };
    if (editEvent) {
      updateMutation.mutate({ eventId: editEvent.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setShowForm(false);
    setEditEvent(null);
    setFormData({ event_name: '', event_date: '', event_time: '', country: 'US', currency: 'USD', category: 'employment', impact: 'medium', forecast: '', previous: '', actual: '' });
  };

  const handleEdit = (e: EconomicEvent) => {
    setEditEvent(e);
    setFormData({
      event_name: e.event_name, event_date: e.event_date, event_time: e.event_time ?? '',
      country: e.country, currency: e.currency, category: e.category, impact: e.impact,
      forecast: e.forecast?.toString() ?? '', previous: e.previous?.toString() ?? '',
      actual: e.actual?.toString() ?? '',
    });
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Economic Calendar"
        description="Track high-impact economic events and market-moving data releases"
        actions={
          <Button size="sm" onClick={() => { setShowForm(true); setEditEvent(null); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Event
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {(['calendar', 'favorites'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>{t}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground"
            placeholder="Search events..." />
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {COUNTRIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}
        </select>
        <select value={impact} onChange={(e) => setImpact(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {IMPACTS.map((i) => <option key={i} value={i}>{i === 'All' ? 'All Impact' : i}</option>)}
        </select>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {filteredEvents.length === 0 && <EmptyState />}
        {filteredEvents.map((ev: EconomicEvent) => (
          <motion.div key={ev.id} variants={item}>
            <Card className="hover:border-border/80 transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <button onClick={() => toggleFavMutation.mutate(ev.id)} className="shrink-0">
                  <Star className={cn('h-4 w-4', ev.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                </button>
                <Badge variant={IMPACT_VARIANT[ev.impact] ?? 'info'}>{ev.impact}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ev.event_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.country} · {ev.currency} · {ev.category}
                    {ev.event_time && <> · {ev.event_time}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {ev.forecast != null && <span className="text-muted-foreground">F: {ev.forecast}</span>}
                  {ev.previous != null && <span className="text-muted-foreground">P: {ev.previous}</span>}
                  {ev.actual != null && <span className={cn('font-medium', ev.actual > (ev.forecast ?? 0) ? 'text-emerald-500' : 'text-red-500')}>A: {ev.actual}</span>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{ev.event_date}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(ev)}><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(ev.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Create/Edit Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{editEvent ? 'Edit Event' : 'Add Economic Event'}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditEvent(null); }}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Event name" value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {COUNTRIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {IMPACTS.filter((i) => i !== 'All').map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <input type="number" step="any" placeholder="Forecast" value={formData.forecast} onChange={(e) => setFormData({ ...formData, forecast: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Previous" value={formData.previous} onChange={(e) => setFormData({ ...formData, previous: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Actual" value={formData.actual} onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditEvent(null); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.event_name || !formData.event_date}>
                {editEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

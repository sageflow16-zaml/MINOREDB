import {useState} from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import {LoadingSpinner, EmptyState} from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { useSessions, useCreateSession, useSessionStats } from '../hooks/useMarketIntelligence';
import type { SessionAnalysis, SessionStats } from '../api/types';
import {Plus, X} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const SESSIONS = [
  { key: 'asia', label: 'Asia', time: '00:00–07:00 UTC', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { key: 'london', label: 'London', time: '07:00–16:00 UTC', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { key: 'newyork', label: 'New York', time: '13:00–22:00 UTC', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { key: 'overlap', label: 'LDN/NY Overlap', time: '13:00–16:00 UTC', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
];

const VOL_COLORS: Record<string, 'destructive' | 'warning' | 'info' | 'success'> = {
  high: 'destructive', medium: 'warning', low: 'info',
};

function SessionCard({ session, stats }: { session: typeof SESSIONS[0]; stats?: SessionStats }) {
  return (
    <Card className="hover:border-border/80 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={cn('border', session.color)}>{session.label}</Badge>
          <span className="text-xs text-muted-foreground">{session.time}</span>
        </div>
        {stats && stats.sample_size > 0 ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Avg Range:</span> <span className="font-medium">{stats.avg_range?.toFixed(1)} pips</span></div>
            <div><span className="text-muted-foreground">Max Range:</span> <span className="font-medium">{stats.max_range?.toFixed(1)} pips</span></div>
            <div><span className="text-muted-foreground">Samples:</span> <span className="font-medium">{stats.sample_size}</span></div>
            <div><span className="text-muted-foreground">High Vol:</span> <span className="font-medium">{stats.high_vol_count ?? 0}</span></div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionAnalysisPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    session_name: 'london', symbol: 'EURUSD', open_price: '', high_price: '', low_price: '', close_price: '',
    range_pips: '', direction: 'bullish', volatility: 'medium', notes: '',
  });

  const { data: sessions = [], isLoading } = useSessions(projectId!, date);
  const createMutation = useCreateSession(projectId!);

  const asiaStats = useSessionStats(projectId!, 'asia');
  const londonStats = useSessionStats(projectId!, 'london');
  const nyStats = useSessionStats(projectId!, 'newyork');
  const overlapStats = useSessionStats(projectId!, 'overlap');

  const statsMap: Record<string, SessionStats | undefined> = {
    asia: asiaStats.data, london: londonStats.data, newyork: nyStats.data, overlap: overlapStats.data,
  };

  const handleCreate = () => {
    createMutation.mutate({
      ...formData, date,
      open_price: formData.open_price ? parseFloat(formData.open_price) : undefined,
      high_price: formData.high_price ? parseFloat(formData.high_price) : undefined,
      low_price: formData.low_price ? parseFloat(formData.low_price) : undefined,
      close_price: formData.close_price ? parseFloat(formData.close_price) : undefined,
      range_pips: formData.range_pips ? parseFloat(formData.range_pips) : undefined,
    });
    setShowForm(false);
    setFormData({ session_name: 'london', symbol: 'EURUSD', open_price: '', high_price: '', low_price: '', close_price: '', range_pips: '', direction: 'bullish', volatility: 'medium', notes: '' });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session Analysis"
        description="Analyze price behavior across trading sessions"
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Log Session
          </Button>
        }
      />

      {/* Date selector */}
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Session overview cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SESSIONS.map((s) => (
            <SessionCard key={s.key} session={s} stats={statsMap[s.key]} />
          ))}
        </motion.div>

        {/* Session logs for selected date */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Session Logs — {date}</CardTitle></CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-2">
                  {sessions.map((s: SessionAnalysis) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
                      <Badge className={cn('border', SESSIONS.find((ss) => ss.key === s.session_name)?.color ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30')}>
                        {s.session_name}
                      </Badge>
                      <span className="text-sm font-mono text-foreground">{s.symbol}</span>
                      {s.open_price != null && <span className="text-xs text-muted-foreground">O: {s.open_price}</span>}
                      {s.high_price != null && <span className="text-xs text-muted-foreground">H: {s.high_price}</span>}
                      {s.low_price != null && <span className="text-xs text-muted-foreground">L: {s.low_price}</span>}
                      {s.close_price != null && <span className="text-xs text-muted-foreground">C: {s.close_price}</span>}
                      {s.range_pips != null && <span className="text-sm font-medium text-foreground">{s.range_pips} pips</span>}
                      {s.direction && <span className={cn('text-xs font-medium', s.direction === 'bullish' ? 'text-emerald-500' : s.direction === 'bearish' ? 'text-red-500' : 'text-muted-foreground')}>{s.direction}</span>}
                      {s.volatility && <Badge variant={VOL_COLORS[s.volatility] ?? 'info'}>{s.volatility}</Badge>}
                      {s.notes && <span className="text-xs text-muted-foreground flex-1 truncate">{s.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Create dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Log Session Analysis</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={formData.session_name} onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {SESSIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <input placeholder="Symbol" value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              <input type="number" step="any" placeholder="Open" value={formData.open_price}
                onChange={(e) => setFormData({ ...formData, open_price: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="High" value={formData.high_price}
                onChange={(e) => setFormData({ ...formData, high_price: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Low" value={formData.low_price}
                onChange={(e) => setFormData({ ...formData, low_price: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Close" value={formData.close_price}
                onChange={(e) => setFormData({ ...formData, close_price: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Range (pips)" value={formData.range_pips}
                onChange={(e) => setFormData({ ...formData, range_pips: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={formData.direction} onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
              <select value={formData.volatility} onChange={(e) => setFormData({ ...formData, volatility: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <textarea placeholder="Notes (optional)" value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-16 resize-none" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.symbol}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

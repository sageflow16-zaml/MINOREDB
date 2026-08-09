import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner, ErrorState } from '../components/ui/Feedback';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import {
  useReplaySessions, useCreateSession, useReplayState,
  useNextCandle, usePrevCandle, useJumpToCandle,
  useCreateTrade, useCreateBookmark, useReplayDashboard,
  useUpsertReview,
  useCreateMistake, useDeleteMistake,
  useCreateScreenshot, useDeleteScreenshot,
} from '../hooks/useReplay';
import type { MarketCandle, ReplayWorkspaceState, ReplayTrade, ReplayAnnotation } from '../api/replay';
import {
  Play, Pause, SkipBack, SkipForward,
  Plus, X, Save, Edit3, BookOpen, Upload,
  TrendingUp, Brain, Award, AlertTriangle,
  Clock, Image, Type, ArrowUpRight, Circle, Square,
  MessageSquare, BarChart3, Maximize2, Minimize2,
} from 'lucide-react';
import { cn } from '../lib/utils';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD'];
const MISTAKE_TYPES = ['Entry', 'Exit', 'Risk Management', 'Psychology', 'Rule Violation', 'Missing Setup', 'Other'];
const ANNOTATION_TOOLS = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'rectangle', icon: Square, label: 'Rect' },
];

function CandlestickChart({ candles }: { candles?: MarketCandle[]; trades?: ReplayTrade[]; annotations?: ReplayAnnotation[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight || 500,
layout: { background: { type: ColorType.Solid, color: 'hsl(var(--card))' }, textColor: 'hsl(var(--muted))' },
grid: { vertLines: { color: 'hsl(var(--elevated))' }, horzLines: { color: 'hsl(var(--elevated))' } },
timeScale: { borderColor: 'hsl(var(--elevated))' },
      crosshair: { mode: 0 },
    });
    const series = chart.addSeries(CandlestickSeries, {
upColor: 'hsl(var(--success))', downColor: 'hsl(var(--danger))',
borderDownColor: 'hsl(var(--danger))', borderUpColor: 'hsl(var(--success))',
wickDownColor: 'hsl(var(--danger))', wickUpColor: 'hsl(var(--success))',
    });
    series.setData(candles.map((c) => ({ time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any, open: c.open, high: c.high, low: c.low, close: c.close })));
    chart.timeScale().fitContent();
    const handleResize = () => { if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight || 500 }); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [candles]);

  return (
    <motion.div layout className={cn('relative rounded-xl border border-border bg-card overflow-hidden', fullscreen ? 'fixed inset-4 z-50' : 'flex-1 min-h-[400px]')}>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button onClick={() => setFullscreen(!fullscreen)} aria-label={fullscreen ? 'Exit fullscreen' : 'Toggle fullscreen'} className="rounded-lg bg-background/80 p-1.5 text-muted hover:text-foreground transition-colors">
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div ref={chartRef} className="absolute inset-0" role="img" aria-label="Price chart" />
    </motion.div>
  );
}

function TimelinePanel({ state, currentCandle, onJump, playbackSpeed, onSpeedChange }: {
  state: ReplayWorkspaceState; currentCandle: number; onJump: (index: number) => void; playbackSpeed: number; onSpeedChange: (speed: number) => void;
}) {
  const total = state.session.total_candles;
  const events = useMemo(() => {
    const items: { candle_index: number; type: string; label: string; icon: any; color: string }[] = [];
    state.trades.forEach((t) => items.push({ candle_index: t.candle_index, type: 'trade', label: `${t.direction} @ ${t.entry_price}`, icon: TrendingUp, color: 'text-success' }));
    state.bookmarks.forEach((b) => items.push({ candle_index: b.candle_index, type: 'bookmark', label: b.note || 'Bookmark', icon: BookOpen, color: 'text-primary-text' }));
    state.mistakes.forEach((m) => { if (m.candle_index != null) items.push({ candle_index: m.candle_index, type: 'mistake', label: m.mistake_type || 'Mistake', icon: AlertTriangle, color: 'text-danger-text' }); });
    state.annotations.forEach((a) => items.push({ candle_index: a.candle_index, type: 'annotation', label: a.label || a.annotation_type, icon: Edit3, color: 'text-success' }));
    return items.sort((a, b) => a.candle_index - b.candle_index);
  }, [state]);

  const progressPct = total > 0 ? (currentCandle / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="text-xs font-medium text-foreground">Timeline</h3><span className="text-3xs text-muted font-mono">{currentCandle + 1}/{total}</span></div>
      <div className="relative h-2 rounded-full bg-elevated cursor-pointer"
        role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={total} aria-valuenow={currentCandle}
        onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; onJump(Math.floor(pct * total)); }}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') onJump(Math.min(currentCandle + 1, total - 1)); if (e.key === 'ArrowLeft') onJump(Math.max(currentCandle - 1, 0)); }}>
        <div className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-card" style={{ left: `calc(${progressPct}% - 6px)` }} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-3xs text-muted">Speed</span>
        {[1, 2, 5, 10].map((s) => (
          <button key={s} onClick={() => onSpeedChange(1000 / s)}
            className={cn('rounded px-2 py-0.5 text-3xs font-medium transition-colors', 1000 / s === playbackSpeed ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>{s}x</button>
        ))}
      </div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
        {events.slice(-30).map((evt, i) => (
          <button key={i} onClick={() => onJump(evt.candle_index)}
            className={cn('w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-background', evt.candle_index === currentCandle && 'bg-primary/10')}>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background">
              <evt.icon className={cn('h-3 w-3', evt.color)} />
            </div>
            <div className="min-w-0 flex-1"><p className="text-2xs font-medium text-secondary truncate">{evt.label}</p><p className="text-3xs text-muted">Candle #{evt.candle_index}</p></div>
          </button>
        ))}
        {events.length === 0 && <p className="text-2xs text-muted text-center py-4">No events yet</p>}
      </div>
    </div>
  );
}

function ReviewPanel({ projectId, state }: { projectId: string; state: ReplayWorkspaceState }) {
  const [tab, setTab] = useState<'review' | 'mistakes' | 'psychology'>('review');
  const upsertReview = useUpsertReview(projectId);
  const [review, setReview] = useState({
    went_well: state.review?.went_well || '', went_wrong: state.review?.went_wrong || '',
    rule_violations: state.review?.rule_violations || '', execution_quality: state.review?.execution_quality || '',
    risk_management: state.review?.risk_management || '', psychology: state.review?.psychology || '',
    confidence_score: state.review?.confidence_score ?? 50, trade_grade: state.review?.trade_grade || '',
    discipline_score: state.review?.discipline_score ?? 0, rule_compliance: state.review?.rule_compliance ?? 0,
  });
  useEffect(() => { if (state.review) setReview({ went_well: state.review.went_well || '', went_wrong: state.review.went_wrong || '', rule_violations: state.review.rule_violations || '', execution_quality: state.review.execution_quality || '', risk_management: state.review.risk_management || '', psychology: state.review.psychology || '', confidence_score: state.review.confidence_score ?? 50, trade_grade: state.review.trade_grade || '', discipline_score: state.review.discipline_score ?? 0, rule_compliance: state.review.rule_compliance ?? 0 }); }, [state.review]);
  const saveReview = () => { upsertReview.mutate({ sessionId: state.session.id, ...review }); };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-background p-0.5">
        {[
          { id: 'review' as const, label: 'Review', icon: MessageSquare },
          { id: 'mistakes' as const, label: 'Mistakes', icon: AlertTriangle },
          { id: 'psychology' as const, label: 'Psychology', icon: Brain },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 rounded-md px-2 py-1.5 text-3xs font-medium transition-colors flex items-center justify-center gap-1', tab === t.id ? 'bg-card text-foreground' : 'text-muted hover:text-secondary')}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {tab === 'review' && (
            <div className="space-y-3">
              <div><label className="text-3xs font-medium text-muted">What went well</label><textarea className="w-full mt-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary min-h-[50px]" value={review.went_well} onChange={(e) => setReview((p) => ({ ...p, went_well: e.target.value }))} /></div>
              <div><label className="text-3xs font-medium text-muted">What went wrong</label><textarea className="w-full mt-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary min-h-[50px]" value={review.went_wrong} onChange={(e) => setReview((p) => ({ ...p, went_wrong: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-3xs font-medium text-muted">Execution</label><select className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-secondary" value={review.execution_quality} onChange={(e) => setReview((p) => ({ ...p, execution_quality: e.target.value }))}><option value="">Select...</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Average">Average</option><option value="Poor">Poor</option></select></div>
                <div><label className="text-3xs font-medium text-muted">Risk Mgmt</label><select className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-secondary" value={review.risk_management} onChange={(e) => setReview((p) => ({ ...p, risk_management: e.target.value }))}><option value="">Select...</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Average">Average</option><option value="Poor">Poor</option></select></div>
              </div>
              <div className="flex items-center gap-3">
                <div><label className="text-3xs font-medium text-muted">Grade</label><select className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-secondary" value={review.trade_grade} onChange={(e) => setReview((p) => ({ ...p, trade_grade: e.target.value }))}><option value="">-</option>{['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label className="text-3xs font-medium text-muted">Confidence</label><input type="number" min={0} max={100} className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-secondary" value={review.confidence_score} onChange={(e) => setReview((p) => ({ ...p, confidence_score: parseFloat(e.target.value) || 0 }))} /></div>
                <div><label className="text-3xs font-medium text-muted">Discipline</label><input type="number" min={0} max={100} className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-secondary" value={review.discipline_score} onChange={(e) => setReview((p) => ({ ...p, discipline_score: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <div className="flex items-center justify-between"><span className="text-3xs text-muted">Rule compliance: {review.rule_compliance}%</span><input type="range" min={0} max={100} className="w-32 accent-primary" value={review.rule_compliance} onChange={(e) => setReview((p) => ({ ...p, rule_compliance: parseInt(e.target.value) }))} /></div>
              <Button size="sm" className="w-full" onClick={saveReview} disabled={upsertReview.isPending}><Save className="h-3 w-3 mr-1" /> Save Review</Button>
            </div>
          )}
          {tab === 'mistakes' && <MistakePanel projectId={projectId} state={state} />}
          {tab === 'psychology' && (
            <div className="space-y-3">
              <div><label className="text-3xs font-medium text-muted">Psychology notes</label><textarea className="w-full mt-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary min-h-[80px]" value={review.psychology} onChange={(e) => setReview((p) => ({ ...p, psychology: e.target.value }))} placeholder="How were you feeling?" /></div>
              <Button size="sm" className="w-full" onClick={saveReview} disabled={upsertReview.isPending}><Save className="h-3 w-3 mr-1" /> Save</Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MistakePanel({ projectId, state }: { projectId: string; state: ReplayWorkspaceState }) {
  const [showForm, setShowForm] = useState(false);
  const [mistakeType, setMistakeType] = useState(''); const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState(''); const [recommendation, setRecommendation] = useState('');
  const createMistake = useCreateMistake(projectId); const deleteMistake = useDeleteMistake(projectId);
  const handleSubmit = () => {
    if (!description.trim()) return;
    createMistake.mutate({ sessionId: state.session.id, mistake_type: mistakeType || undefined, severity, description, candle_index: state.session.current_candle, preventable: true, recommendation: recommendation || undefined },
      { onSuccess: () => { setShowForm(false); setMistakeType(''); setDescription(''); setRecommendation(''); } });
  };
  return (
    <div className="space-y-2">
      {state.mistakes.length > 0 && (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {state.mistakes.map((m) => (
            <div key={m.id} className="flex items-start gap-2 rounded-lg bg-background p-2">
              <div className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', m.severity === 'High' ? 'bg-danger' : m.severity === 'Medium' ? 'bg-warning' : 'bg-muted')} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="text-3xs font-medium text-secondary">{m.mistake_type || 'Mistake'}</span><Badge variant={m.severity === 'High' ? 'destructive' : m.severity === 'Medium' ? 'warning' : 'default'} size="sm">{m.severity}</Badge></div>
                <p className="text-3xs text-muted mt-0.5">{m.description}</p>
                {m.recommendation && <p className="text-3xs text-primary-text mt-0.5">&rarr; {m.recommendation}</p>}
              </div>
              <button onClick={() => deleteMistake.mutate({ sessionId: state.session.id, mistakeId: m.id })} className="text-muted hover:text-danger-text shrink-0"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      {showForm ? (
        <div className="space-y-2 rounded-lg border border-border p-2.5">
          <select className="w-full rounded border border-border bg-background px-2 py-1 text-3xs text-secondary" value={mistakeType} onChange={(e) => setMistakeType(e.target.value)}><option value="">Type...</option>{MISTAKE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select className="w-full rounded border border-border bg-background px-2 py-1 text-3xs text-secondary" value={severity} onChange={(e) => setSeverity(e.target.value)}>{['Low', 'Medium', 'High'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <textarea className="w-full rounded border border-border bg-background px-2 py-1 text-3xs text-secondary placeholder-muted min-h-[50px]" placeholder="Describe..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <textarea className="w-full rounded border border-border bg-background px-2 py-1 text-3xs text-secondary placeholder-muted" placeholder="Recommendation..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          <div className="flex gap-2"><Button size="sm" className="flex-1" onClick={handleSubmit} disabled={!description.trim() || createMistake.isPending}>Save</Button><Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </div>
      ) : (<Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}><Plus className="h-3 w-3 mr-1" /> Add Mistake</Button>)}
    </div>
  );
}

function NewTradeModal({ projectId, sessionId, currentCandle, onClose }: { projectId: string; sessionId: string; currentCandle: number; onClose: () => void }) {
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entry, setEntry] = useState(''); const [sl, setSl] = useState(''); const [tp, setTp] = useState('');
  const [size, setSize] = useState(''); const [risk, setRisk] = useState(''); const [notes, setNotes] = useState(''); const [confidence, setConfidence] = useState('');
  const tradeMut = useCreateTrade(projectId);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    tradeMut.mutate({ sessionId, direction: direction.toLowerCase(), entry_price: parseFloat(entry), ...(sl ? { stop_loss: parseFloat(sl) } : {}), ...(tp ? { take_profit: parseFloat(tp) } : {}), ...(size ? { position_size: parseFloat(size) } : {}), ...(risk ? { risk_percent: parseFloat(risk) } : {}), ...(notes ? { notes } : {}), ...(confidence ? { confidence: parseFloat(confidence) } : {}) }, { onSuccess: () => onClose() });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-foreground">New Trade @ Candle #{currentCandle}</h2><button onClick={onClose} className="text-muted hover:text-foreground"><X className="h-4 w-4" /></button></div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setDirection('BUY')} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', direction === 'BUY' ? 'bg-success text-white' : 'bg-background text-muted hover:text-secondary')}>BUY</button>
            <button type="button" onClick={() => setDirection('SELL')} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', direction === 'SELL' ? 'bg-danger text-white' : 'bg-background text-muted hover:text-secondary')}>SELL</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" placeholder="Entry" value={entry} onChange={(e) => setEntry(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" required />
            <input type="number" step="any" placeholder="Stop Loss" value={sl} onChange={(e) => setSl(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
            <input type="number" step="any" placeholder="Take Profit" value={tp} onChange={(e) => setTp(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
            <input type="number" step="any" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
            <input type="number" step="any" placeholder="Risk %" value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
            <input type="number" min={0} max={100} placeholder="Confidence %" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
          </div>
          <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-secondary placeholder-muted focus:outline-none focus:border-primary" />
          <div className="flex gap-2"><Button type="submit" className="flex-1" disabled={!entry || tradeMut.isPending}>{tradeMut.isPending ? 'Saving...' : 'Save Trade'}</Button><Button variant="ghost" onClick={onClose}>Cancel</Button></div>
        </form>
      </div>
    </div>
  );
}

export default function ReplayPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<'timeline' | 'screenshots'>('timeline');
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);
  const [showNewTrade, setShowNewTrade] = useState(false);

  const sessionsQuery = useReplaySessions(projectId!);
  const stateQuery = useReplayState(projectId!, activeSessionId);
  const dashboardQuery = useReplayDashboard(projectId!);
  const nextMut = useNextCandle(projectId!); const prevMut = usePrevCandle(projectId!);
  const jumpMut = useJumpToCandle(projectId!); const createSession = useCreateSession(projectId!);
  const createBookmarkMut = useCreateBookmark(projectId!);
  const createScreenshot = useCreateScreenshot(projectId!);
  const deleteScreenshot = useDeleteScreenshot(projectId!);

  const sessions = sessionsQuery.data || [];
  const state = stateQuery.data;
  const currentCandleIndex = state?.session.current_candle ?? 0;

  useEffect(() => { if (!activeSessionId && sessions.length > 0) setActiveSessionId(sessions[0].id); }, [sessions, activeSessionId]);

  useEffect(() => {
    if (isPlaying && activeSessionId) {
      playIntervalRef.current = window.setInterval(() => { if (state?.session.status === 'active') nextMut.mutate(activeSessionId); else setIsPlaying(false); }, playbackSpeed);
    }
    return () => { if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null; } };
  }, [isPlaying, activeSessionId, playbackSpeed, state?.session.status]);

  const handleJump = useCallback((index: number) => { if (activeSessionId) jumpMut.mutate({ sessionId: activeSessionId, candleIndex: index }); }, [activeSessionId, jumpMut]);
  const handleNext = useCallback(() => { if (activeSessionId) nextMut.mutate(activeSessionId); }, [activeSessionId, nextMut]);
  const handlePrev = useCallback(() => { if (activeSessionId) prevMut.mutate(activeSessionId); }, [activeSessionId, prevMut]);

  const handleCreateSession = (data: { pair: string; timeframe: string; start_date: string; end_date: string }) => {
    createSession.mutate(data, {
      onSuccess: (s: { id: string }) => setActiveSessionId(s.id),
    });
  };

  const sessionTrades = state?.trades ?? [];
  const sessionBookmarks = state?.bookmarks ?? [];

  const handleStartScreenshot = () => {
    if (activeSessionId) createScreenshot.mutate({ sessionId: activeSessionId, candle_index: currentCandleIndex });
  };

  return (
    <div className="p-6 md:p-8 space-y-4 max-w-screen-2xl mx-auto h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><BarChart3 className="h-5 w-5 text-primary-text" /></div>
          <div><h1 className="text-xl font-semibold text-foreground tracking-tight">Replay</h1><p className="text-sm text-muted mt-0.5">{dashboardQuery.data?.total_sessions ?? 0} sessions &bull; {dashboardQuery.data?.total_trades ?? 0} trades{dashboardQuery.data?.avg_win_rate != null ? ` &bull; WR ${dashboardQuery.data.avg_win_rate.toFixed(1)}%` : ''}</p></div>
        </div>
      </motion.div>

      {/* Session Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {sessions.slice().reverse().map((s: any) => (
          <button key={s.id} onClick={() => setActiveSessionId(s.id)}
            className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-2xs font-medium transition-colors', s.id === activeSessionId ? 'border-primary/40 bg-primary/5 text-primary-text' : 'border-border bg-card text-muted hover:text-secondary')}>
            {s.pair} {s.timeframe} <span className="text-3xs opacity-60">{new Date(s.start_date).toLocaleDateString()}</span>
          </button>
        ))}
        <div className="relative group">
          <Button variant="outline" size="sm" className="text-2xs"><Plus className="h-3 w-3 mr-1" /> New</Button>
          <div className="absolute top-full right-0 mt-1 w-64 rounded-xl border border-border bg-card shadow-xl p-3 space-y-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="flex gap-2">
              <select id="new-pair" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-2xs text-secondary">{PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              <select id="new-tf" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-2xs text-secondary">{TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}</select>
            </div>
            <div className="flex gap-2">
              <input id="new-start" type="date" defaultValue="2024-06-01" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-2xs text-secondary" />
              <input id="new-end" type="date" defaultValue="2024-06-10" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-2xs text-secondary" />
            </div>
            <Button size="sm" className="w-full" onClick={() => {
              const pair = (document.getElementById('new-pair') as HTMLSelectElement)?.value || 'EURUSD';
              const tf = (document.getElementById('new-tf') as HTMLSelectElement)?.value || '1h';
              const start = (document.getElementById('new-start') as HTMLInputElement)?.value || '2024-06-01';
              const end = (document.getElementById('new-end') as HTMLInputElement)?.value || '2024-06-10';
              handleCreateSession({ pair, timeframe: tf, start_date: start + 'T00:00:00Z', end_date: end + 'T00:00:00Z' });
            }}><Play className="h-3 w-3 mr-1" /> Start Replay</Button>
          </div>
        </div>
      </div>

      {/* Loading / Empty */}
      {sessionsQuery.isLoading && <div className="flex items-center justify-center py-12"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary animate-pulse" /><div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} /><div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} /></div></div>}
      {!sessionsQuery.isLoading && sessions.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated"><BarChart3 className="h-6 w-6 text-muted" /></div><p className="text-sm font-medium text-secondary">No replay sessions</p><p className="text-xs text-muted mt-1">Create a new session to start replaying market data.</p></div>
      )}

      {/* Main workspace */}
      {stateQuery.isLoading ? (
        <LoadingSpinner message="Loading replay data..." />
      ) : stateQuery.isError ? (
        <ErrorState message="Failed to load replay data" description={stateQuery.error?.message || 'An unexpected error occurred'} onRetry={() => stateQuery.refetch()} />
      ) : state ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Left panel */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex gap-1 rounded-lg bg-background p-0.5">
              <button onClick={() => setLeftPanel('timeline')} className={cn('flex-1 rounded-md px-2 py-1.5 text-3xs font-medium transition-colors', leftPanel === 'timeline' ? 'bg-card text-foreground' : 'text-muted')}><Clock className="h-3 w-3 inline mr-1" />Timeline</button>
              <button onClick={() => setLeftPanel('screenshots')} className={cn('flex-1 rounded-md px-2 py-1.5 text-3xs font-medium transition-colors', leftPanel === 'screenshots' ? 'bg-card text-foreground' : 'text-muted')}><Image className="h-3 w-3 inline mr-1" />Shots</button>
            </div>
            {leftPanel === 'timeline' ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <TimelinePanel state={state} currentCandle={currentCandleIndex} onJump={handleJump} playbackSpeed={playbackSpeed} onSpeedChange={setPlaybackSpeed} />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><h3 className="text-xs font-medium text-foreground">Screenshots</h3><Button variant="ghost" size="icon" onClick={handleStartScreenshot}><Image className="h-3.5 w-3.5" /></Button></div>
                  {state.screenshots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
                      {state.screenshots.map((s: any) => (
                        <div key={s.id} className="relative rounded-lg bg-background p-2 aspect-video flex items-center justify-center group">
                          <div className="flex flex-col items-center gap-1"><Image className="h-5 w-5 text-muted" /><span className="text-3xs text-muted">{s.category || 'Shot'}</span></div>
                          <button onClick={() => deleteScreenshot.mutate({ sessionId: state.session.id, screenshotId: s.id })} className="absolute top-1 right-1 rounded bg-background p-0.5 text-muted hover:text-danger-text opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-2xs text-muted text-center py-4">No screenshots</p>}
                </div>
              </div>
            )}
            {/* Session context */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-3xs text-muted">Pair</span><span className="text-2xs font-medium text-foreground">{state.session.pair}</span></div>
              <div className="flex items-center justify-between"><span className="text-3xs text-muted">Timeframe</span><Badge variant="info" size="sm">{state.session.timeframe}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-3xs text-muted">Status</span><Badge variant={state.session.status === 'active' ? 'success' : state.session.status === 'paused' ? 'warning' : 'default'} size="sm">{state.session.status}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-3xs text-muted">Range</span><span className="text-3xs text-muted">{new Date(state.session.start_date).toLocaleDateString()} - {new Date(state.session.end_date).toLocaleDateString()}</span></div>
            </div>
            {state.candle && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-3xs text-muted">O</p><p className="text-2xs font-mono font-semibold text-foreground">{state.candle.open.toFixed(5)}</p></div>
                  <div><p className="text-3xs text-muted">H</p><p className="text-2xs font-mono font-semibold text-success">{state.candle.high.toFixed(5)}</p></div>
                  <div><p className="text-3xs text-muted">L</p><p className="text-2xs font-mono font-semibold text-danger-text">{state.candle.low.toFixed(5)}</p></div>
                </div>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Playback controls */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handlePrev} disabled={!activeSessionId || currentCandleIndex <= 0} aria-label="Previous candle" className="rounded-lg border border-border p-1.5 text-muted hover:text-foreground hover:bg-background disabled:opacity-30"><SkipBack className="h-4 w-4" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} disabled={!activeSessionId || state.session.status !== 'active'} aria-label={isPlaying ? 'Pause' : 'Play'} className={cn('rounded-lg p-1.5 transition-colors disabled:opacity-30', isPlaying ? 'bg-danger/10 text-danger-text hover:bg-danger/20' : 'bg-primary/10 text-primary-text hover:bg-primary/20')}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                <button onClick={handleNext} disabled={!activeSessionId} aria-label="Next candle" className="rounded-lg border border-border p-1.5 text-muted hover:text-foreground hover:bg-background disabled:opacity-30"><SkipForward className="h-4 w-4" /></button>
                <div className="h-4 w-px bg-elevated" />
                <span className="text-2xs text-muted font-mono">{currentCandleIndex + 1}/{state.session.total_candles}</span>
                <div className="h-4 w-px bg-elevated" />
                {[0.5, 1, 2, 5].map((s) => (<button key={s} onClick={() => setPlaybackSpeed(1000 / s)} className={cn('rounded px-2 py-0.5 text-3xs font-medium transition-colors', 1000 / s === playbackSpeed ? 'bg-primary/10 text-primary-text' : 'text-muted hover:text-secondary')}>{s}x</button>))}
                <div className="ml-auto flex gap-1">
                  <button onClick={() => handleJump(0)} className="rounded px-2 py-0.5 text-3xs font-medium text-muted hover:text-secondary">Start</button>
                  {sessionTrades.length > 0 && <button onClick={() => handleJump(sessionTrades[0].candle_index)} className="rounded px-2 py-0.5 text-3xs font-medium text-primary-text hover:bg-primary/10">Entry</button>}
                  {state.mistakes.length > 0 && <button onClick={() => handleJump(state.mistakes[0].candle_index ?? 0)} className="rounded px-2 py-0.5 text-3xs font-medium text-danger-text hover:bg-danger/10">Mistake</button>}
                </div>
              </div>
            </div>

            {/* Chart */}
            <CandlestickChart candles={state.candles_visible} trades={sessionTrades} annotations={state.annotations} />

            {/* Drawing tools */}
            <div className="rounded-xl border border-border bg-card p-2">
              <div className="flex items-center gap-1">
                <span className="text-3xs font-medium text-muted mr-1">Draw:</span>
                {ANNOTATION_TOOLS.map((tool) => (
                  <button key={tool.type} onClick={() => setActiveTool(activeTool === tool.type ? null : tool.type)}
                    className={cn('rounded-lg border p-1.5 transition-colors', activeTool === tool.type ? 'border-primary bg-primary/10 text-primary-text' : 'border-border text-muted hover:text-foreground hover:bg-background')} title={tool.label}>
                    <tool.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Trades list */}
            {sessionTrades.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-muted" />Trades ({sessionTrades.length})</h3>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {sessionTrades.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg bg-background px-2.5 py-1.5 text-2xs">
                      <Badge variant={t.direction === 'SELL' ? 'destructive' : 'success'} size="sm">{t.direction}</Badge>
                      <span className="font-mono text-foreground">@{t.entry_price?.toFixed(5)}</span>
                      {t.stop_loss && <span className="text-muted">SL:{t.stop_loss.toFixed(5)}</span>}
                      {t.take_profit && <span className="text-muted">TP:{t.take_profit.toFixed(5)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-3 space-y-3">
            <Button size="sm" className="w-full" onClick={() => setShowNewTrade(true)}><Plus className="h-3.5 w-3.5 mr-1" /> New Trade</Button>
            <div className="flex gap-2">
              <Input placeholder="Bookmark note..." className="text-xs flex-1" id="bookmark-input" />
              <Button variant="outline" size="sm" onClick={() => {
                const input = document.getElementById('bookmark-input') as HTMLInputElement;
                if (input?.value.trim()) { createBookmarkMut.mutate({ sessionId: state.session.id, candle_index: currentCandleIndex, date: new Date().toISOString(), note: input.value }); input.value = ''; }
              }}><BookOpen className="h-3 w-3 mr-1" /> Mark</Button>
            </div>
            {sessionBookmarks.length > 0 && (
              <div className="max-h-[100px] overflow-y-auto space-y-1">
                {sessionBookmarks.slice(-5).map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg bg-background px-2 py-1 text-3xs cursor-pointer hover:bg-card" onClick={() => handleJump(b.candle_index)}>
                    <BookOpen className="h-3 w-3 text-primary-text shrink-0" />
                    <span className="text-muted truncate flex-1">{b.note || 'Bookmark'}</span>
                    <span className="text-muted shrink-0">#{b.candle_index}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-medium text-foreground mb-3 flex items-center gap-2"><Award className="h-3.5 w-3.5 text-muted" /> Trade Review</h3>
              <ReviewPanel projectId={projectId!} state={state} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
            <BarChart3 className="h-6 w-6 text-muted" />
          </div>
          <p className="text-sm font-medium text-secondary">No replay session loaded</p>
          <p className="text-xs text-muted mt-1">Select a session above or create a new one to start replaying market data.</p>
          <div className="flex gap-3 mt-4">
            <Button size="sm" className="gap-1.5"><Play className="h-3.5 w-3.5" /> Create Replay</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Import Replay</Button>
          </div>
        </div>
      )}

      {showNewTrade && activeSessionId && <NewTradeModal projectId={projectId!} sessionId={activeSessionId} currentCandle={currentCandleIndex} onClose={() => setShowNewTrade(false)} />}
    </div>
  );
}

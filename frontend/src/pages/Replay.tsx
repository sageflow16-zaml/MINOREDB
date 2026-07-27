import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import { Alert } from '../components/ui/alert';
import {
  useReplaySessions, useCreateSession, useReplayState,
  useNextCandle, usePrevCandle, useJumpToCandle,
  usePauseSession, useResumeSession, useFinishSession,
  useCreateTrade, useCreateBookmark, useDeleteBookmark,
  useUpdateBookmark, useReplayDashboard,
  useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation,
  useUpsertReview,
  useCreateMistake, useDeleteMistake,
  useCreateScreenshot, useDeleteScreenshot,
} from '../hooks/useReplay';
import type { MarketCandle, ReplaySession, ReplayWorkspaceState, ReplayTrade, ReplayBookmark, ReplayAnnotation, ReplayMistake, ReplayScreenshot } from '../api/replay';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';
import {
  Play, Pause, SkipBack, SkipForward,
  Plus, X, Save, Edit3, Trash2, BookOpen,
  TrendingUp, TrendingDown, Brain, Award, AlertTriangle, CheckCircle2,
  Clock, Image, Type, ArrowUpRight, Circle, Square, TrendingUp as TrendLine,
  MessageSquare, BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD'];
const MISTAKE_TYPES = ['Entry', 'Exit', 'Risk Management', 'Psychology', 'Rule Violation', 'Missing Setup', 'Other'];
const SCREENSHOT_CATEGORIES = ['Pre-entry', 'Entry', 'Management', 'Exit', 'Post-analysis'];
const ANNOTATION_TOOLS = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'rectangle', icon: Square, label: 'Rect' },
  { type: 'trendline', icon: TrendLine, label: 'Trendline' },
];

/* ════════════════════════════════════════════════
   CHART COMPONENT
   ════════════════════════════════════════════════ */

function CandlestickChart({ candles = [], trades = [], annotations = [] }: { candles?: MarketCandle[]; trades?: ReplayTrade[]; annotations?: ReplayAnnotation[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight || 500,
      layout: { background: { type: ColorType.Solid, color: 'hsl(var(--card))' }, textColor: 'hsl(var(--muted-foreground))' },
      grid: { vertLines: { color: 'hsl(var(--border))' }, horzLines: { color: 'hsl(var(--border))' } },
      timeScale: { borderColor: 'hsl(var(--border))' },
      crosshair: { mode: 0 },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(var(--success))', downColor: 'hsl(var(--destructive))',
      borderDownColor: 'hsl(var(--destructive))', borderUpColor: 'hsl(var(--success))',
      wickDownColor: 'hsl(var(--destructive))', wickUpColor: 'hsl(var(--success))',
    });

    series.setData(candles.map((c) => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    })));

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight || 500 });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [candles]);

  return (
    <div ref={containerRef} className="relative flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={chartRef} className="absolute inset-0" />
    </div>
  );
}

/* ════════════════════════════════════════════════
   LEFT PANEL — TIMELINE
   ════════════════════════════════════════════════ */

function TimelinePanel({ state, currentCandle, onJump }: { state: ReplayWorkspaceState; currentCandle: number; onJump: (index: number) => void }) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const total = state.session.total_candles;

  const events = useMemo(() => {
    const items: { candle_index: number; type: string; label: string; icon: any; color: string }[] = [];
    state.trades.forEach((t) => {
      items.push({ candle_index: t.candle_index, type: 'trade', label: `${t.direction} @ ${t.entry_price}`, icon: TrendingUp, color: 'text-success' });
    });
    state.bookmarks.forEach((b) => {
      items.push({ candle_index: b.candle_index, type: 'bookmark', label: b.note || 'Bookmark', icon: BookOpen, color: 'text-chart-1' });
    });
    state.mistakes.forEach((m) => {
      if (m.candle_index != null) {
        items.push({ candle_index: m.candle_index, type: 'mistake', label: m.mistake_type || 'Mistake', icon: AlertTriangle, color: 'text-destructive' });
      }
    });
    state.screenshots.forEach((s) => {
      items.push({ candle_index: s.candle_index, type: 'screenshot', label: s.category || 'Screenshot', icon: Image, color: 'text-chart-3' });
    });
    state.annotations.forEach((a) => {
      items.push({ candle_index: a.candle_index, type: 'annotation', label: a.label || a.annotation_type, icon: Edit3, color: 'text-chart-2' });
    });
    return items.sort((a, b) => a.candle_index - b.candle_index);
  }, [state]);

  const progressPct = total > 0 ? (currentCandle / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Timeline</h3>
        <span className="text-[10px] text-muted-foreground">{currentCandle + 1}/{total}</span>
      </div>

      {/* Scrub bar */}
      <div className="relative h-2 rounded-full bg-muted/50 cursor-pointer" ref={timelineRef}
        onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; onJump(Math.floor(pct * total)); }}>
        <div className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm transition-all" style={{ left: `calc(${progressPct}% - 6px)` }} />
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Speed</span>
        {['1x', '2x', '5x', '10x'].map((s) => (
          <button key={s} className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">{s}</button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {events.slice(-30).map((evt, i) => (
          <button key={i} onClick={() => onJump(evt.candle_index)}
            className={cn('w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/30',
              evt.candle_index === currentCandle && 'bg-muted/50 ring-1 ring-border'
            )}>
            <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', evt.color.includes('text-') ? `bg-${evt.color.replace('text-', '')}/10` : 'bg-muted/30')}>
              <evt.icon className={cn('h-3 w-3', evt.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground truncate">{evt.label}</p>
              <p className="text-[9px] text-muted-foreground">Candle #{evt.candle_index}</p>
            </div>
          </button>
        ))}
        {events.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-4">No timeline events yet</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   RIGHT PANEL — REVIEW
   ════════════════════════════════════════════════ */

function ReviewPanel({ projectId, state }: { projectId: string; state: ReplayWorkspaceState }) {
  const [tab, setTab] = useState<'review' | 'mistakes' | 'checklist' | 'psychology'>('review');
  const upsertReview = useUpsertReview(projectId);

  const [review, setReview] = useState({
    went_well: state.review?.went_well || '',
    went_wrong: state.review?.went_wrong || '',
    rule_violations: state.review?.rule_violations || '',
    execution_quality: state.review?.execution_quality || '',
    risk_management: state.review?.risk_management || '',
    psychology: state.review?.psychology || '',
    confidence_score: state.review?.confidence_score ?? 50,
    trade_grade: state.review?.trade_grade || '',
    discipline_score: state.review?.discipline_score ?? 0,
    rule_compliance: state.review?.rule_compliance ?? 0,
  });

  useEffect(() => {
    if (state.review) {
      setReview({
        went_well: state.review.went_well || '',
        went_wrong: state.review.went_wrong || '',
        rule_violations: state.review.rule_violations || '',
        execution_quality: state.review.execution_quality || '',
        risk_management: state.review.risk_management || '',
        psychology: state.review.psychology || '',
        confidence_score: state.review.confidence_score ?? 50,
        trade_grade: state.review.trade_grade || '',
        discipline_score: state.review.discipline_score ?? 0,
        rule_compliance: state.review.rule_compliance ?? 0,
      });
    }
  }, [state.review]);

  const saveReview = () => {
    upsertReview.mutate({ sessionId: state.session.id, ...review });
  };

  const tabs = [
    { id: 'review' as const, label: 'Review', icon: MessageSquare },
    { id: 'mistakes' as const, label: 'Mistakes', icon: AlertTriangle },
    { id: 'checklist' as const, label: 'Checklist', icon: CheckCircle2 },
    { id: 'psychology' as const, label: 'Psychology', icon: Brain },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors flex items-center justify-center gap-1',
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === 'review' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">What went well</label>
                <textarea className="w-full mt-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[50px]" value={review.went_well} onChange={(e) => setReview((p) => ({ ...p, went_well: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">What went wrong</label>
                <textarea className="w-full mt-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[50px]" value={review.went_wrong} onChange={(e) => setReview((p) => ({ ...p, went_wrong: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Rule violations</label>
                <textarea className="w-full mt-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px]" value={review.rule_violations} onChange={(e) => setReview((p) => ({ ...p, rule_violations: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Execution quality</label>
                  <select className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" value={review.execution_quality} onChange={(e) => setReview((p) => ({ ...p, execution_quality: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Risk management</label>
                  <select className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" value={review.risk_management} onChange={(e) => setReview((p) => ({ ...p, risk_management: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Grade</label>
                  <select className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" value={review.trade_grade} onChange={(e) => setReview((p) => ({ ...p, trade_grade: e.target.value }))}>
                    <option value="">-</option>
                    {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Confidence</label>
                  <input type="number" min={0} max={100} className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" value={review.confidence_score} onChange={(e) => setReview((p) => ({ ...p, confidence_score: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Discipline</label>
                  <input type="number" min={0} max={100} className="w-full mt-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs" value={review.discipline_score} onChange={(e) => setReview((p) => ({ ...p, discipline_score: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Rule compliance: {review.rule_compliance}%</span>
                <input type="range" min={0} max={100} className="w-32" value={review.rule_compliance} onChange={(e) => setReview((p) => ({ ...p, rule_compliance: parseInt(e.target.value) }))} />
              </div>
              <Button size="sm" className="w-full" onClick={saveReview} disabled={upsertReview.isPending}>
                <Save className="h-3 w-3 mr-1" /> Save Review
              </Button>
            </div>
          )}

          {tab === 'mistakes' && <MistakePanel projectId={projectId} state={state} />}

          {tab === 'checklist' && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">Pre-trade checklist review</p>
              <div className="space-y-1.5">
                {[
                  { label: 'HTF bias confirmed', done: false },
                  { label: 'Liquidity identified', done: false },
                  { label: 'MSS confirmed', done: false },
                  { label: 'Entry model valid', done: false },
                  { label: 'Risk acceptable', done: false },
                  { label: 'News checked', done: false },
                  { label: 'Session valid', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5">
                    <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      item.done ? 'bg-primary border-primary' : 'border-input'
                    )}>
                      {item.done && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className={cn('text-[11px]', item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <Alert variant="info" title="Discipline" className="mt-2">
                Score: {review.discipline_score || 0}% — {review.discipline_score && review.discipline_score >= 80 ? 'Good' : review.discipline_score && review.discipline_score >= 50 ? 'Needs improvement' : 'Not scored'}
              </Alert>
            </div>
          )}

          {tab === 'psychology' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Psychology notes</label>
                <textarea className="w-full mt-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" value={review.psychology} onChange={(e) => setReview((p) => ({ ...p, psychology: e.target.value }))} placeholder="How were you feeling during this trade?" />
              </div>
              <Alert variant="info" title="AI Review (coming soon)" className="text-xs">
                Future AI analysis will detect emotional patterns and provide coaching suggestions.
              </Alert>
              <Button size="sm" className="w-full" onClick={saveReview} disabled={upsertReview.isPending}>
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MISTAKE PANEL
   ════════════════════════════════════════════════ */

function MistakePanel({ projectId, state }: { projectId: string; state: ReplayWorkspaceState }) {
  const [showForm, setShowForm] = useState(false);
  const [mistakeType, setMistakeType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [preventable, setPreventable] = useState(true);
  const [recommendation, setRecommendation] = useState('');
  const createMistake = useCreateMistake(projectId);
  const deleteMistake = useDeleteMistake(projectId);

  const handleSubmit = () => {
    if (!description.trim()) return;
    createMistake.mutate({
      sessionId: state.session.id,
      mistake_type: mistakeType || undefined,
      severity,
      description,
      candle_index: state.session.current_candle,
      preventable,
      recommendation: recommendation || undefined,
    }, { onSuccess: () => { setShowForm(false); setMistakeType(''); setDescription(''); setRecommendation(''); } });
  };

  return (
    <div className="space-y-2">
      {state.mistakes.length > 0 && (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {state.mistakes.map((m) => (
            <div key={m.id} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2">
              <div className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                m.severity === 'High' ? 'bg-destructive' : m.severity === 'Medium' ? 'bg-warning' : 'bg-muted-foreground'
              )} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-foreground">{m.mistake_type || 'Mistake'}</span>
                  <Badge variant={m.severity === 'High' ? 'destructive' : m.severity === 'Medium' ? 'warning' : 'default'} size="sm">{m.severity}</Badge>
                  {m.preventable && <Badge variant="info" size="sm">Preventable</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.description}</p>
                {m.recommendation && <p className="text-[10px] text-chart-1 mt-0.5">→ {m.recommendation}</p>}
              </div>
              <button onClick={() => deleteMistake.mutate({ sessionId: state.session.id, mistakeId: m.id })} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      {showForm ? (
        <div className="space-y-2 rounded-lg border border-border p-2.5">
          <select className="w-full rounded border border-input bg-background px-2 py-1 text-[10px]" value={mistakeType} onChange={(e) => setMistakeType(e.target.value)}>
            <option value="">Type...</option>
            {MISTAKE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="w-full rounded border border-input bg-background px-2 py-1 text-[10px]" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {['Low', 'Medium', 'High'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea className="w-full rounded border border-input bg-background px-2 py-1 text-[10px] min-h-[50px]" placeholder="Describe the mistake..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <textarea className="w-full rounded border border-input bg-background px-2 py-1 text-[10px]" placeholder="Recommendation..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <input type="checkbox" checked={preventable} onChange={(e) => setPreventable(e.target.checked)} /> Preventable
          </label>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={!description.trim() || createMistake.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add Mistake
        </Button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SCREENSHOT PANEL
   ════════════════════════════════════════════════ */

function ScreenshotPanel({ projectId, state, currentCandle }: { projectId: string; state: ReplayWorkspaceState; currentCandle: number }) {
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [caption, setCaption] = useState('');
  const createScreenshot = useCreateScreenshot(projectId);
  const deleteScreenshot = useDeleteScreenshot(projectId);

  const filtered = useMemo(() => {
    const shots = state.screenshots ?? [];
    if (activeTab === 'all') return shots;
    return shots.filter((s) => s.category === activeTab);
  }, [state.screenshots, activeTab]);

  const handleAddScreenshot = () => {
    createScreenshot.mutate({
      sessionId: state.session.id,
      candle_index: currentCandle,
      category: category || undefined,
      caption: caption || undefined,
      image_url: undefined,
    }, { onSuccess: () => { setShowForm(false); setCategory(''); setCaption(''); } });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {['all', ...SCREENSHOT_CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={cn('shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              activeTab === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
        {filtered.map((s) => (
          <div key={s.id} className="relative rounded-lg bg-muted/30 p-2 aspect-video flex items-center justify-center group">
            {s.image_url ? (
              <img src={s.image_url} alt={s.caption || ''} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Image className="h-5 w-5 text-muted-foreground/50" />
                <span className="text-[9px] text-muted-foreground">{s.category || 'Screenshot'}</span>
              </div>
            )}
            <button onClick={() => deleteScreenshot.mutate({ sessionId: state.session.id, screenshotId: s.id })}
              className="absolute top-1 right-1 rounded bg-background/80 p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3" />
            </button>
            {s.caption && <span className="absolute bottom-1 left-1 right-1 text-[8px] text-background bg-foreground/60 rounded px-1 truncate">{s.caption}</span>}
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-2 py-4 text-center text-[10px] text-muted-foreground">No screenshots</div>}
      </div>
      {showForm ? (
        <div className="space-y-2 rounded-lg border border-border p-2.5">
          <select className="w-full rounded border border-input bg-background px-2 py-1 text-[10px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Category...</option>
            {SCREENSHOT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="w-full rounded border border-input bg-background px-2 py-1 text-[10px]" placeholder="Caption..." value={caption} onChange={(e) => setCaption(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={handleAddScreenshot} disabled={createScreenshot.isPending}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Image className="h-3 w-3 mr-1" /> Add Screenshot
        </Button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════ */

export default function ReplayPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<'timeline' | 'screenshots'>('timeline');
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);
  const [showNewTrade, setShowNewTrade] = useState(false);

  const sessionsQuery = useReplaySessions(projectId!);
  const stateQuery = useReplayState(projectId!, activeSessionId);
  const dashboardQuery = useReplayDashboard(projectId!);
  const nextMut = useNextCandle(projectId!);
  const prevMut = usePrevCandle(projectId!);
  const jumpMut = useJumpToCandle(projectId!);
  const createSession = useCreateSession(projectId!);
  const createBookmarkMut = useCreateBookmark(projectId!);

  const sessions = sessionsQuery.data || [];
  const state = stateQuery.data;
  const currentCandleIndex = state?.session.current_candle ?? 0;

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) setActiveSessionId(sessions[0].id);
  }, [sessions, activeSessionId]);

  // Playback
  useEffect(() => {
    if (isPlaying && activeSessionId) {
      playIntervalRef.current = window.setInterval(() => {
        if (state?.session.status === 'active') nextMut.mutate(activeSessionId);
        else { setIsPlaying(false); }
      }, playbackSpeed);
    }
    return () => { if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null; } };
  }, [isPlaying, activeSessionId, playbackSpeed, state?.session.status]);

  const handleJump = useCallback((index: number) => {
    if (activeSessionId) jumpMut.mutate({ sessionId: activeSessionId, candleIndex: index });
  }, [activeSessionId, jumpMut]);

  const handleNext = useCallback(() => {
    if (activeSessionId) nextMut.mutate(activeSessionId);
  }, [activeSessionId, nextMut]);

  const handlePrev = useCallback(() => {
    if (activeSessionId) prevMut.mutate(activeSessionId);
  }, [activeSessionId, prevMut]);

  const handleCreateSession = (data: { pair: string; timeframe: string; start_date: string; end_date: string }) => {
    createSession.mutate(data, { onSuccess: (s) => setActiveSessionId(s.id) });
  };

  const sessionTrades = state?.trades ?? [];
  const sessionBookmarks = state?.bookmarks ?? [];

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* ── Header Bar ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Replay Workspace</h1>
          <Badge variant="info" size="sm">Beta</Badge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{dashboardQuery.data?.total_sessions ?? 0} sessions</span>
          <span>·</span>
          <span>{dashboardQuery.data?.total_trades ?? 0} replay trades</span>
          {dashboardQuery.data?.avg_win_rate != null && (
            <><span>·</span><span>WR: {dashboardQuery.data.avg_win_rate.toFixed(1)}%</span></>
          )}
        </div>
      </div>

      {/* ── Session Selector + Create ── */}
      <div className="flex flex-wrap items-center gap-2">
        {sessions.slice().reverse().map((s) => (
          <button key={s.id} onClick={() => setActiveSessionId(s.id)}
            className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
              s.id === activeSessionId ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}>
            {s.pair} {s.timeframe} <span className="text-[9px] opacity-60">{new Date(s.start_date).toLocaleDateString()}</span>
          </button>
        ))}
        <div className="relative group">
          <Button variant="outline" size="sm" className="text-[11px]"><Plus className="h-3 w-3 mr-1" /> New</Button>
          <div className="absolute top-full right-0 mt-1 w-64 rounded-xl border border-border bg-card shadow-xl p-3 space-y-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="flex gap-2">
              <select id="new-pair" className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-[11px]">
                {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select id="new-tf" className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-[11px]">
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input id="new-start" type="date" defaultValue="2024-06-01" className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-[11px]" />
              <input id="new-end" type="date" defaultValue="2024-06-10" className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-[11px]" />
            </div>
            <Button size="sm" className="w-full" onClick={() => {
              const pair = (document.getElementById('new-pair') as HTMLSelectElement)?.value || 'EURUSD';
              const tf = (document.getElementById('new-tf') as HTMLSelectElement)?.value || '1h';
              const start = (document.getElementById('new-start') as HTMLInputElement)?.value || '2024-06-01';
              const end = (document.getElementById('new-end') as HTMLInputElement)?.value || '2024-06-10';
              handleCreateSession({ pair, timeframe: tf, start_date: start + 'T00:00:00Z', end_date: end + 'T00:00:00Z' });
            }}>
              <Play className="h-3 w-3 mr-1" /> Start Replay
            </Button>
          </div>
        </div>
      </div>

      {/* ── Loading / Empty States ── */}
      {sessionsQuery.isLoading && <LoadingSpinner />}
      {!sessionsQuery.isLoading && sessions.length === 0 && (
        <EmptyState title="No replay sessions" description="Create a new session above to start replaying market data." />
      )}

      {/* ── 3-Panel Workspace ── */}
      {state && !stateQuery.isLoading && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* ═══ LEFT PANEL ═══ */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
              <button onClick={() => setLeftPanel('timeline')} className={cn('flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors', leftPanel === 'timeline' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                <Clock className="h-3 w-3 inline mr-1" /> Timeline
              </button>
              <button onClick={() => setLeftPanel('screenshots')} className={cn('flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors', leftPanel === 'screenshots' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                <Image className="h-3 w-3 inline mr-1" /> Shots
              </button>
            </div>

            {leftPanel === 'timeline' ? (
              <Card>
                <CardContent className="p-3">
                  <TimelinePanel state={state} currentCandle={currentCandleIndex} onJump={handleJump} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-3">
                  <ScreenshotPanel projectId={projectId!} state={state} currentCandle={currentCandleIndex} />
                </CardContent>
              </Card>
            )}

            {/* Session context */}
            <Card>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Pair</span>
                  <span className="text-[11px] font-medium text-foreground">{state.session.pair}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Timeframe</span>
                  <Badge variant="info" size="sm">{state.session.timeframe}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Status</span>
                  <Badge variant={state.session.status === 'active' ? 'success' : state.session.status === 'paused' ? 'warning' : 'default'} size="sm">
                    {state.session.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Range</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(state.session.start_date).toLocaleDateString()} - {new Date(state.session.end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Current candle info */}
            {state.candle && (
              <Card>
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[9px] text-muted-foreground">O</div>
                      <div className="text-[11px] font-mono font-semibold">{state.candle.open.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground">H</div>
                      <div className="text-[11px] font-mono font-semibold text-success">{state.candle.high.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground">L</div>
                      <div className="text-[11px] font-mono font-semibold text-destructive">{state.candle.low.toFixed(5)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══ CENTER PANEL — Chart + Controls ═══ */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {/* Replay controls */}
            <Card>
              <CardContent className="p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handlePrev} disabled={!activeSessionId || currentCandleIndex <= 0}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors">
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button onClick={() => setIsPlaying(!isPlaying)} disabled={!activeSessionId || state.session.status !== 'active'}
                    className={cn('rounded-lg p-1.5 transition-colors disabled:opacity-30',
                      isPlaying ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={handleNext} disabled={!activeSessionId}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors">
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-mono">{currentCandleIndex + 1}/{state.session.total_candles}</span>
                  <div className="h-4 w-px bg-border" />
                  {[0.5, 1, 2, 5].map((s) => (
                    <button key={s} onClick={() => setPlaybackSpeed(1000 / s)}
                      className={cn('rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                        1000 / s === playbackSpeed ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                      )}>
                      {s}x
                    </button>
                  ))}
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => handleJump(0)} disabled={!activeSessionId}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30">
                      Start
                    </button>
                    <button onClick={() => handleJump(state.session.total_candles - 1)} disabled={!activeSessionId}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30">
                      End
                    </button>
                    {sessionTrades.length > 0 && (
                      <button onClick={() => handleJump(sessionTrades[0].candle_index)} disabled={!activeSessionId}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-chart-1 hover:text-chart-1/80 hover:bg-chart-1/10 transition-colors disabled:opacity-30">
                        Entry
                      </button>
                    )}
                    {state.mistakes.length > 0 && (
                      <button onClick={() => handleJump(state.mistakes[0].candle_index ?? 0)} disabled={!activeSessionId}
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors disabled:opacity-30">
                        Mistake
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            <CandlestickChart candles={state.candles_visible} trades={sessionTrades} annotations={state.annotations} />

            {/* Annotation toolbar */}
            <Card>
              <CardContent className="p-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground mr-1">Draw:</span>
                  {ANNOTATION_TOOLS.map((tool) => (
                    <button key={tool.type} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      title={tool.label}>
                      <tool.icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                  <div className="h-4 w-px bg-border mx-1" />
                  <span className="text-[10px] font-medium text-muted-foreground mr-1">Jump:</span>
                  {[
                    { label: 'Entry', type: 'entry', color: 'text-chart-1' },
                    { label: 'Exit', type: 'exit', color: 'text-chart-2' },
                    { label: 'Mistake', type: 'mistake', color: 'text-destructive' },
                  ].map((j) => (
                    <button key={j.type} onClick={() => {
                      if (j.type === 'entry' && sessionTrades.length > 0) handleJump(sessionTrades[0].candle_index);
                      if (j.type === 'exit' && sessionTrades.length > 0) handleJump(sessionTrades[sessionTrades.length - 1].candle_index);
                      if (j.type === 'mistake' && state.mistakes.length > 0) handleJump(state.mistakes[0].candle_index ?? 0);
                    }} disabled={!activeSessionId}
                      className={cn('rounded px-2 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-30', j.color, 'hover:bg-muted/30')}>
                      {j.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trades list */}
            {sessionTrades.length > 0 && (
              <Card>
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                    Trades ({sessionTrades.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                    {sessionTrades.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px]">
                        <Badge variant={t.direction === 'SELL' ? 'destructive' : 'success'} size="sm">{t.direction}</Badge>
                        <span className="font-mono text-foreground">@{t.entry_price?.toFixed(5)}</span>
                        {t.stop_loss && <span className="text-muted-foreground">SL:{t.stop_loss.toFixed(5)}</span>}
                        {t.take_profit && <span className="text-muted-foreground">TP:{t.take_profit.toFixed(5)}</span>}
                        {t.confidence != null && <span className="text-muted-foreground">Conf:{t.confidence}%</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══ RIGHT PANEL — Review ═══ */}
          <div className="lg:col-span-3 space-y-3">
            {/* New trade quick button */}
            <Button size="sm" className="w-full" onClick={() => setShowNewTrade(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New Trade
            </Button>

            {/* Bookmark this candle */}
            <div className="flex gap-2">
              <Input placeholder="Bookmark note..." className="text-xs flex-1" id="bookmark-input" />
              <Button variant="outline" size="sm" onClick={() => {
                const input = document.getElementById('bookmark-input') as HTMLInputElement;
                if (input?.value.trim()) {
                  createBookmarkMut.mutate({ sessionId: state.session.id, candle_index: currentCandleIndex, date: new Date().toISOString(), note: input.value });
                  input.value = '';
                }
              }}>
                <BookOpen className="h-3 w-3 mr-1" /> Bookmark
              </Button>
            </div>

            {/* Bookmarks quick list */}
            {sessionBookmarks.length > 0 && (
              <div className="max-h-[100px] overflow-y-auto space-y-1">
                {sessionBookmarks.slice(-5).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-2 py-1 text-[10px] cursor-pointer hover:bg-muted/50"
                    onClick={() => handleJump(b.candle_index)}>
                    <BookOpen className="h-3 w-3 text-chart-1 shrink-0" />
                    <span className="text-muted-foreground truncate flex-1">{b.note || 'Bookmark'}</span>
                    <span className="text-muted-foreground shrink-0">#{b.candle_index}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Review panel */}
            <Card>
              <CardHeader className="px-3 py-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  Trade Review
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ReviewPanel projectId={projectId!} state={state} />
              </CardContent>
            </Card>

            {/* AI Review placeholder */}
            <Alert variant="info" title="AI Analysis (coming soon)" className="text-xs">
              Future versions will auto-analyze your trade execution, detect patterns, and suggest improvements.
            </Alert>
          </div>
        </div>
      )}

      {/* ── New Trade Form Modal ── */}
      {showNewTrade && activeSessionId && (
        <NewTradeModal projectId={projectId!} sessionId={activeSessionId} currentCandle={currentCandleIndex} onClose={() => setShowNewTrade(false)} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   NEW TRADE MODAL
   ════════════════════════════════════════════════ */

function NewTradeModal({ projectId, sessionId, currentCandle, onClose }: { projectId: string; sessionId: string; currentCandle: number; onClose: () => void }) {
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [size, setSize] = useState('');
  const [risk, setRisk] = useState('');
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState('');
  const tradeMut = useCreateTrade(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    tradeMut.mutate({
      sessionId, direction: direction.toLowerCase(),
      entry_price: parseFloat(entry),
      ...(sl ? { stop_loss: parseFloat(sl) } : {}),
      ...(tp ? { take_profit: parseFloat(tp) } : {}),
      ...(size ? { position_size: parseFloat(size) } : {}),
      ...(risk ? { risk_percent: parseFloat(risk) } : {}),
      ...(notes ? { notes } : {}),
      ...(confidence ? { confidence: parseFloat(confidence) } : {}),
    }, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">New Trade @ Candle #{currentCandle}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setDirection('BUY')}
              className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                direction === 'BUY' ? 'bg-success text-white' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              )}>BUY</button>
            <button type="button" onClick={() => setDirection('SELL')}
              className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                direction === 'SELL' ? 'bg-destructive text-white' : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              )}>SELL</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" placeholder="Entry" value={entry} onChange={(e) => setEntry(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" required />
            <input type="number" step="any" placeholder="Stop Loss" value={sl} onChange={(e) => setSl(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
            <input type="number" step="any" placeholder="Take Profit" value={tp} onChange={(e) => setTp(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
            <input type="number" step="any" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
            <input type="number" step="any" placeholder="Risk %" value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
            <input type="number" min={0} max={100} placeholder="Confidence %" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
          </div>
          <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs" />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!entry || tradeMut.isPending}>
              {tradeMut.isPending ? 'Saving...' : 'Save Trade'}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

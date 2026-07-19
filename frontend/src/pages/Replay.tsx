import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LoadingSpinner, EmptyState } from '../components/ui/Feedback';
import {
  useReplaySessions, useCreateSession, useReplayState,
  useNextCandle, usePrevCandle, useJumpToCandle,
  usePauseSession, useResumeSession, useFinishSession,
  useCreateTrade, useCreateBookmark, useDeleteBookmark,
  useUpdateBookmark, useReplayDashboard,
} from '../hooks/useReplay';
import type { MarketCandle, ReplaySession } from '../api/replay';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD'];

function CandlestickChart({ candles }: { candles: MarketCandle[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    if (!chartApi.current) {
      chartApi.current = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 400,
        layout: { background: { type: ColorType.Solid, color: '#1e293b' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
        timeScale: { borderColor: '#475569' },
        crosshair: { mode: 0 },
      });
    }

    const series = chartApi.current.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderDownColor: '#ef4444', borderUpColor: '#22c55e',
      wickDownColor: '#ef4444', wickUpColor: '#22c55e',
    });

    series.setData(candles.map((c) => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    chartApi.current.timeScale().fitContent();

    return () => {
      chartApi.current?.remove();
      chartApi.current = null;
    };
  }, [candles]);

  return <div ref={chartRef} className="w-full rounded-lg overflow-hidden" />;
}

function SessionForm({ projectId, onCreated }: { projectId: string; onCreated: (id: string) => void }) {
  const [pair, setPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');
  const [startDate, setStartDate] = useState('2024-06-01');
  const [endDate, setEndDate] = useState('2024-06-10');
  const createMutation = useCreateSession(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { pair, timeframe, start_date: startDate + 'T00:00:00Z', end_date: endDate + 'T00:00:00Z' },
      { onSuccess: (data) => onCreated(data.id) },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Pair</label>
        <select value={pair} onChange={(e) => setPair(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Timeframe</label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Start</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">End</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
      </div>
      <button type="submit" disabled={createMutation.isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {createMutation.isPending ? 'Creating...' : 'New Session'}
      </button>
    </form>
  );
}

function NavigationControls({ projectId, session }: { projectId: string; session: ReplaySession }) {
  const [jumpIndex, setJumpIndex] = useState('');
  const nextMut = useNextCandle(projectId);
  const prevMut = usePrevCandle(projectId);
  const jumpMut = useJumpToCandle(projectId);
  const pauseMut = usePauseSession(projectId);
  const resumeMut = useResumeSession(projectId);
  const finishMut = useFinishSession(projectId);

  const active = nextMut.isPending || prevMut.isPending || jumpMut.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <button onClick={() => prevMut.mutate(session.id)} disabled={active}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700">
        Prev
      </button>
      <button onClick={() => nextMut.mutate(session.id)} disabled={active}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
        Next
      </button>
      <div className="flex items-center gap-1">
        <input type="number" min={0} max={session.total_candles - 1} value={jumpIndex}
          onChange={(e) => setJumpIndex(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          placeholder="# idx" />
        <button onClick={() => { const idx = parseInt(jumpIndex); if (!isNaN(idx)) jumpMut.mutate({ sessionId: session.id, candleIndex: idx }); }} disabled={active || !jumpIndex}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700">
          Jump
        </button>
      </div>
      <span className="mx-2 text-sm text-slate-500">
        {session.current_candle + 1} / {session.total_candles}
      </span>
      {session.status === 'active' ? (
        <button onClick={() => pauseMut.mutate(session.id)} disabled={active}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:opacity-50">
          Pause
        </button>
      ) : session.status === 'paused' ? (
        <button onClick={() => resumeMut.mutate(session.id)} disabled={active}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">
          Resume
        </button>
      ) : null}
      {session.status !== 'completed' && (
        <button onClick={() => finishMut.mutate(session.id)} disabled={active}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50">
          Finish
        </button>
      )}
      <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
        session.status === 'active' ? 'bg-green-100 text-green-700' :
        session.status === 'paused' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-500'
      }`}>{session.status}</span>
    </div>
  );
}

function TradePanel({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const [direction, setDirection] = useState('buy');
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
    tradeMut.mutate({
      sessionId, direction,
      entry_price: parseFloat(entry),
      ...(sl ? { stop_loss: parseFloat(sl) } : {}),
      ...(tp ? { take_profit: parseFloat(tp) } : {}),
      ...(size ? { position_size: parseFloat(size) } : {}),
      ...(risk ? { risk_percent: parseFloat(risk) } : {}),
      ...(notes ? { notes } : {}),
      ...(confidence ? { confidence: parseFloat(confidence) } : {}),
    }, { onSuccess: () => { setEntry(''); setSl(''); setTp(''); setSize(''); setRisk(''); setNotes(''); setConfidence(''); } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Trade</h4>
      <div className="flex gap-2">
        <button type="button" onClick={() => setDirection('buy')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${direction === 'buy' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>Buy</button>
        <button type="button" onClick={() => setDirection('sell')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${direction === 'sell' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>Sell</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="any" placeholder="Entry" value={entry} onChange={(e) => setEntry(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <input type="number" step="any" placeholder="Stop Loss" value={sl} onChange={(e) => setSl(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <input type="number" step="any" placeholder="Take Profit" value={tp} onChange={(e) => setTp(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <input type="number" step="any" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <input type="number" step="any" placeholder="Risk %" value={risk} onChange={(e) => setRisk(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <input type="number" min={0} max={100} placeholder="Confidence %" value={confidence} onChange={(e) => setConfidence(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
      </div>
      <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
      <button type="submit" disabled={tradeMut.isPending || !entry}
        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {tradeMut.isPending ? 'Saving...' : 'Save Trade'}
      </button>
    </form>
  );
}

function BookmarkPanel({ projectId, sessionId, currentCandle, bookmarks }: { projectId: string; sessionId: string; currentCandle: number; bookmarks: any[] }) {
  const [note, setNote] = useState('');
  const createMut = useCreateBookmark(projectId);
  const deleteMut = useDeleteBookmark(projectId);
  const updateMut = useUpdateBookmark(projectId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const handleAdd = () => {
    createMut.mutate({ sessionId, candle_index: currentCandle, date: new Date().toISOString(), note: note || undefined });
    setNote('');
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Bookmarks</h4>
      <div className="flex gap-2 mb-3">
        <input value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Bookmark note (optional)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <button onClick={handleAdd} disabled={createMut.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
      </div>
      {bookmarks.length === 0 ? (
        <p className="text-xs text-slate-400">No bookmarks yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs dark:border-slate-600 dark:bg-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600 dark:text-slate-300">Candle #{bm.candle_index}</span>
                <div className="flex gap-1">
                  {editingId === bm.id ? (
                    <button onClick={() => { updateMut.mutate({ sessionId, bookmarkId: bm.id, note: editNote }); setEditingId(null); }}
                      className="text-blue-500 hover:text-blue-700">Save</button>
                  ) : (
                    <button onClick={() => { setEditingId(bm.id); setEditNote(bm.note || ''); }}
                      className="text-slate-400 hover:text-slate-600">Edit</button>
                  )}
                  <button onClick={() => deleteMut.mutate({ sessionId, bookmarkId: bm.id })}
                    className="text-red-400 hover:text-red-600">Del</button>
                </div>
              </div>
              {editingId === bm.id ? (
                <input value={editNote} onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
              ) : bm.note ? (
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">{bm.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReplayPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const sessionsQuery = useReplaySessions(projectId!);
  const stateQuery = useReplayState(projectId!, activeSessionId);
  const dashboardQuery = useReplayDashboard(projectId!);

  const sessions = sessionsQuery.data || [];
  const state = stateQuery.data;

  const currentCandleIndex = state?.session.current_candle ?? 0;

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const isLoading = sessionsQuery.isLoading;
  const isStateLoading = stateQuery.isLoading && !!activeSessionId;

  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader title="Historical Replay">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">V1</span>
      </PageHeader>

      <div className="flex items-center justify-between">
        <SessionForm projectId={projectId!} onCreated={setActiveSessionId} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Sessions: {dashboardQuery.data?.total_sessions ?? 0} | 
            Trades: {dashboardQuery.data?.total_trades ?? 0} |
            Avg R:R: {dashboardQuery.data?.avg_rr != null ? dashboardQuery.data.avg_rr.toFixed(2) : 'N/A'}
          </span>
        </div>
      </div>

      {sessions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sessions.slice().reverse().map((s) => (
            <button key={s.id} onClick={() => setActiveSessionId(s.id)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                s.id === activeSessionId
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
              {s.pair} {s.timeframe} ({new Date(s.start_date).toLocaleDateString()})
            </button>
          ))}
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && sessions.length === 0 && (
        <EmptyState message="No replay sessions yet. Create one above to start." />
      )}

      {state && !isStateLoading && (
        <>
          <NavigationControls projectId={projectId!} session={state.session} />

          <CandlestickChart candles={state.candles_visible} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Current Candle</h4>
                {state.candle ? (
                  <div className="grid grid-cols-5 gap-3 text-sm">
                    <div><span className="text-slate-400">Open</span><p className="font-mono font-semibold">{state.candle.open.toFixed(5)}</p></div>
                    <div><span className="text-slate-400">High</span><p className="font-mono font-semibold text-green-600">{state.candle.high.toFixed(5)}</p></div>
                    <div><span className="text-slate-400">Low</span><p className="font-mono font-semibold text-red-600">{state.candle.low.toFixed(5)}</p></div>
                    <div><span className="text-slate-400">Close</span><p className="font-mono font-semibold">{state.candle.close.toFixed(5)}</p></div>
                    <div><span className="text-slate-400">Volume</span><p className="font-mono font-semibold">{state.candle.volume.toFixed(2)}</p></div>
                  </div>
                ) : <p className="text-xs text-slate-400">No candle data</p>}
              </div>

              {state.trades.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Trades ({state.trades.length})</h4>
                  <div className="space-y-2">
                    {state.trades.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs dark:border-slate-600 dark:bg-slate-700/50">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${t.direction === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.direction?.toUpperCase()}</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">@{t.entry_price?.toFixed(5)}</span>
                        {t.stop_loss && <span className="text-slate-400">SL: {t.stop_loss.toFixed(5)}</span>}
                        {t.take_profit && <span className="text-slate-400">TP: {t.take_profit.toFixed(5)}</span>}
                        {t.confidence && <span className="text-slate-400">Conf: {t.confidence}%</span>}
                        {t.notes && <span className="text-slate-400 truncate">{t.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <TradePanel projectId={projectId!} sessionId={state.session.id} />
              <BookmarkPanel projectId={projectId!} sessionId={state.session.id}
                currentCandle={currentCandleIndex} bookmarks={state.bookmarks} />
            </div>
          </div>
        </>
      )}

      {isStateLoading && <LoadingSpinner />}
    </div>
  );
}

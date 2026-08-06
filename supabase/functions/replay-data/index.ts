import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger, CircuitBreaker } from '../_shared/logging.ts';

const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY') || '';
const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const logger = new Logger({ function: 'replay-data' });
const twelvedataBreaker = new CircuitBreaker('twelvedata', 5, 60000, 30000);

function mapSymbol(symbol: string): string {
  if (/^[A-Z]{6}$/.test(symbol)) {
    const major = symbol.slice(0, 3);
    const minor = symbol.slice(3);
    const forexMajors = ['EUR', 'GBP', 'USD', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    if ((forexMajors.includes(major) && forexMajors.includes(minor)) ||
        symbol === 'XAUUSD' || symbol === 'XAGUSD' || symbol === 'XPTUSD' || symbol === 'XPDUSD') {
      return `${major}/${minor}`;
    }
  }
  if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  const indexMap: Record<string, string> = { DXY: 'USDX', US30: 'DJI', SPX500: 'SPX', NAS100: 'IXIC', UK100: 'UKX', JPN225: 'NI225', VIX: 'VIX' };
  return indexMap[symbol] || symbol;
}

function mapInterval(timeframe: string): string {
  const map: Record<string, string> = { '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min', '1h': '1h', '4h': '4h', '1d': '1day', '1w': '1week' };
  return map[timeframe] || '1day';
}

function toIso(value: string): string {
  if (!value) return new Date().toISOString();
  const withTime = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (withTime) return `${value.includes('Z') || value.includes('+') ? value : value + 'Z'}`;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${value}T00:00:00Z`;
  return value;
}

async function fetchTwelveData(symbol: string, interval: string, startDate?: string, endDate?: string, attempt = 1): Promise<{ status: string; values?: any[]; error?: string }> {
  const params = new URLSearchParams({
    symbol: mapSymbol(symbol),
    interval,
    apikey: twelveDataKey,
    outputsize: '5000',
    timezone: 'UTC',
  });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const url = `${TWELVEDATA_BASE}/time_series?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 401) return { status: 'error', error: 'Twelve Data API key is invalid or expired. Update TWELVEDATA_API_KEY in Supabase project settings.' };
    if (resp.status === 429) {
      logger.warn('TwelveData rate limited', { symbol, interval, attempt });
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        return fetchTwelveData(symbol, interval, startDate, endDate, attempt + 1);
      }
      return { status: 'error', error: 'Rate limit exceeded. Try again later.' };
    }
    if (resp.status >= 500 && attempt < MAX_RETRIES) {
      logger.warn('TwelveData server error, retrying', { symbol, interval, attempt, status: resp.status });
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      return fetchTwelveData(symbol, interval, startDate, endDate, attempt + 1);
    }
    let msg = 'Twelve Data API error.';
    try { const j = JSON.parse(body); msg = j.message || j.error || msg; } catch {}
    logger.error('TwelveData request failed', { symbol, interval, status: resp.status, error: msg });
    return { status: 'error', error: `${msg} (HTTP ${resp.status})` };
  }
  const json = await resp.json();
  if (json.status === 'error') {
    logger.error('TwelveData returned API error', { symbol, interval, error: json.message || json.error });
    return { status: 'error', error: json.message || json.error || 'Twelve Data API error.' };
  }
  if (!json.values || json.values.length === 0) {
    logger.warn('TwelveData returned no values', { symbol, interval });
    return { status: 'error', error: 'No data returned from market provider.' };
  }
  return { status: 'ok', values: json.values };
}

function parseTwelveCandles(values: any[]): { open_time: string; open: number; high: number; low: number; close: number; volume: number }[] {
  return values.map((v: any) => {
    const raw = v.datetime.endsWith('Z') ? v.datetime : v.datetime.includes(' ') ? v.datetime.replace(' ', 'T') + 'Z' : v.datetime + 'T00:00:00Z';
    return {
      open_time: new Date(raw).toISOString(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0,
    };
  }).filter((c) => !isNaN(Date.parse(c.open_time))).sort((a, b) => a.open_time.localeCompare(b.open_time));
}

async function ensureCandles(supabase: any, projectId: string, symbol: string, timeframe: string, startDate?: string, endDate?: string, force = false): Promise<{ count: number; source: string; error?: string }> {
  const startIso = startDate ? toIso(startDate) : null;
  const endIso = endDate ? toIso(endDate) : null;
  let query = supabase.from('market_candle').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('symbol', symbol).eq('timeframe', timeframe);
  if (startIso) query = query.gte('open_time', startIso);
  if (endIso) query = query.lte('open_time', endIso);
  const { count } = await query;

  if (count && count > 0 && !force) {
    return { count, source: 'cache' };
  }
  if (!twelveDataKey) {
    if (count) return { count, source: 'cache' };
    return { count: 0, source: 'none', error: 'TWELVEDATA_API_KEY not configured. Add this secret in Supabase project settings.' };
  }

  const from = startIso ? startIso.replace('T', ' ').replace('Z', '') : undefined;
  const to = endIso ? endIso.replace('T', ' ').replace('Z', '') : undefined;
  const result = await twelvedataBreaker.call(() => fetchTwelveData(symbol, mapInterval(timeframe), from, to)).catch((err) => {
    logger.error('TwelveData circuit breaker failure', { symbol, timeframe, error: err instanceof Error ? err.message : 'unknown' });
    return { status: 'error' as const, error: err instanceof Error ? err.message : 'Market data unavailable.' };
  });
  if (result.status !== 'ok' || !result.values) {
    if (count) return { count, source: 'cache' };
    return { count: 0, source: 'none', error: result.error || 'Failed to fetch candles.' };
  }

  const candles = parseTwelveCandles(result.values);
  if (candles.length > 0) {
    const rows = candles.map((c) => ({
      project_id: projectId, symbol, timeframe, open_time: c.open_time,
      open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume,
    }));
    const { error: upsertErr } = await supabase.from('market_candle').upsert(rows, { onConflict: 'project_id,symbol,timeframe,open_time', ignoreDuplicates: true });
    if (upsertErr) return { count: candles.length, source: 'provider', error: `Failed to cache candles: ${upsertErr.message}` };
  }
  return { count: candles.length, source: 'provider' };
}

async function loadCandles(supabase: any, projectId: string, symbol: string, timeframe: string, startDate?: string, endDate?: string): Promise<any[]> {
  let base = supabase.from('market_candle').select('*').eq('project_id', projectId).eq('symbol', symbol).eq('timeframe', timeframe);
  if (startDate) base = base.gte('open_time', toIso(startDate));
  if (endDate) base = base.lte('open_time', toIso(endDate));
  base = base.order('open_time', { ascending: true });
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await base.range(from, from + 999);
    if (error) throw new Error(`Failed to load candles: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function toWorkspace(session: any, candles: any[], currentIndex: number, related: Record<string, any[]>): any {
  const count = candles.length;
  const idx = Math.max(0, Math.min(currentIndex, Math.max(count - 1, 0)));
  const current = count > 0 ? candles[idx] : null;
  const visible = candles.slice(Math.max(0, idx - 60), Math.max(idx + 1, 1));
  const mapCandle = (c: any, i: number) => ({
    id: c.id, pair: c.symbol, timeframe: c.timeframe, timestamp: c.open_time,
    open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close),
    volume: Number(c.volume) || 0, candle_index: i,
  });
  return {
    session: {
      ...session,
      pair: session.symbol,
      current_candle: idx,
      current_date: current ? current.open_time : null,
      start_date: session.start_date || null,
      end_date: session.end_date || null,
      total_candles: count,
    },
    candle: current ? mapCandle(current, idx) : null,
    candles_visible: visible.map(mapCandle),
    trades: (related.trades || []).map((t: any) => ({ ...t, candle_index: t.candle_index ?? t.entry_index ?? t.exit_index ?? 0 })),
    bookmarks: related.bookmarks || [],
    annotations: (related.annotations || []).map((a: any) => ({ ...a, content: a.content ?? a.data ?? undefined })),
    timeline_events: (related.timeline_events || []).map((e: any) => ({ ...e, metadata: e.data ?? e.metadata })),
    review: related.review || null,
    mistakes: related.mistakes || [],
    screenshots: related.screenshots || [],
  };
}

async function buildWorkspace(supabase: any, projectId: string, sessionId: string, indexOverride?: number): Promise<any> {
  const { data: session, error: sessionErr } = await supabase.from('replay_session').select('*').eq('id', sessionId).eq('project_id', projectId).maybeSingle();
  if (sessionErr) throw new Error(sessionErr.message);
  if (!session) throw new Error('Session not found');

  const ensure = await ensureCandles(supabase, projectId, session.symbol, session.timeframe, session.start_date, session.end_date);
  if (ensure.error && ensure.count === 0) {
    throw new Error(ensure.error);
  }

  const candles = await loadCandles(supabase, projectId, session.symbol, session.timeframe, session.start_date, session.end_date);
  if (session.total_candles !== candles.length) {
    await supabase.from('replay_session').update({ total_candles: candles.length }).eq('id', sessionId);
    session.total_candles = candles.length;
  }

  const [trades, bookmarks, annotations, timelineEvents, review, mistakes, screenshots] = await Promise.all([
    supabase.from('replay_trade').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
    supabase.from('replay_bookmark').select('*').eq('session_id', sessionId).order('candle_index', { ascending: true }),
    supabase.from('replay_annotation').select('*').eq('session_id', sessionId).order('candle_index', { ascending: true }),
    supabase.from('replay_timeline_event').select('*').eq('session_id', sessionId).order('candle_index', { ascending: true }),
    supabase.from('replay_review').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('replay_mistake').select('*').eq('session_id', sessionId).order('candle_index', { ascending: true }),
    supabase.from('replay_screenshot').select('*').eq('session_id', sessionId).order('candle_index', { ascending: true }),
  ]);

  return toWorkspace(session, candles, indexOverride ?? session.current_index ?? 0, {
    trades: trades.data || [],
    bookmarks: bookmarks.data || [],
    annotations: annotations.data || [],
    timeline_events: timelineEvents.data || [],
    review: review.data || null,
    mistakes: mistakes.data || [],
    screenshots: screenshots.data || [],
  });
}

async function advanceSession(supabase: any, projectId: string, sessionId: string, delta: number, target?: number): Promise<any> {
  const { data: session } = await supabase.from('replay_session').select('current_index, total_candles').eq('id', sessionId).eq('project_id', projectId).maybeSingle();
  if (!session) throw new Error('Session not found');
  const next = target !== undefined
    ? Math.max(0, Math.min(target, Math.max((session.total_candles || 0) - 1, 0)))
    : Math.max(0, Math.min((session.current_index || 0) + delta, Math.max((session.total_candles || 0) - 1, 0)));
  const { error: updErr } = await supabase.from('replay_session')
    .update({ current_index: next, status: 'active' }).eq('id', sessionId).eq('project_id', projectId);
  if (updErr) throw new Error(updErr.message);
  return buildWorkspace(supabase, projectId, sessionId, next);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  let op = 'unknown';
  let projectId: string | undefined;
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data } = await req.json() as any;
    op = operation;
    projectId = project_id;
    if (!project_id) return errorResponse('Missing project_id');
    const reqLogger = logger.with({ project_id, operation: op });

    switch (operation) {
      case 'fetch-candles': {
        const symbol = data?.symbol;
        const timeframe = data?.timeframe;
        if (!symbol || !timeframe) return errorResponse('Missing symbol or timeframe');
        const result = await ensureCandles(supabase, project_id, symbol, timeframe, data?.start_date, data?.end_date, !!data?.force);
        if (result.error && result.count === 0) return errorResponse(result.error, 502);
        reqLogger.info('candles ensured', { symbol, timeframe, count: result.count, source: result.source, duration_ms: Date.now() - startedAt });
        return successResponse({ symbol, timeframe, count: result.count, source: result.source });
      }

      case 'load-workspace': {
        const sessionId = data?.session_id;
        if (!sessionId) return errorResponse('Missing session_id');
        const workspace = await buildWorkspace(supabase, project_id, sessionId);
        reqLogger.info('workspace loaded', { session_id: sessionId, candles: workspace.total_candles, duration_ms: Date.now() - startedAt });
        return successResponse(workspace);
      }

      case 'next-candle': {
        const sessionId = data?.session_id;
        if (!sessionId) return errorResponse('Missing session_id');
        return successResponse(await advanceSession(supabase, project_id, sessionId, 1));
      }

      case 'prev-candle': {
        const sessionId = data?.session_id;
        if (!sessionId) return errorResponse('Missing session_id');
        return successResponse(await advanceSession(supabase, project_id, sessionId, -1));
      }

      case 'jump-to-candle': {
        const sessionId = data?.session_id;
        if (!sessionId) return errorResponse('Missing session_id');
        if (!Number.isInteger(data?.candle_index)) return errorResponse('Missing candle_index');
        return successResponse(await advanceSession(supabase, project_id, sessionId, 0, data.candle_index));
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    logger.error('replay-data failed', { operation: op, project_id: projectId, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger, CircuitBreaker, RetryStrategy } from '../_shared/logging.ts';

const alphavantageKey = Deno.env.get('ALPHAVANTAGE_API_KEY') || '';
const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY') || '';

const logger = new Logger({ function: 'collector' });

const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const twelvedataBreaker = new CircuitBreaker('twelvedata', 5, 60000, 30000);
const alphavantageBreaker = new CircuitBreaker('alphavantage', 5, 60000, 30000);

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

function parseAlphaVantageDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const withTime = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (withTime) {
    return `${withTime[1]}-${withTime[2]}-${withTime[3]}T${withTime[4]}:${withTime[5]}:${withTime[6]}Z`;
  }
  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00:00Z`;
  }
  return value;
}

async function fetchTwelveData(symbol: string, interval: string, attempt = 1): Promise<{ status: string; values?: any[]; error?: string }> {
  const url = `${TWELVEDATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${twelveDataKey}&outputsize=5000&timezone=UTC`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 401) return { status: 'error', error: 'Twelve Data API key is invalid or expired. Update TWELVEDATA_API_KEY in Supabase project settings.' };
    if (resp.status === 429) {
      logger.warn('TwelveData rate limited', { symbol, interval, attempt });
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        return fetchTwelveData(symbol, interval, attempt + 1);
      }
      return { status: 'error', error: 'Rate limit exceeded. Try again later.' };
    }
    if (resp.status >= 500 && attempt < MAX_RETRIES) {
      logger.warn('TwelveData server error, retrying', { symbol, interval, attempt, status: resp.status });
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      return fetchTwelveData(symbol, interval, attempt + 1);
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

async function fetchAlphaVantage(url: string, label: string): Promise<any> {
  return alphavantageBreaker.call(() =>
    RetryStrategy.withBackoff(
      async () => {
        const resp = await fetch(url);
        if (!resp.ok) {
          const e = new Error(`Alpha Vantage request failed (HTTP ${resp.status})`) as Error & { status?: number };
          e.status = resp.status;
          throw e;
        }
        return await resp.json();
      },
      {
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        shouldRetry: (err) => {
          const status = (err as { status?: number })?.status;
          return status === 429 || (status !== undefined && status >= 500);
        },
        onRetry: (_err, attempt) => logger.warn('Alpha Vantage retry', { label, attempt }),
      },
    ),
  );
}

function parseTwelveCandles(values: any[]): { time: number; open: number; high: number; low: number; close: number; volume: number }[] {
  return values.map((v: any) => {
    const dt = v.datetime.endsWith('Z') ? v.datetime : v.datetime.includes(' ') ? v.datetime.replace(' ', 'T') + 'Z' : v.datetime + 'T00:00:00Z';
    return {
      time: Math.floor(new Date(dt).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0,
    };
  }).filter(c => !isNaN(c.time)).sort((a, b) => a.time - b.time);
}

async function loadCandles(supabase: any, symbol: string, timeframe: string, projectId?: string): Promise<{ candles: ReturnType<typeof parseTwelveCandles> } | { error: string }> {
  if (!twelveDataKey) {
    return { error: 'TWELVEDATA_API_KEY not configured. Chart data unavailable. Add this secret in Supabase project settings.' };
  }
  const mappedSymbol = mapSymbol(symbol);
  const interval = mapInterval(timeframe);

  if (projectId) {
    const { data: cached } = (await supabase.from('market_data_cache')
      .select('data, expires_at')
      .eq('project_id', projectId)
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .eq('data_type', 'ohlc')
      .maybeSingle()) as unknown as { data: { data: unknown; expires_at?: string } | null };
    if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
      return { candles: cached.data as ReturnType<typeof parseTwelveCandles> };
    }
  }

  const result = await twelvedataBreaker.call(() => fetchTwelveData(mappedSymbol, interval)).catch((err): Awaited<ReturnType<typeof fetchTwelveData>> => {
    logger.error('TwelveData circuit breaker failure', { symbol, mappedSymbol, interval, error: err instanceof Error ? err.message : 'unknown' });
    return { status: 'error' as const, error: err instanceof Error ? err.message : 'Market data unavailable.' };
  });
  if (result.status === 'error') {
    return { error: result.error || 'Market data unavailable.' };
  }
  const candles = parseTwelveCandles(result.values!);
  if (candles.length === 0) {
    return { error: 'No candle data returned for this symbol/timeframe.' };
  }

  if (projectId) {
    const ttlMs = ['1day', '1week', '1month'].includes(interval) ? 3_600_000 : 60_000;
    await supabase.from('market_data_cache').upsert({
      project_id: projectId,
      symbol,
      timeframe,
      data_type: 'ohlc',
      data: candles,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
    }, { onConflict: 'project_id, symbol, timeframe, data_type', ignoreDuplicates: false });
  }

  return { candles };
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
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data: payload } = await req.json() as any;
    op = operation;
    projectId = project_id;
    const reqLogger = logger.with({ project_id, operation: op });
    const collectorName = payload?.collector_name;

    switch (operation) {
      case 'run': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const runStartedAt = Date.now();
        const results: { collected: number; errors: number; messages: string[] } = { collected: 0, errors: 0, messages: [] };

        const insertMacroEvent = async (row: Record<string, unknown>) => {
          const { error } = await supabase.from('macro_event').insert({ project_id, ...row });
          if (error) {
            results.errors++;
            results.messages.push(error.message);
          } else {
            results.collected++;
          }
        };

        let status = 'success';
        let skippedReason: string | undefined;

        if (collectorName === 'market_news' || collectorName === 'economic_calendar') {
          if (!alphavantageKey) {
            status = 'skipped';
            skippedReason = 'ALPHAVANTAGE_API_KEY is not configured';
          } else {
            try {
              if (collectorName === 'market_news') {
                const news = await fetchAlphaVantage(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${alphavantageKey}&limit=10`, 'news_sentiment');
                if (!news.feed) {
                  status = 'skipped';
                  skippedReason = 'Alpha Vantage returned no news feed';
                } else {
                  for (const item of news.feed) {
                    await insertMacroEvent({
                      event_date: parseAlphaVantageDate(item.time_published),
                      title: item.title,
                      category: 'news',
                      source: 'alphavantage',
                    });
                  }
                }
              } else {
                const cal = await fetchAlphaVantage(`https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&apikey=${alphavantageKey}`, 'economic_calendar');
                if (!cal.entries) {
                  status = 'skipped';
                  skippedReason = 'Alpha Vantage returned no calendar entries';
                } else {
                  for (const entry of cal.entries) {
                    await insertMacroEvent({
                      event_date: parseAlphaVantageDate(entry.date),
                      title: entry.event,
                      country: entry.country,
                      importance: entry.importance || 1,
                      source: 'alphavantage',
                    });
                  }
                }
              }
            } catch {
              status = 'error';
              results.errors++;
              results.messages.push('Alpha Vantage request failed');
            }
          }
        } else {
          status = 'skipped';
          skippedReason = `No bulk ingestion source for collector '${collectorName}'`;
        }

        if (status === 'success' && results.errors > 0) status = 'error';

        await supabase.from('collector_status').upsert({
          project_id,
          collector_name: collectorName,
          status,
          last_run_at: new Date().toISOString(),
          records_collected: results.collected,
          errors: results.errors,
        }, { onConflict: 'project_id,collector_name' });

        await supabase.from('collector_log').insert({
          project_id,
          collector_name: collectorName,
          status,
          records_count: results.collected,
          errors_count: results.errors,
          error_message: skippedReason ?? (results.errors > 0 ? results.messages.slice(0, 5).join('; ') : undefined),
          started_at: new Date(runStartedAt).toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - runStartedAt,
        });

        reqLogger.info('collector run finished', { collector_name: collectorName, status, collected: results.collected, errors: results.errors, duration_ms: Date.now() - runStartedAt });

        return successResponse({
          collector_name: collectorName,
          status,
          records_collected: results.collected,
          errors_count: results.errors,
          error_message: skippedReason ?? (results.errors > 0 ? results.messages.slice(0, 5).join('; ') : undefined),
          duration_ms: Date.now() - runStartedAt,
        });
      }

      case 'toggle': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const { data: existing } = await supabase.from('collector_status')
          .select('enabled').eq('project_id', project_id).eq('collector_name', collectorName).maybeSingle();
        const next = !(existing?.enabled ?? false);
        if (existing) {
          await supabase.from('collector_status').update({ enabled: next })
            .eq('project_id', project_id).eq('collector_name', collectorName);
        } else {
          await supabase.from('collector_status').insert({
            project_id,
            collector_name: collectorName,
            enabled: next,
            status: 'idle',
          });
        }
        reqLogger.info('collector toggled', { collector_name: collectorName, enabled: next });
        return successResponse({ name: collectorName, enabled: next });
      }

      case 'fetch-ohlc': {
        const res = await loadCandles(supabase, payload?.symbol, payload?.timeframe || '1d', project_id);
        if ('error' in res) return errorResponse(res.error);
        reqLogger.info('ohlc fetched', { symbol: payload?.symbol, timeframe: payload?.timeframe || '1d', candles: res.candles.length, duration_ms: Date.now() - startedAt });
        return successResponse(res.candles);
      }

      case 'fetch-latest': {
        const res = await loadCandles(supabase, payload?.symbol, payload?.timeframe || '1d', project_id);
        if ('error' in res) return errorResponse(res.error);
        const candles = res.candles;
        if (candles.length === 0) return errorResponse('No candle data available.');
        reqLogger.info('latest candle fetched', { symbol: payload?.symbol, timeframe: payload?.timeframe || '1d', duration_ms: Date.now() - startedAt });
        return successResponse({
          candle: candles[candles.length - 1],
          server_now: new Date().toISOString(),
        });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    logger.error('collector failed', { operation: op, project_id: projectId, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

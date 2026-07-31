import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const alphavantageKey = Deno.env.get('ALPHAVANTAGE_API_KEY') || '';
const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY') || '';

const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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

async function fetchTwelveData(symbol: string, interval: string, attempt = 1): Promise<{ status: string; values?: any[]; error?: string }> {
  const url = `${TWELVEDATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${twelveDataKey}&outputsize=5000&timezone=UTC`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 401) return { status: 'error', error: 'Twelve Data API key is invalid or expired. Update TWELVEDATA_API_KEY in Supabase project settings.' };
    if (resp.status === 429) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        return fetchTwelveData(symbol, interval, attempt + 1);
      }
      return { status: 'error', error: 'Rate limit exceeded. Try again later.' };
    }
    if (resp.status >= 500 && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      return fetchTwelveData(symbol, interval, attempt + 1);
    }
    let msg = 'Twelve Data API error.';
    try { const j = JSON.parse(body); msg = j.message || j.error || msg; } catch {}
    return { status: 'error', error: `${msg} (HTTP ${resp.status})` };
  }
  const json = await resp.json();
  if (json.status === 'error') {
    return { status: 'error', error: json.message || json.error || 'Twelve Data API error.' };
  }
  if (!json.values || json.values.length === 0) {
    return { status: 'error', error: 'No data returned from market provider.' };
  }
  return { status: 'ok', values: json.values };
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

async function loadCandles(supabase: ReturnType<typeof createClient>, symbol: string, timeframe: string, projectId?: string): Promise<{ candles: ReturnType<typeof parseTwelveCandles> } | { error: string }> {
  if (!twelveDataKey) {
    return { error: 'TWELVEDATA_API_KEY not configured. Chart data unavailable. Add this secret in Supabase project settings.' };
  }
  const mappedSymbol = mapSymbol(symbol);
  const interval = mapInterval(timeframe);

  if (projectId) {
    const { data: cached } = await supabase.from('market_data_cache')
      .select('data, expires_at')
      .eq('project_id', projectId)
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .eq('data_type', 'ohlc')
      .maybeSingle();
    if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
      return { candles: cached.data };
    }
  }

  const result = await fetchTwelveData(mappedSymbol, interval);
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
    const collectorName = payload?.collector_name;

    switch (operation) {
      case 'run': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const results: any = { collected: 0, errors: 0 };

        if (collectorName === 'market_news' && alphavantageKey) {
          try {
            const resp = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${alphavantageKey}&limit=10`);
            const news = await resp.json();
            if (news.feed) {
              for (const item of news.feed) {
                await supabase.from('macro_event').insert({
                  project_id,
                  event_date: item.time_published,
                  title: item.title,
                  category: 'news',
                  source: 'alphavantage',
                });
                results.collected++;
              }
            }
          } catch { results.errors++; }
        }

        if (collectorName === 'economic_calendar') {
          try {
            const resp = await fetch(`https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&apikey=${alphavantageKey}`);
            const cal = await resp.json();
            if (cal.entries) {
              for (const entry of cal.entries) {
                await supabase.from('macro_event').insert({
                  project_id,
                  event_date: entry.date,
                  title: entry.event,
                  country: entry.country,
                  importance: entry.importance || 1,
                  source: 'alphavantage',
                });
                results.collected++;
              }
            }
          } catch { results.errors++; }
        }

        await supabase.from('collector_status').upsert({
          project_id,
          collector_name: collectorName,
          status: 'completed',
          last_run_at: new Date().toISOString(),
          records_collected: results.collected,
        }, { onConflict: 'project_id,collector_name' });

        return successResponse(results);
      }

      case 'toggle': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const { data: status } = await supabase.from('collector_status')
          .select('enabled').eq('project_id', project_id).eq('collector_name', collectorName).single();
        await supabase.from('collector_status').update({
          enabled: !status?.enabled,
        }).eq('project_id', project_id).eq('collector_name', collectorName);
        return successResponse({ toggled: !status?.enabled });
      }

      case 'fetch-ohlc': {
        const res = await loadCandles(supabase, payload?.symbol, payload?.timeframe || '1d', project_id);
        if ('error' in res) return errorResponse(res.error);
        return successResponse(res.candles);
      }

      case 'fetch-latest': {
        const res = await loadCandles(supabase, payload?.symbol, payload?.timeframe || '1d', project_id);
        if ('error' in res) return errorResponse(res.error);
        const candles = res.candles;
        if (candles.length === 0) return errorResponse('No candle data available.');
        return successResponse({
          candle: candles[candles.length - 1],
          server_now: new Date().toISOString(),
        });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

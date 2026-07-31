import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataSuccess {
  success: true;
  candles: OhlcCandle[];
}

export interface MarketDataError {
  success: false;
  reason: string;
}

export type MarketDataResult = MarketDataSuccess | MarketDataError;

const CACHE_PREFIX = 'minore_ohlc_';
const CACHE_TTL_MS = 60 * 1000;

function cacheKey(symbol: string, timeframe: string): string {
  return `${CACHE_PREFIX}${symbol}_${timeframe}`;
}

function readLocalCache(symbol: string, timeframe: string): OhlcCandle[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(symbol, timeframe));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(symbol, timeframe));
      return null;
    }
    return entry.candles;
  } catch {
    return null;
  }
}

function readStaleLocalCache(symbol: string, timeframe: string): OhlcCandle[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(symbol, timeframe));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return entry.candles || null;
  } catch {
    return null;
  }
}

function writeLocalCache(symbol: string, timeframe: string, candles: OhlcCandle[]) {
  try {
    localStorage.setItem(cacheKey(symbol, timeframe), JSON.stringify({ candles, ts: Date.now() }));
  } catch {}
}

function shouldHumanize(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('twelvedata_api_key') || lower.includes('apikey') || lower.includes('api key')) return 'Market data feed requires a valid Twelve Data API key. Configure it in Supabase project settings.';
  if (lower.includes('rate limit')) return 'Market data rate limit reached. Please wait a moment and try again.';
  if (lower.includes('unauthorized')) return 'Session expired. Please refresh the page.';
  if (lower.includes('fetch failed') || lower.includes('network') || lower.includes('econnrefused')) return 'Network error. Check your internet connection.';
  if (lower.includes('non-2xx') || lower.includes('edge function')) return 'Market data temporarily unavailable.';
  return message;
}

export const marketDataService = {
  async fetchOHLC(symbol: string, timeframe: string, projectId?: string): Promise<MarketDataResult> {
    const fresh = readLocalCache(symbol, timeframe);
    if (fresh) return { success: true, candles: fresh };

    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const data = await callEdgeFunction<any>('collector', {
          operation: 'fetch-ohlc',
          project_id: projectId,
          data: { symbol, timeframe },
        });
        const raw = data ?? [];
        const candles: OhlcCandle[] = Array.isArray(raw) ? raw : [];
        if (candles.length > 0) {
          writeLocalCache(symbol, timeframe, candles);
          return { success: true, candles };
        }
        lastError = 'No candle data returned';
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    const stale = readStaleLocalCache(symbol, timeframe);
    if (stale) return { success: true, candles: stale };

    try {
      const { data: supabaseCached } = await supabase
        .from('market_data_cache')
        .select('data')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .eq('data_type', 'ohlc')
        .maybeSingle();
      if (supabaseCached?.data && Array.isArray(supabaseCached.data) && supabaseCached.data.length > 0) {
        writeLocalCache(symbol, timeframe, supabaseCached.data);
        return { success: true, candles: supabaseCached.data };
      }
    } catch {}

    return { success: false, reason: shouldHumanize(lastError) };
  },

  async fetchLatest(symbol: string, timeframe: string, projectId?: string): Promise<OhlcCandle | null> {
    try {
      const data = await callEdgeFunction<any>('collector', {
        operation: 'fetch-latest',
        project_id: projectId,
        data: { symbol, timeframe },
      });
      const candle = data?.candle;
      const time = Math.floor(Number(candle?.time));
      const open = Number(candle?.open);
      const high = Number(candle?.high);
      const low = Number(candle?.low);
      const close = Number(candle?.close);
      if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) return null;
      return { time, open, high, low, close, volume: Number(candle?.volume) || 0 };
    } catch {
      return null;
    }
  },
};

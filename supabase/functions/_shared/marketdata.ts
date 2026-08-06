import { Logger } from './logging.ts';

const logger = new Logger({ function: 'marketdata' });

export const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export function mapSymbol(symbol: string): string {
  if (/^[A-Z]{6}$/.test(symbol)) {
    const major = symbol.slice(0, 3);
    const minor = symbol.slice(3);
    const forexMajors = ['EUR', 'GBP', 'USD', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    if ((forexMajors.includes(major) && forexMajors.includes(minor)) ||
        symbol === 'XAUUSD' || symbol === 'XAGUSD' || symbol === 'XPTUSD' || symbol === 'XPDUSD') {
      return `${major}/${minor}`;
    }
    const cryptoPairs = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'];
    if (cryptoPairs.includes(symbol)) return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  const indexMap: Record<string, string> = { DXY: 'USDX', US30: 'DJI', SPX500: 'SPX', NAS100: 'IXIC', UK100: 'UKX', JPN225: 'NI225', VIX: 'VIX' };
  return indexMap[symbol] || symbol;
}

export function mapInterval(timeframe: string): string {
  const map: Record<string, string> = { '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min', '1h': '1h', '4h': '4h', '1d': '1day', '1w': '1week' };
  return map[timeframe] || '1day';
}

export async function fetchTwelveData(
  symbol: string,
  interval: string,
  startDate?: string,
  endDate?: string,
  attempt = 1,
): Promise<{ status: string; values?: any[]; error?: string }> {
  const twelveDataKey = Deno.env.get('TWELVEDATA_API_KEY') || '';
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

import { useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketDataService, type OhlcCandle } from '../api/marketData';

export const OHLC_KEYS = {
  all: ['ohlc'] as const,
  candles: (symbol: string, timeframe: string, projectId?: string) =>
    [...OHLC_KEYS.all, symbol, timeframe, projectId] as const,
};

const circuitBreakers = new Map<string, { failures: number; lastFailure: number; openUntil: number }>();
const MAX_FAILURES = 3;
const COOLDOWN_MS = 120_000;

function isCircuitOpen(key: string): boolean {
  const state = circuitBreakers.get(key);
  if (!state) return false;
  if (state.failures >= MAX_FAILURES && Date.now() < state.openUntil) return true;
  if (Date.now() >= state.openUntil) { circuitBreakers.delete(key); return false; }
  return false;
}

function recordFailure(key: string) {
  const state = circuitBreakers.get(key) || { failures: 0, lastFailure: 0, openUntil: 0 };
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= MAX_FAILURES) state.openUntil = Date.now() + COOLDOWN_MS;
  circuitBreakers.set(key, state);
}

function recordSuccess(key: string) {
  circuitBreakers.delete(key);
}

export function useOhlcData(symbol: string, timeframe: string, projectId?: string, enabled: boolean = true) {
  const circuitKey = `${symbol}:${timeframe}`;
  const open = isCircuitOpen(circuitKey);

  const queryFn = useCallback(async () => {
    if (open) throw new Error('Market data temporarily unavailable. Retrying in 2 minutes.');
    try {
      const data = await marketDataService.fetchOhlc(symbol, timeframe, projectId);
      recordSuccess(circuitKey);
      return data;
    } catch (err) {
      recordFailure(circuitKey);
      throw err;
    }
  }, [symbol, timeframe, projectId, circuitKey, open]);

  return useQuery<OhlcCandle[]>({
    queryKey: OHLC_KEYS.candles(symbol, timeframe, projectId),
    queryFn,
    enabled: enabled && !!symbol,
    refetchInterval: open ? false : 60_000,
    retry: open ? 0 : 2,
    staleTime: 30_000,
  });
}

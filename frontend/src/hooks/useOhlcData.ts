import { useQuery } from '@tanstack/react-query';
import { marketDataService, type OhlcCandle } from '../api/marketData';

export const OHLC_KEYS = {
  all: ['ohlc'] as const,
  candles: (symbol: string, timeframe: string, projectId?: string) =>
    [...OHLC_KEYS.all, symbol, timeframe, projectId] as const,
};

export function useOhlcData(symbol: string, timeframe: string, projectId?: string, enabled: boolean = true) {
  return useQuery<OhlcCandle[]>({
    queryKey: OHLC_KEYS.candles(symbol, timeframe, projectId),
    queryFn: () => marketDataService.fetchOhlc(symbol, timeframe, projectId),
    enabled: enabled && !!symbol,
    refetchInterval: 60_000,
    retry: 2,
    staleTime: 30_000,
  });
}

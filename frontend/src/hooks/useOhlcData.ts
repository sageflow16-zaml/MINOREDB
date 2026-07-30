import { useQuery } from '@tanstack/react-query';
import { marketDataService, type OhlcCandle } from '../api/marketData';

export const OHLC_KEYS = {
  all: ['ohlc'] as const,
  candles: (symbol: string, timeframe: string) => [...OHLC_KEYS.all, symbol, timeframe] as const,
};

export function useOhlcData(symbol: string, timeframe: string, enabled: boolean = true) {
  return useQuery<OhlcCandle[]>({
    queryKey: OHLC_KEYS.candles(symbol, timeframe),
    queryFn: () => marketDataService.fetchOhlc(symbol, timeframe),
    enabled: enabled && !!symbol,
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  });
}

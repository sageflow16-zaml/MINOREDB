import { useQuery } from '@tanstack/react-query';
import { marketDataService, type OhlcCandle, type MarketDataResult } from '../services/marketDataService';

const QUERY_KEY = ['ohlc'] as const;

export function useMarketData(symbol: string, timeframe: string, projectId?: string, enabled: boolean = true) {
  return useQuery<MarketDataResult>({
    queryKey: [...QUERY_KEY, symbol, timeframe, projectId],
    queryFn: () => marketDataService.fetchOHLC(symbol, timeframe, projectId),
    enabled: enabled && !!symbol,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}

export type { OhlcCandle, MarketDataResult };

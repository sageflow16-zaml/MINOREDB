import { callEdgeFunction } from '../lib/edgeFunctions';

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const marketDataService = {
  fetchOhlc: async (symbol: string, timeframe: string, projectId?: string): Promise<OhlcCandle[]> => {
    return callEdgeFunction<OhlcCandle[]>('collector', {
      operation: 'fetch-ohlc',
      project_id: projectId,
      data: { symbol, timeframe },
    });
  },
};

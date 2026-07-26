import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ContextAnalysis, ContextRequest } from './types';

export const contextService = {
  market: (projectId: string, symbols: string[], forceRefresh = false): Promise<{ data: ContextAnalysis[] }> =>
    callEdgeFunction('context', { operation: 'market_context', project_id: projectId, data: { symbols, force_refresh: forceRefresh } }),

  multiTimeframe: (projectId: string, symbols: string[], timeframes: string[], forceRefresh = false): Promise<{ data: ContextAnalysis[] }> =>
    callEdgeFunction('context', { operation: 'multi_timeframe', project_id: projectId, data: { symbols, timeframes, force_refresh: forceRefresh } }),

  analyze: (projectId: string, request: ContextRequest): Promise<{ data: ContextAnalysis }> =>
    callEdgeFunction('context', { operation: 'analyze', project_id: projectId, data: request as any }),

  tradeReadiness: (projectId: string, symbol: string): Promise<{ data: { ready: boolean; score: number; factors: string[] } }> =>
    callEdgeFunction('context', { operation: 'trade_readiness', project_id: projectId, data: { symbol } }),

  full: async (_projectId: string, _symbols: string[], _forceRefresh = false): Promise<{ data: ContextAnalysis[] }> => {
    throw new Error('Full context analysis requires deployment of context AI microservice');
  },
};

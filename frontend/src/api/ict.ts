import api from '../services/api';
import type {
  ICTAnalysisRequest, ICTAnalysisResponse,
  ICTMarketBias, ICTExecutionSignal, AIContext, ICTFullContext,
} from './types';

export const ictApi = {
  analyze: (projectId: string, data: ICTAnalysisRequest) =>
    api.post<ICTAnalysisResponse>(`/projects/${projectId}/ict/analyze`, data),

  getStructures: (projectId: string, symbol?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/structures`, { params: { symbol, limit } }),

  getEvents: (projectId: string, symbol?: string, eventType?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/events`, { params: { symbol, event_type: eventType, limit } }),

  getFVGs: (projectId: string, symbol?: string, status?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/fvgs`, { params: { symbol, status, limit } }),

  getOrderBlocks: (projectId: string, symbol?: string, blockType?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/order-blocks`, { params: { symbol, block_type: blockType, limit } }),

  getLiquidityZones: (projectId: string, symbol?: string, liquidityType?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/liquidity`, { params: { symbol, liquidity_type: liquidityType, limit } }),

  getSetups: (projectId: string, symbol?: string, modelType?: string, status?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/setups`, { params: { symbol, model_type: modelType, status, limit } }),

  getSetup: (projectId: string, setupId: string) =>
    api.get<Record<string, unknown>>(`/projects/${projectId}/ict/setups/${setupId}`),

  getSessions: (projectId: string, symbol?: string, date?: string, limit = 50) =>
    api.get<Record<string, unknown>[]>(`/projects/${projectId}/ict/sessions`, { params: { symbol, date, limit } }),

  getMarketBias: (projectId: string, symbol = 'EURUSD') =>
    api.get<ICTMarketBias>(`/projects/${projectId}/ict/bias`, { params: { symbol } }),

  getSignals: (projectId: string, symbol?: string, status?: string, limit = 50) =>
    api.get<ICTExecutionSignal[]>(`/projects/${projectId}/ict/signals`, { params: { symbol, status, limit } }),

  getAIContext: (projectId: string, symbol = 'EURUSD') =>
    api.get<AIContext>(`/projects/${projectId}/ict/ai-context`, { params: { symbol } }),

  getFullContext: (projectId: string, symbol = 'EURUSD') =>
    api.get<ICTFullContext>(`/projects/${projectId}/ict/context`, { params: { symbol } }),
};

import { supabase } from '../lib/supabase';
import type { ICTAnalysisRequest, ICTAnalysisResponse, ICTMarketBias, ICTExecutionSignal, AIContext, ICTFullContext } from './types';

export const ictApi = {
  analyze: async (_projectId: string, _data: ICTAnalysisRequest): Promise<{ data: ICTAnalysisResponse }> => {
    throw new Error('ICT analysis requires AI Edge Function deployment');
  },

  getStructures: async (projectId: string, symbol?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('market_structure_point').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getEvents: async (projectId: string, symbol?: string, eventType?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('market_timeline').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    if (eventType) query = query.eq('event_type', eventType);
    const { data, error } = await query.order('event_time', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getFVGs: async (_projectId: string, _symbol?: string, _status?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('FVG data requires ICT analysis engine');
  },

  getOrderBlocks: async (_projectId: string, _symbol?: string, _blockType?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('Order blocks require ICT analysis engine');
  },

  getLiquidityZones: async (_projectId: string, _symbol?: string, _liquidityType?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('Liquidity zones require ICT analysis engine');
  },

  getSetups: async (_projectId: string, _symbol?: string, _modelType?: string, _status?: string, _limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    throw new Error('ICT setups require analysis engine');
  },

  getSetup: async (_projectId: string, _setupId: string): Promise<{ data: Record<string, unknown> }> => {
    throw new Error('ICT setup detail requires analysis engine');
  },

  getSessions: async (projectId: string, symbol?: string, _date?: string, limit = 50): Promise<{ data: Record<string, unknown>[] }> => {
    let query = supabase.from('session_analysis').select('*').eq('project_id', projectId);
    if (symbol) query = query.eq('symbol', symbol);
    const { data, error } = await query.order('date', { ascending: false }).limit(limit);
    if (error) throw error;
    return { data: data ?? [] };
  },

  getMarketBias: async (_projectId: string, _symbol = 'EURUSD'): Promise<{ data: ICTMarketBias }> => {
    throw new Error('Market bias requires AI analysis');
  },

  getSignals: async (_projectId: string, _symbol?: string, _status?: string, _limit = 50): Promise<{ data: ICTExecutionSignal[] }> => {
    throw new Error('ICT signals require analysis engine');
  },

  getAIContext: async (_projectId: string, _symbol = 'EURUSD'): Promise<{ data: AIContext }> => {
    throw new Error('AI context requires analysis engine');
  },

  getFullContext: async (_projectId: string, _symbol = 'EURUSD'): Promise<{ data: ICTFullContext }> => {
    throw new Error('Full context requires analysis engine');
  },
};

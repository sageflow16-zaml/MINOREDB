import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { DecisionResponse, DecisionEnvironment, DecisionHistoryEntry } from './types';

export const decisionService = {
  evaluateCurrent: async (projectId: string, env: DecisionEnvironment): Promise<DecisionResponse> =>
    callEdgeFunction('ai', { operation: 'evaluate-current', project_id: projectId, data: { environment: env } }),

  evaluateTrade: async (projectId: string, tradeId: string): Promise<DecisionResponse> =>
    callEdgeFunction('ai', { operation: 'analyze-trade', project_id: projectId, data: { trade_id: tradeId } }),

  history: async (_projectId: string, limit: number = 20): Promise<DecisionHistoryEntry[]> => {
    const { data, error } = await supabase.from('trade_evaluation').select('*, trade:trade_id(*)').order('evaluated_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as DecisionHistoryEntry[];
  },
};

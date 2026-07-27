import { supabase } from '../lib/supabase';
import type { SimilarityResponse, SimilarityEnvironment, SimilarityHistoryEntry } from './types';

export const similarityService = {
  compareCurrent: async (projectId: string, env: SimilarityEnvironment): Promise<SimilarityResponse> => {
    const { data, error } = await supabase.rpc('find_similar_trades', {
      p_project_id: projectId,
      p_pair: env.pair ?? null,
      p_direction: env.direction ?? null,
      p_weekly_bias: env.weekly_bias ?? null,
      p_daily_bias: env.daily_bias ?? null,
      p_limit: 10,
    });
    if (error) throw error;
    return { matches: (data ?? []) as any[], summary: { total_matches: ((data ?? []) as any[]).length } } as any;
  },

  compareTrade: async (projectId: string, tradeId: string): Promise<SimilarityResponse> => {
    const { data: trade } = await supabase.from('trade').select('pair, direction, weekly_bias, daily_bias').eq('id', tradeId).single();
    if (!trade) throw new Error('Trade not found');
    const { data, error } = await supabase.rpc('find_similar_trades', {
      p_project_id: projectId, p_pair: trade.pair, p_direction: trade.direction,
      p_weekly_bias: trade.weekly_bias, p_daily_bias: trade.daily_bias, p_limit: 10,
    });
    if (error) throw error;
    return { matches: (data ?? []) as any[], summary: { total_matches: ((data ?? []) as any[]).length } } as any;
  },

  comparePattern: async (projectId: string, patternId: string): Promise<SimilarityResponse> => {
    const { data: pattern } = await supabase.from('pattern').select('signature').eq('id', patternId).single();
    if (!pattern) throw new Error('Pattern not found');
    const sig = pattern.signature as Record<string, string> | null;
    const { data, error } = await supabase.rpc('find_similar_trades', {
      p_project_id: projectId, p_pair: sig?.pair ?? null, p_direction: sig?.direction ?? null,
      p_weekly_bias: sig?.weekly_bias ?? null, p_daily_bias: sig?.daily_bias ?? null, p_limit: 10,
    });
    if (error) throw error;
    return { matches: (data ?? []) as any[], summary: { total_matches: ((data ?? []) as any[]).length } } as any;
  },

  history: async (projectId: string, limit: number = 50): Promise<SimilarityHistoryEntry[]> => {
    const { data, error } = await supabase.from('trade_memory')
      .select('id, trade_id, summary, confidence, similarity_score, created_at')
      .eq('project_id', projectId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((d: any) => ({ id: d.id, trade_id: d.trade_id, query: d.summary || '', results: [], confidence: d.confidence, created_at: d.created_at })) as SimilarityHistoryEntry[];
  },
};

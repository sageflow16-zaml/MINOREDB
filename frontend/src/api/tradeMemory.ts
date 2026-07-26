import { supabase } from '../lib/supabase';
import type { TradeMemory } from './types';

export const tradeMemoryService = {
  list: async (projectId: string): Promise<TradeMemory[]> => {
    const { data, error } = await supabase
      .from('trade_memory')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as TradeMemory[];
  },

  get: async (projectId: string, tradeId: string): Promise<TradeMemory> => {
    const { data, error } = await supabase
      .from('trade_memory')
      .select('*')
      .eq('trade_id', tradeId)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as TradeMemory;
  },
};

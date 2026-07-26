import { supabase } from '../lib/supabase';
import type { TradeRead, TradeCreate, TradeUpdate } from './types';

export const tradeService = {
  list: async (projectId: string): Promise<TradeRead[]> => {
    const { data, error } = await supabase
      .from('trade')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return (data ?? []) as TradeRead[];
  },

  get: async (projectId: string, id: string): Promise<TradeRead> => {
    const { data, error } = await supabase
      .from('trade')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data as TradeRead;
  },

  create: async (projectId: string, data: TradeCreate): Promise<TradeRead> => {
    const { data: row, error } = await supabase
      .from('trade')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();

    if (error) throw error;
    return row as TradeRead;
  },

  update: async (projectId: string, id: string, data: TradeUpdate): Promise<TradeRead> => {
    const { data: row, error } = await supabase
      .from('trade')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return row as TradeRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('trade')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) throw error;
  },
};

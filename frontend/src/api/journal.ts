import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';

export const journalService = {
  create: async (params: {
    project_id: string;
    trade_id: string;
    entry?: string;
    exit_notes?: string;
    emotional_state?: string;
    lessons_learned?: string;
    mistakes_identified?: string;
    improvements?: string;
    tags?: string[];
    is_ai_generated?: boolean;
  }) => {
    const { data, error } = await supabase.from('journal_entry').insert(params).select().single();
    if (error) throw error;
    return data;
  },

  list: async (projectId: string, params?: { tradeId?: string; limit?: number; offset?: number }) => {
    let query = supabase.from('journal_entry').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (params?.tradeId) query = query.eq('trade_id', params.tradeId);
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    query = query.range(offset, offset + limit - 1).limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  getById: async (projectId: string, id: string) => {
    const { data, error } = await supabase.from('journal_entry').select('*').eq('id', id).eq('project_id', projectId).single();
    if (error) throw error;
    return data;
  },

  update: async (projectId: string, id: string, params: Record<string, unknown>) => {
    const { data, error } = await supabase.from('journal_entry').update(params).eq('id', id).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (projectId: string, id: string) => {
    const { error } = await supabase.from('journal_entry').delete().eq('id', id).eq('project_id', projectId);
    if (error) throw error;
  },

  generate: (projectId: string, tradeId: string): Promise<{ data: Record<string, string> }> =>
    callEdgeFunction('ai', { operation: 'generate-journal', project_id: projectId, data: { trade_id: tradeId } }),
};

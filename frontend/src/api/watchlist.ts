import { supabase } from '../lib/supabase';

export const watchlistService = {
  list: async (projectId: string) => {
    const { data, error } = await supabase.from('watchlist_item').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  create: async (projectId: string, params: { symbol: string; name?: string; notes?: string; priority?: string; alerts_enabled?: boolean }) => {
    const { data, error } = await supabase.from('watchlist_item').insert({ project_id: projectId, ...params }).select().single();
    if (error) throw error;
    return data;
  },

  update: async (projectId: string, id: string, params: Record<string, unknown>) => {
    const { data, error } = await supabase.from('watchlist_item').update(params).eq('id', id).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data;
  },

  remove: async (projectId: string, id: string) => {
    const { error } = await supabase.from('watchlist_item').delete().eq('id', id).eq('project_id', projectId);
    if (error) throw error;
  },

  reorder: async (projectId: string, ids: string[]) => {
    const updates = ids.map((id, index) => supabase.from('watchlist_item').update({ sort_order: index }).eq('id', id).eq('project_id', projectId));
    await Promise.all(updates);
  },
};

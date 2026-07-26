import { supabase } from '../lib/supabase';
import type { HypothesisRead } from './types';

export const hypothesisService = {
  list: async (projectId: string): Promise<HypothesisRead[]> => {
    const { data, error } = await supabase
      .from('hypothesis')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as HypothesisRead[];
  },

  get: async (projectId: string, id: string): Promise<HypothesisRead> => {
    const { data, error } = await supabase
      .from('hypothesis')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as HypothesisRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('hypothesis')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },
};

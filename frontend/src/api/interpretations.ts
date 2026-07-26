import { supabase } from '../lib/supabase';
import type { InterpretationRead } from './types';

export const interpretationService = {
  list: async (projectId: string): Promise<InterpretationRead[]> => {
    const { data, error } = await supabase
      .from('interpretation')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as InterpretationRead[];
  },

  get: async (projectId: string, id: string): Promise<InterpretationRead> => {
    const { data, error } = await supabase
      .from('interpretation')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as InterpretationRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('interpretation')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },
};

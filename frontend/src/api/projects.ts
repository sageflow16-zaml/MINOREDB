import { supabase } from '../lib/supabase';
import type { Project } from './types';

export const projectService = {
  list: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('project')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Project[];
  },

  get: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from('project')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data as Project;
  },

  create: async (data: { name: string; description?: string }): Promise<Project> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: row, error } = await supabase
      .from('project')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return row as Project;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const { data: row, error } = await supabase
      .from('project')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return row as Project;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('project')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

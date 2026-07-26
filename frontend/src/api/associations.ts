import { supabase } from '../lib/supabase';
import type { AssociationRead, AssociationCreate, AssociationUpdate } from './types';

export const associationService = {
  list: async (projectId: string): Promise<AssociationRead[]> => {
    const { data, error } = await supabase
      .from('association')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssociationRead[];
  },

  get: async (projectId: string, id: string): Promise<AssociationRead> => {
    const { data, error } = await supabase
      .from('association')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as AssociationRead;
  },

  create: async (projectId: string, data: AssociationCreate): Promise<AssociationRead> => {
    const { data: row, error } = await supabase
      .from('association')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as AssociationRead;
  },

  update: async (projectId: string, id: string, data: AssociationUpdate): Promise<AssociationRead> => {
    const { data: row, error } = await supabase
      .from('association')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as AssociationRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('association')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },
};

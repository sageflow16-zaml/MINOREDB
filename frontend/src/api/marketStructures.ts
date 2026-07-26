import { supabase } from '../lib/supabase';
import type { MarketStructureRead, MarketStructureCreate, MarketStructureUpdate } from './types';

export const marketStructureService = {
  list: async (projectId: string): Promise<MarketStructureRead[]> => {
    const { data, error } = await supabase
      .from('market_structure')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MarketStructureRead[];
  },

  get: async (projectId: string, id: string): Promise<MarketStructureRead> => {
    const { data, error } = await supabase
      .from('market_structure')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as MarketStructureRead;
  },

  create: async (projectId: string, data: MarketStructureCreate): Promise<MarketStructureRead> => {
    const { data: row, error } = await supabase
      .from('market_structure')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as MarketStructureRead;
  },

  update: async (projectId: string, id: string, data: MarketStructureUpdate): Promise<MarketStructureRead> => {
    const { data: row, error } = await supabase
      .from('market_structure')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as MarketStructureRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('market_structure')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },
};

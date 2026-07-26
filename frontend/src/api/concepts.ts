import { supabase } from '../lib/supabase';
import type { ConceptRead, ConceptCreate, ConceptUpdate, ClaimRead, InterpretationRead } from './types';

export const conceptService = {
  list: async (projectId: string): Promise<ConceptRead[]> => {
    const { data, error } = await supabase
      .from('concept')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ConceptRead[];
  },

  get: async (projectId: string, id: string): Promise<ConceptRead> => {
    const { data, error } = await supabase
      .from('concept')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as ConceptRead;
  },

  create: async (projectId: string, data: ConceptCreate): Promise<ConceptRead> => {
    const { data: row, error } = await supabase
      .from('concept')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as ConceptRead;
  },

  update: async (projectId: string, id: string, data: ConceptUpdate): Promise<ConceptRead> => {
    const { data: row, error } = await supabase
      .from('concept')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as ConceptRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('concept')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  claims: async (projectId: string, id: string): Promise<ClaimRead[]> => {
    const { data: associations, error: assocError } = await supabase
      .from('association')
      .select('claim_id')
      .eq('concept_id', id);
    if (assocError) throw assocError;
    if (!associations || associations.length === 0) return [];
    const claimIds = associations.map((a: { claim_id: string }) => a.claim_id);
    const { data: claims, error: cError } = await supabase
      .from('claim')
      .select('*')
      .in('id', claimIds)
      .is('deleted_at', null);
    if (cError) throw cError;
    return (claims ?? []) as ClaimRead[];
  },

  interpretations: async (projectId: string, id: string): Promise<InterpretationRead[]> => {
    const { data, error } = await supabase
      .from('interpretation')
      .select('*')
      .eq('concept_id', id)
      .eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as InterpretationRead[];
  },
};

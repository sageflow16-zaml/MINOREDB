import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ConflictRead, ConflictCreate, ConflictUpdate, ClaimRead } from './types';

export const conflictService = {
  list: async (projectId: string): Promise<ConflictRead[]> => {
    const { data, error } = await supabase
      .from('conflict')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ConflictRead[];
  },

  get: async (projectId: string, id: string): Promise<ConflictRead> => {
    const { data, error } = await supabase
      .from('conflict')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as ConflictRead;
  },

  create: async (projectId: string, data: ConflictCreate): Promise<ConflictRead> => {
    const { data: row, error } = await supabase
      .from('conflict')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as ConflictRead;
  },

  update: async (projectId: string, id: string, data: ConflictUpdate): Promise<ConflictRead> => {
    const { data: row, error } = await supabase
      .from('conflict')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as ConflictRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('conflict')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  claims: async (projectId: string, id: string): Promise<ClaimRead[]> => {
    const { data: ccs, error: ccError } = await supabase
      .from('claim_conflict')
      .select('claim_id')
      .eq('conflict_id', id);
    if (ccError) throw ccError;
    if (!ccs || ccs.length === 0) return [];
    const claimIds = ccs.map((cc: { claim_id: string }) => cc.claim_id);
    const { data: claims, error: cError } = await supabase
      .from('claim')
      .select('*')
      .in('id', claimIds)
      .is('deleted_at', null);
    if (cError) throw cError;
    return (claims ?? []) as ClaimRead[];
  },

  generateQuestion: async (projectId: string, conflictId: string) =>
    callEdgeFunction('ai', { operation: 'generate-question', project_id: projectId, data: { conflict_id: conflictId } }),
};

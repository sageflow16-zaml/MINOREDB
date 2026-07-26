import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ClaimRead, ClaimCreate, ClaimUpdate } from './types';

export const claimService = {
  list: async (projectId: string): Promise<ClaimRead[]> => {
    const { data, error } = await supabase
      .from('claim')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ClaimRead[];
  },

  get: async (projectId: string, id: string): Promise<ClaimRead> => {
    const { data, error } = await supabase
      .from('claim')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as ClaimRead;
  },

  create: async (projectId: string, data: ClaimCreate): Promise<ClaimRead> => {
    const { data: row, error } = await supabase
      .from('claim')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as ClaimRead;
  },

  update: async (projectId: string, id: string, data: ClaimUpdate): Promise<ClaimRead> => {
    const { data: row, error } = await supabase
      .from('claim')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as ClaimRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('claim')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  extractConcepts: async (projectId: string, claimId: string) =>
    callEdgeFunction('ai', { operation: 'extract-concepts', project_id: projectId, data: { claim_id: claimId } }),

  interpret: async (projectId: string, claimId: string) =>
    callEdgeFunction('ai', { operation: 'interpret', project_id: projectId, data: { claim_id: claimId } }),

  graph: async (projectId: string, claimId: string) => {
    const { data: claim } = await supabase.from('claim').select('*').eq('id', claimId).single();
    const { data: associations } = await supabase
      .from('association')
      .select('*, concept:concept_id(*)')
      .eq('claim_id', claimId);
    const conceptIds = (associations || []).map((a: any) => a.concept_id).filter(Boolean);
    const { data: concepts } = conceptIds.length > 0
      ? await supabase.from('concept').select('*').in('id', conceptIds)
      : { data: [] as any[] };
    const { data: claimConflicts } = await supabase
      .from('claim_conflict')
      .select('*, conflict:conflict_id(*)')
      .eq('claim_id', claimId);
    const conflicts = (claimConflicts || []).map((cc: any) => cc.conflict).filter(Boolean);
    const conflictIds = conflicts.map((c: any) => c.id);
    const { data: research_questions } = conflictIds.length > 0
      ? await supabase.from('research_question').select('*').in('conflict_id', conflictIds)
      : { data: [] as any[] };
    const questionIds = (research_questions || []).map((rq: any) => rq.id);
    const { data: hypotheses } = questionIds.length > 0
      ? await supabase.from('hypothesis').select('*').in('research_question_id', questionIds)
      : { data: [] as any[] };
    const { data: interpretation } = await supabase
      .from('interpretation')
      .select('*')
      .eq('project_id', projectId)
      .in('concept_id', conceptIds)
      .limit(1)
      .maybeSingle();
    return { claim, associations, concepts: concepts || [], conflicts, research_questions: research_questions || [], hypotheses: hypotheses || [], interpretation };
  },
};

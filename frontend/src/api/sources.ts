import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { SourceRead, SourceCreate, SourceUpdate } from './types';

export const sourceService = {
  list: async (projectId: string): Promise<SourceRead[]> => {
    const { data, error } = await supabase
      .from('source')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SourceRead[];
  },

  get: async (projectId: string, id: string): Promise<SourceRead> => {
    const { data, error } = await supabase
      .from('source')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as SourceRead;
  },

  create: async (projectId: string, data: SourceCreate): Promise<SourceRead> => {
    const { data: row, error } = await supabase
      .from('source')
      .insert({ ...data, project_id: projectId })
      .select()
      .single();
    if (error) throw error;
    return row as SourceRead;
  },

  update: async (projectId: string, id: string, data: SourceUpdate): Promise<SourceRead> => {
    const { data: row, error } = await supabase
      .from('source')
      .update(data)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();
    if (error) throw error;
    return row as SourceRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('source')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  upload: async (projectId: string, formData: FormData): Promise<SourceRead> => {
    const file = formData.get('file') as File;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${projectId}/${Date.now()}_${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from('sources')
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: row, error } = await supabase
      .from('source')
      .insert({ project_id: projectId, source_metadata: { file_path: filePath, original_name: file.name } })
      .select()
      .single();
    if (error) throw error;
    return row as SourceRead;
  },

  extractClaims: async (projectId: string, sourceId: string) =>
    callEdgeFunction('ai', { operation: 'extract-claims', project_id: projectId, data: { source_id: sourceId } }),

  detectConflicts: async (projectId: string, sourceId: string) =>
    callEdgeFunction('ai', { operation: 'detect-conflicts', project_id: projectId, data: { source_id: sourceId } }),
};

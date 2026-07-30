import { supabase } from '../lib/supabase';
import type { PlaybookRead, PlaybookCreate, PlaybookUpdate, PlaybookStep } from './types';

export const playbookService = {
  list: async (projectId: string, params?: { search?: string; status?: string; category?: string }): Promise<PlaybookRead[]> => {
    let query = supabase.from('playbook').select('*').eq('project_id', projectId);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.search) query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PlaybookRead[];
  },

  get: async (projectId: string, id: string): Promise<PlaybookRead> => {
    const { data, error } = await supabase.from('playbook').select('*').eq('id', id).eq('project_id', projectId).single();
    if (error) throw error;
    return data as PlaybookRead;
  },

  create: async (projectId: string, data: PlaybookCreate): Promise<PlaybookRead> => {
    const { data: row, error } = await supabase.from('playbook').insert({ ...data, project_id: projectId }).select().single();
    if (error) throw error;
    return row as PlaybookRead;
  },

  update: async (projectId: string, id: string, data: PlaybookUpdate): Promise<PlaybookRead> => {
    const { data: row, error } = await supabase.from('playbook').update(data).eq('id', id).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PlaybookRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase.from('playbook').delete().eq('id', id).eq('project_id', projectId);
    if (error) throw error;
  },

  addStep: async (projectId: string, id: string, step: PlaybookStep): Promise<PlaybookRead> => {
    const pb = await playbookService.get(projectId, id);
    const steps = [...(pb.steps || []), step];
    return playbookService.update(projectId, id, { steps } as PlaybookUpdate);
  },

  updateStep: async (projectId: string, id: string, stepId: string, updates: Partial<PlaybookStep>): Promise<PlaybookRead> => {
    const pb = await playbookService.get(projectId, id);
    const steps = (pb.steps || []).map((s) => (s.id === stepId ? { ...s, ...updates } : s));
    return playbookService.update(projectId, id, { steps } as PlaybookUpdate);
  },

  removeStep: async (projectId: string, id: string, stepId: string): Promise<PlaybookRead> => {
    const pb = await playbookService.get(projectId, id);
    const steps = (pb.steps || []).filter((s) => s.id !== stepId);
    return playbookService.update(projectId, id, { steps } as PlaybookUpdate);
  },

  reorderSteps: async (projectId: string, id: string, stepIds: string[]): Promise<PlaybookRead> => {
    const pb = await playbookService.get(projectId, id);
    const stepMap = new Map((pb.steps || []).map((s) => [s.id, s]));
    const steps = stepIds.map((sid) => stepMap.get(sid)).filter(Boolean) as PlaybookStep[];
    return playbookService.update(projectId, id, { steps } as PlaybookUpdate);
  },
};

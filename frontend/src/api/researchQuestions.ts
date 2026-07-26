import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { ResearchQuestionRead } from './types';

export const researchQuestionService = {
  list: async (projectId: string): Promise<ResearchQuestionRead[]> => {
    const { data, error } = await supabase
      .from('research_question')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ResearchQuestionRead[];
  },

  get: async (projectId: string, id: string): Promise<ResearchQuestionRead> => {
    const { data, error } = await supabase
      .from('research_question')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();
    if (error) throw error;
    return data as ResearchQuestionRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase
      .from('research_question')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  generateHypothesis: async (projectId: string, questionId: string) =>
    callEdgeFunction('ai', { operation: 'generate-hypothesis', project_id: projectId, data: { research_question_id: questionId } }),
};

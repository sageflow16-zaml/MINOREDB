import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  LearningEventRead,
  KnowledgeSnapshotRead,
} from './types';

export const learningService = {
  events: async (projectId: string, limit: number = 50): Promise<LearningEventRead[]> => {
    const { data, error } = await supabase
      .from('learning_event')
      .select('id, created_at, event_type, entity_type, entity_id, duration_ms, status, summary')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as LearningEventRead[];
  },

  snapshots: async (projectId: string, limit: number = 30): Promise<KnowledgeSnapshotRead[]> => {
    const { data, error } = await supabase
      .from('knowledge_snapshot')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as KnowledgeSnapshotRead[];
  },

  status: async (projectId: string) =>
    callEdgeFunction('ai', { operation: 'learning-status', project_id: projectId }),

  rebuild: async (projectId: string) =>
    callEdgeFunction('ai', { operation: 'rebuild-learning', project_id: projectId }),
};

export { learningService as learningApi };

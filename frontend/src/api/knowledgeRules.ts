import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { KnowledgeRule, TopKnowledgeRule } from './types';

export const knowledgeRuleService = {
  list: async (projectId: string): Promise<KnowledgeRule[]> => {
    const { data, error } = await supabase.from('knowledge_rule').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeRule[];
  },

  get: async (_projectId: string, id: string): Promise<KnowledgeRule> => {
    const { data, error } = await supabase.from('knowledge_rule').select('*').eq('id', id).single();
    if (error) throw error;
    return data as KnowledgeRule;
  },

  top: async (projectId: string): Promise<TopKnowledgeRule | null> => {
    const { data, error } = await supabase.from('knowledge_rule').select('id, title, confidence, win_rate, occurrences, avg_rr').eq('project_id', projectId).order('confidence', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as TopKnowledgeRule | null;
  },

  refresh: (projectId: string): Promise<{ rules_created: number }> =>
    callEdgeFunction('ai', { operation: 'refresh-knowledge-rules', project_id: projectId }),
};

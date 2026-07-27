import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  BrainAskResponse, BrainDashboard, BrainDecision, BrainCoaching,
  PersonalInsight, LearningObservation, TraderDNA, BrainMemory,
} from './types';

export interface BrainAskRequest {
  question: string; context?: Record<string, unknown>;
  include_steps?: string[]; skip_steps?: string[];
}
export interface BrainMemoryCreate {
  memory_type: string; key: string; title?: string;
  content?: Record<string, unknown>; text_content?: string;
  importance?: string; tags?: string[];
  source_entity_type?: string; source_entity_id?: string;
}
export interface BrainCoachingRequest {
  coaching_type?: string; period_start?: string; period_end?: string;
}
export interface SimilaritySearchRequest {
  pair?: string; direction?: string; session?: string;
  entry_model?: string; weekly_bias?: string; daily_bias?: string; limit?: number;
}

export const brainAsk = (projectId: string, data: BrainAskRequest): Promise<BrainAskResponse> =>
  callEdgeFunction('ai', { operation: 'ask', project_id: projectId, data: data as any });

export const getDNA = async (projectId: string): Promise<TraderDNA> => {
  const { data, error } = await supabase.from('ai_profile').select('*').eq('project_id', projectId).maybeSingle();
  if (error) throw error;
  return (data ?? {}) as unknown as TraderDNA;
};

export const refreshDNA = (projectId: string): Promise<TraderDNA> =>
  callEdgeFunction('ai', { operation: 'build-profile', project_id: projectId });

export const getBrainDashboard = async (projectId: string): Promise<BrainDashboard> => {
  const [insights, coaching, decisions, observations] = await Promise.all([
    supabase.from('ai_insight').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
    supabase.from('coaching_session').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5),
    supabase.from('brain_decision').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
    supabase.from('learning_observation').select('*').eq('project_id', projectId).eq('is_dismissed', false).order('created_at', { ascending: false }),
  ]);
  if (insights.error) throw insights.error;
  if (coaching.error) throw coaching.error;
  if (decisions.error) throw decisions.error;
  if (observations.error) throw observations.error;
  const allInsights = (insights.data ?? []) as PersonalInsight[];
  const allCoaching = (coaching.data ?? []) as BrainCoaching[];
  const allDecisions = (decisions.data ?? []) as BrainDecision[];
  const allObservations = (observations.data ?? []) as LearningObservation[];
  return {
    dna: null,
    recent_decisions: allDecisions,
    top_insights: allInsights,
    active_observations: allObservations,
    latest_coaching: allCoaching.length > 0 ? allCoaching[0] : null,
    memory_summary: { total: 0, by_type: {}, importance_distribution: {}, expired: 0, active: 0 },
    today_intelligence: { style: null, best_session: null, overall_score: 0, psychology_score: 0, risk_behavior: null, insights: [] },
  } as BrainDashboard;
};

export const createBrainMemory = async (projectId: string, data: BrainMemoryCreate): Promise<BrainMemory> => {
  const { data: row, error } = await supabase.from('brain_memory').insert({ project_id: projectId, ...data, tags: data.tags as any, content: data.content as any }).select().single();
  if (error) throw error;
  return row as unknown as BrainMemory;
};

export const searchBrainMemories = async (projectId: string, params?: Record<string, string>): Promise<BrainMemory[]> => {
  let query = supabase.from('brain_memory').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (params?.memory_type) query = query.eq('memory_type', params.memory_type);
  if (params?.importance) query = query.eq('importance', params.importance);
  if (params?.key) query = query.eq('key', params.key);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as BrainMemory[];
};

export const deleteBrainMemory = async (projectId: string, memoryId: string): Promise<void> => {
  const { error } = await supabase.from('brain_memory').delete().eq('id', memoryId).eq('project_id', projectId);
  if (error) throw error;
};

export const listDecisions = async (projectId: string, limit?: number): Promise<BrainDecision[]> => {
  let query = supabase.from('brain_decision').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as BrainDecision[];
};

export const getDecision = async (projectId: string, decisionId: string): Promise<BrainDecision> => {
  const { data, error } = await supabase.from('brain_decision').select('*').eq('id', decisionId).eq('project_id', projectId).single();
  if (error) throw error;
  return data as unknown as BrainDecision;
};

export const trackOutcome = async (projectId: string, decisionId: string, outcome: string, feedback?: string): Promise<void> => {
  const { error } = await supabase.from('brain_decision').update({ outcome, outcome_feedback: feedback }).eq('id', decisionId).eq('project_id', projectId);
  if (error) throw error;
};

export const searchBrainSimilarity = (projectId: string, _data: SimilaritySearchRequest): Promise<any> =>
  callEdgeFunction('ai', { operation: 'similarity-search', project_id: projectId, data: _data as any });

export const getInsights = async (projectId: string, limit?: number): Promise<PersonalInsight[]> => {
  let query = supabase.from('ai_insight').select('*').eq('project_id', projectId).eq('is_dismissed', false).order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PersonalInsight[];
};

export const generateInsights = (projectId: string): Promise<PersonalInsight[]> =>
  callEdgeFunction('ai', { operation: 'generate-insights', project_id: projectId });

export const dismissInsight = async (projectId: string, insightId: string): Promise<void> => {
  const { error } = await supabase.from('ai_insight').update({ is_dismissed: true }).eq('id', insightId).eq('project_id', projectId);
  if (error) throw error;
};

export const getObservations = async (projectId: string): Promise<LearningObservation[]> => {
  const { data, error } = await supabase.from('learning_observation').select('*').eq('project_id', projectId).eq('is_dismissed', false).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LearningObservation[];
};

export const detectObservations = (projectId: string): Promise<LearningObservation[]> =>
  callEdgeFunction('ai', { operation: 'detect-observations', project_id: projectId });

export const dismissObservation = async (projectId: string, observationId: string): Promise<void> => {
  const { error } = await supabase.from('learning_observation').update({ is_dismissed: true }).eq('id', observationId).eq('project_id', projectId);
  if (error) throw error;
};

export const generateCoaching = (projectId: string, data: BrainCoachingRequest): Promise<BrainCoaching> =>
  callEdgeFunction('ai', { operation: 'generate-coaching', project_id: projectId, data: data as any });

export const listCoachingSessions = async (projectId: string, coachingType?: string, limit?: number): Promise<BrainCoaching[]> => {
  let query = supabase.from('coaching_session').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
  if (coachingType) query = query.eq('session_type', coachingType);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as BrainCoaching[];
};

export const getLatestCoaching = async (projectId: string): Promise<BrainCoaching> => {
  const { data, error } = await supabase.from('coaching_session').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data ?? {}) as unknown as BrainCoaching;
};

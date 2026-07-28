import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  AIProfile,
  TradeEvaluation,
  KnowledgeLink,
  DetectedPattern,
  CoachingSession,
  AIInsight,
  AIRecommendation,
  AISummary,
  AIProviderConfig,
  AIDashboardData,
  KnowledgeGraphData,
} from './types';

export const aiFoundationService = {
  // Profile
  getProfile: async (projectId: string): Promise<AIProfile> => {
    const { data, error } = await supabase
      .from('ai_profile')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? {}) as AIProfile;
  },

  updateProfile: async (projectId: string, profile: Partial<AIProfile>): Promise<AIProfile> => {
    const { data, error } = await supabase
      .from('ai_profile')
      .upsert({ project_id: projectId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'project_id' })
      .select()
      .single();
    if (error) throw error;
    return data as AIProfile;
  },

  analyzeProfile: async (projectId: string): Promise<AIProfile> =>
    callEdgeFunction('ai', { operation: 'analyze-profile', project_id: projectId }),

  // Evaluations
  evaluateTrade: async (projectId: string, tradeId: string): Promise<TradeEvaluation> =>
    callEdgeFunction('ai', { operation: 'evaluate-trade', project_id: projectId, data: { trade_id: tradeId } }),

  getEvaluations: async (projectId: string, limit = 50): Promise<TradeEvaluation[]> => {
    const { data, error } = await supabase
      .from('trade_evaluation')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as TradeEvaluation[];
  },

  // Patterns
  detectPatterns: async (projectId: string): Promise<DetectedPattern[]> =>
    callEdgeFunction('ai', { operation: 'detect-patterns', project_id: projectId }),

  getPatterns: async (projectId: string, patternType?: string): Promise<DetectedPattern[]> => {
    let query = supabase.from('detected_pattern').select('*').eq('project_id', projectId);
    if (patternType) query = query.eq('pattern_type', patternType);
    const { data, error } = await query.order('last_detected_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DetectedPattern[];
  },

  // Knowledge Links
  createLink: async (projectId: string, link: { source_type: string; source_id: string; target_type: string; target_id: string; relationship: string }): Promise<KnowledgeLink> => {
    const { data, error } = await supabase
      .from('knowledge_link')
      .insert({ project_id: projectId, ...link })
      .select()
      .single();
    if (error) throw error;
    return data as KnowledgeLink;
  },

  getLinks: async (projectId: string, entityType?: string, entityId?: string): Promise<KnowledgeLink[]> => {
    let query = supabase.from('knowledge_link').select('*').eq('project_id', projectId);
    if (entityType && entityId) {
      query = query.or(
        `and(source_type.eq.${entityType},source_id.eq.${entityId}),and(target_type.eq.${entityType},target_id.eq.${entityId})`
      );
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeLink[];
  },

  deleteLink: async (projectId: string, linkId: string): Promise<void> => {
    const { error } = await supabase
      .from('knowledge_link')
      .delete()
      .eq('id', linkId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  autoLink: async (projectId: string): Promise<{ linked: number }> =>
    callEdgeFunction('ai', { operation: 'auto-link', project_id: projectId }),

  getGraph: async (projectId: string, entityType?: string, entityId?: string): Promise<KnowledgeGraphData> =>
    callEdgeFunction('ai', { operation: 'knowledge-graph', project_id: projectId, data: { entity_type: entityType, entity_id: entityId } }),

  // Insights
  generateInsights: async (projectId: string): Promise<AIInsight[]> =>
    callEdgeFunction('ai', { operation: 'generate-insights', project_id: projectId }),

  getInsights: async (projectId: string): Promise<AIInsight[]> => {
    const { data, error } = await supabase
      .from('ai_insight')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AIInsight[];
  },

  dismissInsight: async (projectId: string, insightId: string): Promise<void> => {
    const { error } = await supabase
      .from('ai_insight')
      .update({ is_dismissed: true })
      .eq('id', insightId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  // Recommendations
  generateRecommendations: async (projectId: string): Promise<AIRecommendation[]> =>
    callEdgeFunction('ai', { operation: 'generate-recommendations', project_id: projectId }),

  getRecommendations: async (projectId: string): Promise<AIRecommendation[]> => {
    const { data, error } = await supabase
      .from('ai_recommendation')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AIRecommendation[];
  },

  dismissRecommendation: async (projectId: string, recId: string): Promise<void> => {
    const { error } = await supabase
      .from('ai_recommendation')
      .update({ is_dismissed: true })
      .eq('id', recId)
      .eq('project_id', projectId);
    if (error) throw error;
  },

  // Coaching
  generateCoaching: async (projectId: string, sessionType = 'daily', date?: string): Promise<CoachingSession> =>
    callEdgeFunction('ai', { operation: 'generate-coaching', project_id: projectId, data: { session_type: sessionType, date } }),

  getCoaching: async (projectId: string, sessionType?: string): Promise<CoachingSession[]> => {
    let query = supabase.from('coaching_session').select('*').eq('project_id', projectId);
    if (sessionType) query = query.eq('session_type', sessionType);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CoachingSession[];
  },

  // Summaries
  createSummary: async (projectId: string, summary: { summary_type: string; content?: Record<string, unknown>; text_summary?: string }): Promise<AISummary> => {
    const { data, error } = await supabase
      .from('ai_summary')
      .insert({ project_id: projectId, ...summary })
      .select()
      .single();
    if (error) throw error;
    return data as AISummary;
  },

  getSummaries: async (projectId: string, summaryType?: string, period?: string): Promise<AISummary[]> => {
    let query = supabase.from('ai_summary').select('*').eq('project_id', projectId);
    if (summaryType) query = query.eq('summary_type', summaryType);
    if (period) query = query.eq('period_start', period);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AISummary[];
  },

  generatePerformanceSummary: async (projectId: string): Promise<AISummary> =>
    callEdgeFunction('ai', { operation: 'generate-performance-summary', project_id: projectId }),

  // Context
  buildContext: async (projectId: string, options?: Record<string, unknown>): Promise<Record<string, unknown>> =>
    callEdgeFunction('ai', { operation: 'build-context', project_id: projectId, data: options ?? {} }),

  // Providers (no project_id)
  getProviders: async (): Promise<AIProviderConfig[]> => {
    const { data, error } = await supabase
      .from('ai_provider_config')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AIProviderConfig[];
  },

  getDefaultProvider: async (): Promise<AIProviderConfig> => {
    const { data, error } = await supabase
      .from('ai_provider_config')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();
    if (error) throw error;
    return (data ?? {}) as AIProviderConfig;
  },

  createProvider: async (provider: Partial<AIProviderConfig>): Promise<AIProviderConfig> => {
    const { data, error } = await supabase
      .from('ai_provider_config')
      .insert(provider)
      .select()
      .single();
    if (error) throw error;
    return data as AIProviderConfig;
  },

  updateProvider: async (providerId: string, provider: Partial<AIProviderConfig>): Promise<AIProviderConfig> => {
    const { data, error } = await supabase
      .from('ai_provider_config')
      .update(provider)
      .eq('id', providerId)
      .select()
      .single();
    if (error) throw error;
    return data as AIProviderConfig;
  },

  deleteProvider: async (providerId: string): Promise<void> => {
    const { error } = await supabase
      .from('ai_provider_config')
      .delete()
      .eq('id', providerId);
    if (error) throw error;
  },

  // Dashboard
  getDashboard: async (projectId: string): Promise<AIDashboardData> => {
    const [profile, insights, coaching, recommendations, patterns] = await Promise.all([
      supabase.from('ai_profile').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('ai_insight').select('*').eq('project_id', projectId).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('coaching_session').select('*').eq('project_id', projectId).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('ai_recommendation').select('*').eq('project_id', projectId).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('detected_pattern').select('*').eq('project_id', projectId).eq('is_active', true).order('confidence', { ascending: false }).limit(10),
    ]);

    return {
      profile: (profile.data ?? undefined) as AIProfile | undefined,
      latest_insights: (insights.data ?? []) as AIInsight[],
      coaching_cards: (coaching.data ?? []) as CoachingSession[],
      recommendations: (recommendations.data ?? []) as AIRecommendation[],
      detected_patterns: (patterns.data ?? []) as DetectedPattern[],
      recent_improvements: [],
      areas_to_improve: [],
    } as AIDashboardData;
  },
};

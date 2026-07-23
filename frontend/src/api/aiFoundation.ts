import api from '../services/api';
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

const base = (projectId: string) => `/projects/${projectId}/ai`;

export const aiFoundationService = {
  // Profile
  getProfile: (projectId: string) =>
    api.get<AIProfile>(`${base(projectId)}/profile`).then((r) => r.data),
  updateProfile: (projectId: string, data: Partial<AIProfile>) =>
    api.put<AIProfile>(`${base(projectId)}/profile`, data).then((r) => r.data),
  analyzeProfile: (projectId: string) =>
    api.post<AIProfile>(`${base(projectId)}/profile/analyze`).then((r) => r.data),

  // Evaluations
  evaluateTrade: (projectId: string, tradeId: string) =>
    api.post<TradeEvaluation>(`${base(projectId)}/evaluate/${tradeId}`).then((r) => r.data),
  getEvaluations: (projectId: string, limit = 50) =>
    api.get<TradeEvaluation[]>(`${base(projectId)}/evaluations?limit=${limit}`).then((r) => r.data),

  // Patterns
  detectPatterns: (projectId: string) =>
    api.post<DetectedPattern[]>(`${base(projectId)}/patterns/detect`).then((r) => r.data),
  getPatterns: (projectId: string, patternType?: string) =>
    api.get<DetectedPattern[]>(`${base(projectId)}/patterns${patternType ? `?pattern_type=${patternType}` : ''}`).then((r) => r.data),

  // Knowledge Links
  createLink: (projectId: string, data: { source_type: string; source_id: string; target_type: string; target_id: string; relationship: string }) =>
    api.post<KnowledgeLink>(`${base(projectId)}/knowledge/links`, data).then((r) => r.data),
  getLinks: (projectId: string, entityType?: string, entityId?: string) =>
    api.get<KnowledgeLink[]>(`${base(projectId)}/knowledge/links${entityType ? `?entity_type=${entityType}&entity_id=${entityId}` : ''}`).then((r) => r.data),
  deleteLink: (projectId: string, linkId: string) =>
    api.delete(`${base(projectId)}/knowledge/links/${linkId}`).then((r) => r.data),
  autoLink: (projectId: string) =>
    api.post<{ linked: number }>(`${base(projectId)}/knowledge/auto-link`).then((r) => r.data),
  getGraph: (projectId: string, entityType?: string, entityId?: string) =>
    api.get<KnowledgeGraphData>(`${base(projectId)}/knowledge/graph${entityType ? `?entity_type=${entityType}&entity_id=${entityId}` : ''}`).then((r) => r.data),

  // Insights
  generateInsights: (projectId: string) =>
    api.post<AIInsight[]>(`${base(projectId)}/insights/generate`).then((r) => r.data),
  getInsights: (projectId: string) =>
    api.get<AIInsight[]>(`${base(projectId)}/insights`).then((r) => r.data),
  dismissInsight: (projectId: string, insightId: string) =>
    api.put(`${base(projectId)}/insights/${insightId}/dismiss`).then((r) => r.data),

  // Recommendations
  generateRecommendations: (projectId: string) =>
    api.post<AIRecommendation[]>(`${base(projectId)}/recommendations/generate`).then((r) => r.data),
  getRecommendations: (projectId: string) =>
    api.get<AIRecommendation[]>(`${base(projectId)}/recommendations`).then((r) => r.data),
  dismissRecommendation: (projectId: string, recId: string) =>
    api.put(`${base(projectId)}/recommendations/${recId}/dismiss`).then((r) => r.data),

  // Coaching
  generateCoaching: (projectId: string, sessionType = 'daily', date?: string) =>
    api.post<CoachingSession>(`${base(projectId)}/coaching/generate?session_type=${sessionType}${date ? `&date=${date}` : ''}`).then((r) => r.data),
  getCoaching: (projectId: string, sessionType?: string) =>
    api.get<CoachingSession[]>(`${base(projectId)}/coaching${sessionType ? `?session_type=${sessionType}` : ''}`).then((r) => r.data),

  // Summaries
  createSummary: (projectId: string, data: { summary_type: string; content?: Record<string, unknown>; text_summary?: string }) =>
    api.post<AISummary>(`${base(projectId)}/summaries`, data).then((r) => r.data),
  getSummaries: (projectId: string, summaryType?: string, period?: string) =>
    api.get<AISummary[]>(`${base(projectId)}/summaries${summaryType ? `?summary_type=${summaryType}` : ''}${period ? `&period=${period}` : ''}`).then((r) => r.data),
  generatePerformanceSummary: (projectId: string) =>
    api.post<AISummary>(`${base(projectId)}/summaries/performance`).then((r) => r.data),

  // Context
  buildContext: (projectId: string, options?: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`${base(projectId)}/context`, options || {}).then((r) => r.data),

  // Providers
  getProviders: () =>
    api.get<AIProviderConfig[]>('/ai/providers').then((r) => r.data),
  getDefaultProvider: () =>
    api.get<AIProviderConfig>('/ai/providers/default').then((r) => r.data),
  createProvider: (data: Partial<AIProviderConfig>) =>
    api.post<AIProviderConfig>('/ai/providers', data).then((r) => r.data),
  updateProvider: (providerId: string, data: Partial<AIProviderConfig>) =>
    api.put<AIProviderConfig>(`/ai/providers/${providerId}`, data).then((r) => r.data),
  deleteProvider: (providerId: string) =>
    api.delete(`/ai/providers/${providerId}`).then((r) => r.data),

  // Dashboard
  getDashboard: (projectId: string) =>
    api.get<AIDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),
};

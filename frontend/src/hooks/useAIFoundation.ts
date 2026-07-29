import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiFoundationService } from '../api/aiFoundation';
import { createEvent, eventBus } from '../lib/ai/eventBus';

// ── Profile ──

export const useAIProfile = (projectId: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'profile'],
    queryFn: () => aiFoundationService.getProfile(projectId),
    enabled: !!projectId,
  });
};

export const useUpdateAIProfile = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => aiFoundationService.updateProfile(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'profile'] }),
  });
};

export const useAnalyzeProfile = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.analyzeProfile(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', projectId, 'profile'] });
      eventBus.emit(createEvent('PROFILE_ANALYZED', projectId, {}));
    },
  });
};

// ── Evaluations ──

export const useEvaluateTrade = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tradeId: string) => aiFoundationService.evaluateTrade(projectId, tradeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'evaluations'] }),
  });
};

export const useEvaluations = (projectId: string, limit = 50) => {
  return useQuery({
    queryKey: ['ai', projectId, 'evaluations', limit],
    queryFn: () => aiFoundationService.getEvaluations(projectId, limit),
    enabled: !!projectId,
  });
};

// ── Patterns ──

export const useDetectPatterns = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.detectPatterns(projectId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai', projectId, 'patterns'] });
      const patterns = Array.isArray(data) ? data : [];
      eventBus.emit(createEvent('PATTERN_DETECTED', projectId, {
        patternCount: patterns.length,
        negativePatterns: patterns.filter((p: any) => p?.pattern_type === 'negative' || p?.confidence < 40).length,
        confidence: patterns.reduce((s: number, p: any) => s + (p?.confidence || 0), 0) / (patterns.length || 1),
      }));
    },
  });
};

export const usePatterns = (projectId: string, patternType?: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'patterns', patternType],
    queryFn: () => aiFoundationService.getPatterns(projectId, patternType),
    enabled: !!projectId,
  });
};

// ── Knowledge Links ──

export const useCreateKnowledgeLink = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { source_type: string; source_id: string; target_type: string; target_id: string; relationship: string }) =>
      aiFoundationService.createLink(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'knowledge'] }),
  });
};

export const useKnowledgeLinks = (projectId: string, entityType?: string, entityId?: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'knowledge', entityType, entityId],
    queryFn: () => aiFoundationService.getLinks(projectId, entityType, entityId),
    enabled: !!projectId,
  });
};

export const useDeleteKnowledgeLink = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => aiFoundationService.deleteLink(projectId, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'knowledge'] }),
  });
};

export const useAutoLink = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.autoLink(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'knowledge'] }),
  });
};

export const useKnowledgeGraph = (projectId: string, entityType?: string, entityId?: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'graph', entityType, entityId],
    queryFn: () => aiFoundationService.getGraph(projectId, entityType, entityId),
    enabled: !!projectId,
  });
};

// ── Insights ──

export const useGenerateInsights = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.generateInsights(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'insights'] }),
  });
};

export const useInsights = (projectId: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'insights'],
    queryFn: () => aiFoundationService.getInsights(projectId),
    enabled: !!projectId,
  });
};

export const useDismissInsight = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) => aiFoundationService.dismissInsight(projectId, insightId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'insights'] }),
  });
};

// ── Recommendations ──

export const useGenerateRecommendations = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.generateRecommendations(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'recommendations'] }),
  });
};

export const useRecommendations = (projectId: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'recommendations'],
    queryFn: () => aiFoundationService.getRecommendations(projectId),
    enabled: !!projectId,
  });
};

export const useDismissRecommendation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recId: string) => aiFoundationService.dismissRecommendation(projectId, recId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'recommendations'] }),
  });
};

// ── Coaching ──

export const useGenerateCoaching = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionType, date }: { sessionType?: string; date?: string }) =>
      aiFoundationService.generateCoaching(projectId, sessionType, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'coaching'] }),
  });
};

export const useCoachingSessions = (projectId: string, sessionType?: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'coaching', sessionType],
    queryFn: () => aiFoundationService.getCoaching(projectId, sessionType),
    enabled: !!projectId,
  });
};

// ── Summaries ──

export const useCreateSummary = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { summary_type: string; content?: Record<string, unknown>; text_summary?: string }) =>
      aiFoundationService.createSummary(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'summaries'] }),
  });
};

export const useSummaries = (projectId: string, summaryType?: string, period?: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'summaries', summaryType, period],
    queryFn: () => aiFoundationService.getSummaries(projectId, summaryType, period),
    enabled: !!projectId,
  });
};

export const usePerformanceSummary = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiFoundationService.generatePerformanceSummary(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', projectId, 'summaries'] }),
  });
};

// ── Context ──

export const useBuildContext = (projectId: string) => {
  return useMutation({
    mutationFn: (options?: Record<string, unknown>) => aiFoundationService.buildContext(projectId, options),
  });
};

// ── Providers ──

export const useProviders = () => {
  return useQuery({
    queryKey: ['ai', 'providers'],
    queryFn: () => aiFoundationService.getProviders(),
  });
};

export const useDefaultProvider = () => {
  return useQuery({
    queryKey: ['ai', 'providers', 'default'],
    queryFn: () => aiFoundationService.getDefaultProvider(),
  });
};

export const useCreateProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => aiFoundationService.createProvider(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'providers'] }),
  });
};

export const useUpdateProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      aiFoundationService.updateProvider(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'providers'] }),
  });
};

export const useDeleteProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiFoundationService.deleteProvider(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'providers'] }),
  });
};

// ── Dashboard ──

export const useAIDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['ai', projectId, 'dashboard'],
    queryFn: () => aiFoundationService.getDashboard(projectId),
    enabled: !!projectId,
  });
};

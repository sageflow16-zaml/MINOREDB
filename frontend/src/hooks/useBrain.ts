import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as brainApi from '../api/brain';
import type { BrainAskRequest, BrainCoachingRequest, SimilaritySearchRequest, BrainMemoryCreate } from '../api/brain';

// ── Keys ──
const brainKeys = {
  all: (pid: string) => ['brain', pid] as const,
  dna: (pid: string) => ['brain', pid, 'dna'] as const,
  dashboard: (pid: string) => ['brain', pid, 'dashboard'] as const,
  decisions: (pid: string) => ['brain', pid, 'decisions'] as const,
  decision: (pid: string, id: string) => ['brain', pid, 'decisions', id] as const,
  insights: (pid: string) => ['brain', pid, 'insights'] as const,
  observations: (pid: string) => ['brain', pid, 'observations'] as const,
  coaching: (pid: string) => ['brain', pid, 'coaching'] as const,
  coachingLatest: (pid: string) => ['brain', pid, 'coaching', 'latest'] as const,
  memories: (pid: string) => ['brain', pid, 'memories'] as const,
};

// ── DNA ──

export const useDNA = (projectId: string) =>
  useQuery({
    queryKey: brainKeys.dna(projectId),
    queryFn: () => brainApi.getDNA(projectId),
    enabled: !!projectId,
  });

export const useRefreshDNA = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => brainApi.refreshDNA(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.dna(projectId) }),
  });
};

// ── Dashboard ──

export const useBrainDashboard = (projectId: string) =>
  useQuery({
    queryKey: brainKeys.dashboard(projectId),
    queryFn: () => brainApi.getBrainDashboard(projectId),
    enabled: !!projectId,
  });

// ── Ask ──

export const useBrainAsk = (projectId: string) =>
  useMutation<import('../api/types').BrainAskResponse, Error, BrainAskRequest>({
    mutationFn: (data: BrainAskRequest) => brainApi.brainAsk(projectId, data),
  });

// ── Decisions ──

export const useDecisions = (projectId: string, limit?: number) =>
  useQuery({
    queryKey: brainKeys.decisions(projectId),
    queryFn: () => brainApi.listDecisions(projectId, limit),
    enabled: !!projectId,
  });

export const useDecision = (projectId: string, decisionId: string) =>
  useQuery({
    queryKey: brainKeys.decision(projectId, decisionId),
    queryFn: () => brainApi.getDecision(projectId, decisionId),
    enabled: !!projectId && !!decisionId,
  });

export const useTrackOutcome = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ decisionId, outcome, feedback }: { decisionId: string; outcome: string; feedback?: string }) =>
      brainApi.trackOutcome(projectId, decisionId, outcome, feedback),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.decisions(projectId) }),
  });
};

// ── Insights ──

export const useBrainInsights = (projectId: string, limit?: number) =>
  useQuery({
    queryKey: brainKeys.insights(projectId),
    queryFn: () => brainApi.getInsights(projectId, limit),
    enabled: !!projectId,
  });

export const useGenerateBrainInsights = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => brainApi.generateInsights(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.insights(projectId) }),
  });
};

export const useDismissBrainInsight = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) => brainApi.dismissInsight(projectId, insightId),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.insights(projectId) }),
  });
};

// ── Observations ──

export const useObservations = (projectId: string) =>
  useQuery({
    queryKey: brainKeys.observations(projectId),
    queryFn: () => brainApi.getObservations(projectId),
    enabled: !!projectId,
  });

export const useDetectObservations = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => brainApi.detectObservations(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.observations(projectId) }),
  });
};

export const useDismissObservation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (observationId: string) => brainApi.dismissObservation(projectId, observationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: brainKeys.observations(projectId) }),
  });
};

// ── Coaching ──

export const useCoachingSessions = (projectId: string, coachingType?: string, limit?: number) =>
  useQuery({
    queryKey: brainKeys.coaching(projectId),
    queryFn: () => brainApi.listCoachingSessions(projectId, coachingType, limit),
    enabled: !!projectId,
  });

export const useLatestCoaching = (projectId: string) =>
  useQuery({
    queryKey: brainKeys.coachingLatest(projectId),
    queryFn: () => brainApi.getLatestCoaching(projectId),
    enabled: !!projectId,
  });

export const useGenerateCoaching = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BrainCoachingRequest) => brainApi.generateCoaching(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brainKeys.coaching(projectId) });
      qc.invalidateQueries({ queryKey: brainKeys.coachingLatest(projectId) });
    },
  });
};

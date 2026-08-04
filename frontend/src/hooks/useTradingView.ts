import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradingviewService } from '../api/tradingview';

export const TV_KEYS = {
  all: ['tradingview'] as const,
  events: (projectId: string, params?: { limit?: number; symbol?: string; timeframe?: string; event_type?: string }) =>
    [...TV_KEYS.all, 'events', projectId, params] as const,
  event: (id: string) => [...TV_KEYS.all, 'event', id] as const,
  logs: (projectId: string, limit?: number) => [...TV_KEYS.all, 'logs', projectId, { limit }] as const,
  stats: (projectId: string) => [...TV_KEYS.all, 'stats', projectId] as const,
  secret: (projectId: string) => [...TV_KEYS.all, 'secret', projectId] as const,
};

export const useTVEvents = (projectId: string, params?: { limit?: number; symbol?: string; timeframe?: string; event_type?: string }) =>
  useQuery({
    queryKey: TV_KEYS.events(projectId, params),
    queryFn: () => tradingviewService.events(projectId, params),
    enabled: !!projectId,
  });

export const useTVEvent = (id: string) =>
  useQuery({
    queryKey: TV_KEYS.event(id),
    queryFn: () => tradingviewService.event(id),
    enabled: !!id,
  });

export const useTVLogs = (projectId: string, limit?: number) =>
  useQuery({
    queryKey: TV_KEYS.logs(projectId, limit),
    queryFn: () => tradingviewService.logs(projectId, limit),
    enabled: !!projectId,
  });

export const useTVStats = (projectId: string) =>
  useQuery({
    queryKey: TV_KEYS.stats(projectId),
    queryFn: () => tradingviewService.stats(projectId),
    enabled: !!projectId,
  });

export const useTVWebhookSecret = (projectId: string) =>
  useQuery({
    queryKey: TV_KEYS.secret(projectId),
    queryFn: () => tradingviewService.getWebhookSecret(projectId),
    enabled: !!projectId,
  });

export const useTVRotateSecret = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tradingviewService.rotateWebhookSecret(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TV_KEYS.secret(projectId) }),
  });
};

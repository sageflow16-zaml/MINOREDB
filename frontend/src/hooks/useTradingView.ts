import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tradingviewService } from '../api/tradingview';

export const TV_KEYS = {
  all: ['tradingview'] as const,
  events: (params?: { limit?: number; symbol?: string; timeframe?: string; event_type?: string }) =>
    [...TV_KEYS.all, 'events', params] as const,
  event: (id: string) => [...TV_KEYS.all, 'event', id] as const,
  logs: (limit?: number) => [...TV_KEYS.all, 'logs', { limit }] as const,
  stats: () => [...TV_KEYS.all, 'stats'] as const,
};

export const useTVEvents = (params?: { limit?: number; symbol?: string; timeframe?: string; event_type?: string }) =>
  useQuery({
    queryKey: TV_KEYS.events(params),
    queryFn: () => tradingviewService.events(params),
  });

export const useTVEvent = (id: string) =>
  useQuery({
    queryKey: TV_KEYS.event(id),
    queryFn: () => tradingviewService.event(id),
    enabled: !!id,
  });

export const useTVLogs = (limit?: number) =>
  useQuery({
    queryKey: TV_KEYS.logs(limit),
    queryFn: () => tradingviewService.logs(limit),
  });

export const useTVStats = () =>
  useQuery({
    queryKey: TV_KEYS.stats(),
    queryFn: () => tradingviewService.stats(),
  });

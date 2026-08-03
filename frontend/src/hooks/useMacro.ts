import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { macroService } from '../api/macro';

export const MACRO_KEYS = {
  all: ['macro'] as const,
  snapshot: (projectId?: string) => [...MACRO_KEYS.all, 'snapshot', projectId] as const,
  events: (projectId?: string, limit?: number, importance?: string) => [...MACRO_KEYS.all, 'events', projectId, { limit, importance }] as const,
  calendar: (projectId?: string) => [...MACRO_KEYS.all, 'calendar', projectId] as const,
  state: (projectId?: string) => [...MACRO_KEYS.all, 'state', projectId] as const,
};

export const useMacroSnapshot = (projectId?: string) =>
  useQuery({
    queryKey: MACRO_KEYS.snapshot(projectId),
    queryFn: () => macroService.snapshot(projectId!),
    enabled: !!projectId,
  });

export const useMacroEvents = (projectId?: string, limit?: number, importance?: string) =>
  useQuery({
    queryKey: MACRO_KEYS.events(projectId, limit, importance),
    queryFn: () => macroService.events(projectId!, limit, importance),
    enabled: !!projectId,
  });

export const useMacroCalendar = (projectId?: string) =>
  useQuery({
    queryKey: MACRO_KEYS.calendar(projectId),
    queryFn: () => macroService.calendar(projectId!),
    enabled: !!projectId,
  });

export const useMacroState = (projectId?: string) =>
  useQuery({
    queryKey: MACRO_KEYS.state(projectId),
    queryFn: () => macroService.state(projectId!),
    enabled: !!projectId,
  });

export const useMacroRefresh = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => macroService.refresh(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACRO_KEYS.all });
    },
  });
};

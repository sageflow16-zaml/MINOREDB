import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { macroService } from '../api/macro';

export const MACRO_KEYS = {
  all: ['macro'] as const,
  snapshot: () => [...MACRO_KEYS.all, 'snapshot'] as const,
  events: (limit?: number, importance?: string) => [...MACRO_KEYS.all, 'events', { limit, importance }] as const,
  calendar: () => [...MACRO_KEYS.all, 'calendar'] as const,
  state: () => [...MACRO_KEYS.all, 'state'] as const,
};

export const useMacroSnapshot = () =>
  useQuery({
    queryKey: MACRO_KEYS.snapshot(),
    queryFn: () => macroService.snapshot(),
  });

export const useMacroEvents = (limit?: number, importance?: string) =>
  useQuery({
    queryKey: MACRO_KEYS.events(limit, importance),
    queryFn: () => macroService.events(limit, importance),
  });

export const useMacroCalendar = () =>
  useQuery({
    queryKey: MACRO_KEYS.calendar(),
    queryFn: () => macroService.calendar(),
  });

export const useMacroState = () =>
  useQuery({
    queryKey: MACRO_KEYS.state(),
    queryFn: () => macroService.state(),
  });

export const useMacroRefresh = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => macroService.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACRO_KEYS.all });
    },
  });
};

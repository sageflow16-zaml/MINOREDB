import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mt5Service } from '../api/mt5';
import type { MT5ConnectRequest } from '../api/types';

export const MT5_KEYS = {
  all: ['mt5'] as const,
  status: () => [...MT5_KEYS.all, 'status'] as const,
  logs: (limit?: number) => [...MT5_KEYS.all, 'logs', { limit }] as const,
};

export const useMT5Status = () =>
  useQuery({
    queryKey: MT5_KEYS.status(),
    queryFn: () => mt5Service.status(),
  });

export const useMT5Logs = (limit?: number) =>
  useQuery({
    queryKey: MT5_KEYS.logs(limit),
    queryFn: () => mt5Service.logs(limit),
  });

export const useMT5Connect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: MT5ConnectRequest) => mt5Service.connect(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MT5_KEYS.all });
    },
  });
};

export const useMT5Disconnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mt5Service.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MT5_KEYS.all });
    },
  });
};

export const useMT5Sync = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mode: string) => mt5Service.sync(projectId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MT5_KEYS.all });
    },
  });
};

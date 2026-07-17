import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorService, type CollectorStatus } from '../api';
import toast from 'react-hot-toast';

export const useCollectors = (projectId: string) => {
  return useQuery({
    queryKey: ['collectors', projectId],
    queryFn: () => collectorService.list(projectId),
  });
};

export const useCollectorStatuses = (projectId: string) => {
  return useQuery({
    queryKey: ['collectors', projectId, 'status'],
    queryFn: () => collectorService.status(projectId),
  });
};

export const useRunCollector = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => collectorService.run(projectId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectors', projectId] });
      queryClient.invalidateQueries({ queryKey: ['collectors', projectId, 'status'] });
      queryClient.invalidateQueries({ queryKey: ['collectors', projectId, 'logs'] });
      toast.success(`${data.collector_name}: ${data.status} (${data.records_collected} records)`);
    },
    onError: () => toast.error('Failed to run collector'),
  });
};

export const useToggleCollector = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      collectorService.toggle(projectId, name, enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectors', projectId] });
      queryClient.invalidateQueries({ queryKey: ['collectors', projectId, 'status'] });
      toast.success(`${data.name} ${data.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: () => toast.error('Failed to toggle collector'),
  });
};

export const useCollectorLogs = (projectId: string, limit = 50) => {
  return useQuery({
    queryKey: ['collectors', projectId, 'logs', limit],
    queryFn: () => collectorService.logs(projectId, limit),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategyService } from '../api/strategies';
import type { StrategyCreate, StrategyUpdate, StrategyVersionCreate } from '../api/types';
import toast from 'react-hot-toast';

export const useStrategies = (projectId: string, params?: { status?: string; category?: string; market?: string; search?: string; tag?: string }) =>
  useQuery({
    queryKey: ['strategies', projectId, params],
    queryFn: () => strategyService.list(projectId, params),
    enabled: !!projectId,
  });

export const useStrategy = (projectId: string, strategyId: string) =>
  useQuery({
    queryKey: ['strategies', projectId, strategyId],
    queryFn: () => strategyService.get(projectId, strategyId),
    enabled: !!projectId && !!strategyId,
  });

export const useCreateStrategy = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StrategyCreate) => strategyService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', projectId] });
      toast.success('Strategy created');
    },
    onError: () => toast.error('Failed to create strategy'),
  });
};

export const useUpdateStrategy = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StrategyUpdate }) => strategyService.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', projectId] });
      toast.success('Strategy updated');
    },
    onError: () => toast.error('Failed to update strategy'),
  });
};

export const useDeleteStrategy = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategyService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['strategies', projectId] });
      const previous = queryClient.getQueryData<unknown[]>(['strategies', projectId]);
      queryClient.setQueryData(['strategies', projectId], (old: unknown[] | undefined) =>
        old?.filter((s: any) => s.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      toast.error('Failed to delete strategy');
      queryClient.setQueryData(['strategies', projectId], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['strategies', projectId] }),
  });
};

export const useDuplicateStrategy = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategyService.duplicate(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', projectId] });
      toast.success('Strategy duplicated');
    },
    onError: () => toast.error('Failed to duplicate strategy'),
  });
};

export const useStrategyAnalytics = (projectId: string, strategyId: string) =>
  useQuery({
    queryKey: ['strategies', projectId, strategyId, 'analytics'],
    queryFn: () => strategyService.analytics(projectId, strategyId),
    enabled: !!projectId && !!strategyId,
  });

export const useStrategyVersions = (projectId: string, strategyId: string) =>
  useQuery({
    queryKey: ['strategies', projectId, strategyId, 'versions'],
    queryFn: () => strategyService.versions(projectId, strategyId),
    enabled: !!projectId && !!strategyId,
  });

export const useCreateStrategyVersion = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StrategyVersionCreate }) =>
      strategyService.createVersion(projectId, id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['strategies', projectId, variables.id, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['strategies', projectId, variables.id] });
      toast.success('Version created');
    },
    onError: () => toast.error('Failed to create version'),
  });
};

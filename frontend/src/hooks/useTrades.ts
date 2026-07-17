import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService, type TradeRead, type TradeCreate, type TradeUpdate } from '../api';
import toast from 'react-hot-toast';

export const useTrades = (projectId: string) => {
  return useQuery({
    queryKey: ['trades', projectId],
    queryFn: () => tradeService.list(projectId),
  });
};

export const useTrade = (projectId: string, tradeId: string) => {
  return useQuery({
    queryKey: ['trades', projectId, tradeId],
    queryFn: () => tradeService.get(projectId, tradeId),
    enabled: !!tradeId,
  });
};

export const useCreateTrade = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TradeCreate) => tradeService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', projectId] });
      toast.success('Trade created');
    },
    onError: () => toast.error('Failed to create trade'),
  });
};

export const useUpdateTrade = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TradeUpdate }) =>
      tradeService.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', projectId] });
      toast.success('Trade updated');
    },
    onError: () => toast.error('Failed to update trade'),
  });
};

export const useDeleteTrade = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tradeService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['trades', projectId] });
      const previous = queryClient.getQueryData<TradeRead[]>(['trades', projectId]);
      queryClient.setQueryData(['trades', projectId], (old: TradeRead[] | undefined) =>
        old?.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onSuccess: () => toast.success('Trade deleted'),
    onError: (err, _, context) => {
      toast.error('Delete failed');
      queryClient.setQueryData(['trades', projectId], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trades', projectId] }),
  });
};

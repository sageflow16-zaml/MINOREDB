import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStableQuery } from './useStableQuery';
import { tradeService, type TradeRead, type TradeCreate, type TradeUpdate } from '../api';
import { callEdgeFunction } from '../lib/edgeFunctions';
import toast from 'react-hot-toast';
import { createEvent, eventBus } from '../lib/ai/eventBus';

export const useTrades = (projectId: string) => {
  return useStableQuery({
    queryKey: ['trades', projectId],
    queryFn: () => tradeService.list(projectId),
    enabled: !!projectId,
  });
};

export const useTrade = (projectId: string, tradeId: string) => {
  return useStableQuery({
    queryKey: ['trades', projectId, tradeId],
    queryFn: () => tradeService.get(projectId, tradeId),
    enabled: !!projectId && !!tradeId,
  });
};

export const useCreateTrade = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TradeCreate) => {
      const enriched = { ...data };
      if (!enriched.london_session && !enriched.asian_session && !enriched.newyork_session && data.open_time) {
        const hour = new Date(data.open_time).getUTCHours();
        if (hour >= 0 && hour < 8) enriched.asian_session = 'Asian';
        else if (hour >= 8 && hour < 16) enriched.london_session = 'London';
        else if (hour >= 16 && hour < 24) enriched.newyork_session = 'New York';
      }
      return tradeService.create(projectId, enriched);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trades', projectId] });
      toast.success('Trade created');
      eventBus.emit(createEvent('TRADE_RECORDED', projectId, { tradeId: data?.id, pair: (data as any)?.pair }));
      if (data && (data as any).status === 'CLOSED') {
        callEdgeFunction('ai', { operation: 'analyze-trade', project_id: projectId, data: { trade_id: data.id } }).catch(() => {});
        callEdgeFunction('ai', { operation: 'generate-debrief', project_id: projectId, data: { trade_id: data.id } }).catch(() => {});
      }
    },
    onError: () => toast.error('Failed to create trade'),
  });
};

export const useUpdateTrade = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TradeUpdate }) =>
      tradeService.update(projectId, id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trades', projectId] });
      toast.success('Trade updated');
      if ((variables.data as any)?.status === 'CLOSED') {
        callEdgeFunction('ai', { operation: 'analyze-trade', project_id: projectId, data: { trade_id: variables.id } }).catch(() => {});
        callEdgeFunction('ai', { operation: 'generate-debrief', project_id: projectId, data: { trade_id: variables.id } }).catch(() => {});
      }
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

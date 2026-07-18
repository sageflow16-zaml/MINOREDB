import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketStructureService, type MarketStructureRead, type MarketStructureCreate, type MarketStructureUpdate } from '../api';
import toast from 'react-hot-toast';

export const useMarketStructures = (projectId: string) => {
  return useQuery({
    queryKey: ['market-structures', projectId],
    queryFn: () => marketStructureService.list(projectId),
    enabled: !!projectId,
  });
};

export const useMarketStructure = (projectId: string, msId: string) => {
  return useQuery({
    queryKey: ['market-structures', projectId, msId],
    queryFn: () => marketStructureService.get(projectId, msId),
    enabled: !!projectId && !!msId,
  });
};

export const useCreateMarketStructure = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MarketStructureCreate) => marketStructureService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-structures', projectId] });
      toast.success('Market structure created');
    },
    onError: () => toast.error('Failed to create market structure'),
  });
};

export const useUpdateMarketStructure = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketStructureUpdate }) =>
      marketStructureService.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-structures', projectId] });
      toast.success('Market structure updated');
    },
    onError: () => toast.error('Failed to update market structure'),
  });
};

export const useDeleteMarketStructure = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketStructureService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['market-structures', projectId] });
      const previous = queryClient.getQueryData<MarketStructureRead[]>(['market-structures', projectId]);
      queryClient.setQueryData(['market-structures', projectId], (old: MarketStructureRead[] | undefined) =>
        old?.filter((ms) => ms.id !== id)
      );
      return { previous };
    },
    onSuccess: () => toast.success('Market structure deleted'),
    onError: (err, _, context) => {
      toast.error('Delete failed');
      queryClient.setQueryData(['market-structures', projectId], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['market-structures', projectId] }),
  });
};

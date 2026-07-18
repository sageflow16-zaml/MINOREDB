import { ConflictRead, ClaimRead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conflictService } from '../api';
import toast from 'react-hot-toast';

export const useConflicts = (projectId: string) => {
  return useQuery({
    queryKey: ['conflicts', projectId],
    queryFn: () => conflictService.list(projectId),
    enabled: !!projectId,
  });
};

export const useConflictClaims = (projectId: string, conflictId: string) => {
    return useQuery({
      queryKey: ['conflict-claims', projectId, conflictId],
      queryFn: () => conflictService.claims(projectId, conflictId),
      enabled: !!projectId && !!conflictId,
    });
};

export const useDeleteConflict = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conflictService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conflicts', projectId] });
      const previous = queryClient.getQueryData<ConflictRead[]>(['conflicts', projectId]);
      queryClient.setQueryData(['conflicts', projectId], (old: ConflictRead[] | undefined) => old?.filter(c => c.id !== id));
      return { previous };
    },
    onSuccess: () => toast.success('Conflict deleted'),
    onError: (err, _, context) => {
      toast.error('Delete failed');
      queryClient.setQueryData(['conflicts', projectId], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conflicts', projectId] }),
  });
};

export const useGenerateRQ = (projectId: string) => {
    return useMutation({
      mutationFn: (conflictId: string) => conflictService.generateQuestion(projectId, conflictId),
      onSuccess: () => toast.success('Research question generated'),
      onError: () => toast.error('Failed to generate research question'),
    });
};

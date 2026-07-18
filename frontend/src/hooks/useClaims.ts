import { ClaimRead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimService } from '../api';
import toast from 'react-hot-toast';

export const useClaims = (projectId: string) => {
  return useQuery({
    queryKey: ['claims', projectId],
    queryFn: () => claimService.list(projectId),
    enabled: !!projectId,
  });
};

export const useExtractConcepts = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (claimId: string) => claimService.extractConcepts(projectId, claimId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['concepts', projectId] });
        toast.success('Concepts extracted');
      },
      onError: () => toast.error('Failed to extract concepts'),
    });
};

export const useDeleteClaim = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (claimId: string) => claimService.remove(projectId, claimId),
      onMutate: async (claimId) => {
        await queryClient.cancelQueries({ queryKey: ['claims', projectId] });
        const previous = queryClient.getQueryData<ClaimRead[]>(['claims', projectId]);
        queryClient.setQueryData(['claims', projectId], (old: ClaimRead[] | undefined) => old?.filter(c => c.id !== claimId));
        return { previous };
      },
      onSuccess: () => toast.success('Claim deleted'),
      onError: (err, _, context) => {
        toast.error('Delete failed');
        queryClient.setQueryData(['claims', projectId], context?.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['claims', projectId] }),
    });
};

export const useInterpretClaim = (projectId: string) => {
    return useMutation({
      mutationFn: (claimId: string) => claimService.interpret(projectId, claimId),
      onSuccess: () => toast.success('Interpretation created'),
      onError: () => toast.error('Interpretation failed'),
    });
};

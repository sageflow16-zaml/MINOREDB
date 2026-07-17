import { ConceptRead, ClaimRead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conceptService } from '../api';
import toast from 'react-hot-toast';

export const useConcepts = (projectId: string) => {
  return useQuery({
    queryKey: ['concepts', projectId],
    queryFn: () => conceptService.list(projectId),
  });
};

export const useConceptClaims = (projectId: string, conceptId: string) => {
    return useQuery({
      queryKey: ['concept-claims', projectId, conceptId],
      queryFn: () => conceptService.claims(projectId, conceptId),
      enabled: !!conceptId,
    });
};

export const useConceptInterpretations = (projectId: string, conceptId: string) => {
    return useQuery({
      queryKey: ['concept-interpretations', projectId, conceptId],
      queryFn: () => conceptService.interpretations(projectId, conceptId),
      enabled: !!conceptId,
    });
};

export const useDeleteConcept = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (conceptId: string) => conceptService.remove(projectId, conceptId),
      onMutate: async (conceptId) => {
        await queryClient.cancelQueries({ queryKey: ['concepts', projectId] });
        const previous = queryClient.getQueryData<ConceptRead[]>(['concepts', projectId]);
        queryClient.setQueryData(['concepts', projectId], (old: ConceptRead[] | undefined) => old?.filter(c => c.id !== conceptId));
        return { previous };
      },
      onSuccess: () => toast.success('Concept deleted'),
      onError: (err, _, context) => {
        toast.error('Delete failed');
        queryClient.setQueryData(['concepts', projectId], context?.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['concepts', projectId] }),
    });
};

import { InterpretationRead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interpretationService } from '../api';
import toast from 'react-hot-toast';

export const useInterpretations = (projectId: string) => {
  return useQuery({
    queryKey: ['interpretations', projectId],
    queryFn: () => interpretationService.list(projectId),
  });
};

export const useDeleteInterpretation = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interpretationService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['interpretations', projectId] });
      const previous = queryClient.getQueryData<InterpretationRead[]>(['interpretations', projectId]);
      queryClient.setQueryData(['interpretations', projectId], (old: InterpretationRead[] | undefined) => old?.filter(i => i.id !== id));
      return { previous };
    },
    onSuccess: () => toast.success('Interpretation deleted'),
    onError: (err, _, context) => {
      toast.error('Delete failed');
      queryClient.setQueryData(['interpretations', projectId], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['interpretations', projectId] }),
  });
};

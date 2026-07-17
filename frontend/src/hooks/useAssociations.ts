import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { associationService } from '../api';

export const useAssociations = (projectId: string) => {
  return useQuery({
    queryKey: ['associations', projectId],
    queryFn: () => associationService.list(projectId),
    enabled: !!projectId,
  });
};

export const useCreateAssociation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => associationService.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['associations', projectId] }),
  });
};

export const useDeleteAssociation = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => associationService.remove(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['associations', projectId] }),
  });
};

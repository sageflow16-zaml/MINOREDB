import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playbookService } from '../api/playbooks';
import type { PlaybookCreate, PlaybookUpdate, PlaybookStep } from '../api/types';
import toast from 'react-hot-toast';

export const usePlaybooks = (projectId: string, params?: { search?: string; status?: string; category?: string }) =>
  useQuery({
    queryKey: ['playbooks', projectId, params],
    queryFn: () => playbookService.list(projectId, params),
    enabled: !!projectId,
  });

export const usePlaybook = (projectId: string, playbookId: string) =>
  useQuery({
    queryKey: ['playbooks', projectId, playbookId],
    queryFn: () => playbookService.get(projectId, playbookId),
    enabled: !!projectId && !!playbookId,
  });

export const useCreatePlaybook = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlaybookCreate) => playbookService.create(projectId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }); toast.success('Playbook created'); },
    onError: () => toast.error('Failed to create playbook'),
  });
};

export const useUpdatePlaybook = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlaybookUpdate }) => playbookService.update(projectId, id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }); toast.success('Playbook updated'); },
    onError: () => toast.error('Failed to update playbook'),
  });
};

export const useDeletePlaybook = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbookService.remove(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['playbooks', projectId] });
      const previous = queryClient.getQueryData<unknown[]>(['playbooks', projectId]);
      queryClient.setQueryData(['playbooks', projectId], (old: unknown[] | undefined) => old?.filter((p: any) => p.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => { toast.error('Failed to delete playbook'); queryClient.setQueryData(['playbooks', projectId], context?.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }),
  });
};

export const useAddPlaybookStep = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, step }: { id: string; step: PlaybookStep }) => playbookService.addStep(projectId, id, step),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }); toast.success('Step added'); },
    onError: () => toast.error('Failed to add step'),
  });
};

export const useUpdatePlaybookStep = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stepId, updates }: { id: string; stepId: string; updates: Partial<PlaybookStep> }) => playbookService.updateStep(projectId, id, stepId, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }); toast.success('Step updated'); },
    onError: () => toast.error('Failed to update step'),
  });
};

export const useRemovePlaybookStep = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stepId }: { id: string; stepId: string }) => playbookService.removeStep(projectId, id, stepId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playbooks', projectId] }); toast.success('Step removed'); },
    onError: () => toast.error('Failed to remove step'),
  });
};

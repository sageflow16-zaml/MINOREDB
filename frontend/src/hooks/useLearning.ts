import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService } from '../api/learning';
import { createEvent, eventBus } from '../lib/ai/eventBus';

export const useLearningEvents = (projectId: string, limit?: number) => {
  return useQuery({
    queryKey: ['learning', projectId, 'events', limit],
    queryFn: () => learningService.events(projectId, limit),
    enabled: !!projectId,
  });
};

export const useLearningSnapshots = (projectId: string) => {
  return useQuery({
    queryKey: ['learning', projectId, 'snapshots'],
    queryFn: () => learningService.snapshots(projectId),
    enabled: !!projectId,
  });
};

export const useLearningStatus = (projectId: string) => {
  return useQuery({
    queryKey: ['learning', projectId, 'status'],
    queryFn: () => learningService.status(projectId),
    enabled: !!projectId,
    refetchInterval: 10000,
  });
};

export const useLearningRebuild = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => learningService.rebuild(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning', projectId] });
      eventBus.emit(createEvent('LEARNING_EVENT', projectId, { action: 'rebuild' }));
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourceService } from '../api';
import { SourceRead } from '../types';
import toast from 'react-hot-toast';

export const useSources = (projectId: string) => {
  return useQuery({
    queryKey: ['sources', projectId],
    queryFn: () => sourceService.list(projectId),
    enabled: !!projectId,
  });
};

export const useUploadSource = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => sourceService.upload(projectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', projectId] });
      toast.success('Source uploaded successfully');
    },
    onError: () => toast.error('Upload failed'),
  });
};

export const useExtractClaims = (projectId: string) => {
  return useMutation({
    mutationFn: (sourceId: string) => sourceService.extractClaims(projectId, sourceId),
    onSuccess: () => toast.success('Claims extracted'),
    onError: () => toast.error('Failed to extract claims'),
  });
};

export const useDetectConflicts = (projectId: string) => {
  return useMutation({
    mutationFn: (sourceId: string) => sourceService.detectConflicts(projectId, sourceId),
    onSuccess: () => toast.success('Conflicts detected'),
    onError: () => toast.error('Failed to detect conflicts'),
  });
};

export const useDeleteSource = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => sourceService.remove(projectId, sourceId),
    onMutate: async (sourceId) => {
      await queryClient.cancelQueries({ queryKey: ['sources', projectId] });
      const previousSources = queryClient.getQueryData<SourceRead[]>(['sources', projectId]);
      queryClient.setQueryData(['sources', projectId], (old: SourceRead[] | undefined) => old?.filter(s => s.id !== sourceId));
      return { previousSources };
    },
    onSuccess: () => toast.success('Source deleted'),
    onError: (err, _, context) => {
      toast.error('Delete failed');
      queryClient.setQueryData(['sources', projectId], context?.previousSources);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sources', projectId] }),
  });
};

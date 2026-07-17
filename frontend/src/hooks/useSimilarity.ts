import { useQuery, useMutation } from '@tanstack/react-query';
import { similarityService } from '../api/similarity';
import type { SimilarityEnvironment } from '../api/types';

export const useSimilarityCurrent = (projectId: string) => {
  return useMutation({
    mutationFn: (env: SimilarityEnvironment) =>
      similarityService.compareCurrent(projectId, env),
  });
};

export const useSimilarityTrade = (projectId: string) => {
  return useMutation({
    mutationFn: (tradeId: string) =>
      similarityService.compareTrade(projectId, tradeId),
  });
};

export const useSimilarityPattern = (projectId: string) => {
  return useMutation({
    mutationFn: (patternId: string) =>
      similarityService.comparePattern(projectId, patternId),
  });
};

export const useSimilarityHistory = (projectId: string) => {
  return useQuery({
    queryKey: ['similarity', projectId, 'history'],
    queryFn: () => similarityService.history(projectId),
    enabled: !!projectId,
  });
};

import { useQuery, useMutation } from '@tanstack/react-query';
import { decisionService } from '../api/decision';
import type { DecisionEnvironment } from '../api/types';

export const useDecisionCurrent = (projectId: string) => {
  return useMutation({
    mutationFn: (env: DecisionEnvironment) =>
      decisionService.evaluateCurrent(projectId, env),
  });
};

export const useDecisionTrade = (projectId: string) => {
  return useMutation({
    mutationFn: (tradeId: string) =>
      decisionService.evaluateTrade(projectId, tradeId),
  });
};

export const useDecisionHistory = (projectId: string) => {
  return useQuery({
    queryKey: ['decision', projectId, 'history'],
    queryFn: () => decisionService.history(projectId),
    enabled: !!projectId,
  });
};

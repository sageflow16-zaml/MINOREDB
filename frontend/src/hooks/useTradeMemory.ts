import { useQuery } from '@tanstack/react-query';
import { tradeMemoryService, type TradeMemory } from '../api';

export const useTradeMemories = (projectId: string) => {
  return useQuery({
    queryKey: ['trade-memories', projectId],
    queryFn: () => tradeMemoryService.list(projectId),
    enabled: !!projectId,
  });
};

export const useTradeMemory = (projectId: string, tradeId: string) => {
  return useQuery({
    queryKey: ['trade-memory', projectId, tradeId],
    queryFn: () => tradeMemoryService.get(projectId, tradeId),
    enabled: !!projectId && !!tradeId,
  });
};

import { useQuery, useMutation } from '@tanstack/react-query';
import { ictApi } from '../api/ict';
import {ICTAnalysisRequest} from '../api/types';

export const ictKeys = {
  all: ['ict'] as const,
  structures: (projectId: string, symbol?: string) => ['ict', 'structures', projectId, symbol] as const,
  events: (projectId: string, symbol?: string) => ['ict', 'events', projectId, symbol] as const,
  fvgs: (projectId: string, symbol?: string) => ['ict', 'fvgs', projectId, symbol] as const,
  orderBlocks: (projectId: string, symbol?: string) => ['ict', 'order-blocks', projectId, symbol] as const,
  liquidity: (projectId: string, symbol?: string) => ['ict', 'liquidity', projectId, symbol] as const,
  setups: (projectId: string, symbol?: string) => ['ict', 'setups', projectId, symbol] as const,
  setup: (projectId: string, setupId: string) => ['ict', 'setup', projectId, setupId] as const,
  sessions: (projectId: string, symbol?: string) => ['ict', 'sessions', projectId, symbol] as const,
  bias: (projectId: string, symbol?: string) => ['ict', 'bias', projectId, symbol] as const,
  signals: (projectId: string, symbol?: string) => ['ict', 'signals', projectId, symbol] as const,
  aiContext: (projectId: string, symbol?: string) => ['ict', 'ai-context', projectId, symbol] as const,
  fullContext: (projectId: string, symbol?: string) => ['ict', 'context', projectId, symbol] as const,
};

export function useAnalyzeICT(projectId: string) {
  return useMutation({
    mutationFn: async (data: ICTAnalysisRequest) => {
      const resp = await ictApi.analyze(projectId, data);
      return resp.data;
    },
  });
}

export function useICTStructures(projectId: string, symbol?: string) {
  return useQuery({
    queryKey: ictKeys.structures(projectId, symbol),
    queryFn: () => ictApi.getStructures(projectId, symbol),
    enabled: !!projectId,
  });
}

export function useICTEvents(projectId: string, symbol?: string, eventType?: string) {
  return useQuery({
    queryKey: [...ictKeys.events(projectId, symbol), eventType],
    queryFn: () => ictApi.getEvents(projectId, symbol, eventType),
    enabled: !!projectId,
  });
}

export function useICTFVGs(projectId: string, symbol?: string, status?: string) {
  return useQuery({
    queryKey: [...ictKeys.fvgs(projectId, symbol), status],
    queryFn: () => ictApi.getFVGs(projectId, symbol, status),
    enabled: !!projectId,
  });
}

export function useICTOrderBlocks(projectId: string, symbol?: string, blockType?: string) {
  return useQuery({
    queryKey: [...ictKeys.orderBlocks(projectId, symbol), blockType],
    queryFn: () => ictApi.getOrderBlocks(projectId, symbol, blockType),
    enabled: !!projectId,
  });
}

export function useICTLiquidity(projectId: string, symbol?: string, liquidityType?: string) {
  return useQuery({
    queryKey: [...ictKeys.liquidity(projectId, symbol), liquidityType],
    queryFn: () => ictApi.getLiquidityZones(projectId, symbol, liquidityType),
    enabled: !!projectId,
  });
}

export function useICTSetups(projectId: string, symbol?: string, modelType?: string, status?: string) {
  return useQuery({
    queryKey: [...ictKeys.setups(projectId, symbol), modelType, status],
    queryFn: () => ictApi.getSetups(projectId, symbol, modelType, status),
    enabled: !!projectId,
  });
}

export function useICTSetup(projectId: string, setupId: string) {
  return useQuery({
    queryKey: ictKeys.setup(projectId, setupId),
    queryFn: () => ictApi.getSetup(projectId, setupId),
    enabled: !!setupId,
  });
}

export function useICTSessions(projectId: string, symbol?: string, date?: string) {
  return useQuery({
    queryKey: [...ictKeys.sessions(projectId, symbol), date],
    queryFn: () => ictApi.getSessions(projectId, symbol, date),
    enabled: !!projectId,
  });
}

export function useICTMarketBias(projectId: string, symbol?: string) {
  return useQuery({
    queryKey: ictKeys.bias(projectId, symbol),
    queryFn: () => ictApi.getMarketBias(projectId, symbol),
    enabled: !!projectId,
  });
}

export function useICTSignals(projectId: string, symbol?: string, status?: string) {
  return useQuery({
    queryKey: [...ictKeys.signals(projectId, symbol), status],
    queryFn: () => ictApi.getSignals(projectId, symbol, status),
    enabled: !!projectId,
  });
}

export function useICTAIContext(projectId: string, symbol?: string) {
  return useQuery({
    queryKey: ictKeys.aiContext(projectId, symbol),
    queryFn: async () => {
      const resp = await ictApi.getAIContext(projectId, symbol);
      return resp.data;
    },
    enabled: !!projectId,
  });
}

export function useICTFullContext(projectId: string, symbol?: string) {
  return useQuery({
    queryKey: ictKeys.fullContext(projectId, symbol),
    queryFn: async () => {
      const resp = await ictApi.getFullContext(projectId, symbol);
      return resp.data;
    },
    enabled: !!projectId,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brokerService } from '../api/broker';

// ── Dashboard ──

export const useBrokerDashboard = (projectId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'dashboard'],
    queryFn: () => brokerService.dashboard(projectId),
    enabled: !!projectId,
  });

// ── Providers ──

export const useBrokerProviders = (projectId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'providers'],
    queryFn: () => brokerService.listProviders(projectId),
    enabled: !!projectId,
  });

// ── Connections ──

export const useBrokerConnections = (projectId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'connections'],
    queryFn: () => brokerService.listConnections(projectId),
    enabled: !!projectId,
  });

export const useBrokerConnection = (projectId: string, connectionId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'connections', connectionId],
    queryFn: () => brokerService.getConnection(projectId, connectionId),
    enabled: !!projectId && !!connectionId,
  });

export const useCreateBrokerConnection = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => brokerService.createConnection(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broker', projectId, 'connections'] }),
  });
};

export const useUpdateBrokerConnection = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: Record<string, unknown> }) =>
      brokerService.updateConnection(projectId, connectionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broker', projectId, 'connections'] }),
  });
};

export const useDeleteBrokerConnection = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => brokerService.deleteConnection(projectId, connectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broker', projectId, 'connections'] }),
  });
};

export const useTestBrokerConnection = (projectId: string) => {
  return useMutation({
    mutationFn: (connectionId: string) => brokerService.testConnection(projectId, connectionId),
  });
};

// ── Broker Accounts ──

export const useBrokerAccounts = (projectId: string, connectionId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'connections', connectionId, 'accounts'],
    queryFn: () => brokerService.listBrokerAccounts(projectId, connectionId),
    enabled: !!projectId && !!connectionId,
  });

export const useBrokerAccount = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'accounts', accountId],
    queryFn: () => brokerService.getBrokerAccount(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

// ── Sync ──

export const useSyncHistory = (projectId: string, connectionId: string, limit?: number) =>
  useQuery({
    queryKey: ['broker', projectId, 'sync', connectionId, { limit }],
    queryFn: () => brokerService.listSyncHistory(projectId, connectionId, limit),
    enabled: !!projectId && !!connectionId,
  });

export const useSyncConnection = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => brokerService.syncConnection(projectId, connectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker', projectId] });
    },
  });
};

export const useSyncAccountTrades = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, accountId }: { connectionId: string; accountId: string }) =>
      brokerService.syncAccountTrades(projectId, connectionId, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker', projectId, 'trades'] });
    },
  });
};

// ── Trades ──

export const useImportedTrades = (projectId: string, params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['broker', projectId, 'trades', params],
    queryFn: () => brokerService.listTrades(projectId, params as Record<string, string | number | undefined>),
    enabled: !!projectId,
  });

export const useImportedTrade = (projectId: string, tradeId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'trades', tradeId],
    queryFn: () => brokerService.getTrade(projectId, tradeId),
    enabled: !!projectId && !!tradeId,
  });

export const useTradeStats = (projectId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'trades', 'stats'],
    queryFn: () => brokerService.getTradeStats(projectId),
    enabled: !!projectId,
  });

// ── Positions & Orders ──

export const useBrokerPositions = (projectId: string, params?: Record<string, string>) =>
  useQuery({
    queryKey: ['broker', projectId, 'positions', params],
    queryFn: () => brokerService.listPositions(projectId, params),
    enabled: !!projectId,
  });

export const useBrokerOrders = (projectId: string, params?: Record<string, string>) =>
  useQuery({
    queryKey: ['broker', projectId, 'orders', params],
    queryFn: () => brokerService.listOrders(projectId, params),
    enabled: !!projectId,
  });

// ── Analytics ──

export const useBrokerAnalyticsList = (projectId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'analytics'],
    queryFn: () => brokerService.listBrokerAnalytics(projectId),
    enabled: !!projectId,
  });

export const useConnectionAnalytics = (projectId: string, connectionId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'analytics', connectionId],
    queryFn: () => brokerService.getConnectionAnalytics(projectId, connectionId),
    enabled: !!projectId && !!connectionId,
  });

export const useExecutionAnalysis = (projectId: string, connectionId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'execution', connectionId],
    queryFn: () => brokerService.getExecutionAnalysis(projectId, connectionId),
    enabled: !!projectId && !!connectionId,
  });

// ── Health & Logs ──

export const useBrokerHealth = (projectId: string, connectionId: string) =>
  useQuery({
    queryKey: ['broker', projectId, 'health', connectionId],
    queryFn: () => brokerService.getHealth(projectId, connectionId),
    enabled: !!projectId && !!connectionId,
  });

export const useCheckBrokerHealth = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => brokerService.checkHealth(projectId, connectionId),
    onSuccess: (_data, connectionId) => {
      qc.invalidateQueries({ queryKey: ['broker', projectId, 'health', connectionId] });
    },
  });
};

export const useBrokerLogs = (projectId: string, connectionId: string, level?: string, limit?: number) =>
  useQuery({
    queryKey: ['broker', projectId, 'logs', connectionId, { level, limit }],
    queryFn: () => brokerService.listLogs(projectId, connectionId, { level, limit }),
    enabled: !!projectId && !!connectionId,
  });

// ── AI ──

export const useBrokerAI = (projectId: string) => {
  return useMutation({
    mutationFn: (question: string) => brokerService.aiAsk(projectId, question),
  });
};

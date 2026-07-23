import api from '../services/api';
import type {
  BrokerHubConnection,
  BrokerAccount,
  BrokerDashboardData,
  BrokerProviderInfo,
  BrokerAnalytics,
  SyncHistoryRecord,
  BrokerLog,
  BrokerHealth,
  ImportedTrade,
  ExecutionAnalysis,
  TradeStats,
  BrokerPosition,
  BrokerOrder,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/broker`;

export const brokerService = {
  // Dashboard
  dashboard: (projectId: string) =>
    api.get<BrokerDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  // Providers
  listProviders: (projectId: string) =>
    api.get<BrokerProviderInfo[]>(`${base(projectId)}/providers`).then((r) => r.data),

  // Connections
  listConnections: (projectId: string) =>
    api.get<BrokerHubConnection[]>(`${base(projectId)}/connections`).then((r) => r.data),

  getConnection: (projectId: string, connectionId: string) =>
    api.get<BrokerHubConnection>(`${base(projectId)}/connections/${connectionId}`).then((r) => r.data),

  createConnection: (projectId: string, data: Partial<BrokerHubConnection>) =>
    api.post<BrokerHubConnection>(`${base(projectId)}/connections`, data).then((r) => r.data),

  updateConnection: (projectId: string, connectionId: string, data: Partial<BrokerHubConnection>) =>
    api.put<BrokerHubConnection>(`${base(projectId)}/connections/${connectionId}`, data).then((r) => r.data),

  deleteConnection: (projectId: string, connectionId: string) =>
    api.delete(`${base(projectId)}/connections/${connectionId}`).then((r) => r.data),

  testConnection: (projectId: string, connectionId: string) =>
    api.post<{ success: boolean; status: string; latency_ms: number | null; message: string }>(
      `${base(projectId)}/connections/${connectionId}/test`
    ).then((r) => r.data),

  // Broker Accounts
  listBrokerAccounts: (projectId: string, connectionId: string) =>
    api.get<BrokerAccount[]>(`${base(projectId)}/connections/${connectionId}/accounts`).then((r) => r.data),

  getBrokerAccount: (projectId: string, accountId: string) =>
    api.get<BrokerAccount>(`${base(projectId)}/accounts/${accountId}`).then((r) => r.data),

  updateBrokerAccount: (projectId: string, accountId: string, data: Partial<BrokerAccount>) =>
    api.put<BrokerAccount>(`${base(projectId)}/accounts/${accountId}`, data).then((r) => r.data),

  // Sync
  listSyncHistory: (projectId: string, connectionId: string, limit?: number) =>
    api.get<SyncHistoryRecord[]>(`${base(projectId)}/connections/${connectionId}/sync`, { params: { limit } }).then((r) => r.data),

  syncConnection: (projectId: string, connectionId: string) =>
    api.post<{ status: string; accounts_synced: number; created: number; updated: number }>(
      `${base(projectId)}/connections/${connectionId}/sync`
    ).then((r) => r.data),

  syncAccountTrades: (projectId: string, connectionId: string, accountId: string) =>
    api.post<{ status: string; created: number; duplicates: number }>(
      `${base(projectId)}/connections/${connectionId}/accounts/${accountId}/sync`
    ).then((r) => r.data),

  // Trades
  listTrades: (projectId: string, params?: { connection_id?: string; account_id?: string; symbol?: string; limit?: number; offset?: number }) =>
    api.get<ImportedTrade[]>(`${base(projectId)}/trades`, { params }).then((r) => r.data),

  getTrade: (projectId: string, tradeId: string) =>
    api.get<ImportedTrade>(`${base(projectId)}/trades/${tradeId}`).then((r) => r.data),

  getTradeStats: (projectId: string) =>
    api.get<TradeStats>(`${base(projectId)}/trades/stats`).then((r) => r.data),

  manualImportTrades: (projectId: string, connectionId: string, accountId: string, trades: Record<string, unknown>[]) =>
    api.post<{ created: number; duplicates: number }>(
      `${base(projectId)}/connections/${connectionId}/accounts/${accountId}/trades/import`,
      { trades }
    ).then((r) => r.data),

  // Positions & Orders
  listPositions: (projectId: string, params?: { connection_id?: string; account_id?: string }) =>
    api.get<BrokerPosition[]>(`${base(projectId)}/positions`, { params }).then((r) => r.data),

  listOrders: (projectId: string, params?: { connection_id?: string; account_id?: string }) =>
    api.get<BrokerOrder[]>(`${base(projectId)}/orders`, { params }).then((r) => r.data),

  // Analytics
  listBrokerAnalytics: (projectId: string) =>
    api.get<BrokerAnalytics[]>(`${base(projectId)}/analytics`).then((r) => r.data),

  getConnectionAnalytics: (projectId: string, connectionId: string) =>
    api.get<BrokerAnalytics>(`${base(projectId)}/connections/${connectionId}/analytics`).then((r) => r.data),

  getExecutionAnalysis: (projectId: string, connectionId: string) =>
    api.get<ExecutionAnalysis>(`${base(projectId)}/connections/${connectionId}/execution`).then((r) => r.data),

  // Health
  getHealth: (projectId: string, connectionId: string) =>
    api.get<BrokerHealth>(`${base(projectId)}/connections/${connectionId}/health`).then((r) => r.data),

  checkHealth: (projectId: string, connectionId: string) =>
    api.post<BrokerHealth>(`${base(projectId)}/connections/${connectionId}/health`).then((r) => r.data),

  // Logs
  listLogs: (projectId: string, connectionId: string, params?: { level?: string; limit?: number }) =>
    api.get<BrokerLog[]>(`${base(projectId)}/connections/${connectionId}/logs`, { params }).then((r) => r.data),

  // AI
  aiAsk: (projectId: string, question: string) =>
    api.post<{ question: string; answer: string }>(`${base(projectId)}/ai/ask`, { question }).then((r) => r.data),
};

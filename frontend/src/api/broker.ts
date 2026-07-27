import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  BrokerHubConnection, BrokerAccount, BrokerDashboardData,
  BrokerProviderInfo, BrokerAnalytics, SyncHistoryRecord,
  BrokerLog, BrokerHealth, ImportedTrade, ExecutionAnalysis,
  TradeStats, BrokerPosition, BrokerOrder,
} from './types';

export const brokerService = {
  dashboard: async (projectId: string): Promise<BrokerDashboardData> => {
    const [conn, accounts, trades] = await Promise.all([
      supabase.from('broker_connection_new').select('*').eq('project_id', projectId),
      supabase.from('broker_account').select('*').eq('project_id', projectId),
      supabase.from('imported_trade').select('*').eq('project_id', projectId).order('close_time', { ascending: false }).limit(50),
    ]);
    if (conn.error) throw conn.error;
    if (accounts.error) throw accounts.error;
    if (trades.error) throw trades.error;
    return {
      connections: (conn.data ?? []) as BrokerHubConnection[],
      accounts: (accounts.data ?? []) as BrokerAccount[],
      recent_trades: (trades.data ?? []) as ImportedTrade[],
    } as unknown as BrokerDashboardData;
  },

  listProviders: async (projectId: string): Promise<BrokerProviderInfo[]> => {
    const { data, error } = await supabase.from('broker_connection_new').select('provider').eq('project_id', projectId).not('provider', 'is', null);
    if (error) throw error;
    const seen = new Set<string>();
    return (data ?? []).filter((r) => { if (seen.has(r.provider)) return false; seen.add(r.provider); return true; }).map((r) => ({ provider: r.provider, name: r.provider }) as unknown as BrokerProviderInfo);
  },

  listConnections: async (projectId: string): Promise<BrokerHubConnection[]> => {
    const { data, error } = await supabase.from('broker_connection_new').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as BrokerHubConnection[];
  },

  getConnection: async (projectId: string, connectionId: string): Promise<BrokerHubConnection> => {
    const { data, error } = await supabase.from('broker_connection_new').select('*').eq('id', connectionId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as unknown as BrokerHubConnection;
  },

  createConnection: async (projectId: string, data: Partial<BrokerHubConnection>): Promise<BrokerHubConnection> => {
    const { data: row, error } = await supabase.from('broker_connection_new').insert({ ...data, project_id: projectId }).select().single();
    if (error) throw error;
    return row as unknown as BrokerHubConnection;
  },

  updateConnection: async (projectId: string, connectionId: string, data: Partial<BrokerHubConnection>): Promise<BrokerHubConnection> => {
    const { data: row, error } = await supabase.from('broker_connection_new').update(data).eq('id', connectionId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as unknown as BrokerHubConnection;
  },

  deleteConnection: async (projectId: string, connectionId: string): Promise<void> => {
    const { error } = await supabase.from('broker_connection_new').delete().eq('id', connectionId).eq('project_id', projectId);
    if (error) throw error;
  },

  testConnection: (projectId: string, connectionId: string) =>
    callEdgeFunction<{ success: boolean; status: string; latency_ms: number | null; message: string }>('broker-sync', { operation: 'test-connection', project_id: projectId, data: { connection_id: connectionId } }),

  listBrokerAccounts: async (projectId: string, connectionId: string): Promise<BrokerAccount[]> => {
    const { data, error } = await supabase.from('broker_account').select('*').eq('project_id', projectId).eq('connection_id', connectionId);
    if (error) throw error;
    return (data ?? []) as unknown as BrokerAccount[];
  },

  getBrokerAccount: async (projectId: string, accountId: string): Promise<BrokerAccount> => {
    const { data, error } = await supabase.from('broker_account').select('*').eq('id', accountId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as unknown as BrokerAccount;
  },

  updateBrokerAccount: async (projectId: string, accountId: string, data: Partial<BrokerAccount>): Promise<BrokerAccount> => {
    const { data: row, error } = await supabase.from('broker_account').update(data).eq('id', accountId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as unknown as BrokerAccount;
  },

  listSyncHistory: async (projectId: string, connectionId: string, limit?: number): Promise<SyncHistoryRecord[]> => {
    let query = supabase.from('sync_history_new').select('*').eq('project_id', projectId).eq('connection_id', connectionId).order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as SyncHistoryRecord[];
  },

  syncConnection: (projectId: string, connectionId: string) =>
    callEdgeFunction<{ status: string; accounts_synced: number; created: number; updated: number }>('broker-sync', { operation: 'sync', project_id: projectId, data: { connection_id: connectionId } }),

  syncAccountTrades: (projectId: string, connectionId: string, accountId: string) =>
    callEdgeFunction<{ status: string; created: number; duplicates: number }>('broker-sync', { operation: 'sync-account', project_id: projectId, data: { connection_id: connectionId, account_id: accountId } }),

  listTrades: async (projectId: string, params?: { connection_id?: string; account_id?: string; symbol?: string; limit?: number; offset?: number }): Promise<ImportedTrade[]> => {
    let query = supabase.from('imported_trade').select('*').eq('project_id', projectId).order('close_time', { ascending: false });
    if (params?.connection_id) query = query.eq('connection_id', params.connection_id);
    if (params?.account_id) query = query.eq('account_id', params.account_id);
    if (params?.symbol) query = query.eq('symbol', params.symbol);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.offset) query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ImportedTrade[];
  },

  getTrade: async (projectId: string, tradeId: string): Promise<ImportedTrade> => {
    const { data, error } = await supabase.from('imported_trade').select('*').eq('id', tradeId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as unknown as ImportedTrade;
  },

  getTradeStats: async (projectId: string): Promise<TradeStats> => {
    const { data, error } = await supabase.from('imported_trade').select('profit').eq('project_id', projectId);
    if (error) throw error;
    const trades = data ?? [];
    const profits = trades.map((t) => Number(t.profit ?? 0));
    const winning = profits.filter((p) => p > 0);
    const losing = profits.filter((p) => p < 0);
    return {
      total_trades: trades.length,
      winning_trades: winning.length,
      losing_trades: losing.length,
      win_rate: trades.length > 0 ? (winning.length / trades.length) * 100 : 0,
      total_profit: profits.reduce((s, p) => s + p, 0),
      avg_profit: trades.length > 0 ? profits.reduce((s, p) => s + p, 0) / trades.length : 0,
      max_drawdown: 0,
      profit_factor: losing.reduce((s, p) => s + Math.abs(p), 0) > 0 ? winning.reduce((s, p) => s + p, 0) / losing.reduce((s, p) => s + Math.abs(p), 0) : 0,
    } as unknown as TradeStats;
  },

  manualImportTrades: async (projectId: string, connectionId: string, accountId: string, trades: Record<string, unknown>[]): Promise<{ created: number; duplicates: number }> => {
    const rows = trades.map((t) => ({ ...t, project_id: projectId, connection_id: connectionId, account_id: accountId }));
    const { error } = await supabase.from('imported_trade').insert(rows as any);
    if (error) throw error;
    return { created: rows.length, duplicates: 0 };
  },

  listPositions: async (projectId: string, params?: { connection_id?: string; account_id?: string }): Promise<BrokerPosition[]> => {
    let query = supabase.from('broker_position').select('*').eq('project_id', projectId);
    if (params?.connection_id) query = query.eq('connection_id', params.connection_id);
    if (params?.account_id) query = query.eq('account_id', params.account_id);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as BrokerPosition[];
  },

  listOrders: async (projectId: string, params?: { connection_id?: string; account_id?: string }): Promise<BrokerOrder[]> => {
    let query = supabase.from('broker_order').select('*').eq('project_id', projectId);
    if (params?.connection_id) query = query.eq('connection_id', params.connection_id);
    if (params?.account_id) query = query.eq('account_id', params.account_id);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as BrokerOrder[];
  },

  listBrokerAnalytics: async (projectId: string): Promise<BrokerAnalytics[]> => {
    const { data, error } = await supabase.from('broker_analytics').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as BrokerAnalytics[];
  },

  getConnectionAnalytics: async (projectId: string, connectionId: string): Promise<BrokerAnalytics> => {
    const { data, error } = await supabase.from('broker_analytics').select('*').eq('connection_id', connectionId).eq('project_id', projectId).maybeSingle();
    if (error) throw error;
    return data as unknown as BrokerAnalytics;
  },

  getExecutionAnalysis: (projectId: string, connectionId: string) =>
    callEdgeFunction<ExecutionAnalysis>('broker-sync', { operation: 'execution-analysis', project_id: projectId, data: { connection_id: connectionId } }),

  getHealth: async (projectId: string, connectionId: string): Promise<BrokerHealth> => {
    const { data, error } = await supabase.from('broker_health').select('*').eq('connection_id', connectionId).eq('project_id', projectId).maybeSingle();
    if (error) throw error;
    return data as unknown as BrokerHealth;
  },

  checkHealth: (projectId: string, connectionId: string) =>
    callEdgeFunction<BrokerHealth>('broker-sync', { operation: 'check-health', project_id: projectId, data: { connection_id: connectionId } }),

  listLogs: async (projectId: string, connectionId: string, params?: { level?: string; limit?: number }): Promise<BrokerLog[]> => {
    let query = supabase.from('broker_log').select('*').eq('project_id', projectId).eq('connection_id', connectionId).order('created_at', { ascending: false });
    if (params?.level) query = query.eq('level', params.level);
    if (params?.limit) query = query.limit(params.limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as BrokerLog[];
  },

  aiAsk: (projectId: string, question: string) =>
    callEdgeFunction<{ question: string; answer: string }>('ai', { operation: 'ask', project_id: projectId, data: { question } }),
};

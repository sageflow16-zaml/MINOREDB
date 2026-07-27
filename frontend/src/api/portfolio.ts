import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type {
  PortfolioDashboardData,
  PortfolioSummary,
  PortfolioRisk,
  Account,
  BrokerProfile,
  AccountGroup,
  PortfolioAllocation,
  Transfer,
  PortfolioGoal,
  AccountHealth,
  AccountRule,
  AccountNote,
  FundingHistory,
  BalanceHistoryPoint,
  EquityHistoryPoint,
  AIAnswer,
  PortfolioSnapshot,
  AccountType,
  AccountStatus,
} from './types';

export const portfolioService = {
  dashboard: async (projectId: string): Promise<PortfolioDashboardData> => {
    const { data, error } = await supabase.rpc('get_portfolio_dashboard', { p_project_id: projectId });
    if (error) throw error;
    return data as unknown as PortfolioDashboardData;
  },

  listAccounts: async (projectId: string, params?: { type?: AccountType; status?: AccountStatus; search?: string }): Promise<Account[]> => {
    let query = supabase.from('account').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (params?.type) query = query.eq('account_type', params.type);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.search) query = query.or(`name.ilike.%${params.search}%,account_number.ilike.%${params.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Account[];
  },

  getAccount: async (projectId: string, accountId: string): Promise<Account> => {
    const { data, error } = await supabase.from('account').select('*').eq('id', accountId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as Account;
  },

  createAccount: async (projectId: string, data: Partial<Account>): Promise<Account> => {
    const { data: row, error } = await supabase.from('account').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as Account;
  },

  updateAccount: async (projectId: string, accountId: string, data: Partial<Account>): Promise<Account> => {
    const { data: row, error } = await supabase.from('account').update(data).eq('id', accountId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as Account;
  },

  archiveAccount: async (projectId: string, accountId: string): Promise<void> => {
    const { error } = await supabase.from('account').update({ is_archived: true }).eq('id', accountId).eq('project_id', projectId);
    if (error) throw error;
  },

  deleteAccount: async (projectId: string, accountId: string): Promise<void> => {
    const { error } = await supabase.from('account').delete().eq('id', accountId).eq('project_id', projectId);
    if (error) throw error;
  },

  listGroups: async (projectId: string): Promise<AccountGroup[]> => {
    const { data, error } = await supabase.from('account_group').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as AccountGroup[];
  },

  createGroup: async (projectId: string, data: { name: string; description?: string; color?: string; account_ids?: string[] }): Promise<AccountGroup> => {
    const { data: row, error } = await supabase.from('account_group').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as AccountGroup;
  },

  updateGroup: async (projectId: string, groupId: string, data: Partial<AccountGroup>): Promise<AccountGroup> => {
    const { data: row, error } = await supabase.from('account_group').update(data).eq('id', groupId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as AccountGroup;
  },

  deleteGroup: async (projectId: string, groupId: string): Promise<void> => {
    const { error } = await supabase.from('account_group').delete().eq('id', groupId).eq('project_id', projectId);
    if (error) throw error;
  },

  listBrokers: async (projectId: string): Promise<BrokerProfile[]> => {
    const { data, error } = await supabase.from('broker_profile').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as BrokerProfile[];
  },

  createBroker: async (projectId: string, data: Partial<BrokerProfile>): Promise<BrokerProfile> => {
    const { data: row, error } = await supabase.from('broker_profile').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as BrokerProfile;
  },

  updateBroker: async (projectId: string, brokerId: string, data: Partial<BrokerProfile>): Promise<BrokerProfile> => {
    const { data: row, error } = await supabase.from('broker_profile').update(data).eq('id', brokerId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as BrokerProfile;
  },

  deleteBroker: async (projectId: string, brokerId: string): Promise<void> => {
    const { error } = await supabase.from('broker_profile').delete().eq('id', brokerId).eq('project_id', projectId);
    if (error) throw error;
  },

  listAllocations: async (projectId: string): Promise<PortfolioAllocation[]> => {
    const { data, error } = await supabase.from('portfolio_allocation').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as PortfolioAllocation[];
  },

  createAllocation: async (projectId: string, data: Partial<PortfolioAllocation>): Promise<PortfolioAllocation> => {
    const { data: row, error } = await supabase.from('portfolio_allocation').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as PortfolioAllocation;
  },

  updateAllocation: async (projectId: string, allocationId: string, data: Partial<PortfolioAllocation>): Promise<PortfolioAllocation> => {
    const { data: row, error } = await supabase.from('portfolio_allocation').update(data).eq('id', allocationId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PortfolioAllocation;
  },

  deleteAllocation: async (projectId: string, allocationId: string): Promise<void> => {
    const { error } = await supabase.from('portfolio_allocation').delete().eq('id', allocationId).eq('project_id', projectId);
    if (error) throw error;
  },

  getRebalanceSuggestions: async (projectId: string): Promise<{ symbol: string; current_pct: number; target_pct: number; difference: number }[]> => {
    const { data, error } = await supabase.from('portfolio_allocation').select('*').eq('project_id', projectId);
    if (error) throw error;
    const allocations = (data ?? []) as PortfolioAllocation[];
    return allocations.map((a) => ({
      symbol: a.entity_name ?? a.entity_id,
      current_pct: a.current_percentage ?? 0,
      target_pct: a.target_percentage ?? 0,
      difference: (a.target_percentage ?? 0) - (a.current_percentage ?? 0),
    }));
  },

  executeRebalance: async (projectId: string, updates?: { allocation_id: string; target_percentage: number }[]): Promise<void> => {
    if (updates && updates.length > 0) {
      const { error } = await supabase.from('portfolio_allocation').upsert(
        updates.map((u) => ({ id: u.allocation_id, project_id: projectId, target_percentage: u.target_percentage })),
        { onConflict: 'id' }
      );
      if (error) throw error;
    }
  },

  listTransfers: async (projectId: string): Promise<Transfer[]> => {
    const { data, error } = await supabase.from('transfer').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Transfer[];
  },

  createTransfer: async (projectId: string, data: Partial<Transfer>): Promise<Transfer> => {
    const { data: row, error } = await supabase.from('transfer').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as Transfer;
  },

  listGoals: async (projectId: string): Promise<PortfolioGoal[]> => {
    const { data, error } = await supabase.from('portfolio_goal').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PortfolioGoal[];
  },

  createGoal: async (projectId: string, data: Partial<PortfolioGoal>): Promise<PortfolioGoal> => {
    const { data: row, error } = await supabase.from('portfolio_goal').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as PortfolioGoal;
  },

  updateGoal: async (projectId: string, goalId: string, data: Partial<PortfolioGoal>): Promise<PortfolioGoal> => {
    const { data: row, error } = await supabase.from('portfolio_goal').update(data).eq('id', goalId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PortfolioGoal;
  },

  deleteGoal: async (projectId: string, goalId: string): Promise<void> => {
    const { error } = await supabase.from('portfolio_goal').delete().eq('id', goalId).eq('project_id', projectId);
    if (error) throw error;
  },

  getAccountHealth: async (projectId: string, accountId: string): Promise<AccountHealth> => {
    const { data, error } = await supabase.from('account_health').select('*').eq('account_id', accountId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as AccountHealth;
  },

  getAccountRules: async (projectId: string, accountId: string): Promise<AccountRule[]> => {
    const { data, error } = await supabase.from('account_rule').select('*').eq('account_id', accountId).eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as AccountRule[];
  },

  checkRules: async (projectId: string, accountId: string): Promise<{ violations: AccountRule[] }> => {
    const { data, error } = await supabase.from('account_rule').select('*').eq('account_id', accountId).eq('project_id', projectId).eq('is_active', true);
    if (error) throw error;
    const rules = (data ?? []) as AccountRule[];
    const violations = rules.filter((r) => {
      if (r.current_value === undefined || r.current_value === null) return false;
      if (r.threshold_value === undefined || r.threshold_value === null) return false;
      return r.current_value >= r.threshold_value;
    });
    return { violations };
  },

  getAccountNotes: async (projectId: string, accountId: string): Promise<AccountNote[]> => {
    const { data, error } = await supabase.from('account_note').select('*').eq('account_id', accountId).eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AccountNote[];
  },

  createAccountNote: async (projectId: string, accountId: string, data: Partial<AccountNote>): Promise<AccountNote> => {
    const { data: row, error } = await supabase.from('account_note').insert({ project_id: projectId, account_id: accountId, ...data }).select().single();
    if (error) throw error;
    return row as AccountNote;
  },

  deleteAccountNote: async (projectId: string, noteId: string): Promise<void> => {
    const { error } = await supabase.from('account_note').delete().eq('id', noteId).eq('project_id', projectId);
    if (error) throw error;
  },

  getFundingHistory: async (projectId: string, accountId: string): Promise<FundingHistory[]> => {
    const { data, error } = await supabase.from('funding_history').select('*').eq('account_id', accountId).eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FundingHistory[];
  },

  getBalanceHistory: async (projectId: string, accountId: string): Promise<BalanceHistoryPoint[]> => {
    const { data, error } = await supabase.from('balance_history').select('*').eq('account_id', accountId).eq('project_id', projectId).order('record_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as BalanceHistoryPoint[];
  },

  getEquityHistory: async (projectId: string, accountId: string): Promise<EquityHistoryPoint[]> => {
    const { data, error } = await supabase.from('equity_history').select('*').eq('account_id', accountId).eq('project_id', projectId).order('record_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as EquityHistoryPoint[];
  },

  analytics: async (projectId: string): Promise<{
    summary: PortfolioSummary;
    snapshots: PortfolioSnapshot[];
  }> => {
    const [accountsResult, snapshotsResult] = await Promise.all([
      supabase.from('account').select('*').eq('project_id', projectId),
      supabase.from('portfolio_snapshot').select('*').eq('project_id', projectId).order('snapshot_date', { ascending: false }).limit(30),
    ]);
    if (accountsResult.error) throw accountsResult.error;
    if (snapshotsResult.error) throw snapshotsResult.error;
    const accounts = (accountsResult.data ?? []) as Account[];
    const totalBalance = accounts.reduce((s, a) => s + (a.current_balance ?? 0), 0);
    const totalEquity = accounts.reduce((s, a) => s + (a.current_equity ?? 0), 0);
    const totalOpenPl = accounts.reduce((s, a) => s + (a.open_pnl ?? 0), 0);
    const totalUsedMargin = accounts.reduce((s, a) => s + (a.used_margin ?? 0), 0);
    const totalFreeMargin = accounts.reduce((s, a) => s + (a.free_margin ?? 0), 0);
    const summary: PortfolioSummary = {
      total_balance: totalBalance,
      total_equity: totalEquity,
      total_open_pnl: totalOpenPl,
      total_used_margin: totalUsedMargin,
      total_free_margin: totalFreeMargin,
      daily_pnl: 0,
      weekly_pnl: 0,
      monthly_pnl: 0,
      total_deposits: 0,
      total_withdrawals: 0,
      account_count: accounts.length,
      active_account_count: accounts.filter((a) => a.status === 'active').length,
      total_trades: 0,
      win_count: 0,
      loss_count: 0,
      win_rate: 0,
      total_pnl: totalOpenPl,
      profit_factor: 0,
      avg_rr: 0,
      max_drawdown_pct: 0,
    };
    const snapshots = (snapshotsResult.data ?? []) as PortfolioSnapshot[];
    return { summary, snapshots };
  },

  riskAssessment: async (projectId: string): Promise<{
    risk: PortfolioRisk;
    health: AccountHealth[];
  }> => {
    const [accountsResult, healthResult] = await Promise.all([
      supabase.from('account').select('*').eq('project_id', projectId),
      supabase.from('account_health').select('*').eq('project_id', projectId),
    ]);
    if (accountsResult.error) throw accountsResult.error;
    if (healthResult.error) throw healthResult.error;
    const accounts = (accountsResult.data ?? []) as Account[];
    const health = (healthResult.data ?? []) as AccountHealth[];
    const totalBalance = accounts.reduce((s, a) => s + (a.current_balance ?? 0), 0);
    const totalEquity = accounts.reduce((s, a) => s + (a.current_equity ?? 0), 0);
    const totalUsedMargin = accounts.reduce((s, a) => s + (a.used_margin ?? 0), 0);
    const totalFreeMargin = accounts.reduce((s, a) => s + (a.free_margin ?? 0), 0);
    const risk: PortfolioRisk = {
      total_exposure: totalUsedMargin + (totalEquity > 0 ? Math.abs(totalEquity - totalBalance) : 0),
      used_margin: totalUsedMargin,
      free_margin: totalFreeMargin,
      margin_ratio: totalEquity > 0 ? (totalUsedMargin / totalEquity) * 100 : 0,
      margin_level: totalUsedMargin > 0 ? (totalEquity / totalUsedMargin) * 100 : 0,
      portfolio_drawdown: 0,
      win_rate: 0,
      loss_count: 0,
      concentration_risk: 0,
      max_symbol_exposure: 0,
      total_open_positions: 0,
      risk_score: health.reduce((s, h) => s + (100 - (h.health_score ?? 50)), 0) / Math.max(health.length, 1),
    };
    return { risk, health };
  },

  report: async (projectId: string, reportType: string, accountId?: string): Promise<{ content: string }> => {
    const [accountsResult, snapshotsResult] = await Promise.all([
      supabase.from('account').select('*').eq('project_id', projectId),
      supabase.from('portfolio_snapshot').select('*').eq('project_id', projectId).order('snapshot_date', { ascending: false }).limit(1),
    ]);
    if (accountsResult.error) throw accountsResult.error;
    if (snapshotsResult.error) throw snapshotsResult.error;
    const accounts = (accountsResult.data ?? []) as Account[];
    const snapshot = (snapshotsResult.data ?? [])[0] as PortfolioSnapshot | undefined;
    const filtered = accountId ? accounts.filter((a) => a.id === accountId) : accounts;
    const content = [
      `Report Type: ${reportType}`,
      `Generated: ${new Date().toISOString()}`,
      `Accounts: ${filtered.length}`,
      `Snapshot Balance: ${snapshot?.total_balance ?? 'N/A'}`,
      `Snapshot Equity: ${snapshot?.total_equity ?? 'N/A'}`,
    ].join('\n');
    return { content };
  },

  addFunding: async (projectId: string, accountId: string, data: { amount: number; description?: string }): Promise<FundingHistory> => {
    const { data: row, error } = await supabase.from('funding_history').insert({
      project_id: projectId,
      account_id: accountId,
      amount: data.amount,
      notes: data.description,
      funding_type: 'deposit',
      event_date: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return row as FundingHistory;
  },

  updateNotePin: async (projectId: string, noteId: string, pinned: boolean): Promise<void> => {
    const { error } = await supabase.from('account_note').update({ pinned }).eq('id', noteId).eq('project_id', projectId);
    if (error) throw error;
  },

  askAI: async (projectId: string, question: string): Promise<AIAnswer> => {
    return callEdgeFunction<AIAnswer>('ai', { operation: 'ask', project_id: projectId, data: { question } });
  },
};

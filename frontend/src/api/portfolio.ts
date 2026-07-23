import api from '../services/api';
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
  AccountType,
  AccountStatus,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/portfolio`;

export const portfolioService = {
  dashboard: (projectId: string) =>
    api.get<PortfolioDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  listAccounts: (projectId: string, params?: { type?: AccountType; status?: AccountStatus; search?: string }) =>
    api.get<Account[]>(`${base(projectId)}/accounts`, { params }).then((r) => r.data),

  getAccount: (projectId: string, accountId: string) =>
    api.get<Account>(`${base(projectId)}/accounts/${accountId}`).then((r) => r.data),

  createAccount: (projectId: string, data: Partial<Account>) =>
    api.post<Account>(`${base(projectId)}/accounts`, data).then((r) => r.data),

  updateAccount: (projectId: string, accountId: string, data: Partial<Account>) =>
    api.put<Account>(`${base(projectId)}/accounts/${accountId}`, data).then((r) => r.data),

  archiveAccount: (projectId: string, accountId: string) =>
    api.post(`${base(projectId)}/accounts/${accountId}/archive`).then((r) => r.data),

  deleteAccount: (projectId: string, accountId: string) =>
    api.delete(`${base(projectId)}/accounts/${accountId}`).then((r) => r.data),

  listGroups: (projectId: string) =>
    api.get<AccountGroup[]>(`${base(projectId)}/groups`).then((r) => r.data),

  createGroup: (projectId: string, data: { name: string; description?: string; color?: string; account_ids?: string[] }) =>
    api.post<AccountGroup>(`${base(projectId)}/groups`, data).then((r) => r.data),

  updateGroup: (projectId: string, groupId: string, data: Partial<AccountGroup>) =>
    api.put<AccountGroup>(`${base(projectId)}/groups/${groupId}`, data).then((r) => r.data),

  deleteGroup: (projectId: string, groupId: string) =>
    api.delete(`${base(projectId)}/groups/${groupId}`).then((r) => r.data),

  listBrokers: (projectId: string) =>
    api.get<BrokerProfile[]>(`${base(projectId)}/brokers`).then((r) => r.data),

  createBroker: (projectId: string, data: Partial<BrokerProfile>) =>
    api.post<BrokerProfile>(`${base(projectId)}/brokers`, data).then((r) => r.data),

  updateBroker: (projectId: string, brokerId: string, data: Partial<BrokerProfile>) =>
    api.put<BrokerProfile>(`${base(projectId)}/brokers/${brokerId}`, data).then((r) => r.data),

  deleteBroker: (projectId: string, brokerId: string) =>
    api.delete(`${base(projectId)}/brokers/${brokerId}`).then((r) => r.data),

  listAllocations: (projectId: string) =>
    api.get<PortfolioAllocation[]>(`${base(projectId)}/allocations`).then((r) => r.data),

  createAllocation: (projectId: string, data: Partial<PortfolioAllocation>) =>
    api.post<PortfolioAllocation>(`${base(projectId)}/allocations`, data).then((r) => r.data),

  updateAllocation: (projectId: string, allocationId: string, data: Partial<PortfolioAllocation>) =>
    api.put<PortfolioAllocation>(`${base(projectId)}/allocations/${allocationId}`, data).then((r) => r.data),

  deleteAllocation: (projectId: string, allocationId: string) =>
    api.delete(`${base(projectId)}/allocations/${allocationId}`).then((r) => r.data),

  getRebalanceSuggestions: (projectId: string) =>
    api.get(`${base(projectId)}/allocations/rebalance-suggestions`).then((r) => r.data),

  executeRebalance: (projectId: string, data?: Record<string, unknown>) =>
    api.post(`${base(projectId)}/allocations/rebalance`, data).then((r) => r.data),

  listTransfers: (projectId: string) =>
    api.get<Transfer[]>(`${base(projectId)}/transfers`).then((r) => r.data),

  createTransfer: (projectId: string, data: Partial<Transfer>) =>
    api.post<Transfer>(`${base(projectId)}/transfers`, data).then((r) => r.data),

  listGoals: (projectId: string) =>
    api.get<PortfolioGoal[]>(`${base(projectId)}/goals`).then((r) => r.data),

  createGoal: (projectId: string, data: Partial<PortfolioGoal>) =>
    api.post<PortfolioGoal>(`${base(projectId)}/goals`, data).then((r) => r.data),

  updateGoal: (projectId: string, goalId: string, data: Partial<PortfolioGoal>) =>
    api.put<PortfolioGoal>(`${base(projectId)}/goals/${goalId}`, data).then((r) => r.data),

  deleteGoal: (projectId: string, goalId: string) =>
    api.delete(`${base(projectId)}/goals/${goalId}`).then((r) => r.data),

  getAccountHealth: (projectId: string, accountId: string) =>
    api.get<AccountHealth>(`${base(projectId)}/accounts/${accountId}/health`).then((r) => r.data),

  getAccountRules: (projectId: string, accountId: string) =>
    api.get<AccountRule[]>(`${base(projectId)}/accounts/${accountId}/rules`).then((r) => r.data),

  checkRules: (projectId: string, accountId: string) =>
    api.post<{ violations: AccountRule[] }>(`${base(projectId)}/accounts/${accountId}/rules/check`).then((r) => r.data),

  getAccountNotes: (projectId: string, accountId: string) =>
    api.get<AccountNote[]>(`${base(projectId)}/accounts/${accountId}/notes`).then((r) => r.data),

  createAccountNote: (projectId: string, accountId: string, data: Partial<AccountNote>) =>
    api.post<AccountNote>(`${base(projectId)}/accounts/${accountId}/notes`, data).then((r) => r.data),

  deleteAccountNote: (projectId: string, noteId: string) =>
    api.delete(`${base(projectId)}/notes/${noteId}`).then((r) => r.data),

  getFundingHistory: (projectId: string, accountId: string) =>
    api.get<FundingHistory[]>(`${base(projectId)}/accounts/${accountId}/funding`).then((r) => r.data),

  getBalanceHistory: (projectId: string, accountId: string) =>
    api.get<BalanceHistoryPoint[]>(`${base(projectId)}/accounts/${accountId}/balance-history`).then((r) => r.data),

  getEquityHistory: (projectId: string, accountId: string) =>
    api.get<EquityHistoryPoint[]>(`${base(projectId)}/accounts/${accountId}/equity-history`).then((r) => r.data),

  analytics: (projectId: string) =>
    api.get(`${base(projectId)}/analytics`).then((r) => r.data),

  riskAssessment: (projectId: string) =>
    api.get(`${base(projectId)}/risk-assessment`).then((r) => r.data),

  report: (projectId: string, reportType: string, accountId?: string) =>
    api.get<{ content: string }>(`${base(projectId)}/reports/${reportType}`, { params: { account_id: accountId } }).then((r) => r.data),

  addFunding: (projectId: string, accountId: string, data: { amount: number; description?: string }) =>
    api.post<FundingHistory>(`${base(projectId)}/accounts/${accountId}/funding`, data).then((r) => r.data),

  updateNotePin: (projectId: string, noteId: string, pinned: boolean) =>
    api.put(`${base(projectId)}/notes/${noteId}`, { pinned }).then((r) => r.data),

  askAI: (projectId: string, question: string) =>
    api.post<AIAnswer>(`${base(projectId)}/ai/ask`, { question }).then((r) => r.data),
};

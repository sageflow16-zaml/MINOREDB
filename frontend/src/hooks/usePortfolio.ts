import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '../api/portfolio';
import type { AccountType, AccountStatus } from '../api/types';

export const usePortfolioDashboard = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'dashboard'],
    queryFn: () => portfolioService.dashboard(projectId),
    enabled: !!projectId,
  });

export const useAccounts = (projectId: string, filters?: { type?: AccountType; status?: AccountStatus; search?: string }) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', filters],
    queryFn: () => portfolioService.listAccounts(projectId, filters),
    enabled: !!projectId,
  });

export const useAccount = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId],
    queryFn: () => portfolioService.getAccount(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useCreateAccount = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => portfolioService.createAccount(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'accounts'] }),
  });
};

export const useUpdateAccount = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: Record<string, unknown> }) =>
      portfolioService.updateAccount(projectId, accountId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'accounts'] }),
  });
};

export const useArchiveAccount = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => portfolioService.archiveAccount(projectId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'accounts'] }),
  });
};

export const useDeleteAccount = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => portfolioService.deleteAccount(projectId, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'accounts'] }),
  });
};

export const useAccountGroups = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'groups'],
    queryFn: () => portfolioService.listGroups(projectId),
    enabled: !!projectId,
  });

export const useCreateAccountGroup = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string; account_ids?: string[] }) =>
      portfolioService.createGroup(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'groups'] }),
  });
};

export const useUpdateAccountGroup = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Record<string, unknown> }) =>
      portfolioService.updateGroup(projectId, groupId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'groups'] }),
  });
};

export const useDeleteAccountGroup = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => portfolioService.deleteGroup(projectId, groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'groups'] }),
  });
};

export const useBrokers = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'brokers'],
    queryFn: () => portfolioService.listBrokers(projectId),
    enabled: !!projectId,
  });

export const useAccountHealth = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'health'],
    queryFn: () => portfolioService.getAccountHealth(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useAccountRules = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'rules'],
    queryFn: () => portfolioService.getAccountRules(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useCheckRules = (projectId: string) =>
  useMutation({
    mutationFn: (accountId: string) => portfolioService.checkRules(projectId, accountId),
  });

export const useAccountNotes = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'notes'],
    queryFn: () => portfolioService.getAccountNotes(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useFundingHistory = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'funding'],
    queryFn: () => portfolioService.getFundingHistory(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useBalanceHistory = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'balance-history'],
    queryFn: () => portfolioService.getBalanceHistory(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const useEquityHistory = (projectId: string, accountId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'accounts', accountId, 'equity-history'],
    queryFn: () => portfolioService.getEquityHistory(projectId, accountId),
    enabled: !!projectId && !!accountId,
  });

export const usePortfolioAllocations = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'allocations'],
    queryFn: () => portfolioService.listAllocations(projectId),
    enabled: !!projectId,
  });

export const usePortfolioTransfers = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'transfers'],
    queryFn: () => portfolioService.listTransfers(projectId),
    enabled: !!projectId,
  });

export const usePortfolioGoals = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'goals'],
    queryFn: () => portfolioService.listGoals(projectId),
    enabled: !!projectId,
  });

export const usePortfolioAnalytics = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'analytics'],
    queryFn: () => portfolioService.analytics(projectId),
    enabled: !!projectId,
  });

export const usePortfolioRiskAssessment = (projectId: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'risk-assessment'],
    queryFn: () => portfolioService.riskAssessment(projectId),
    enabled: !!projectId,
  });

export const usePortfolioReport = (projectId: string, reportType: string, accountId?: string) =>
  useQuery({
    queryKey: ['portfolio', projectId, 'reports', reportType, accountId],
    queryFn: () => portfolioService.report(projectId, reportType, accountId),
    enabled: !!projectId && !!reportType,
  });

export const usePortfolioAskAI = (projectId: string) =>
  useMutation({
    mutationFn: (question: string) => portfolioService.askAI(projectId, question),
  });

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskService } from '../api/risk';

export const useRiskDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['risk', projectId, 'dashboard'],
    queryFn: () => riskService.dashboard(projectId),
    enabled: !!projectId,
  });
};

export const useRiskDrawdown = (projectId: string) => {
  return useQuery({
    queryKey: ['risk', projectId, 'drawdown'],
    queryFn: () => riskService.drawdown(projectId),
    enabled: !!projectId,
  });
};

export const useRiskHistory = (projectId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['risk', projectId, 'history', days],
    queryFn: () => riskService.history(projectId, days),
    enabled: !!projectId,
  });
};

export const useRiskRules = (projectId: string) => {
  return useQuery({
    queryKey: ['risk', projectId, 'rules'],
    queryFn: () => riskService.rules(projectId),
    enabled: !!projectId,
  });
};

export const useCreateRiskRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; rule_type: string; description?: string; limit_value: number; is_active?: boolean; severity?: string; rule_config?: Record<string, unknown> }) =>
      riskService.createRule(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk', projectId, 'rules'] }),
  });
};

export const useUpdateRiskRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: Record<string, unknown> }) =>
      riskService.updateRule(projectId, ruleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk', projectId, 'rules'] }),
  });
};

export const useDeleteRiskRule = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => riskService.deleteRule(projectId, ruleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk', projectId, 'rules'] }),
  });
};

export const useRiskAlerts = (projectId: string) => {
  return useQuery({
    queryKey: ['risk', projectId, 'alerts'],
    queryFn: () => riskService.alerts(projectId),
    enabled: !!projectId,
  });
};

export const useDismissAlert = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => riskService.dismissAlert(projectId, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk', projectId, 'alerts'] }),
  });
};

export const useValidateTrade = (projectId: string) => {
  return useMutation({
    mutationFn: (data: { pair: string; direction: string; entry_price: number; stop_loss: number; take_profit?: number; position_size?: number; risk_percent?: number }) =>
      riskService.validate(projectId, data),
  });
};

export const useCalculatePositionSize = (projectId: string) => {
  return useMutation({
    mutationFn: (data: { account_balance: number; risk_percent: number; entry_price: number; stop_loss: number; pip_value?: number; instrument?: string; account_currency?: string }) =>
      riskService.positionSize(projectId, data),
  });
};

export const useRiskViolations = (projectId: string) => {
  return useQuery({
    queryKey: ['risk', projectId, 'violations'],
    queryFn: () => riskService.violations(projectId),
    enabled: !!projectId,
  });
};

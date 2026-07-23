import api from '../services/api';
import type {
  RiskDashboard,
  RiskRule,
  RiskAlert,
  DrawdownPoint,
  RiskHistoryPoint,
  TradeValidationResult,
  PositionSizeResult,
  RuleViolation,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/risk`;

export const riskService = {
  dashboard: (projectId: string) =>
    api.get<RiskDashboard>(`${base(projectId)}/dashboard`).then((r) => r.data),

  drawdown: (projectId: string) =>
    api.get<DrawdownPoint[]>(`${base(projectId)}/drawdown`).then((r) => r.data),

  history: (projectId: string, days: number = 30) =>
    api.get<RiskHistoryPoint[]>(`${base(projectId)}/history`, { params: { days } }).then((r) => r.data),

  rules: (projectId: string) =>
    api.get<RiskRule[]>(`${base(projectId)}/rules`).then((r) => r.data),

  createRule: (projectId: string, data: { name: string; rule_type: string; description?: string; limit_value: number; is_active?: boolean; severity?: string; rule_config?: Record<string, unknown> }) =>
    api.post<RiskRule>(`${base(projectId)}/rules`, data).then((r) => r.data),

  updateRule: (projectId: string, ruleId: string, data: Partial<RiskRule>) =>
    api.put<RiskRule>(`${base(projectId)}/rules/${ruleId}`, data).then((r) => r.data),

  deleteRule: (projectId: string, ruleId: string) =>
    api.delete(`${base(projectId)}/rules/${ruleId}`).then((r) => r.data),

  alerts: (projectId: string) =>
    api.get<RiskAlert[]>(`${base(projectId)}/alerts`).then((r) => r.data),

  createAlert: (projectId: string, data: { alert_type: string; severity?: string; title: string; message: string; metadata_json?: Record<string, unknown> }) =>
    api.post<RiskAlert>(`${base(projectId)}/alerts`, data).then((r) => r.data),

  dismissAlert: (projectId: string, alertId: string) =>
    api.post(`${base(projectId)}/alerts/${alertId}/dismiss`).then((r) => r.data),

  validate: (projectId: string, data: { pair: string; direction: string; entry_price: number; stop_loss: number; take_profit?: number; position_size?: number; risk_percent?: number }) =>
    api.post<TradeValidationResult>(`${base(projectId)}/validate`, data).then((r) => r.data),

  positionSize: (projectId: string, data: { account_balance: number; risk_percent: number; entry_price: number; stop_loss: number; pip_value?: number; instrument?: string; account_currency?: string }) =>
    api.post<PositionSizeResult>(`${base(projectId)}/position-size`, data).then((r) => r.data),

  violations: (projectId: string) =>
    api.get<RuleViolation[]>(`${base(projectId)}/violations`).then((r) => r.data),
};

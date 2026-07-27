import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { RiskDashboard, RiskRule, RiskAlert, DrawdownPoint, RiskHistoryPoint, TradeValidationResult, PositionSizeResult, RuleViolation } from './types';

export const riskService = {
  dashboard: async (projectId: string): Promise<RiskDashboard> => {
    const { data, error } = await supabase.rpc('get_risk_dashboard', { p_project_id: projectId });
    if (error) throw error;
    return (data ?? {}) as unknown as RiskDashboard;
  },

  drawdown: async (projectId: string): Promise<DrawdownPoint[]> => {
    const { data, error } = await supabase.rpc('get_drawdown_data', { p_project_id: projectId });
    if (error) throw error;
    return (data ?? []) as DrawdownPoint[];
  },

  history: async (projectId: string, days: number = 30): Promise<RiskHistoryPoint[]> => {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase.from('risk_snapshot').select('*').eq('project_id', projectId).gte('snapshot_date', since).order('snapshot_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as RiskHistoryPoint[];
  },

  rules: async (projectId: string): Promise<RiskRule[]> => {
    const { data, error } = await supabase.from('risk_rule').select('*').eq('project_id', projectId).is('deleted_at', null);
    if (error) throw error;
    return (data ?? []) as RiskRule[];
  },

  createRule: async (projectId: string, data: { name: string; rule_type: string; description?: string; limit_value: number; is_active?: boolean; severity?: string; rule_config?: Record<string, unknown> }): Promise<RiskRule> => {
    const { data: row, error } = await supabase.from('risk_rule').insert({ ...data, project_id: projectId }).select().single();
    if (error) throw error;
    return row as RiskRule;
  },

  updateRule: async (projectId: string, ruleId: string, data: Partial<RiskRule>): Promise<RiskRule> => {
    const { data: row, error } = await supabase.from('risk_rule').update(data).eq('id', ruleId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as RiskRule;
  },

  deleteRule: async (projectId: string, ruleId: string): Promise<void> => {
    const { error } = await supabase.from('risk_rule').update({ deleted_at: new Date().toISOString() }).eq('id', ruleId).eq('project_id', projectId);
    if (error) throw error;
  },

  alerts: async (projectId: string): Promise<RiskAlert[]> => {
    const { data, error } = await supabase.from('risk_alert').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as RiskAlert[];
  },

  createAlert: async (projectId: string, data: { alert_type: string; severity?: string; title: string; message: string; metadata_json?: Record<string, unknown> }): Promise<RiskAlert> => {
    const { data: row, error } = await supabase.from('risk_alert').insert({ ...data, project_id: projectId }).select().single();
    if (error) throw error;
    return row as RiskAlert;
  },

  dismissAlert: async (projectId: string, alertId: string): Promise<void> => {
    const { error } = await supabase.from('risk_alert').update({ is_dismissed: true }).eq('id', alertId).eq('project_id', projectId);
    if (error) throw error;
  },

  validate: async (projectId: string, data: { pair: string; direction: string; entry_price: number; stop_loss: number; take_profit?: number; position_size?: number; risk_percent?: number }): Promise<TradeValidationResult> => {
    const { data: row, error } = await supabase.from('trade_validation').insert({ ...data, project_id: projectId }).select().single();
    if (error) throw error;
    return row as TradeValidationResult;
  },

  positionSize: async (_projectId: string, data: { account_balance: number; risk_percent: number; entry_price: number; stop_loss: number; contract_size?: number }): Promise<PositionSizeResult> => {
    const { data: result, error } = await supabase.rpc('calculate_position_size', {
      p_account_balance: data.account_balance,
      p_risk_percent: data.risk_percent,
      p_entry_price: data.entry_price,
      p_stop_loss: data.stop_loss,
      p_contract_size: data.contract_size ?? 1,
    });
    if (error) throw error;
    return (result ?? {}) as unknown as PositionSizeResult;
  },

  violations: async (projectId: string): Promise<RuleViolation[]> => {
    const { data, error } = await supabase.from('risk_rule').select('*').eq('project_id', projectId).eq('is_active', true).gt('violation_count', 0);
    if (error) throw error;
    return (data ?? []) as unknown as RuleViolation[];
  },
};

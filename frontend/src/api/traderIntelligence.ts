import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { TradeDebrief, PersonalPattern, PersonalRule, TraderProfile, TraderProfileSnapshot, DashboardData } from './types';

export type { TradeDebrief, PersonalPattern, PersonalRule, TraderProfile, TraderProfileSnapshot, DashboardData };

export const traderIntelligenceService = {
  dashboard: async (projectId: string): Promise<DashboardData> => {
    const { data: profile } = await supabase.from('trader_profile').select('*').eq('project_id', projectId).maybeSingle();
    const { data: debriefs } = await supabase.from('trade_debrief').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5);
    const { count: debriefCount } = await supabase.from('trade_debrief').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    const { count: patternCount } = await supabase.from('personal_pattern').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('active', true);
    const { count: ruleCount } = await supabase.from('personal_rule').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    const { count: approvedRuleCount } = await supabase.from('personal_rule').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'approved');
    return { debrief_count: debriefCount ?? 0, pattern_count: patternCount ?? 0, rule_count: ruleCount ?? 0, approved_rule_count: approvedRuleCount ?? 0, profile: profile as TraderProfile | null, recent_debriefs: (debriefs ?? []) as TradeDebrief[] };
  },

  listDebriefs: async (projectId: string, params?: { skip?: number; limit?: number; trade_id?: string }): Promise<TradeDebrief[]> => {
    let query = supabase.from('trade_debrief').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (params?.trade_id) query = query.eq('trade_id', params.trade_id);
    if (params?.limit) query = query.range(params.skip ?? 0, (params.skip ?? 0) + params.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TradeDebrief[];
  },

  getDebrief: async (projectId: string, debriefId: string): Promise<TradeDebrief> => {
    const { data, error } = await supabase.from('trade_debrief').select('*').eq('id', debriefId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as TradeDebrief;
  },

  searchDebriefs: async (projectId: string, q: string, limit?: number): Promise<TradeDebrief[]> => {
    const { data, error } = await supabase.from('trade_debrief').select('*').eq('project_id', projectId).or(`summary.ilike.%${q}%,lessons_learned.ilike.%${q}%`).order('created_at', { ascending: false }).limit(limit ?? 20);
    if (error) throw error;
    return (data ?? []) as TradeDebrief[];
  },

  generateDebrief: (projectId: string, tradeId: string): Promise<{ debrief: TradeDebrief; message: string }> =>
    callEdgeFunction('ai', { operation: 'generate-debrief', project_id: projectId, data: { trade_id: tradeId } }),

  updateDebrief: async (projectId: string, debriefId: string, data: Partial<TradeDebrief>): Promise<TradeDebrief> => {
    const { data: row, error } = await supabase.from('trade_debrief').update(data).eq('id', debriefId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as TradeDebrief;
  },

  deleteDebrief: async (projectId: string, debriefId: string): Promise<void> => {
    const { error } = await supabase.from('trade_debrief').delete().eq('id', debriefId).eq('project_id', projectId);
    if (error) throw error;
  },

  listPatterns: async (projectId: string, params?: { skip?: number; limit?: number; category?: string; active?: boolean }): Promise<PersonalPattern[]> => {
    let query = supabase.from('personal_pattern').select('*').eq('project_id', projectId).order('occurrence_count', { ascending: false });
    if (params?.category) query = query.eq('category', params.category);
    if (params?.active !== undefined) query = query.eq('active', params.active);
    if (params?.limit) query = query.range(params.skip ?? 0, (params.skip ?? 0) + params.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PersonalPattern[];
  },

  getPattern: async (projectId: string, patternId: string): Promise<PersonalPattern> => {
    const { data, error } = await supabase.from('personal_pattern').select('*').eq('id', patternId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as PersonalPattern;
  },

  detectPatterns: (projectId: string, _limit?: number): Promise<PersonalPattern[]> =>
    callEdgeFunction('ai', { operation: 'detect-patterns', project_id: projectId }),

  updatePattern: async (projectId: string, patternId: string, data: Partial<PersonalPattern>): Promise<PersonalPattern> => {
    const { data: row, error } = await supabase.from('personal_pattern').update(data).eq('id', patternId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PersonalPattern;
  },

  deletePattern: async (projectId: string, patternId: string): Promise<void> => {
    const { error } = await supabase.from('personal_pattern').delete().eq('id', patternId).eq('project_id', projectId);
    if (error) throw error;
  },

  listRules: async (projectId: string, params?: { skip?: number; limit?: number; status?: string; category?: string }): Promise<PersonalRule[]> => {
    let query = supabase.from('personal_rule').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.limit) query = query.range(params.skip ?? 0, (params.skip ?? 0) + params.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PersonalRule[];
  },

  getRulesForApproval: async (projectId: string, limit?: number): Promise<PersonalRule[]> => {
    const { data, error } = await supabase.from('personal_rule').select('*').eq('project_id', projectId).eq('status', 'draft').order('created_at', { ascending: false }).limit(limit ?? 50);
    if (error) throw error;
    return (data ?? []) as PersonalRule[];
  },

  getRule: async (projectId: string, ruleId: string): Promise<PersonalRule> => {
    const { data, error } = await supabase.from('personal_rule').select('*').eq('id', ruleId).eq('project_id', projectId).single();
    if (error) throw error;
    return data as PersonalRule;
  },

  generateRules: (projectId: string): Promise<{ rules: PersonalRule[]; message: string }> =>
    callEdgeFunction('ai', { operation: 'generate-rules', project_id: projectId }),

  approveRule: async (projectId: string, ruleId: string, notes?: string): Promise<PersonalRule> => {
    const { data: row, error } = await supabase.from('personal_rule').update({ status: 'approved', approved_at: new Date().toISOString(), rejection_reason: notes || null }).eq('id', ruleId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PersonalRule;
  },

  rejectRule: async (projectId: string, ruleId: string, reason: string): Promise<PersonalRule> => {
    const { data: row, error } = await supabase.from('personal_rule').update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason }).eq('id', ruleId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PersonalRule;
  },

  updateRule: async (projectId: string, ruleId: string, data: Partial<PersonalRule>): Promise<PersonalRule> => {
    const { data: row, error } = await supabase.from('personal_rule').update(data).eq('id', ruleId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as PersonalRule;
  },

  deleteRule: async (projectId: string, ruleId: string): Promise<void> => {
    const { error } = await supabase.from('personal_rule').delete().eq('id', ruleId).eq('project_id', projectId);
    if (error) throw error;
  },

  getProfile: async (projectId: string): Promise<TraderProfile> => {
    const { data, error } = await supabase.from('trader_profile').select('*').eq('project_id', projectId).maybeSingle();
    if (error) throw error;
    return data as TraderProfile;
  },

  buildProfile: (projectId: string): Promise<TraderProfile> =>
    callEdgeFunction('ai', { operation: 'build-profile', project_id: projectId }),

  getSnapshots: async (projectId: string, limit?: number): Promise<TraderProfileSnapshot[]> => {
    const { data, error } = await supabase.from('trader_profile_snapshot').select('*').eq('project_id', projectId).order('snapshot_date', { ascending: false }).limit(limit ?? 20);
    if (error) throw error;
    return (data ?? []) as TraderProfileSnapshot[];
  },
};

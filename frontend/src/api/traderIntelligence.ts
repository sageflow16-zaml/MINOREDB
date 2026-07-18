import api from '../services/api';

export interface TradeDebrief {
  id: string;
  project_id: string;
  trade_id: string;
  entry_review: string | null;
  execution_review: string | null;
  exit_review: string | null;
  psychology_review: string | null;
  lessons_learned: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  mistakes: string[] | null;
  improvements: string[] | null;
  overall_rating: number | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalPattern {
  id: string;
  project_id: string;
  name: string;
  category: string;
  signature: Record<string, unknown> | null;
  description: string | null;
  trade_ids: string[] | null;
  occurrence_count: number;
  win_count: number;
  loss_count: number;
  total_pnl: number | null;
  avg_rr: number | null;
  confidence: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalRule {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  version: number;
  evidence: Record<string, unknown> | null;
  supporting_stats: Record<string, unknown> | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TraderProfile {
  id: string;
  project_id: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  trading_habits: Record<string, unknown> | null;
  discipline_score: number | null;
  rule_adherence: Record<string, unknown> | null;
  performance_trends: Record<string, unknown> | null;
  total_trades_analyzed: number;
  total_debriefs: number;
  active_patterns: number;
  approved_rules: number;
  improvement_suggestions: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TraderProfileSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  strengths: string[] | null;
  weaknesses: string[] | null;
  discipline_score: number | null;
  rule_adherence: Record<string, unknown> | null;
  total_trades_analyzed: number;
  total_debriefs: number;
  active_patterns: number;
  approved_rules: number;
  created_at: string;
}

export interface DashboardData {
  debrief_count: number;
  pattern_count: number;
  rule_count: number;
  approved_rule_count: number;
  profile: TraderProfile | null;
  recent_debriefs: TradeDebrief[];
}

const base = (projectId: string) => `/projects/${projectId}/trader-intelligence`;

export const traderIntelligenceService = {
  dashboard: (projectId: string) =>
    api.get<DashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  listDebriefs: (projectId: string, params?: { skip?: number; limit?: number; trade_id?: string }) =>
    api.get<TradeDebrief[]>(`${base(projectId)}/debriefs`, { params }).then((r) => r.data),

  getDebrief: (projectId: string, debriefId: string) =>
    api.get<TradeDebrief>(`${base(projectId)}/debriefs/${debriefId}`).then((r) => r.data),

  searchDebriefs: (projectId: string, q: string, limit?: number) =>
    api.get<TradeDebrief[]>(`${base(projectId)}/debriefs/search`, { params: { q, limit } }).then((r) => r.data),

  generateDebrief: (projectId: string, tradeId: string) =>
    api.post<{ debrief: TradeDebrief; message: string }>(
      `${base(projectId)}/debriefs/generate`,
      { trade_id: tradeId }
    ).then((r) => r.data),

  updateDebrief: (projectId: string, debriefId: string, data: Partial<TradeDebrief>) =>
    api.put<TradeDebrief>(`${base(projectId)}/debriefs/${debriefId}`, data).then((r) => r.data),

  deleteDebrief: (projectId: string, debriefId: string) =>
    api.delete(`${base(projectId)}/debriefs/${debriefId}`),

  listPatterns: (projectId: string, params?: { skip?: number; limit?: number; category?: string; active?: boolean }) =>
    api.get<PersonalPattern[]>(`${base(projectId)}/patterns`, { params }).then((r) => r.data),

  getPattern: (projectId: string, patternId: string) =>
    api.get<PersonalPattern>(`${base(projectId)}/patterns/${patternId}`).then((r) => r.data),

  detectPatterns: (projectId: string, limit?: number) =>
    api.post<PersonalPattern[]>(`${base(projectId)}/patterns/detect`, null, { params: { limit } }).then((r) => r.data),

  updatePattern: (projectId: string, patternId: string, data: Partial<PersonalPattern>) =>
    api.put<PersonalPattern>(`${base(projectId)}/patterns/${patternId}`, data).then((r) => r.data),

  deletePattern: (projectId: string, patternId: string) =>
    api.delete(`${base(projectId)}/patterns/${patternId}`),

  listRules: (projectId: string, params?: { skip?: number; limit?: number; status?: string; category?: string }) =>
    api.get<PersonalRule[]>(`${base(projectId)}/rules`, { params }).then((r) => r.data),

  getRulesForApproval: (projectId: string, limit?: number) =>
    api.get<PersonalRule[]>(`${base(projectId)}/rules/for-approval`, { params: { limit } }).then((r) => r.data),

  getRule: (projectId: string, ruleId: string) =>
    api.get<PersonalRule>(`${base(projectId)}/rules/${ruleId}`).then((r) => r.data),

  generateRules: (projectId: string) =>
    api.post<{ rules: PersonalRule[]; message: string }>(`${base(projectId)}/rules/generate`).then((r) => r.data),

  approveRule: (projectId: string, ruleId: string, notes?: string) =>
    api.post<PersonalRule>(`${base(projectId)}/rules/${ruleId}/approve`, { notes }).then((r) => r.data),

  rejectRule: (projectId: string, ruleId: string, reason: string) =>
    api.post<PersonalRule>(`${base(projectId)}/rules/${ruleId}/reject`, { reason }).then((r) => r.data),

  updateRule: (projectId: string, ruleId: string, data: Partial<PersonalRule>) =>
    api.put<PersonalRule>(`${base(projectId)}/rules/${ruleId}`, data).then((r) => r.data),

  deleteRule: (projectId: string, ruleId: string) =>
    api.delete(`${base(projectId)}/rules/${ruleId}`),

  getProfile: (projectId: string) =>
    api.get<TraderProfile>(`${base(projectId)}/profile`).then((r) => r.data),

  buildProfile: (projectId: string) =>
    api.post<TraderProfile>(`${base(projectId)}/profile/build`).then((r) => r.data),

  getSnapshots: (projectId: string, limit?: number) =>
    api.get<TraderProfileSnapshot[]>(`${base(projectId)}/profile/snapshots`, { params: { limit } }).then((r) => r.data),
};

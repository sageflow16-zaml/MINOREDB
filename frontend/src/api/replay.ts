import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';

export interface MarketCandle {
  id: string; pair: string; timeframe: string; timestamp: string;
  open: number; high: number; low: number; close: number; volume: number; candle_index: number;
}
export interface ReplaySession {
  id: string; project_id: string; pair: string; timeframe: string;
  start_date: string; current_date: string; end_date: string;
  current_candle: number; total_candles: number; status: string;
  started_at: string; completed_at: string | null; notes: string | null; created_at: string;
}
export interface ReplayTrade {
  id: string; session_id: string; trade_id: string | null;
  candle_index: number; direction: string | null; entry_price: number | null;
  stop_loss: number | null; take_profit: number | null; position_size: number | null;
  risk_percent: number | null; notes: string | null; confidence: number | null; created_at: string;
}
export interface ReplayBookmark {
  id: string; session_id: string; candle_index: number; date: string; note: string | null; created_at: string;
}
export interface ReplayAnnotation {
  id: string; created_at: string; updated_at: string; session_id: string;
  candle_index: number; annotation_type: string; content?: Record<string, unknown>;
  color?: string; label?: string;
}
export interface ReplayTimelineEvent {
  id: string; created_at: string; session_id: string; candle_index: number;
  event_type: string; title?: string; description?: string; severity?: string; metadata?: Record<string, unknown>;
}
export interface ReplayReview {
  id: string; created_at: string; updated_at: string; session_id: string;
  went_well?: string; went_wrong?: string; rule_violations?: string;
  execution_quality?: string; risk_management?: string; psychology?: string;
  confidence_score?: number; trade_grade?: string; discipline_score?: number;
  completed_checklist?: string[]; missed_checklist?: string[]; rule_compliance?: number;
}
export interface ReplayMistake {
  id: string; created_at: string; session_id: string;
  mistake_type?: string; severity?: string; description?: string;
  candle_index?: number; preventable?: boolean; recommendation?: string;
}
export interface ReplayScreenshot {
  id: string; created_at: string; session_id: string;
  candle_index: number; category?: string; image_url?: string; caption?: string;
}
export interface ReplayWorkspaceState {
  session: ReplaySession; candle: MarketCandle | null;
  candles_visible: MarketCandle[]; trades: ReplayTrade[];
  bookmarks: ReplayBookmark[]; annotations: ReplayAnnotation[];
  timeline_events: ReplayTimelineEvent[]; review: ReplayReview | null;
  mistakes: ReplayMistake[]; screenshots: ReplayScreenshot[];
}

export const replayService = {
  createSession: async (projectId: string, data: { pair: string; timeframe: string; start_date: string; end_date: string; notes?: string }): Promise<ReplaySession> => {
    const { data: row, error } = await supabase.from('replay_session').insert({
      project_id: projectId, symbol: data.pair, timeframe: data.timeframe,
      start_date: data.start_date, end_date: data.end_date, notes: data.notes,
      status: 'created', current_index: 0,
    }).select().single();
    if (error) throw error;
    return row as unknown as ReplaySession;
  },

  listSessions: async (projectId: string): Promise<ReplaySession[]> => {
    const { data, error } = await supabase.from('replay_session').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ReplaySession[];
  },

  getSession: async (projectId: string, sessionId: string): Promise<ReplayWorkspaceState> => {
    const { error } = await supabase.from('replay_session').select('id').eq('id', sessionId).eq('project_id', projectId).single();
    if (error) throw error;
    return callEdgeFunction<ReplayWorkspaceState>('replay-data', { operation: 'load-workspace', project_id: projectId, data: { session_id: sessionId } });
  },

  fetchCandles: async (projectId: string, data: { symbol: string; timeframe: string; start_date?: string; end_date?: string; force?: boolean }): Promise<{ symbol: string; timeframe: string; count: number; source: string }> =>
    callEdgeFunction('replay-data', { operation: 'fetch-candles', project_id: projectId, data }),

  nextCandle: (projectId: string, sessionId: string) =>
    callEdgeFunction<ReplayWorkspaceState>('replay-data', { operation: 'next-candle', project_id: projectId, data: { session_id: sessionId } }),
  prevCandle: (projectId: string, sessionId: string) =>
    callEdgeFunction<ReplayWorkspaceState>('replay-data', { operation: 'prev-candle', project_id: projectId, data: { session_id: sessionId } }),
  jumpToCandle: (projectId: string, sessionId: string, candleIndex: number) =>
    callEdgeFunction<ReplayWorkspaceState>('replay-data', { operation: 'jump-to-candle', project_id: projectId, data: { session_id: sessionId, candle_index: candleIndex } }),
  pauseSession: async (projectId: string, sessionId: string): Promise<ReplaySession> => {
    const { data, error } = await supabase.from('replay_session').update({ status: 'paused' }).eq('id', sessionId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data as unknown as ReplaySession;
  },
  resumeSession: async (projectId: string, sessionId: string): Promise<ReplaySession> => {
    const { data, error } = await supabase.from('replay_session').update({ status: 'active' }).eq('id', sessionId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data as unknown as ReplaySession;
  },
  finishSession: async (projectId: string, sessionId: string): Promise<ReplaySession> => {
    const { data, error } = await supabase.from('replay_session').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return data as unknown as ReplaySession;
  },

  createTrade: async (projectId: string, sessionId: string, data: { direction: string; entry_price: number; stop_loss?: number; take_profit?: number; position_size?: number; risk_percent?: number; notes?: string; confidence?: number }): Promise<ReplayTrade> => {
    const { data: row, error } = await supabase.from('replay_trade').insert({
      project_id: projectId, session_id: sessionId, direction: data.direction,
      entry_price: data.entry_price, stop_loss: data.stop_loss, take_profit: data.take_profit,
      position_size: data.position_size, risk_percent: data.risk_percent,
      notes: data.notes, confidence: data.confidence,
    }).select().single();
    if (error) throw error;
    return row as unknown as ReplayTrade;
  },

  createBookmark: async (projectId: string, sessionId: string, data: { candle_index: number; date: string; note?: string }): Promise<ReplayBookmark> => {
    const { data: row, error } = await supabase.from('replay_bookmark').insert({
      project_id: projectId, session_id: sessionId, candle_index: data.candle_index, notes: data.note,
    }).select().single();
    if (error) throw error;
    return { ...row, date: row.created_at, note: (row as any).notes } as unknown as ReplayBookmark;
  },

  deleteBookmark: async (_projectId: string, bookmarkId: string): Promise<void> => {
    const { error } = await supabase.from('replay_bookmark').delete().eq('id', bookmarkId);
    if (error) throw error;
  },

  updateBookmark: async (_projectId: string, bookmarkId: string, note: string): Promise<ReplayBookmark> => {
    const { data, error } = await supabase.from('replay_bookmark').update({ notes: note }).eq('id', bookmarkId).select().single();
    if (error) throw error;
    return { ...data, date: data.created_at, note: (data as any).notes } as unknown as ReplayBookmark;
  },

  getDashboard: async (projectId: string): Promise<{ total_sessions: number; total_trades: number; avg_rr: number; avg_win_rate: number; learning_progress: number; knowledge_growth: number }> => {
    const { count: total_sessions } = await supabase.from('replay_session').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    const { count: total_trades } = await supabase.from('replay_trade').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    return { total_sessions: total_sessions ?? 0, total_trades: total_trades ?? 0, avg_rr: 0, avg_win_rate: 0, learning_progress: 0, knowledge_growth: 0 };
  },

  createAnnotation: async (projectId: string, sessionId: string, data: { candle_index: number; annotation_type: string; content?: Record<string, unknown>; color?: string; label?: string }): Promise<ReplayAnnotation> => {
    const { data: row, error } = await supabase.from('replay_annotation').insert({
      project_id: projectId, session_id: sessionId, candle_index: data.candle_index,
      annotation_type: data.annotation_type, data: data.content, color: data.color, label: data.label,
    }).select().single();
    if (error) throw error;
    return { ...row, content: (row as any).data } as unknown as ReplayAnnotation;
  },

  updateAnnotation: async (_projectId: string, annotationId: string, data: { content?: Record<string, unknown>; color?: string; label?: string; candle_index?: number }): Promise<ReplayAnnotation> => {
    const update: Record<string, unknown> = {};
    if (data.content !== undefined) update.data = data.content;
    if (data.color !== undefined) update.color = data.color;
    if (data.label !== undefined) update.label = data.label;
    if (data.candle_index !== undefined) update.candle_index = data.candle_index;
    const { data: row, error } = await supabase.from('replay_annotation').update(update).eq('id', annotationId).select().single();
    if (error) throw error;
    return { ...row, content: (row as any).data } as unknown as ReplayAnnotation;
  },

  deleteAnnotation: async (_projectId: string, annotationId: string): Promise<void> => {
    const { error } = await supabase.from('replay_annotation').delete().eq('id', annotationId);
    if (error) throw error;
  },

  upsertReview: async (_projectId: string, sessionId: string, data: Partial<{
    went_well: string; went_wrong: string; rule_violations: string; execution_quality: string;
    risk_management: string; psychology: string; confidence_score: number; trade_grade: string;
    discipline_score: number; completed_checklist: string[]; missed_checklist: string[]; rule_compliance: number;
  }>): Promise<ReplayReview> => {
    const existing = await supabase.from('replay_review').select('id').eq('session_id', sessionId).maybeSingle();
    const payload = { session_id: sessionId, ...data, completed_checklist: data.completed_checklist as any, missed_checklist: data.missed_checklist as any };
    let result;
    if (existing.data) {
      result = await supabase.from('replay_review').update(payload).eq('id', existing.data.id).select().single();
    } else {
      result = await supabase.from('replay_review').insert(payload).select().single();
    }
    if (result.error) throw result.error;
    return result.data as unknown as ReplayReview;
  },

  getReview: async (_projectId: string, sessionId: string): Promise<ReplayReview | null> => {
    const { data, error } = await supabase.from('replay_review').select('*').eq('session_id', sessionId).maybeSingle();
    if (error) throw error;
    return data as unknown as ReplayReview | null;
  },

  createMistake: async (projectId: string, sessionId: string, data: { mistake_type?: string; severity?: string; description?: string; candle_index?: number; preventable?: boolean; recommendation?: string }): Promise<ReplayMistake> => {
    const { data: row, error } = await supabase.from('replay_mistake').insert({
      project_id: projectId, session_id: sessionId, ...data,
    }).select().single();
    if (error) throw error;
    return row as unknown as ReplayMistake;
  },

  updateMistake: async (_projectId: string, mistakeId: string, data: { mistake_type?: string; severity?: string; description?: string; preventable?: boolean; recommendation?: string }): Promise<ReplayMistake> => {
    const { data: row, error } = await supabase.from('replay_mistake').update(data).eq('id', mistakeId).select().single();
    if (error) throw error;
    return row as unknown as ReplayMistake;
  },

  deleteMistake: async (_projectId: string, mistakeId: string): Promise<void> => {
    const { error } = await supabase.from('replay_mistake').delete().eq('id', mistakeId);
    if (error) throw error;
  },

  createScreenshot: async (projectId: string, sessionId: string, data: { candle_index: number; category?: string; image_url?: string; caption?: string }): Promise<ReplayScreenshot> => {
    const { data: row, error } = await supabase.from('replay_screenshot').insert({
      project_id: projectId, session_id: sessionId, ...data,
    }).select().single();
    if (error) throw error;
    return row as unknown as ReplayScreenshot;
  },

  updateScreenshot: async (_projectId: string, screenshotId: string, data: { category?: string; caption?: string }): Promise<ReplayScreenshot> => {
    const { data: row, error } = await supabase.from('replay_screenshot').update(data).eq('id', screenshotId).select().single();
    if (error) throw error;
    return row as unknown as ReplayScreenshot;
  },

  deleteScreenshot: async (_projectId: string, screenshotId: string): Promise<void> => {
    const { error } = await supabase.from('replay_screenshot').delete().eq('id', screenshotId);
    if (error) throw error;
  },
};

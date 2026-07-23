import api from '../services/api';

// ── Existing Types ──

export interface MarketCandle {
  id: string;
  pair: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candle_index: number;
}

export interface ReplaySession {
  id: string;
  project_id: string;
  pair: string;
  timeframe: string;
  start_date: string;
  current_date: string;
  end_date: string;
  current_candle: number;
  total_candles: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReplayTrade {
  id: string;
  session_id: string;
  trade_id: string | null;
  candle_index: number;
  direction: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_size: number | null;
  risk_percent: number | null;
  notes: string | null;
  confidence: number | null;
  created_at: string;
}

export interface ReplayBookmark {
  id: string;
  session_id: string;
  candle_index: number;
  date: string;
  note: string | null;
  created_at: string;
}

// ── New Workspace Types ──

export interface ReplayAnnotation {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  candle_index: number;
  annotation_type: string;
  content?: Record<string, unknown>;
  color?: string;
  label?: string;
}

export interface ReplayTimelineEvent {
  id: string;
  created_at: string;
  session_id: string;
  candle_index: number;
  event_type: string;
  title?: string;
  description?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
}

export interface ReplayReview {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  went_well?: string;
  went_wrong?: string;
  rule_violations?: string;
  execution_quality?: string;
  risk_management?: string;
  psychology?: string;
  confidence_score?: number;
  trade_grade?: string;
  discipline_score?: number;
  completed_checklist?: string[];
  missed_checklist?: string[];
  rule_compliance?: number;
}

export interface ReplayMistake {
  id: string;
  created_at: string;
  session_id: string;
  mistake_type?: string;
  severity?: string;
  description?: string;
  candle_index?: number;
  preventable?: boolean;
  recommendation?: string;
}

export interface ReplayScreenshot {
  id: string;
  created_at: string;
  session_id: string;
  candle_index: number;
  category?: string;
  image_url?: string;
  caption?: string;
}

export interface ReplayWorkspaceState {
  session: ReplaySession;
  candle: MarketCandle | null;
  candles_visible: MarketCandle[];
  trades: ReplayTrade[];
  bookmarks: ReplayBookmark[];
  annotations: ReplayAnnotation[];
  timeline_events: ReplayTimelineEvent[];
  review: ReplayReview | null;
  mistakes: ReplayMistake[];
  screenshots: ReplayScreenshot[];
}

// ── Service ──

export const replayService = {
  createSession: (projectId: string, data: { pair: string; timeframe: string; start_date: string; end_date: string; notes?: string }) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions`, data).then((r) => r.data),

  listSessions: (projectId: string) =>
    api.get<ReplaySession[]>(`/projects/${projectId}/replay/sessions`).then((r) => r.data),

  getSession: (projectId: string, sessionId: string) =>
    api.get<ReplayWorkspaceState>(`/projects/${projectId}/replay/sessions/${sessionId}`).then((r) => r.data),

  nextCandle: (projectId: string, sessionId: string) =>
    api.post<ReplayWorkspaceState>(`/projects/${projectId}/replay/sessions/${sessionId}/next`).then((r) => r.data),

  prevCandle: (projectId: string, sessionId: string) =>
    api.post<ReplayWorkspaceState>(`/projects/${projectId}/replay/sessions/${sessionId}/prev`).then((r) => r.data),

  jumpToCandle: (projectId: string, sessionId: string, candleIndex: number) =>
    api.post<ReplayWorkspaceState>(`/projects/${projectId}/replay/sessions/${sessionId}/jump?candle_index=${candleIndex}`).then((r) => r.data),

  pauseSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/pause`).then((r) => r.data),

  resumeSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/resume`).then((r) => r.data),

  finishSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/finish`).then((r) => r.data),

  createTrade: (projectId: string, sessionId: string, data: { direction: string; entry_price: number; stop_loss?: number; take_profit?: number; position_size?: number; risk_percent?: number; notes?: string; confidence?: number }) =>
    api.post<ReplayWorkspaceState>(`/projects/${projectId}/replay/sessions/${sessionId}/trades`, data).then((r) => r.data),

  createBookmark: (projectId: string, sessionId: string, data: { candle_index: number; date: string; note?: string }) =>
    api.post<ReplayBookmark>(`/projects/${projectId}/replay/sessions/${sessionId}/bookmarks`, data).then((r) => r.data),

  deleteBookmark: (projectId: string, bookmarkId: string) =>
    api.delete(`/projects/${projectId}/replay/bookmarks/${bookmarkId}`),

  updateBookmark: (projectId: string, bookmarkId: string, note: string) =>
    api.patch<ReplayBookmark>(`/projects/${projectId}/replay/bookmarks/${bookmarkId}`, { note }).then((r) => r.data),

  getDashboard: (projectId: string) =>
    api.get<{ total_sessions: number; total_trades: number; avg_rr: number; avg_win_rate: number; learning_progress: number; knowledge_growth: number }>(
      `/projects/${projectId}/replay/dashboard`,
    ).then((r) => r.data),

  // ── New Workspace Endpoints ──

  createAnnotation: (projectId: string, sessionId: string, data: { candle_index: number; annotation_type: string; content?: Record<string, unknown>; color?: string; label?: string }) =>
    api.post<ReplayAnnotation>(`/projects/${projectId}/replay/sessions/${sessionId}/annotations`, data).then((r) => r.data),

  updateAnnotation: (projectId: string, annotationId: string, data: { content?: Record<string, unknown>; color?: string; label?: string; candle_index?: number }) =>
    api.patch<ReplayAnnotation>(`/projects/${projectId}/replay/annotations/${annotationId}`, data).then((r) => r.data),

  deleteAnnotation: (projectId: string, annotationId: string) =>
    api.delete(`/projects/${projectId}/replay/annotations/${annotationId}`),

  upsertReview: (projectId: string, sessionId: string, data: Partial<{
    went_well: string; went_wrong: string; rule_violations: string; execution_quality: string;
    risk_management: string; psychology: string; confidence_score: number; trade_grade: string;
    discipline_score: number; completed_checklist: string[]; missed_checklist: string[]; rule_compliance: number;
  }>) =>
    api.put<ReplayReview>(`/projects/${projectId}/replay/sessions/${sessionId}/review`, data).then((r) => r.data),

  getReview: (projectId: string, sessionId: string) =>
    api.get<ReplayReview | null>(`/projects/${projectId}/replay/sessions/${sessionId}/review`).then((r) => r.data),

  createMistake: (projectId: string, sessionId: string, data: { mistake_type?: string; severity?: string; description?: string; candle_index?: number; preventable?: boolean; recommendation?: string }) =>
    api.post<ReplayMistake>(`/projects/${projectId}/replay/sessions/${sessionId}/mistakes`, data).then((r) => r.data),

  updateMistake: (projectId: string, mistakeId: string, data: { mistake_type?: string; severity?: string; description?: string; preventable?: boolean; recommendation?: string }) =>
    api.patch<ReplayMistake>(`/projects/${projectId}/replay/mistakes/${mistakeId}`, data).then((r) => r.data),

  deleteMistake: (projectId: string, mistakeId: string) =>
    api.delete(`/projects/${projectId}/replay/mistakes/${mistakeId}`),

  createScreenshot: (projectId: string, sessionId: string, data: { candle_index: number; category?: string; image_url?: string; caption?: string }) =>
    api.post<ReplayScreenshot>(`/projects/${projectId}/replay/sessions/${sessionId}/screenshots`, data).then((r) => r.data),

  updateScreenshot: (projectId: string, screenshotId: string, data: { category?: string; caption?: string }) =>
    api.patch<ReplayScreenshot>(`/projects/${projectId}/replay/screenshots/${screenshotId}`, data).then((r) => r.data),

  deleteScreenshot: (projectId: string, screenshotId: string) =>
    api.delete(`/projects/${projectId}/replay/screenshots/${screenshotId}`),
};

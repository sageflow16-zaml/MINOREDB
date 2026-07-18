import api from '../services/api';

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

export interface ReplayState {
  session: ReplaySession;
  candle: MarketCandle | null;
  candles_visible: MarketCandle[];
  trades: ReplayTrade[];
  bookmarks: ReplayBookmark[];
}

export const replayService = {
  createSession: (projectId: string, data: { pair: string; timeframe: string; start_date: string; end_date: string; notes?: string }) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions`, data).then((r) => r.data),

  listSessions: (projectId: string) =>
    api.get<ReplaySession[]>(`/projects/${projectId}/replay/sessions`).then((r) => r.data),

  getSession: (projectId: string, sessionId: string) =>
    api.get<ReplayState>(`/projects/${projectId}/replay/sessions/${sessionId}`).then((r) => r.data),

  nextCandle: (projectId: string, sessionId: string) =>
    api.post<ReplayState>(`/projects/${projectId}/replay/sessions/${sessionId}/next`).then((r) => r.data),

  prevCandle: (projectId: string, sessionId: string) =>
    api.post<ReplayState>(`/projects/${projectId}/replay/sessions/${sessionId}/prev`).then((r) => r.data),

  jumpToCandle: (projectId: string, sessionId: string, candleIndex: number) =>
    api.post<ReplayState>(`/projects/${projectId}/replay/sessions/${sessionId}/jump?candle_index=${candleIndex}`).then((r) => r.data),

  pauseSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/pause`).then((r) => r.data),

  resumeSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/resume`).then((r) => r.data),

  finishSession: (projectId: string, sessionId: string) =>
    api.post<ReplaySession>(`/projects/${projectId}/replay/sessions/${sessionId}/finish`).then((r) => r.data),

  createTrade: (projectId: string, sessionId: string, data: { direction: string; entry_price: number; stop_loss?: number; take_profit?: number; position_size?: number; risk_percent?: number; notes?: string; confidence?: number }) =>
    api.post<ReplayState>(`/projects/${projectId}/replay/sessions/${sessionId}/trades`, data).then((r) => r.data),

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
};

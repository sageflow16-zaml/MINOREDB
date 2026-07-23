import api from '../services/api';
import type {
  EconomicEvent,
  MarketRegime,
  CorrelationData,
  LiquidityLevel,
  MarketStructurePoint,
  SessionAnalysis,
  Watchlist,
  WatchlistItem,
  MarketAlert,
  MarketTimelineEvent,
  DataProviderConfig,
  MarketDashboardData,
  CorrelationMatrix,
  SessionStats,
  MarketAIContext,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/market-intel`;

export const marketIntelService = {
  // Dashboard
  dashboard: (projectId: string) =>
    api.get<MarketDashboardData>(`${base(projectId)}/dashboard`).then((r) => r.data),

  // Events
  events: (projectId: string, startDate?: string, endDate?: string, country?: string, impact?: string, category?: string) =>
    api.get<EconomicEvent[]>(`${base(projectId)}/events`, {
      params: { start_date: startDate, end_date: endDate, country, impact, category },
    }).then((r) => r.data),

  createEvent: (projectId: string, data: Partial<EconomicEvent>) =>
    api.post<EconomicEvent>(`${base(projectId)}/events`, data).then((r) => r.data),

  updateEvent: (projectId: string, eventId: string, data: Partial<EconomicEvent>) =>
    api.put<EconomicEvent>(`${base(projectId)}/events/${eventId}`, data).then((r) => r.data),

  deleteEvent: (projectId: string, eventId: string) =>
    api.delete(`${base(projectId)}/events/${eventId}`).then((r) => r.data),

  toggleFavorite: (projectId: string, eventId: string) =>
    api.put<EconomicEvent>(`${base(projectId)}/events/${eventId}/favorite`).then((r) => r.data),

  favorites: (projectId: string) =>
    api.get<EconomicEvent[]>(`${base(projectId)}/events/favorites`).then((r) => r.data),

  // Regime
  regimes: (projectId: string, symbol?: string) =>
    api.get<MarketRegime[]>(`${base(projectId)}/regimes`, { params: { symbol } }).then((r) => r.data),

  activeRegime: (projectId: string, symbol?: string) =>
    api.get<MarketRegime | null>(`${base(projectId)}/regimes/active`, { params: { symbol } }).then((r) => r.data),

  detectRegime: (projectId: string, symbol?: string, metrics?: Record<string, unknown>) =>
    api.post<MarketRegime>(`${base(projectId)}/regimes/detect`, { symbol, metrics }).then((r) => r.data),

  // Correlations
  correlations: (projectId: string, symbol?: string, period?: string) =>
    api.get<CorrelationData[]>(`${base(projectId)}/correlations`, { params: { symbol, period } }).then((r) => r.data),

  correlationMatrix: (projectId: string, period?: string) =>
    api.get<CorrelationMatrix>(`${base(projectId)}/correlations/matrix`, { params: { period } }).then((r) => r.data),

  calculateCorrelation: (projectId: string, data: { symbol_a: string; symbol_b: string; prices_a: number[]; prices_b: number[]; period?: string }) =>
    api.post<CorrelationData>(`${base(projectId)}/correlations/calculate`, data).then((r) => r.data),

  // Liquidity
  liquidity: (projectId: string, symbol: string, date?: string) =>
    api.get<LiquidityLevel[]>(`${base(projectId)}/liquidity/${symbol}`, { params: { date } }).then((r) => r.data),

  createLiquidity: (projectId: string, data: Partial<LiquidityLevel>) =>
    api.post<LiquidityLevel>(`${base(projectId)}/liquidity`, data).then((r) => r.data),

  markSwept: (projectId: string, levelId: string) =>
    api.put<LiquidityLevel>(`${base(projectId)}/liquidity/${levelId}/swept`).then((r) => r.data),

  deleteLiquidity: (projectId: string, levelId: string) =>
    api.delete(`${base(projectId)}/liquidity/${levelId}`).then((r) => r.data),

  // Structure
  structure: (projectId: string, symbol: string, timeframe?: string) =>
    api.get<MarketStructurePoint[]>(`${base(projectId)}/structure/${symbol}`, { params: { timeframe } }).then((r) => r.data),

  createStructure: (projectId: string, data: Partial<MarketStructurePoint>) =>
    api.post<MarketStructurePoint>(`${base(projectId)}/structure`, data).then((r) => r.data),

  mitigateStructure: (projectId: string, pointId: string) =>
    api.put<MarketStructurePoint>(`${base(projectId)}/structure/${pointId}/mitigate`).then((r) => r.data),

  // Sessions
  sessions: (projectId: string, date?: string, symbol?: string) =>
    api.get<SessionAnalysis[]>(`${base(projectId)}/sessions`, { params: { date, symbol } }).then((r) => r.data),

  createSession: (projectId: string, data: Partial<SessionAnalysis>) =>
    api.post<SessionAnalysis>(`${base(projectId)}/sessions`, data).then((r) => r.data),

  sessionStats: (projectId: string, sessionName: string, days?: number) =>
    api.get<SessionStats>(`${base(projectId)}/sessions/${sessionName}/stats`, { params: { days } }).then((r) => r.data),

  // Watchlist
  watchlists: (projectId: string) =>
    api.get<Watchlist[]>(`${base(projectId)}/watchlists`).then((r) => r.data),

  createWatchlist: (projectId: string, data: Partial<Watchlist>) =>
    api.post<Watchlist>(`${base(projectId)}/watchlists`, data).then((r) => r.data),

  deleteWatchlist: (projectId: string, watchlistId: string) =>
    api.delete(`${base(projectId)}/watchlists/${watchlistId}`).then((r) => r.data),

  watchlistItems: (projectId: string, watchlistId: string) =>
    api.get<WatchlistItem[]>(`${base(projectId)}/watchlists/${watchlistId}/items`).then((r) => r.data),

  addWatchlistItem: (projectId: string, watchlistId: string, data: Partial<WatchlistItem>) =>
    api.post<WatchlistItem>(`${base(projectId)}/watchlists/${watchlistId}/items`, data).then((r) => r.data),

  updateWatchlistItem: (projectId: string, itemId: string, data: Partial<WatchlistItem>) =>
    api.put<WatchlistItem>(`${base(projectId)}/watchlists/items/${itemId}`, data).then((r) => r.data),

  deleteWatchlistItem: (projectId: string, itemId: string) =>
    api.delete(`${base(projectId)}/watchlists/items/${itemId}`).then((r) => r.data),

  // Alerts
  alerts: (projectId: string, alertType?: string) =>
    api.get<MarketAlert[]>(`${base(projectId)}/alerts`, { params: { alert_type: alertType } }).then((r) => r.data),

  createAlert: (projectId: string, data: Partial<MarketAlert>) =>
    api.post<MarketAlert>(`${base(projectId)}/alerts`, data).then((r) => r.data),

  readAlert: (projectId: string, alertId: string) =>
    api.put<MarketAlert>(`${base(projectId)}/alerts/${alertId}/read`).then((r) => r.data),

  dismissAlert: (projectId: string, alertId: string) =>
    api.put(`${base(projectId)}/alerts/${alertId}/dismiss`).then((r) => r.data),

  checkNewsAlerts: (projectId: string) =>
    api.post<MarketAlert[]>(`${base(projectId)}/alerts/check-news`).then((r) => r.data),

  // Timeline
  timeline: (projectId: string, startDate?: string, endDate?: string, eventType?: string, limit?: number) =>
    api.get<MarketTimelineEvent[]>(`${base(projectId)}/timeline`, {
      params: { start_date: startDate, end_date: endDate, event_type: eventType, limit },
    }).then((r) => r.data),

  createTimelineEvent: (projectId: string, data: Partial<MarketTimelineEvent>) =>
    api.post<MarketTimelineEvent>(`${base(projectId)}/timeline`, data).then((r) => r.data),

  autoPopulateTimeline: (projectId: string) =>
    api.post<{ count: number }>(`${base(projectId)}/timeline/auto-populate`).then((r) => r.data),

  // Providers
  providers: (projectId: string) =>
    api.get<DataProviderConfig[]>(`${base(projectId)}/providers`).then((r) => r.data),

  defaultProvider: (projectId: string) =>
    api.get<DataProviderConfig | null>(`${base(projectId)}/providers/default`).then((r) => r.data),

  createProvider: (projectId: string, data: Partial<DataProviderConfig>) =>
    api.post<DataProviderConfig>(`${base(projectId)}/providers`, data).then((r) => r.data),

  updateProvider: (projectId: string, providerId: string, data: Partial<DataProviderConfig>) =>
    api.put<DataProviderConfig>(`${base(projectId)}/providers/${providerId}`, data).then((r) => r.data),

  deleteProvider: (projectId: string, providerId: string) =>
    api.delete(`${base(projectId)}/providers/${providerId}`).then((r) => r.data),

  // AI Context
  aiContext: (projectId: string) =>
    api.get<MarketAIContext>(`${base(projectId)}/ai-context`).then((r) => r.data),
};

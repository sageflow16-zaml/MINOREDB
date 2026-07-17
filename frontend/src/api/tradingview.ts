import api from '../services/api';
import type {
  MarketEvent,
  WebhookLog,
  WebhookResponse,
  WebhookStats,
} from './types';

const BASE = '/tradingview';

export const tradingviewService = {
  events: (params: { limit?: number; symbol?: string; timeframe?: string; event_type?: string } = {}) =>
    api.get<MarketEvent[]>(`${BASE}/events`, { params }).then((r) => r.data),

  event: (id: string) =>
    api.get<MarketEvent>(`${BASE}/events/${id}`).then((r) => r.data),

  logs: (limit: number = 100) =>
    api.get<WebhookLog[]>(`${BASE}/logs`, { params: { limit } }).then((r) => r.data),

  stats: () =>
    api.get<WebhookStats>(`${BASE}/stats`).then((r) => r.data),

  webhook: (payload: Record<string, unknown>) =>
    api.post<WebhookResponse>(`${BASE}/webhook`, payload).then((r) => r.data),
};

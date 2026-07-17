import api from '../services/api';
import type {
  MacroEvent,
  MarketSnapshot,
  MacroRefreshResponse,
  MarketState,
} from './types';

const BASE = '/macro';

export const macroService = {
  snapshot: () =>
    api.get<MarketSnapshot | null>(`${BASE}/snapshot`).then((r) => r.data),

  events: (limit: number = 50, importance?: string) =>
    api.get<MacroEvent[]>(`${BASE}/events`, { params: { limit, importance } }).then((r) => r.data),

  calendar: () =>
    api.get<MacroEvent[]>(`${BASE}/calendar`).then((r) => r.data),

  state: () =>
    api.get<MarketState>(`${BASE}/state`).then((r) => r.data),

  refresh: () =>
    api.post<MacroRefreshResponse>(`${BASE}/refresh`).then((r) => r.data),
};

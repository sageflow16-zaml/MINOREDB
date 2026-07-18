import api from '../services/api';
import type { TradeMemory } from './types';

const base = (projectId: string) => `/projects/${projectId}/memories`;

export const tradeMemoryService = {
  list: (projectId: string) =>
    api.get<TradeMemory[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, tradeId: string) =>
    api.get<TradeMemory>(`${base(projectId)}/${tradeId}`).then((r) => r.data),
};

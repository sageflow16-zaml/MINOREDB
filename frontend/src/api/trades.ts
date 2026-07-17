import api from '../services/api';
import type { TradeRead, TradeCreate, TradeUpdate } from './types';

const base = (projectId: string) => `/projects/${projectId}/trades`;

export const tradeService = {
  list: (projectId: string) =>
    api.get<TradeRead[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<TradeRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: TradeCreate) =>
    api.post<TradeRead>(base(projectId), data).then((r) => r.data),
  update: (projectId: string, id: string, data: TradeUpdate) =>
    api.put<TradeRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
};

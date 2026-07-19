import api from '../services/api';
import type { MarketStructureRead, MarketStructureCreate, MarketStructureUpdate } from './types';

const base = (projectId: string) => `/projects/${projectId}/market-structures`;

export const marketStructureService = {
  list: (projectId: string) =>
    api.get<MarketStructureRead[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<MarketStructureRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: MarketStructureCreate) =>
    api.post<MarketStructureRead>(`${base(projectId)}/`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: MarketStructureUpdate) =>
    api.put<MarketStructureRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
};

import api from '../services/api';
import type { StrategyRead, StrategyCreate, StrategyUpdate, StrategyVersionRead, StrategyVersionCreate, StrategyAnalytics } from './types';

const base = (projectId: string) => `/projects/${projectId}/strategies`;

export const strategyService = {
  list: (projectId: string, params?: { skip?: number; limit?: number; status?: string; category?: string; market?: string; search?: string; tag?: string }) =>
    api.get<StrategyRead[]>(`${base(projectId)}/`, { params }).then((r) => r.data),

  get: (projectId: string, id: string) =>
    api.get<StrategyRead>(`${base(projectId)}/${id}`).then((r) => r.data),

  create: (projectId: string, data: StrategyCreate) =>
    api.post<StrategyRead>(`${base(projectId)}/`, data).then((r) => r.data),

  update: (projectId: string, id: string, data: StrategyUpdate) =>
    api.put<StrategyRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),

  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),

  duplicate: (projectId: string, id: string) =>
    api.post<StrategyRead>(`${base(projectId)}/${id}/duplicate`).then((r) => r.data),

  analytics: (projectId: string, id: string) =>
    api.get<StrategyAnalytics>(`${base(projectId)}/${id}/analytics`).then((r) => r.data),

  versions: (projectId: string, id: string) =>
    api.get<StrategyVersionRead[]>(`${base(projectId)}/${id}/versions`).then((r) => r.data),

  createVersion: (projectId: string, id: string, data: StrategyVersionCreate) =>
    api.post<StrategyVersionRead>(`${base(projectId)}/${id}/versions`, data).then((r) => r.data),

  compareVersions: (projectId: string, id: string, versionA: string, versionB: string) =>
    api.get<{ version_a: unknown; version_b: unknown }>(`${base(projectId)}/${id}/versions/compare`, {
      params: { version_a: versionA, version_b: versionB },
    }).then((r) => r.data),
};

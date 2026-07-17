import api from '../services/api';
import type { CollectorStatus, CollectorLog, CollectorRunResult } from './types';

const base = (projectId: string) => `/projects/${projectId}/collectors`;

export const collectorService = {
  list: (projectId: string) =>
    api.get<CollectorStatus[]>(base(projectId)).then((r) => r.data),
  status: (projectId: string) =>
    api.get<CollectorStatus[]>(`${base(projectId)}/status`).then((r) => r.data),
  run: (projectId: string, name: string) =>
    api.post<CollectorRunResult>(`${base(projectId)}/run/${name}`).then((r) => r.data),
  toggle: (projectId: string, name: string, enabled: boolean) =>
    api.put<CollectorStatus>(`${base(projectId)}/${name}/toggle`, null, { params: { enabled } }).then((r) => r.data),
  logs: (projectId: string, limit = 50) =>
    api.get<CollectorLog[]>(`${base(projectId)}/logs`, { params: { limit } }).then((r) => r.data),
};

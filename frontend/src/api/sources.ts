import api from '../services/api';
import type { SourceRead, SourceCreate, SourceUpdate } from './types';

const base = (projectId: string) => `/projects/${projectId}/sources`;

export const sourceService = {
  list: (projectId: string) =>
    api.get<SourceRead[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<SourceRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: SourceCreate) =>
    api.post<SourceRead>(base(projectId), data).then((r) => r.data),
  update: (projectId: string, id: string, data: SourceUpdate) =>
    api.put<SourceRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
  upload: (projectId: string, formData: FormData) =>
    api
      .post<SourceRead>(`${base(projectId)}/upload`, formData)
      .then((r) => r.data),
  extractClaims: (projectId: string, sourceId: string) =>
    api
      .post(`${base(projectId)}/${sourceId}/extract-claims`)
      .then((r) => r.data),
  detectConflicts: (projectId: string, sourceId: string) =>
    api
      .post(`${base(projectId)}/${sourceId}/detect-conflicts`)
      .then((r) => r.data),
};
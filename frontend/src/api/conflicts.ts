import api from '../services/api';
import type { ConflictRead, ConflictCreate, ConflictUpdate, ClaimRead } from './types';

const base = (projectId: string) => `/projects/${projectId}/conflicts`;

export const conflictService = {
  list: (projectId: string) =>
    api.get<ConflictRead[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<ConflictRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: ConflictCreate) =>
    api.post<ConflictRead>(base(projectId), data).then((r) => r.data),
  update: (projectId: string, id: string, data: ConflictUpdate) =>
    api.put<ConflictRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
  claims: (projectId: string, id: string) =>
    api.get<ClaimRead[]>(`${base(projectId)}/${id}/claims`).then((r) => r.data),
  generateQuestion: (projectId: string, conflictId: string) =>
    api
      .post(`${base(projectId)}/${conflictId}/generate-question`)
      .then((r) => r.data),
};
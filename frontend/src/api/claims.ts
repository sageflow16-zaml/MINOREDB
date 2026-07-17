import api from '../services/api';
import type { ClaimRead, ClaimCreate, ClaimUpdate, GraphResponse } from './types';

const base = (projectId: string) => `/projects/${projectId}/claims`;

export const claimService = {
  list: (projectId: string) =>
    api.get<ClaimRead[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<ClaimRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: ClaimCreate) =>
    api.post<ClaimRead>(base(projectId), data).then((r) => r.data),
  update: (projectId: string, id: string, data: ClaimUpdate) =>
    api.put<ClaimRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
  extractConcepts: (projectId: string, claimId: string) =>
    api.post(`${base(projectId)}/${claimId}/extract-concepts`).then((r) => r.data),
  interpret: (projectId: string, claimId: string) =>
    api.post(`${base(projectId)}/${claimId}/interpret`).then((r) => r.data),
  graph: (projectId: string, claimId: string) =>
    api.get<GraphResponse>(`${base(projectId)}/${claimId}/graph`).then((r) => r.data),
};
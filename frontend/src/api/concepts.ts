import api from '../services/api';
import type { ConceptRead, ConceptCreate, ConceptUpdate, ClaimRead, InterpretationRead } from './types';

const base = (projectId: string) => `/projects/${projectId}/concepts`;

export const conceptService = {
  list: (projectId: string) =>
    api.get<ConceptRead[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<ConceptRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: ConceptCreate) =>
    api.post<ConceptRead>(`${base(projectId)}/`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: ConceptUpdate) =>
    api.put<ConceptRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
  claims: (projectId: string, id: string) =>
    api.get<ClaimRead[]>(`${base(projectId)}/${id}/claims`).then((r) => r.data),
  interpretations: (projectId: string, id: string) =>
    api
      .get<InterpretationRead[]>(`${base(projectId)}/${id}/interpretations`)
      .then((r) => r.data),
};
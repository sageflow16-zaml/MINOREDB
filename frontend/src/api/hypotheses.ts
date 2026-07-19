import api from '../services/api';
import type { HypothesisRead } from './types';

const base = (projectId: string) => `/projects/${projectId}/hypotheses`;

export const hypothesisService = {
  list: (projectId: string) =>
    api.get<HypothesisRead[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<HypothesisRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
};
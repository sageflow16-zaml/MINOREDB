import api from '../services/api';
import type { InterpretationRead } from './types';

const base = (projectId: string) => `/projects/${projectId}/interpretations`;

export const interpretationService = {
  list: (projectId: string) =>
    api.get<InterpretationRead[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<InterpretationRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
};
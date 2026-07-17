import api from '../services/api';
import type { AssociationRead, AssociationCreate, AssociationUpdate } from './types';

const base = (projectId: string) => `/projects/${projectId}/associations`;

export const associationService = {
  list: (projectId: string) =>
    api.get<AssociationRead[]>(base(projectId)).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<AssociationRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, data: AssociationCreate) =>
    api.post<AssociationRead>(base(projectId), data).then((r) => r.data),
  update: (projectId: string, id: string, data: AssociationUpdate) =>
    api.put<AssociationRead>(`${base(projectId)}/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
};
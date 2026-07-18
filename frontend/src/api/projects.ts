import api from '../services/api';
import type { Project } from './types';

export const projectService = {
  list: () => api.get<Project[]>('/projects/').then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Project>('/projects/', data).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
};
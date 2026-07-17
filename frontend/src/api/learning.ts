import api from '../services/api';
import type {
  LearningEventRead,
  KnowledgeSnapshotRead,
  LearningStatus,
  LearningRebuildResponse,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/learning`;

export const learningService = {
  events: (projectId: string, limit: number = 50) =>
    api.get<LearningEventRead[]>(`${base(projectId)}/events`, { params: { limit } }).then((r) => r.data),

  snapshots: (projectId: string, limit: number = 30) =>
    api.get<KnowledgeSnapshotRead[]>(`${base(projectId)}/snapshots`, { params: { limit } }).then((r) => r.data),

  rebuild: (projectId: string) =>
    api.post<LearningRebuildResponse>(`${base(projectId)}/rebuild`, { event_type: "manual_rebuild" }).then((r) => r.data),

  status: (projectId: string) =>
    api.get<LearningStatus>(`${base(projectId)}/status`).then((r) => r.data),
};

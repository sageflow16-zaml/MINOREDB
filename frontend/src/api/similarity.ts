import api from '../services/api';
import type {
  SimilarityResponse,
  SimilarityEnvironment,
  SimilarityHistoryEntry,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/similarity`;

export const similarityService = {
  compareCurrent: (projectId: string, env: SimilarityEnvironment) =>
    api.post<SimilarityResponse>(`${base(projectId)}/current`, env).then((r) => r.data),

  compareTrade: (projectId: string, tradeId: string) =>
    api.post<SimilarityResponse>(`${base(projectId)}/trade/${tradeId}`).then((r) => r.data),

  comparePattern: (projectId: string, patternId: string) =>
    api.post<SimilarityResponse>(`${base(projectId)}/pattern/${patternId}`).then((r) => r.data),

  history: (projectId: string, limit: number = 50) =>
    api.get<SimilarityHistoryEntry[]>(`${base(projectId)}/history`, { params: { limit } }).then((r) => r.data),
};

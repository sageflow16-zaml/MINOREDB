import api from '../services/api';
import type { DecisionResponse, DecisionEnvironment, DecisionHistoryEntry } from './types';

const base = (projectId: string) => `/projects/${projectId}/decision`;

export const decisionService = {
  evaluateCurrent: (projectId: string, env: DecisionEnvironment) =>
    api.post<DecisionResponse>(`${base(projectId)}/current`, env).then((r) => r.data),

  evaluateTrade: (projectId: string, tradeId: string) =>
    api.post<DecisionResponse>(`${base(projectId)}/trade/${tradeId}`).then((r) => r.data),

  history: (projectId: string, limit: number = 20) =>
    api.get<DecisionHistoryEntry[]>(`${base(projectId)}/history`, { params: { limit } }).then((r) => r.data),
};

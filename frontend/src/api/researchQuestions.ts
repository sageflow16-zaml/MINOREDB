import api from '../services/api';
import type { ResearchQuestionRead } from './types';

const base = (projectId: string) => `/projects/${projectId}/questions`;

export const researchQuestionService = {
  list: (projectId: string) =>
    api.get<ResearchQuestionRead[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    api.get<ResearchQuestionRead>(`${base(projectId)}/${id}`).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`).then((r) => r.data),
  generateHypothesis: (projectId: string, questionId: string) =>
    api
      .post(`${base(projectId)}/${questionId}/generate-hypothesis`)
      .then((r) => r.data),
};
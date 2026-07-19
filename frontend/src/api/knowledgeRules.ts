import api from '../services/api';
import type { KnowledgeRule } from './types';

const base = (projectId: string) => `/projects/${projectId}/knowledge`;

export const knowledgeRuleService = {
  list: (projectId: string) =>
    api.get<KnowledgeRule[]>(`${base(projectId)}/`).then((r) => r.data),
  get: (projectId: string, ruleId: string) =>
    api.get<KnowledgeRule>(`${base(projectId)}/${ruleId}`).then((r) => r.data),
  top: (projectId: string) =>
    api.get<KnowledgeRule>(`${base(projectId)}/top`).then((r) => r.data),
  refresh: (projectId: string) =>
    api.post<KnowledgeRule[]>(`${base(projectId)}/refresh`).then((r) => r.data),
};

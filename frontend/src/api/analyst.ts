import api from '../services/api';

export interface EvidenceItem {
  source: string;
  data: unknown;
}

export interface AnalystResponse {
  answer: string;
  confidence: number;
  sources: string[];
  evidence: EvidenceItem[];
}

export const analystService = {
  query: (projectId: string, question: string) =>
    api.post<AnalystResponse>(`/projects/${projectId}/analyst/query`, { question }).then((r) => r.data),
};

import api from '../services/api';

export interface ResearchSession {
  id: string;
  project_id: string;
  question: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  created_at: string;
}

export interface ResearchTask {
  id: string;
  step: number;
  tool: string;
  description: string | null;
  status: string;
  evidence_count: number;
  created_at: string;
}

export interface ResearchReport {
  id: string;
  summary: string;
  findings: string[] | null;
  recommendations: string[] | null;
  limitations: string[] | null;
  confidence: number | null;
  sources: string[] | null;
  created_at: string;
}

export interface ResearchDetail {
  session: ResearchSession;
  tasks: ResearchTask[];
  report: ResearchReport | null;
}

export const researchService = {
  run: (projectId: string, question: string) =>
    api.post<{ session_id: string; status: string; message: string }>(
      `/projects/${projectId}/research/run`,
      { question },
    ).then((r) => r.data),

  getSession: (projectId: string, sessionId: string) =>
    api.get<ResearchDetail>(`/projects/${projectId}/research/${sessionId}`).then((r) => r.data),

  getHistory: (projectId: string) =>
    api.get<ResearchSession[]>(`/projects/${projectId}/research/history/list`).then((r) => r.data),
};

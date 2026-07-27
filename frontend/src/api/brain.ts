import api from '../services/api';
import type {
  BrainAskResponse,
  BrainDashboard,
  BrainDecision,
  BrainCoaching,
  PersonalInsight,
  LearningObservation,
  TraderDNA,
  BrainMemory,
} from './types';

export interface BrainAskRequest {
  question: string;
  context?: Record<string, unknown>;
  include_steps?: string[];
  skip_steps?: string[];
}

export interface BrainMemoryCreate {
  memory_type: string;
  key: string;
  title?: string;
  content?: Record<string, unknown>;
  text_content?: string;
  importance?: string;
  tags?: string[];
  source_entity_type?: string;
  source_entity_id?: string;
}

export interface BrainCoachingRequest {
  coaching_type?: string;
  period_start?: string;
  period_end?: string;
}

export interface SimilaritySearchRequest {
  pair?: string;
  direction?: string;
  session?: string;
  entry_model?: string;
  weekly_bias?: string;
  daily_bias?: string;
  limit?: number;
}

export const brainAsk = (projectId: string, data: BrainAskRequest) =>
  api.post<BrainAskResponse>(`/projects/${projectId}/brain/ask`, data).then(r => r.data).catch(() => null as unknown as BrainAskResponse);

export const getDNA = (projectId: string) =>
  api.get<TraderDNA>(`/projects/${projectId}/brain/dna`).then(r => r.data).catch(() => null as unknown as TraderDNA);

export const refreshDNA = (projectId: string) =>
  api.post<TraderDNA>(`/projects/${projectId}/brain/dna/refresh`).then(r => r.data).catch(() => null as unknown as TraderDNA);

export const getBrainDashboard = (projectId: string) =>
  api.get<BrainDashboard>(`/projects/${projectId}/brain/dashboard`).then(r => r.data).catch(() => null as unknown as BrainDashboard);

export const createBrainMemory = (projectId: string, data: BrainMemoryCreate) =>
  api.post<BrainMemory>(`/projects/${projectId}/brain/memories`, data).then(r => r.data).catch(() => null as unknown as BrainMemory);

export const searchBrainMemories = (projectId: string, params?: Record<string, string>) =>
  api.get<BrainMemory[]>(`/projects/${projectId}/brain/memories`, { params }).then(r => r.data).catch(() => []);

export const deleteBrainMemory = (projectId: string, memoryId: string) =>
  api.delete(`/projects/${projectId}/brain/memories/${memoryId}`).then(r => r.data).catch(() => null as unknown as void);

export const listDecisions = (projectId: string, limit?: number) =>
  api.get<BrainDecision[]>(`/projects/${projectId}/brain/decisions`, { params: { limit } }).then(r => r.data).catch(() => []);

export const getDecision = (projectId: string, decisionId: string) =>
  api.get<BrainDecision>(`/projects/${projectId}/brain/decisions/${decisionId}`).then(r => r.data).catch(() => null as unknown as BrainDecision);

export const trackOutcome = (projectId: string, decisionId: string, outcome: string, feedback?: string) =>
  api.post(`/projects/${projectId}/brain/decisions/${decisionId}/outcome`, { outcome, feedback }).then(r => r.data).catch(() => null as unknown as void);

export const searchBrainSimilarity = (projectId: string, data: SimilaritySearchRequest) =>
  api.post(`/projects/${projectId}/brain/similarity`, data).then(r => r.data).catch(() => null as unknown as void);

export const getInsights = (projectId: string, limit?: number) =>
  api.get<PersonalInsight[]>(`/projects/${projectId}/brain/insights`, { params: { limit } }).then(r => r.data).catch(() => []);

export const generateInsights = (projectId: string) =>
  api.post<PersonalInsight[]>(`/projects/${projectId}/brain/insights/generate`).then(r => r.data).catch(() => []);

export const dismissInsight = (projectId: string, insightId: string) =>
  api.post(`/projects/${projectId}/brain/insights/${insightId}/dismiss`).then(r => r.data).catch(() => null as unknown as void);

export const getObservations = (projectId: string) =>
  api.get<LearningObservation[]>(`/projects/${projectId}/brain/observations`).then(r => r.data).catch(() => []);

export const detectObservations = (projectId: string) =>
  api.post<LearningObservation[]>(`/projects/${projectId}/brain/observations/detect`).then(r => r.data).catch(() => []);

export const dismissObservation = (projectId: string, observationId: string) =>
  api.post(`/projects/${projectId}/brain/observations/${observationId}/dismiss`).then(r => r.data).catch(() => null as unknown as void);

export const generateCoaching = (projectId: string, data: BrainCoachingRequest) =>
  api.post<BrainCoaching>(`/projects/${projectId}/brain/coach`, data).then(r => r.data).catch(() => null as unknown as BrainCoaching);

export const listCoachingSessions = (projectId: string, coachingType?: string, limit?: number) =>
  api.get<BrainCoaching[]>(`/projects/${projectId}/brain/coach`, { params: { coaching_type: coachingType, limit } }).then(r => r.data).catch(() => []);

export const getLatestCoaching = (projectId: string) =>
  api.get<BrainCoaching>(`/projects/${projectId}/brain/coach/latest`).then(r => r.data).catch(() => null as unknown as BrainCoaching);

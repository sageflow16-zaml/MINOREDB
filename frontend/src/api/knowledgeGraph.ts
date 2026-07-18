import api from '../services/api';
import type { GraphData, KnowledgeNode, KnowledgeEdge, GraphSnapshot } from './types';

const base = (projectId: string) => `/projects/${projectId}/graph`;

export const knowledgeGraphService = {
  data: (projectId: string, nodeType?: string) => {
    const params = nodeType ? `?node_type=${encodeURIComponent(nodeType)}` : '';
    return api.get<GraphData>(`${base(projectId)}/data${params}`).then((r) => r.data);
  },
  nodes: (projectId: string, nodeType?: string) => {
    const params = nodeType ? `?node_type=${encodeURIComponent(nodeType)}` : '';
    return api.get<KnowledgeNode[]>(`${base(projectId)}/nodes${params}`).then((r) => r.data);
  },
  edges: (projectId: string) =>
    api.get<KnowledgeEdge[]>(`${base(projectId)}/edges`).then((r) => r.data),
  snapshot: (projectId: string) =>
    api.get<GraphSnapshot>(`${base(projectId)}/snapshot`).then((r) => r.data),
  refresh: (projectId: string) =>
    api.post<GraphSnapshot>(`${base(projectId)}/refresh`).then((r) => r.data),
};

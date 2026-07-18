import api from '../services/api';

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface KnowledgeConcept {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string | null;
  definition: string | null;
  purpose: string | null;
  market_context: string | null;
  rules: Record<string, unknown> | null;
  conditions: string | null;
  confirmations: string | null;
  invalidations: string | null;
  common_mistakes: string | null;
  best_practices: string | null;
  difficulty: string | null;
  confidence: number | null;
  status: string;
  reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  tags: KnowledgeTag[];
  category?: KnowledgeCategory | null;
}

export interface KnowledgeConceptDetail extends KnowledgeConcept {
  relationships_outgoing: any[];
  relationships_incoming: any[];
  examples: any[];
  references: any[];
  revisions: any[];
}

export interface KnowledgeRelationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relationship_type: string;
  strength: number | null;
  confidence: number | null;
  description: string | null;
  created_at: string;
  source_concept?: KnowledgeConcept;
  target_concept?: KnowledgeConcept;
}

export interface KnowledgeExample {
  id: string;
  concept_id: string;
  title: string;
  description: string | null;
  market: string | null;
  pair: string | null;
  timeframe: string | null;
  notes: string | null;
  created_at: string;
}

export interface KnowledgeReference {
  id: string;
  concept_id: string;
  source_type: string;
  title: string;
  author: string | null;
  publication: string | null;
  url: string | null;
  confidence: number | null;
  created_at: string;
}

export interface KnowledgeStats {
  total_categories: number;
  total_concepts: number;
  total_relationships: number;
  total_examples: number;
  total_references: number;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category_name: string | null;
  difficulty: string | null;
  status: string;
  match_type: string;
  relevance: number;
}

export const knowledgeService = {
  // Stats
  getStats: () => api.get<KnowledgeStats>('/knowledge/stats').then(r => r.data),

  // Categories
  getCategories: () => api.get<KnowledgeCategory[]>('/knowledge/categories').then(r => r.data),
  getCategory: (id: string) => api.get<KnowledgeCategory>(`/knowledge/categories/${id}`).then(r => r.data),
  createCategory: (data: { name: string; slug: string; description?: string; icon?: string; color?: string }) =>
    api.post<KnowledgeCategory>('/knowledge/categories', data).then(r => r.data),
  updateCategory: (id: string, data: Partial<KnowledgeCategory>) =>
    api.put<KnowledgeCategory>(`/knowledge/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: string) => api.delete(`/knowledge/categories/${id}`),

  // Tags
  getTags: () => api.get<KnowledgeTag[]>('/knowledge/tags').then(r => r.data),
  createTag: (data: { name: string; color?: string }) =>
    api.post<KnowledgeTag>('/knowledge/tags', data).then(r => r.data),
  deleteTag: (id: string) => api.delete(`/knowledge/tags/${id}`),

  // Concepts
  getConcepts: (categoryId?: string) => {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return api.get<KnowledgeConcept[]>(`/knowledge/concepts${params}`).then(r => r.data);
  },
  getConcept: (id: string) => api.get<KnowledgeConceptDetail>(`/knowledge/concepts/${id}`).then(r => r.data),
  getRelatedConcepts: (id: string) => api.get<KnowledgeConcept[]>(`/knowledge/concepts/${id}/related`).then(r => r.data),
  createConcept: (data: { category_id: string; title: string; slug: string; summary?: string; definition?: string; tag_ids?: string[]; status?: string; difficulty?: string }) =>
    api.post<KnowledgeConcept>('/knowledge/concepts', data).then(r => r.data),
  updateConcept: (id: string, data: Partial<KnowledgeConcept>) =>
    api.put<KnowledgeConcept>(`/knowledge/concepts/${id}`, data).then(r => r.data),
  deleteConcept: (id: string) => api.delete(`/knowledge/concepts/${id}`),

  // Relationships
  getRelationships: (conceptId?: string) => {
    const params = conceptId ? `?concept_id=${conceptId}` : '';
    return api.get<KnowledgeRelationship[]>(`/knowledge/relationships${params}`).then(r => r.data);
  },
  createRelationship: (data: { source_concept_id: string; target_concept_id: string; relationship_type: string; strength?: number; confidence?: number; description?: string }) =>
    api.post<KnowledgeRelationship>('/knowledge/relationships', data).then(r => r.data),
  deleteRelationship: (id: string) => api.delete(`/knowledge/relationships/${id}`),

  // Examples
  getExamples: (conceptId?: string) => {
    const params = conceptId ? `?concept_id=${conceptId}` : '';
    return api.get<KnowledgeExample[]>(`/knowledge/examples${params}`).then(r => r.data);
  },
  createExample: (data: { concept_id: string; title: string; pair?: string; timeframe?: string; description?: string }) =>
    api.post<KnowledgeExample>('/knowledge/examples', data).then(r => r.data),
  deleteExample: (id: string) => api.delete(`/knowledge/examples/${id}`),

  // References
  getReferences: (conceptId?: string) => {
    const params = conceptId ? `?concept_id=${conceptId}` : '';
    return api.get<KnowledgeReference[]>(`/knowledge/references${params}`).then(r => r.data);
  },
  createReference: (data: { concept_id: string; source_type: string; title: string; author?: string; url?: string }) =>
    api.post<KnowledgeReference>('/knowledge/references', data).then(r => r.data),
  deleteReference: (id: string) => api.delete(`/knowledge/references/${id}`),

  // Search
  search: (q: string, categoryId?: string) => {
    let params = `?q=${encodeURIComponent(q)}`;
    if (categoryId) params += `&category_id=${categoryId}`;
    return api.get<KnowledgeSearchResult[]>(`/knowledge/search${params}`).then(r => r.data);
  },

  // Explorer
  getExplorer: (conceptId?: string) => {
    const params = conceptId ? `?concept_id=${conceptId}` : '';
    return api.get<{ nodes: any[]; edges: any[] }>(`/knowledge/explorer${params}`).then(r => r.data);
  },
};

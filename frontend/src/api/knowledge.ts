import { supabase } from '../lib/supabase';
import type { KnowledgeCategory, KnowledgeTag, KnowledgeConcept, KnowledgeConceptDetail, KnowledgeRelationship, KnowledgeExample, KnowledgeReference, KnowledgeStats, KnowledgeSearchResult } from './types';

export type { KnowledgeCategory, KnowledgeTag, KnowledgeConcept, KnowledgeConceptDetail, KnowledgeRelationship, KnowledgeExample, KnowledgeReference, KnowledgeStats, KnowledgeSearchResult };

const KNOWLEDGE_TABLES = {
  categories: 'knowledge_category',
  tags: 'knowledge_tag',
  concepts: 'knowledge_concept',
  relationships: 'knowledge_relationship',
  examples: 'knowledge_example',
  references: 'knowledge_reference',
} as const;

export const knowledgeService = {
  getStats: async (): Promise<KnowledgeStats> => {
    const { count: totalCategories } = await supabase.from(KNOWLEDGE_TABLES.categories).select('*', { count: 'exact', head: true });
    const { count: totalConcepts } = await supabase.from(KNOWLEDGE_TABLES.concepts).select('*', { count: 'exact', head: true });
    const { count: totalRelationships } = await supabase.from(KNOWLEDGE_TABLES.relationships).select('*', { count: 'exact', head: true });
    const { count: totalExamples } = await supabase.from(KNOWLEDGE_TABLES.examples).select('*', { count: 'exact', head: true });
    const { count: totalReferences } = await supabase.from(KNOWLEDGE_TABLES.references).select('*', { count: 'exact', head: true });
    return { total_categories: totalCategories ?? 0, total_concepts: totalConcepts ?? 0, total_relationships: totalRelationships ?? 0, total_examples: totalExamples ?? 0, total_references: totalReferences ?? 0 };
  },

  getCategories: async (): Promise<KnowledgeCategory[]> => {
    const { data, error } = await supabase.from(KNOWLEDGE_TABLES.categories).select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as KnowledgeCategory[];
  },
  getCategory: async (id: string): Promise<KnowledgeCategory> => {
    const { data, error } = await supabase.from(KNOWLEDGE_TABLES.categories).select('*').eq('id', id).single();
    if (error) throw error;
    return data as KnowledgeCategory;
  },
  createCategory: async (data: { name: string; slug: string; description?: string; icon?: string; color?: string }): Promise<KnowledgeCategory> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.categories).insert(data).select().single();
    if (error) throw error;
    return row as KnowledgeCategory;
  },
  updateCategory: async (id: string, data: Partial<KnowledgeCategory>): Promise<KnowledgeCategory> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.categories).update(data).eq('id', id).select().single();
    if (error) throw error;
    return row as KnowledgeCategory;
  },
  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.categories).delete().eq('id', id);
    if (error) throw error;
  },

  getTags: async (): Promise<KnowledgeTag[]> => {
    const { data, error } = await supabase.from(KNOWLEDGE_TABLES.tags).select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as KnowledgeTag[];
  },
  createTag: async (data: { name: string; color?: string }): Promise<KnowledgeTag> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.tags).insert(data).select().single();
    if (error) throw error;
    return row as KnowledgeTag;
  },
  deleteTag: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.tags).delete().eq('id', id);
    if (error) throw error;
  },

  getConcepts: async (categoryId?: string): Promise<KnowledgeConcept[]> => {
    let query = supabase.from(KNOWLEDGE_TABLES.concepts).select('*, category:category_id(*), tags:knowledge_concept_tag(tag:tag_id(*)))');
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data, error } = await query.order('title', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as KnowledgeConcept[];
  },
  getConcept: async (id: string): Promise<KnowledgeConceptDetail> => {
    const { data, error } = await supabase.from(KNOWLEDGE_TABLES.concepts).select('*').eq('id', id).single();
    if (error) throw error;
    const { data: outgoing } = await supabase.from(KNOWLEDGE_TABLES.relationships).select('*, target_concept:target_concept_id(*)').eq('source_concept_id', id);
    const { data: incoming } = await supabase.from(KNOWLEDGE_TABLES.relationships).select('*, source_concept:source_concept_id(*)').eq('target_concept_id', id);
    const { data: examples } = await supabase.from(KNOWLEDGE_TABLES.examples).select('*').eq('concept_id', id);
    const { data: references } = await supabase.from(KNOWLEDGE_TABLES.references).select('*').eq('concept_id', id);
    return { ...data, relationships_outgoing: outgoing ?? [], relationships_incoming: incoming ?? [], examples: examples ?? [], references: references ?? [], revisions: [] } as KnowledgeConceptDetail;
  },
  getRelatedConcepts: async (_id: string): Promise<KnowledgeConcept[]> => {
    throw new Error('Related concepts requires AI');
  },
  createConcept: async (data: { category_id: string; title: string; slug: string; summary?: string; definition?: string; tag_ids?: string[]; status?: string; difficulty?: string }): Promise<KnowledgeConcept> => {
    const { tag_ids, ...rest } = data;
    const { data: concept, error } = await supabase.from(KNOWLEDGE_TABLES.concepts).insert(rest).select().single();
    if (error) throw error;
    if (tag_ids && tag_ids.length > 0) {
      await supabase.from('knowledge_concept_tag').insert(tag_ids.map((tag_id: string) => ({ concept_id: concept.id, tag_id })));
    }
    return concept as KnowledgeConcept;
  },
  updateConcept: async (id: string, data: Partial<KnowledgeConcept>): Promise<KnowledgeConcept> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.concepts).update(data).eq('id', id).select().single();
    if (error) throw error;
    return row as KnowledgeConcept;
  },
  deleteConcept: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.concepts).delete().eq('id', id);
    if (error) throw error;
  },

  getRelationships: async (conceptId?: string): Promise<KnowledgeRelationship[]> => {
    let query = supabase.from(KNOWLEDGE_TABLES.relationships).select('*, source_concept:source_concept_id(*), target_concept:target_concept_id(*)');
    if (conceptId) query = query.or(`source_concept_id.eq.${conceptId},target_concept_id.eq.${conceptId}`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as KnowledgeRelationship[];
  },
  createRelationship: async (data: { source_concept_id: string; target_concept_id: string; relationship_type: string; strength?: number; confidence?: number; description?: string }): Promise<KnowledgeRelationship> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.relationships).insert(data).select().single();
    if (error) throw error;
    return row as KnowledgeRelationship;
  },
  deleteRelationship: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.relationships).delete().eq('id', id);
    if (error) throw error;
  },

  getExamples: async (conceptId?: string): Promise<KnowledgeExample[]> => {
    let query = supabase.from(KNOWLEDGE_TABLES.examples).select('*');
    if (conceptId) query = query.eq('concept_id', conceptId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeExample[];
  },
  createExample: async (data: { concept_id: string; title: string; pair?: string; timeframe?: string; description?: string }): Promise<KnowledgeExample> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.examples).insert(data).select().single();
    if (error) throw error;
    return row as KnowledgeExample;
  },
  deleteExample: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.examples).delete().eq('id', id);
    if (error) throw error;
  },

  getReferences: async (conceptId?: string): Promise<KnowledgeReference[]> => {
    let query = supabase.from(KNOWLEDGE_TABLES.references).select('*');
    if (conceptId) query = query.eq('concept_id', conceptId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as KnowledgeReference[];
  },
  createReference: async (data: { concept_id: string; source_type: string; title: string; author?: string; url?: string }): Promise<KnowledgeReference> => {
    const { data: row, error } = await supabase.from(KNOWLEDGE_TABLES.references).insert(data).select().single();
    if (error) throw error;
    return row as KnowledgeReference;
  },
  deleteReference: async (id: string): Promise<void> => {
    const { error } = await supabase.from(KNOWLEDGE_TABLES.references).delete().eq('id', id);
    if (error) throw error;
  },

  search: async (q: string, _categoryId?: string): Promise<KnowledgeSearchResult[]> => {
    const { data, error } = await supabase.from(KNOWLEDGE_TABLES.concepts)
      .select('id, title, slug, summary, category:category_id(name), difficulty, status')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,definition.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((c: any) => ({ id: c.id, name: c.title, type: 'concept', description: c.summary, category: c.category?.name, tags: c.difficulty ? [c.difficulty] : undefined, relevance: 1 } as KnowledgeSearchResult));
  },

  getExplorer: async (_conceptId?: string): Promise<{ nodes: any[]; edges: any[] }> => {
    const { data: categories } = await supabase.from(KNOWLEDGE_TABLES.categories).select('id, name');
    const { data: concepts } = await supabase.from(KNOWLEDGE_TABLES.concepts).select('id, title, category_id').limit(50);
    const { data: relationships } = await supabase.from(KNOWLEDGE_TABLES.relationships).select('source_concept_id, target_concept_id, relationship_type').limit(100);
    const nodes = [
      ...(categories ?? []).map((c: any) => ({ id: `cat-${c.id}`, label: c.name, type: 'category' })),
      ...(concepts ?? []).map((c: any) => ({ id: `con-${c.id}`, label: c.title, type: 'concept', category_id: c.category_id })),
    ];
    const edges = (relationships ?? []).map((r: any) => ({ source: `con-${r.source_concept_id}`, target: `con-${r.target_concept_id}`, label: r.relationship_type }));
    return { nodes, edges };
  },
};

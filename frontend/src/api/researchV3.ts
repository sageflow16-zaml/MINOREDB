import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { AIMessage } from '../types';

export interface ResearchV3Session {
  id: string;
  project_id: string;
  title: string;
  document_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

export interface FlashCard {
  front: string;
  back: string;
  topic: string;
  difficulty: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
  difficulty: string;
}

export interface StudyNotes {
  title: string;
  topics: { topic: string; subtopics: { subtopic: string; content: string; key_points: string[]; quotes: string[] }[] }[];
  summary: string;
  key_takeaways: string[];
}

export interface DocumentComparison {
  similarities: string[];
  differences: string[];
  complementary: string[];
  contradictions: string[];
  synthesis: string;
}

export interface ResearchRecommendation {
  category: string;
  priority: string;
  title: string;
  description: string;
  rationale: string;
  document_references: string[];
  action_items: string[];
}

export interface CrossDocReasoning {
  shared_concepts: { concept: string; documents: string[]; explanation: string }[];
  contradictions: { concept: string; docs_disagreeing: string[]; explanation: string; resolution_suggestion: string }[];
  complementary_insights: { insight: string; source_docs: string[]; supported_by: string[]; trading_application: string }[];
  synthesis: string;
  gaps: string[];
}

export interface RelatedDocument {
  source_id: string;
  title: string;
  similarity: number;
  snippet: string;
}

export const researchV3Service = {
  chat: async (projectId: string, conversationId: string, message: string, documentIds?: string[]) => {
    return callEdgeFunction('ai', { operation: 'research-chat', project_id: projectId, data: { conversation_id: conversationId, message, document_ids: documentIds || [] } });
  },

  semanticSearch: async (projectId: string, query: string, documentIds?: string[]) => {
    return callEdgeFunction('ai', { operation: 'semantic-search', project_id: projectId, data: { query, document_ids: documentIds || [] } });
  },

  journalAnalyze: async (projectId: string, documentId: string) => {
    return callEdgeFunction('ai', { operation: 'journal-analyze', project_id: projectId, data: { document_id: documentId } });
  },

  generateFlashcards: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'generate-flashcards', project_id: projectId, data: { document_ids: documentIds } });
  },

  compareDocuments: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'compare-documents', project_id: projectId, data: { document_ids: documentIds } });
  },

  extractRules: async (projectId: string, documentId: string) => {
    return callEdgeFunction('ai', { operation: 'extract-rules', project_id: projectId, data: { document_id: documentId } });
  },

  generateQuiz: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'generate-quiz', project_id: projectId, data: { document_ids: documentIds } });
  },

  generateStudyNotes: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'generate-study-notes', project_id: projectId, data: { document_ids: documentIds } });
  },

  findConfluences: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'find-confluences', project_id: projectId, data: { document_ids: documentIds } });
  },

  getKnowledgeGraphData: async (projectId: string) => {
    return callEdgeFunction('ai', { operation: 'knowledge-graph-data', project_id: projectId, data: {} });
  },

  suggestQuestions: async (projectId: string, documentId: string) => {
    return callEdgeFunction('ai', { operation: 'suggest-questions', project_id: projectId, data: { document_id: documentId } });
  },

  findRelatedDocuments: async (projectId: string, documentId: string) => {
    return callEdgeFunction('ai', { operation: 'find-related', project_id: projectId, data: { document_id: documentId } });
  },

  crossDocumentReasoning: async (projectId: string, documentIds: string[]) => {
    return callEdgeFunction('ai', { operation: 'cross-document-reasoning', project_id: projectId, data: { document_ids: documentIds } });
  },

  getRecommendations: async (projectId: string, documentIds?: string[]) => {
    return callEdgeFunction('ai', { operation: 'get-recommendations', project_id: projectId, data: { document_ids: documentIds || [] } });
  },

  // Collections
  getCollections: async (projectId: string) => {
    const { data } = await supabase.from('document_collection').select('*').eq('project_id', projectId).order('sort_order');
    return data || [];
  },

  addToCollection: async (projectId: string, documentId: string, collectionId: string, folderId?: string) => {
    return supabase.from('document_collection_member').upsert({
      project_id: projectId,
      document_id: documentId,
      collection_id: collectionId,
      folder_id: folderId || null,
    }).select().single();
  },

  removeFromCollection: async (projectId: string, documentId: string, collectionId: string) => {
    return supabase.from('document_collection_member').delete().eq('document_id', documentId).eq('collection_id', collectionId);
  },

  getCollectionDocuments: async (collectionId: string) => {
    const { data } = await supabase.from('document_collection_member')
      .select('document_id, source:document_id(id, name, raw_text, created_at)')
      .eq('collection_id', collectionId);
    return data || [];
  },

  // Bookmarks
  getBookmarks: async (documentId: string) => {
    const { data } = await supabase.from('document_bookmark').select('*').eq('document_id', documentId).order('page');
    return data || [];
  },

  addBookmark: async (projectId: string, documentId: string, page: number, label?: string) => {
    return supabase.from('document_bookmark').insert({ project_id: projectId, document_id: documentId, page, label }).select().single();
  },

  removeBookmark: async (bookmarkId: string) => {
    return supabase.from('document_bookmark').delete().eq('id', bookmarkId);
  },

  // Highlights
  getHighlights: async (documentId: string) => {
    const { data } = await supabase.from('document_highlight').select('*').eq('document_id', documentId).order('page');
    return data || [];
  },

  addHighlight: async (projectId: string, documentId: string, page: number, text: string, color?: string, note?: string) => {
    return supabase.from('document_highlight').insert({ project_id: projectId, document_id: documentId, page, text, color: color || 'yellow', note }).select().single();
  },

  removeHighlight: async (highlightId: string) => {
    return supabase.from('document_highlight').delete().eq('id', highlightId);
  },

  // Notes
  getNotes: async (documentId: string) => {
    const { data } = await supabase.from('document_note').select('*').eq('document_id', documentId).order('created_at', { ascending: false });
    return data || [];
  },

  addNote: async (projectId: string, documentId: string, text: string, page?: number) => {
    return supabase.from('document_note').insert({ project_id: projectId, document_id: documentId, text, page }).select().single();
  },

  deleteNote: async (noteId: string) => {
    return supabase.from('document_note').delete().eq('id', noteId);
  },

  // Create conversation
  createConversation: async (projectId: string, title: string, documentIds?: string[]) => {
    const { data, error } = await supabase.from('ai_conversation').insert({
      project_id: projectId,
      title,
      metadata: { research_v3: true, document_ids: documentIds || [] },
    }).select().single();
    if (error) throw error;
    return data;
  },

  getConversation: async (conversationId: string) => {
    const { data: convo } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).single();
    const { data: messages } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    return { conversation: convo, messages: messages || [] };
  },

  getConversations: async (projectId: string) => {
    const { data } = await supabase.from('ai_conversation')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  },

  saveResearchSession: async (projectId: string, title?: string, documentIds?: string[], conversationId?: string | null) => {
    const { data: existing } = await supabase.from('research_session')
      .select('id, document_ids')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (existing && existing.length > 0) {
      const { data } = await supabase.from('research_session')
        .update({ document_ids: documentIds || [], title: title || undefined, updated_at: new Date().toISOString() })
        .eq('id', existing[0].id)
        .select()
        .single();
      return data;
    }
    const { data } = await supabase.from('research_session')
      .insert({ project_id: projectId, title: title || 'Research Workspace', document_ids: documentIds || [] })
      .select()
      .single();
    return data;
  },

  getResearchSession: async (projectId: string) => {
    const { data } = await supabase.from('research_session')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
};

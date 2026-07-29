import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { researchV3Service } from '../api/researchV3';
import toast from 'react-hot-toast';

export const useResearchChat = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message, documentIds }: { conversationId: string; message: string; documentIds?: string[] }) =>
      researchV3Service.chat(projectId, conversationId, message, documentIds),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
};

export const useConversation = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => researchV3Service.getConversation(conversationId!),
    enabled: !!conversationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const msgs = data?.messages;
      if (!msgs || msgs.length === 0) return 2000;
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant') return false;
      return 2000;
    },
  });
};

export const useConversations = (projectId: string) => {
  return useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => researchV3Service.getConversations(projectId),
    enabled: !!projectId,
  });
};

export const useCreateConversation = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, documentIds }: { title: string; documentIds?: string[] }) =>
      researchV3Service.createConversation(projectId, title, documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
  });
};

export const useSemanticSearch = () => {
  return useMutation({
    mutationFn: ({ projectId, query, documentIds }: { projectId: string; query: string; documentIds?: string[] }) =>
      researchV3Service.semanticSearch(projectId, query, documentIds),
  });
};

export const useJournalAnalyze = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => researchV3Service.journalAnalyze(projectId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-analysis', projectId] });
      toast.success('Journal analysis complete');
    },
    onError: () => toast.error('Journal analysis failed'),
  });
};

export const useFlashcards = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.generateFlashcards(projectId, documentIds),
  });
};

export const useCompareDocuments = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.compareDocuments(projectId, documentIds),
  });
};

export const useExtractRules = () => {
  return useMutation({
    mutationFn: ({ projectId, documentId }: { projectId: string; documentId: string }) =>
      researchV3Service.extractRules(projectId, documentId),
  });
};

export const useGenerateQuiz = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.generateQuiz(projectId, documentIds),
  });
};

export const useStudyNotes = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.generateStudyNotes(projectId, documentIds),
  });
};

export const useConfluences = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.findConfluences(projectId, documentIds),
  });
};

export const useKnowledgeGraphData = (projectId: string) => {
  return useQuery({
    queryKey: ['knowledge-graph', projectId],
    queryFn: () => researchV3Service.getKnowledgeGraphData(projectId),
    enabled: !!projectId,
    staleTime: 60000,
  });
};

export const useCollections = (projectId: string) => {
  return useQuery({
    queryKey: ['collections', projectId],
    queryFn: () => researchV3Service.getCollections(projectId),
    enabled: !!projectId,
  });
};

export const useCollectionDocuments = (collectionId: string | null) => {
  return useQuery({
    queryKey: ['collection-documents', collectionId],
    queryFn: () => researchV3Service.getCollectionDocuments(collectionId!),
    enabled: !!collectionId,
  });
};

export const useBookmarks = (documentId: string | null) => {
  return useQuery({
    queryKey: ['bookmarks', documentId],
    queryFn: () => researchV3Service.getBookmarks(documentId!),
    enabled: !!documentId,
  });
};

export const useHighlights = (documentId: string | null) => {
  return useQuery({
    queryKey: ['highlights', documentId],
    queryFn: () => researchV3Service.getHighlights(documentId!),
    enabled: !!documentId,
  });
};

export const useDocumentNotes = (documentId: string | null) => {
  return useQuery({
    queryKey: ['document-notes', documentId],
    queryFn: () => researchV3Service.getNotes(documentId!),
    enabled: !!documentId,
  });
};

export const useSuggestedQuestions = () => {
  return useMutation({
    mutationFn: ({ projectId, documentId }: { projectId: string; documentId: string }) =>
      researchV3Service.suggestQuestions(projectId, documentId),
  });
};

export const useRelatedDocuments = () => {
  return useMutation({
    mutationFn: ({ projectId, documentId }: { projectId: string; documentId: string }) =>
      researchV3Service.findRelatedDocuments(projectId, documentId),
  });
};

export const useCrossDocumentReasoning = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds: string[] }) =>
      researchV3Service.crossDocumentReasoning(projectId, documentIds),
  });
};

export const useRecommendations = () => {
  return useMutation({
    mutationFn: ({ projectId, documentIds }: { projectId: string; documentIds?: string[] }) =>
      researchV3Service.getRecommendations(projectId, documentIds),
  });
};

export const useResearchSession = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['research-session', projectId],
    queryFn: () => researchV3Service.getResearchSession(projectId),
    enabled: !!projectId,
  });

  const saveSession = useMutation({
    mutationFn: ({ title, documentIds }: { title?: string; documentIds: string[] }) =>
      researchV3Service.saveResearchSession(projectId, title, documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-session', projectId] });
    },
  });

  return { session, saveSession };
};

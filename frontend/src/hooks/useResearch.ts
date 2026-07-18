import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { researchService } from '../api/research';
import { hypothesisService } from '../api/hypotheses';
import { researchQuestionService } from '../api/researchQuestions';

export const useRunResearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, question }: { projectId: string; question: string }) =>
      researchService.run(projectId, question),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['research-history', projectId] });
    },
  });
};

export const useResearchSession = (projectId: string, sessionId: string | null) => {
  return useQuery({
    queryKey: ['research-session', projectId, sessionId],
    queryFn: () => researchService.getSession(projectId, sessionId!),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.session.status === 'completed' || data.session.status === 'failed')) {
        return false;
      }
      return 2000;
    },
  });
};

export const useResearchHistory = (projectId: string) => {
  return useQuery({
    queryKey: ['research-history', projectId],
    queryFn: () => researchService.getHistory(projectId),
  });
};

export const useHypotheses = (projectId: string) => {
  return useQuery({
    queryKey: ['hypotheses', projectId],
    queryFn: () => hypothesisService.list(projectId),
  });
};

export const useDeleteHypothesis = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hypothesisService.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hypotheses', projectId] });
    },
  });
};

export const useResearchQuestions = (projectId: string) => {
  return useQuery({
    queryKey: ['research-questions', projectId],
    queryFn: () => researchQuestionService.list(projectId),
  });
};

export const useDeleteRQ = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => researchQuestionService.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-questions', projectId] });
    },
  });
};

export const useGenerateHypothesis = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => researchQuestionService.generateHypothesis(projectId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-questions', projectId] });
    },
  });
};

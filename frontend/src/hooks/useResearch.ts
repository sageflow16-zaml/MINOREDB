import { ResearchQuestionRead, HypothesisRead } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { researchQuestionService, hypothesisService } from '../api';
import toast from 'react-hot-toast';

export const useResearchQuestions = (projectId: string) => {
  return useQuery({
    queryKey: ['questions', projectId],
    queryFn: () => researchQuestionService.list(projectId),
  });
};

export const useGenerateHypothesis = (projectId: string) => {
    return useMutation({
      mutationFn: (questionId: string) => researchQuestionService.generateHypothesis(projectId, questionId),
      onSuccess: () => toast.success('Hypothesis generated'),
      onError: () => toast.error('Failed to generate hypothesis'),
    });
};

export const useDeleteRQ = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => researchQuestionService.remove(projectId, id),
    onSuccess: () => toast.success('Research question deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['questions', projectId] }),
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
      onSuccess: () => toast.success('Hypothesis deleted'),
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['hypotheses', projectId] }),
    });
};

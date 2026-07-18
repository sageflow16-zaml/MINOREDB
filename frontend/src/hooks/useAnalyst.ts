import { useMutation } from '@tanstack/react-query';
import { analystService } from '../api/analyst';

export const useAnalystQuery = () => {
  return useMutation({
    mutationFn: ({ projectId, question }: { projectId: string; question: string }) =>
      analystService.query(projectId, question),
  });
};

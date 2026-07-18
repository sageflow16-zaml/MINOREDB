import { useQuery } from '@tanstack/react-query';
import { knowledgeRuleService } from '../api/knowledgeRules';

export const useKnowledgeRules = (projectId: string) => {
  return useQuery({
    queryKey: ['knowledge-rules', projectId],
    queryFn: () => knowledgeRuleService.list(projectId),
    enabled: !!projectId,
  });
};

export const useKnowledgeRule = (projectId: string, ruleId: string) => {
  return useQuery({
    queryKey: ['knowledge-rule', projectId, ruleId],
    queryFn: () => knowledgeRuleService.get(projectId, ruleId),
    enabled: !!projectId && !!ruleId,
  });
};

export const useTopKnowledgeRule = (projectId: string) => {
  return useQuery({
    queryKey: ['knowledge-rule-top', projectId],
    queryFn: () => knowledgeRuleService.top(projectId),
    enabled: !!projectId,
  });
};

import { useQuery } from '@tanstack/react-query';
import { knowledgeGraphService } from '../api/knowledgeGraph';

export const useKnowledgeGraphData = (projectId: string, nodeType?: string) => {
  return useQuery({
    queryKey: ['knowledge-graph-data', projectId, nodeType],
    queryFn: () => knowledgeGraphService.data(projectId, nodeType),
    enabled: !!projectId,
  });
};

export const useKnowledgeGraphSnapshot = (projectId: string) => {
  return useQuery({
    queryKey: ['knowledge-graph-snapshot', projectId],
    queryFn: () => knowledgeGraphService.snapshot(projectId),
    enabled: !!projectId,
  });
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeGraphService } from '../api/knowledgeGraph';

export const useKnowledgeGraphData = (projectId: string, nodeType?: string) => {
  const options = useMemo(() => ({
    queryKey: ['knowledge-graph-data', projectId, nodeType] as const,
    queryFn: () => knowledgeGraphService.data(projectId, nodeType),
    enabled: !!projectId,
  }), [projectId, nodeType]);
  return useQuery(options);
};

export const useKnowledgeGraphSnapshot = (projectId: string) => {
  const options = useMemo(() => ({
    queryKey: ['knowledge-graph-snapshot', projectId] as const,
    queryFn: () => knowledgeGraphService.snapshot(projectId),
    enabled: !!projectId,
  }), [projectId]);
  return useQuery(options);
};

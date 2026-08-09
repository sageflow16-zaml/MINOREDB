import { useQuery } from '@tanstack/react-query';
import {claimService} from '../api';

export const useGraphData = (projectId: string, claimId: string) => {
  return useQuery({
    queryKey: ['graph', projectId, claimId],
    queryFn: () => claimService.graph(projectId, claimId),
    enabled: !!claimId && !!projectId,
  });
};

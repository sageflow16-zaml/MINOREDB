import { useQuery } from '@tanstack/react-query';
import { searchService } from '../api';

export const useSearch = (projectId: string, query: string) => {
  return useQuery({
    queryKey: ['search', projectId, query],
    queryFn: () => searchService.query(projectId, query),
    enabled: !!query && !!projectId,
  });
};

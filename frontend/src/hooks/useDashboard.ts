import { useStableQuery } from './useStableQuery';
import {dashboardService} from '../api';

export const useDashboardStats = (projectId: string) => {
  return useStableQuery({
    queryKey: ['dashboard-stats', projectId],
    queryFn: () => dashboardService.stats(projectId),
    enabled: !!projectId,
  });
};

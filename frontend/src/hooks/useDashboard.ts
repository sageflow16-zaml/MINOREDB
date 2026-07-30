import { useStableQuery } from './useStableQuery';
import { dashboardService, type DashboardStats } from '../api';

export const useDashboardStats = (projectId: string) => {
  return useStableQuery({
    queryKey: ['dashboard-stats', projectId],
    queryFn: () => dashboardService.stats(projectId),
    enabled: !!projectId,
  });
};

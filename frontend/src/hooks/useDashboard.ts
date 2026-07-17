import { useQuery } from '@tanstack/react-query';
import { dashboardService, type DashboardStats } from '../api';

export const useDashboardStats = (projectId: string) => {
  return useQuery({
    queryKey: ['dashboard-stats', projectId],
    queryFn: () => dashboardService.stats(projectId),
  });
};

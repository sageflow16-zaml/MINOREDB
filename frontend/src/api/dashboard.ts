import { supabase } from '../lib/supabase';
import type { DashboardStats } from './types';

export const dashboardService = {
  stats: async (projectId: string): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc('get_dashboard_stats', { p_project_id: projectId });
    if (error) throw error;
    return (data ?? {}) as unknown as DashboardStats;
  },
};

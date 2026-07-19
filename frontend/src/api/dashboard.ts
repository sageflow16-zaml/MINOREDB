import api from '../services/api';
import type { DashboardStats } from './types';

export const dashboardService = {
  // Backend exposes dashboard at /dashboard and expects a required `project_id` query param.
  // Call the backend endpoint with the project_id as a query parameter to match the router.
  stats: (projectId: string) =>
    api.get<DashboardStats>(`/projects/${projectId}/dashboard/`).then((r) => r.data),
};
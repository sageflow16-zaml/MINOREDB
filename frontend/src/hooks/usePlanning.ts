import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../api/planning';

export const usePlanningDashboard = (projectId: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'dashboard'],
    queryFn: () => planningService.dashboard(projectId),
    enabled: !!projectId,
  });
};

export const useDayView = (projectId: string, date: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'day', date],
    queryFn: () => planningService.dayView(projectId, date),
    enabled: !!projectId && !!date,
  });
};

export const useWeekView = (projectId: string, weekStart: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'week', weekStart],
    queryFn: () => planningService.weekView(projectId, weekStart),
    enabled: !!projectId && !!weekStart,
  });
};

export const usePlans = (projectId: string, startDate?: string, endDate?: string, planType?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'plans', startDate, endDate, planType],
    queryFn: () => planningService.plans(projectId, startDate, endDate, planType),
    enabled: !!projectId,
  });
};

export const useCreatePlan = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createPlan(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId] }),
  });
};

export const useUpdatePlan = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Record<string, unknown> }) => planningService.updatePlan(projectId, planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId] }),
  });
};

export const useDeletePlan = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => planningService.deletePlan(projectId, planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId] }),
  });
};

export const useChecklistTemplates = (projectId: string, type?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'checklistTemplates', type],
    queryFn: () => planningService.checklistTemplates(projectId, type),
    enabled: !!projectId,
  });
};

export const useCreateChecklistTemplate = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; checklist_type: string; items: { label: string; category?: string; optional?: boolean }[] }) =>
      planningService.createChecklistTemplate(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'checklistTemplates'] }),
  });
};

export const useChecklistExecutions = (projectId: string, date?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'checklistExecutions', date],
    queryFn: () => planningService.checklistExecutions(projectId, date),
    enabled: !!projectId,
  });
};

export const useCreateChecklistExecution = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { template_id: string; execution_date: string; completed_items?: { label: string; completed: boolean }[]; notes?: string }) =>
      planningService.createChecklistExecution(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'checklistExecutions'] }),
  });
};

export const useEconomicEvents = (projectId: string, startDate?: string, endDate?: string, currency?: string, impactLevel?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'economicEvents', startDate, endDate, currency, impactLevel],
    queryFn: () => planningService.economicEvents(projectId, startDate, endDate, currency, impactLevel),
    enabled: !!projectId,
  });
};

export const useCreateEconomicEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createEconomicEvent(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'economicEvents'] }),
  });
};

export const useReviews = (projectId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'reviews', startDate, endDate],
    queryFn: () => planningService.reviews(projectId, startDate, endDate),
    enabled: !!projectId,
  });
};

export const useCreateReview = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createReview(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId] }),
  });
};

export const useGoals = (projectId: string, goalType?: string, status?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'goals', goalType, status],
    queryFn: () => planningService.goals(projectId, goalType, status),
    enabled: !!projectId,
  });
};

export const useCreateGoal = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createGoal(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'goals'] }),
  });
};

export const useUpdateGoal = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Record<string, unknown> }) => planningService.updateGoal(projectId, goalId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'goals'] }),
  });
};

export const useDeleteGoal = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => planningService.deleteGoal(projectId, goalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'goals'] }),
  });
};

export const useReminders = (projectId: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'reminders'],
    queryFn: () => planningService.reminders(projectId),
    enabled: !!projectId,
  });
};

export const useCreateReminder = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createReminder(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'reminders'] }),
  });
};

export const useToggleReminder = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) => planningService.toggleReminder(projectId, reminderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'reminders'] }),
  });
};

export const useDeleteReminder = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) => planningService.deleteReminder(projectId, reminderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'reminders'] }),
  });
};

export const useCalendarEvents = (projectId: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['planning', projectId, 'calendarEvents', startDate, endDate],
    queryFn: () => planningService.calendarEvents(projectId, startDate, endDate),
    enabled: !!projectId,
  });
};

export const useCreateCalendarEvent = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planningService.createCalendarEvent(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning', projectId, 'calendarEvents'] }),
  });
};

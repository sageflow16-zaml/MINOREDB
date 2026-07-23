import api from '../services/api';
import type {
  TradingPlan,
  ChecklistTemplate,
  ChecklistExecution,
  EconomicEvent,
  DailyReview,
  Goal,
  Reminder,
  CalendarEvent,
  DayViewData,
  WeekViewData,
  PlanningDashboard,
} from './types';

const base = (projectId: string) => `/projects/${projectId}/planning`;

export const planningService = {
  dashboard: (projectId: string) =>
    api.get<PlanningDashboard>(`${base(projectId)}/dashboard`).then((r) => r.data),

  dayView: (projectId: string, date: string) =>
    api.get<DayViewData>(`${base(projectId)}/day/${date}`).then((r) => r.data),

  weekView: (projectId: string, weekStart: string) =>
    api.get<WeekViewData>(`${base(projectId)}/week/${weekStart}`).then((r) => r.data),

  // Plans
  plans: (projectId: string, startDate?: string, endDate?: string, planType?: string) =>
    api.get<TradingPlan[]>(`${base(projectId)}/plans`, { params: { start_date: startDate, end_date: endDate, plan_type: planType } }).then((r) => r.data),

  createPlan: (projectId: string, data: Partial<TradingPlan>) =>
    api.post<TradingPlan>(`${base(projectId)}/plans`, data).then((r) => r.data),

  updatePlan: (projectId: string, planId: string, data: Partial<TradingPlan>) =>
    api.put<TradingPlan>(`${base(projectId)}/plans/${planId}`, data).then((r) => r.data),

  deletePlan: (projectId: string, planId: string) =>
    api.delete(`${base(projectId)}/plans/${planId}`).then((r) => r.data),

  // Checklists
  checklistTemplates: (projectId: string, type?: string) =>
    api.get<ChecklistTemplate[]>(`${base(projectId)}/checklists/templates`, { params: { checklist_type: type } }).then((r) => r.data),

  createChecklistTemplate: (projectId: string, data: { name: string; checklist_type: string; items: { label: string; category?: string; optional?: boolean }[] }) =>
    api.post<ChecklistTemplate>(`${base(projectId)}/checklists/templates`, data).then((r) => r.data),

  deleteChecklistTemplate: (projectId: string, templateId: string) =>
    api.delete(`${base(projectId)}/checklists/templates/${templateId}`).then((r) => r.data),

  checklistExecutions: (projectId: string, date?: string) =>
    api.get<ChecklistExecution[]>(`${base(projectId)}/checklists/executions`, { params: { execution_date: date } }).then((r) => r.data),

  createChecklistExecution: (projectId: string, data: { template_id: string; execution_date: string; completed_items?: { label: string; completed: boolean }[]; notes?: string }) =>
    api.post<ChecklistExecution>(`${base(projectId)}/checklists/executions`, data).then((r) => r.data),

  // Economic Events
  economicEvents: (projectId: string, startDate?: string, endDate?: string, currency?: string, impactLevel?: string) =>
    api.get<EconomicEvent[]>(`${base(projectId)}/economic-events`, { params: { start_date: startDate, end_date: endDate, currency, impact_level: impactLevel } }).then((r) => r.data),

  createEconomicEvent: (projectId: string, data: Partial<EconomicEvent>) =>
    api.post<EconomicEvent>(`${base(projectId)}/economic-events`, data).then((r) => r.data),

  deleteEconomicEvent: (projectId: string, eventId: string) =>
    api.delete(`${base(projectId)}/economic-events/${eventId}`).then((r) => r.data),

  // Reviews
  reviews: (projectId: string, startDate?: string, endDate?: string) =>
    api.get<DailyReview[]>(`${base(projectId)}/reviews`, { params: { start_date: startDate, end_date: endDate } }).then((r) => r.data),

  createReview: (projectId: string, data: Partial<DailyReview>) =>
    api.post<DailyReview>(`${base(projectId)}/reviews`, data).then((r) => r.data),

  updateReview: (projectId: string, reviewId: string, data: Partial<DailyReview>) =>
    api.put<DailyReview>(`${base(projectId)}/reviews/${reviewId}`, data).then((r) => r.data),

  // Goals
  goals: (projectId: string, goalType?: string, status?: string) =>
    api.get<Goal[]>(`${base(projectId)}/goals`, { params: { goal_type: goalType, status } }).then((r) => r.data),

  createGoal: (projectId: string, data: Partial<Goal>) =>
    api.post<Goal>(`${base(projectId)}/goals`, data).then((r) => r.data),

  updateGoal: (projectId: string, goalId: string, data: Partial<Goal>) =>
    api.put<Goal>(`${base(projectId)}/goals/${goalId}`, data).then((r) => r.data),

  deleteGoal: (projectId: string, goalId: string) =>
    api.delete(`${base(projectId)}/goals/${goalId}`).then((r) => r.data),

  // Reminders
  reminders: (projectId: string) =>
    api.get<Reminder[]>(`${base(projectId)}/reminders`).then((r) => r.data),

  createReminder: (projectId: string, data: Partial<Reminder>) =>
    api.post<Reminder>(`${base(projectId)}/reminders`, data).then((r) => r.data),

  toggleReminder: (projectId: string, reminderId: string) =>
    api.post(`${base(projectId)}/reminders/${reminderId}/toggle`).then((r) => r.data),

  deleteReminder: (projectId: string, reminderId: string) =>
    api.delete(`${base(projectId)}/reminders/${reminderId}`).then((r) => r.data),

  // Calendar Events
  calendarEvents: (projectId: string, startDate?: string, endDate?: string) =>
    api.get<CalendarEvent[]>(`${base(projectId)}/events`, { params: { start_date: startDate, end_date: endDate } }).then((r) => r.data),

  createCalendarEvent: (projectId: string, data: Partial<CalendarEvent>) =>
    api.post<CalendarEvent>(`${base(projectId)}/events`, data).then((r) => r.data),

  deleteCalendarEvent: (projectId: string, eventId: string) =>
    api.delete(`${base(projectId)}/events/${eventId}`).then((r) => r.data),
};

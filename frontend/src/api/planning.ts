import { supabase } from '../lib/supabase';
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
  SessionInfo,
} from './types';

function toJsonb(v: unknown): unknown {
  if (typeof v === 'string' && v.includes(',')) return v.split(',').map(s => s.trim()).filter(Boolean);
  if (Array.isArray(v)) return v;
  return v ?? [];
}

function toNum(v: unknown): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export const planningService = {
  dashboard: async (projectId: string): Promise<PlanningDashboard> => {
    const { data, error } = await supabase.rpc('get_planning_dashboard', { p_project_id: projectId });
    if (error) throw error;
    return (data ?? {}) as unknown as PlanningDashboard;
  },

  dayView: async (projectId: string, date: string): Promise<DayViewData> => {
    const dayEnd = new Date(new Date(date).getTime() + 86400000).toISOString();
    const [planResult, eventsResult, economicResult, checklistResult, reviewResult] = await Promise.all([
      supabase.from('trading_plan').select('*').eq('project_id', projectId).eq('plan_date', date).is('deleted_at', null).maybeSingle(),
      supabase.from('calendar_event').select('*').eq('project_id', projectId).gte('event_date', date).lt('event_date', dayEnd).order('event_time'),
      supabase.from('economic_event').select('*').eq('project_id', projectId).gte('event_date', date).lt('event_date', dayEnd),
      supabase.from('checklist_execution').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('execution_date', date).eq('is_completed', true),
      supabase.from('daily_review').select('*').eq('project_id', projectId).eq('review_date', date).maybeSingle(),
    ]);
    if (planResult.error) throw planResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (economicResult.error) throw economicResult.error;
    if (checklistResult.error) throw checklistResult.error;
    if (reviewResult.error) throw reviewResult.error;

    const now = new Date();
    const sessions: SessionInfo[] = [
      { name: 'Asia', start_time: '00:00', end_time: '09:00', status: 'inactive', is_current: false },
      { name: 'London', start_time: '07:00', end_time: '16:00', status: 'inactive', is_current: false },
      { name: 'New York', start_time: '12:00', end_time: '21:00', status: 'inactive', is_current: false },
    ].map((s) => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
      const isCurrent = nowMin >= startMin && nowMin < endMin;
      return { ...s, is_current: isCurrent, status: isCurrent ? 'active' : 'inactive' };
    });

    return {
      date,
      plan: planResult.data as TradingPlan | undefined,
      events: (eventsResult.data ?? []) as CalendarEvent[],
      economic_events: (economicResult.data ?? []) as EconomicEvent[],
      checklist_completed: (checklistResult.count ?? 0) > 0,
      review: reviewResult.data as DailyReview | undefined,
      sessions,
    };
  },

  weekView: async (projectId: string, weekStart: string): Promise<WeekViewData> => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().slice(0, 10);

    const weekEndTs = new Date(new Date(endStr).getTime() + 86400000).toISOString();
    const [plansResult, eventsResult, economicResult, checklistsResult, reviewsResult, goalsResult] = await Promise.all([
      supabase.from('trading_plan').select('*').eq('project_id', projectId).gte('plan_date', weekStart).lte('plan_date', endStr).is('deleted_at', null),
      supabase.from('calendar_event').select('*').eq('project_id', projectId).gte('event_date', weekStart).lt('event_date', weekEndTs).order('event_time'),
      supabase.from('economic_event').select('*').eq('project_id', projectId).gte('event_date', weekStart).lt('event_date', weekEndTs),
      supabase.from('checklist_execution').select('*').eq('project_id', projectId).gte('execution_date', weekStart).lte('execution_date', endStr),
      supabase.from('daily_review').select('*').eq('project_id', projectId).gte('review_date', weekStart).lte('review_date', endStr),
      supabase.from('goal').select('*').eq('project_id', projectId).eq('goal_type', 'weekly'),
    ]);
    if (plansResult.error) throw plansResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (economicResult.error) throw economicResult.error;
    if (checklistsResult.error) throw checklistsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;
    if (goalsResult.error) throw goalsResult.error;

    const plans = (plansResult.data ?? []) as TradingPlan[];
    const events = (eventsResult.data ?? []) as CalendarEvent[];
    const economic = (economicResult.data ?? []) as EconomicEvent[];
    const checklists = (checklistsResult.data ?? []) as ChecklistExecution[];
    const reviews = (reviewsResult.data ?? []) as DailyReview[];

    const days: DayViewData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      days.push({
        date: ds,
        plan: plans.find((p) => p.plan_date === ds),
        events: events.filter((e) => e.event_date?.slice(0, 10) === ds),
        economic_events: economic.filter((e) => e.event_date?.slice(0, 10) === ds),
        checklist_completed: checklists.some((c) => c.execution_date === ds && c.is_completed),
        review: reviews.find((r) => r.review_date === ds),
        sessions: [],
      });
    }

    return {
      week_start: weekStart,
      week_end: endStr,
      days,
      weekly_goals: (goalsResult.data ?? []) as Goal[],
      weekly_review: undefined,
    };
  },

  // Plans
  plans: async (projectId: string, startDate?: string, endDate?: string, planType?: string): Promise<TradingPlan[]> => {
    let query = supabase.from('trading_plan').select('*').eq('project_id', projectId).is('deleted_at', null).order('plan_date', { ascending: false });
    if (startDate) query = query.gte('plan_date', startDate);
    if (endDate) query = query.lte('plan_date', endDate);
    if (planType) query = query.eq('plan_type', planType);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TradingPlan[];
  },

  createPlan: async (projectId: string, data: Partial<TradingPlan>): Promise<TradingPlan> => {
    const { data: row, error } = await supabase.from('trading_plan').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as TradingPlan;
  },

  updatePlan: async (projectId: string, planId: string, data: Partial<TradingPlan>): Promise<TradingPlan> => {
    const { data: row, error } = await supabase.from('trading_plan').update(data).eq('id', planId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as TradingPlan;
  },

  deletePlan: async (projectId: string, planId: string): Promise<void> => {
    const { error } = await supabase.from('trading_plan').update({ deleted_at: new Date().toISOString() }).eq('id', planId).eq('project_id', projectId);
    if (error) throw error;
  },

  // Checklists
  checklistTemplates: async (projectId: string, type?: string): Promise<ChecklistTemplate[]> => {
    let query = supabase.from('checklist_template').select('*').eq('project_id', projectId).order('name');
    if (type) query = query.eq('checklist_type', type);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ChecklistTemplate[];
  },

  createChecklistTemplate: async (projectId: string, data: { name: string; checklist_type: string; items: { label: string; category?: string; optional?: boolean }[] }): Promise<ChecklistTemplate> => {
    const { data: row, error } = await supabase.from('checklist_template').insert({ project_id: projectId, name: data.name, checklist_type: data.checklist_type, items: data.items as any, is_active: true }).select().single();
    if (error) throw error;
    return row as ChecklistTemplate;
  },

  deleteChecklistTemplate: async (projectId: string, templateId: string): Promise<void> => {
    const { error } = await supabase.from('checklist_template').delete().eq('id', templateId).eq('project_id', projectId);
    if (error) throw error;
  },

  checklistExecutions: async (projectId: string, date?: string): Promise<ChecklistExecution[]> => {
    let query = supabase.from('checklist_execution').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (date) query = query.eq('execution_date', date);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ChecklistExecution[];
  },

  createChecklistExecution: async (projectId: string, data: { template_id: string; execution_date: string; completed_items?: { label: string; completed: boolean }[]; notes?: string }): Promise<ChecklistExecution> => {
    const { data: row, error } = await supabase.from('checklist_execution').insert({
      project_id: projectId,
      template_id: data.template_id,
      execution_date: data.execution_date,
      items: (data.completed_items ?? []) as any,
      notes: data.notes,
      is_completed: data.completed_items?.every((i) => i.completed) ?? false,
    }).select().single();
    if (error) throw error;
    return row as ChecklistExecution;
  },

  // Economic Events
  economicEvents: async (projectId: string, startDate?: string, endDate?: string, currency?: string, impactLevel?: string): Promise<EconomicEvent[]> => {
    let query = supabase.from('economic_event').select('*').eq('project_id', projectId).order('event_date', { ascending: true });
    if (startDate) query = query.gte('event_date', startDate);
    if (endDate) query = query.lte('event_date', endDate);
    if (currency) query = query.eq('currency', currency);
    if (impactLevel) query = query.eq('impact_level', impactLevel);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as EconomicEvent[];
  },

  createEconomicEvent: async (projectId: string, data: Partial<EconomicEvent>): Promise<EconomicEvent> => {
    const { data: row, error } = await supabase.from('economic_event').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as EconomicEvent;
  },

  deleteEconomicEvent: async (projectId: string, eventId: string): Promise<void> => {
    const { error } = await supabase.from('economic_event').delete().eq('id', eventId).eq('project_id', projectId);
    if (error) throw error;
  },

  // Reviews
  reviews: async (projectId: string, startDate?: string, endDate?: string): Promise<DailyReview[]> => {
    let query = supabase.from('daily_review').select('*').eq('project_id', projectId).order('review_date', { ascending: false });
    if (startDate) query = query.gte('review_date', startDate);
    if (endDate) query = query.lte('review_date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DailyReview[];
  },

  createReview: async (projectId: string, data: Partial<DailyReview>): Promise<DailyReview> => {
    const payload = {
      project_id: projectId,
      ...data,
      mistakes: toJsonb(data.mistakes),
      lessons: toJsonb(data.lessons),
      next_improvements: data.next_improvements ? toJsonb(data.next_improvements) : undefined,
      discipline_score: toNum(data.discipline_score),
      adherence_to_plan: toNum(data.adherence_to_plan),
      psychology_rating: toNum(data.psychology_rating),
      overall_rating: toNum(data.overall_rating),
    };
    const { data: row, error } = await supabase.from('daily_review').insert(payload).select().single();
    if (error) throw error;
    return row as DailyReview;
  },

  updateReview: async (projectId: string, reviewId: string, data: Partial<DailyReview>): Promise<DailyReview> => {
    const payload = {
      ...data,
      mistakes: data.mistakes !== undefined ? toJsonb(data.mistakes) : undefined,
      lessons: data.lessons !== undefined ? toJsonb(data.lessons) : undefined,
      next_improvements: data.next_improvements !== undefined ? toJsonb(data.next_improvements) : undefined,
      discipline_score: data.discipline_score !== undefined ? toNum(data.discipline_score) : undefined,
      adherence_to_plan: data.adherence_to_plan !== undefined ? toNum(data.adherence_to_plan) : undefined,
      psychology_rating: data.psychology_rating !== undefined ? toNum(data.psychology_rating) : undefined,
      overall_rating: data.overall_rating !== undefined ? toNum(data.overall_rating) : undefined,
    };
    Object.keys(payload).forEach((k) => { if (payload[k as keyof typeof payload] === undefined) delete payload[k as keyof typeof payload]; });
    const { data: row, error } = await supabase.from('daily_review').update(payload).eq('id', reviewId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as DailyReview;
  },

  // Goals
  goals: async (projectId: string, goalType?: string, status?: string): Promise<Goal[]> => {
    let query = supabase.from('goal').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (goalType) query = query.eq('goal_type', goalType);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  createGoal: async (projectId: string, data: Partial<Goal>): Promise<Goal> => {
    const { data: row, error } = await supabase.from('goal').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as Goal;
  },

  updateGoal: async (projectId: string, goalId: string, data: Partial<Goal>): Promise<Goal> => {
    const { data: row, error } = await supabase.from('goal').update(data).eq('id', goalId).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as Goal;
  },

  deleteGoal: async (projectId: string, goalId: string): Promise<void> => {
    const { error } = await supabase.from('goal').delete().eq('id', goalId).eq('project_id', projectId);
    if (error) throw error;
  },

  // Reminders
  reminders: async (projectId: string): Promise<Reminder[]> => {
    const { data, error } = await supabase.from('reminder').select('*').eq('project_id', projectId).order('reminder_time', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Reminder[];
  },

  createReminder: async (projectId: string, data: Partial<Reminder>): Promise<Reminder> => {
    const { data: row, error } = await supabase.from('reminder').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as Reminder;
  },

  toggleReminder: async (projectId: string, reminderId: string): Promise<void> => {
    const { data: reminder, error: fetchError } = await supabase.from('reminder').select('is_active').eq('id', reminderId).eq('project_id', projectId).single();
    if (fetchError) throw fetchError;
    const { error } = await supabase.from('reminder').update({ is_active: !reminder.is_active }).eq('id', reminderId).eq('project_id', projectId);
    if (error) throw error;
  },

  deleteReminder: async (projectId: string, reminderId: string): Promise<void> => {
    const { error } = await supabase.from('reminder').delete().eq('id', reminderId).eq('project_id', projectId);
    if (error) throw error;
  },

  // Calendar Events
  calendarEvents: async (projectId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> => {
    let query = supabase.from('calendar_event').select('*').eq('project_id', projectId).order('event_date', { ascending: true });
    if (startDate) query = query.gte('event_date', startDate);
    if (endDate) query = query.lte('event_date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CalendarEvent[];
  },

  createCalendarEvent: async (projectId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const { data: row, error } = await supabase.from('calendar_event').insert({ project_id: projectId, ...data }).select().single();
    if (error) throw error;
    return row as CalendarEvent;
  },

  deleteCalendarEvent: async (projectId: string, eventId: string): Promise<void> => {
    const { error } = await supabase.from('calendar_event').delete().eq('id', eventId).eq('project_id', projectId);
    if (error) throw error;
  },
};

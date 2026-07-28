import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import {
  usePlanningDashboard, useDayView, usePlans, useCreatePlan,
  useChecklistTemplates, useCreateChecklistTemplate, useChecklistExecutions, useCreateChecklistExecution,
  useEconomicEvents, useCreateEconomicEvent,
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useReminders, useCreateReminder, useToggleReminder, useDeleteReminder,
  useCreateCalendarEvent,
  useReviews, useCreateReview,
} from '../hooks/usePlanning';
import type { PlanningDashboard, DayViewData, Goal, Reminder, EconomicEvent, ChecklistTemplate, DailyReview } from '../api/types';
import {
  Calendar, Target, CheckCircle, Bell, BellOff, Plus, Trash2,
  ChevronLeft, ChevronRight, Eye, Brain,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const IMPACT_COLORS = { high: 'destructive', medium: 'warning', low: 'info' } as const;

function getWeekStart(date: Date): Date { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d; }
function formatDate(d: Date): string { return d.toISOString().split('T')[0]; }

function InsightBadge({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (<div className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2"><span className="text-xs text-[#A1A1AA]">{label}</span><span className={cn('text-xs font-mono font-medium', good === undefined ? 'text-[#FAFAFA]' : good ? 'text-[#22C55E]' : 'text-[#EF4444]')}>{value}</span></div>);
}

export default function PlanningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateEconEvent, setShowCreateEconEvent] = useState(false);
  const [showCreateChecklist, setShowCreateChecklist] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);

  const dashboard = usePlanningDashboard(projectId!);
  const dayView = useDayView(projectId!, selectedDate);
  const plans = usePlans(projectId!);
  const goals = useGoals(projectId!);
  const reminders = useReminders(projectId!);
  const templates = useChecklistTemplates(projectId!);
  const execs = useChecklistExecutions(projectId!, selectedDate);
  const econEvents = useEconomicEvents(projectId!, selectedDate, selectedDate);
  const reviews = useReviews(projectId!);

  const createPlan = useCreatePlan(projectId!);
  const createGoal = useCreateGoal(projectId!);
  const updateGoal = useUpdateGoal(projectId!);
  const deleteGoal = useDeleteGoal(projectId!);
  const createReminder = useCreateReminder(projectId!);
  const toggleReminder = useToggleReminder(projectId!);
  const deleteReminder = useDeleteReminder(projectId!);
  const createEvent = useCreateCalendarEvent(projectId!);
  const createEconEvent = useCreateEconomicEvent(projectId!);
  const createChecklistTemplate = useCreateChecklistTemplate(projectId!);
  const createChecklistExec = useCreateChecklistExecution(projectId!);
  const createReview = useCreateReview(projectId!);

  const isLoading = dashboard.isLoading || dayView.isLoading || plans.isLoading || goals.isLoading || reminders.isLoading || econEvents.isLoading || reviews.isLoading;
  const isError = dashboard.isError || dayView.isError || plans.isError || goals.isError || reminders.isError || econEvents.isError || reviews.isError;

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1); const start = getWeekStart(firstDay);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [currentMonth]);

  const dash = dashboard.data as PlanningDashboard | undefined;
  const dv = dayView.data as DayViewData | undefined;
  const goalList = (goals.data || []) as Goal[];
  const reminderList = (reminders.data || []) as Reminder[];
  const templateList = (templates.data || []) as ChecklistTemplate[];
  const reviewList = (reviews.data || []) as DailyReview[];

  if (isLoading) {
    return (<div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto"><div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /></div>);
  }

  if (isError) {
    return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"><Calendar className="h-6 w-6 text-[#EF4444]" /></div><p className="text-sm font-medium text-[#FAFAFA]">Error loading planning data</p><Button variant="outline" size="sm" onClick={() => dashboard.refetch()}>Try Again</Button></div></div>);
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5]/10"><Calendar className="h-5 w-5 text-[#4F46E5]" /></div>
          <div><h1 className="text-xl font-semibold text-[#FAFAFA] tracking-tight">Planning</h1><p className="text-sm text-[#71717A] mt-0.5">Trading operations hub</p></div>
        </div>
      </motion.div>

      {/* Daily Overview KPIs */}
      {dash && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InsightBadge label="Today's Plan" value={dash.has_plan ? 'Created' : 'Not Set'} good={dash.has_plan} />
          <InsightBadge label="Active Goals" value={String(dash.active_goals_count)} good={dash.active_goals_count > 0} />
          <InsightBadge label="Goal Progress" value={`${dash.goal_progress}%`} good={dash.goal_progress >= 50} />
          <InsightBadge label="Reminders" value={String((dash.active_reminders ?? []).length)} />
        </motion.div>
      )}

      {/* Calendar + Selected Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#71717A]" /><h3 className="text-sm font-medium text-[#FAFAFA]">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3></div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(formatDate(new Date())); }}><Eye className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-medium text-[#71717A] py-1.5">{d}</div>)}
            {calendarDays.map((day, i) => {
              const dateStr = formatDate(day);
              const isToday = dateStr === formatDate(new Date());
              const isSelected = dateStr === selectedDate;
              return (
                <button key={i} onClick={() => setSelectedDate(dateStr)}
                  className={cn('relative h-16 rounded-lg border p-1 text-left transition-all hover:border-[#4F46E5]/50', isSelected ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#27272A]/50', isToday && 'ring-1 ring-[#4F46E5]/30', day.getMonth() !== currentMonth.getMonth() && 'opacity-40')}>
                  <span className={cn('text-[10px] font-medium', isToday ? 'text-[#4F46E5]' : 'text-[#FAFAFA]')}>{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Day View */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#FAFAFA]">{selectedDate}</h3>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setShowCreatePlan(!showCreatePlan)}><Plus className="h-3.5 w-3.5 mr-1" />Plan</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateReview(!showCreateReview)}><Brain className="h-3.5 w-3.5 mr-1" />Review</Button>
            </div>
          </div>
          <div className="space-y-2">
            {dv?.sessions?.map((s: any, i: number) => (
              <div key={i} className={cn('flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2', s.is_current && 'border border-[#4F46E5]/30')}>
                <div className="flex items-center gap-2"><div className={cn('h-2 w-2 rounded-full', s.is_current ? 'bg-[#22C55E] animate-pulse' : 'bg-[#71717A]')} /><span className="text-xs text-[#A1A1AA]">{s.name}</span></div>
                <span className="text-[10px] text-[#71717A]">{s.start_time}-{s.end_time}</span>
              </div>
            ))}
            {(dv?.economic_events ?? []).slice(0, 3).map((ev: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-[#111113] px-3 py-2"><Badge variant={IMPACT_COLORS[ev.impact_level as keyof typeof IMPACT_COLORS] || 'secondary'} size="sm">{ev.impact_level}</Badge><span className="text-xs text-[#A1A1AA]">{ev.event_name}</span><span className="text-[10px] text-[#71717A] ml-auto">{ev.currency}</span></div>
            ))}
            {!dv?.sessions?.length && !dv?.economic_events?.length && <p className="text-xs text-[#71717A] py-6 text-center">No activity for this date</p>}
          </div>
        </motion.div>
      </div>

      {/* Plan + Goals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Plan */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Daily Plan</h3><Button variant="ghost" size="sm" onClick={() => setShowCreatePlan(!showCreatePlan)}>{dv?.plan ? 'Edit' : 'Create'}</Button></div>
          {showCreatePlan && <CreatePlanFormSmall date={selectedDate} existing={dv?.plan} onSubmit={(data) => { createPlan.mutate(data); setShowCreatePlan(false); }} onCancel={() => setShowCreatePlan(false)} />}
          {dv?.plan ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Badge variant={dv.plan.market_bias === 'bullish' ? 'success' : dv.plan.market_bias === 'bearish' ? 'destructive' : 'default'} size="sm">{dv.plan.market_bias || 'No bias'}</Badge><span className="text-xs text-[#71717A]">{(dv.plan.watchlist || []).length} watchlist pairs</span></div>
              {dv.plan.notes && <p className="text-xs text-[#A1A1AA]">{dv.plan.notes}</p>}
            </div>
          ) : <p className="text-xs text-[#71717A] py-4 text-center">No plan for today. Create one to start with structure.</p>}
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Goals ({goalList.length})</h3><Button variant="ghost" size="sm" onClick={() => setShowCreateGoal(!showCreateGoal)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button></div>
          {showCreateGoal && <CreateGoalFormSmall onSubmit={(data) => { createGoal.mutate(data); setShowCreateGoal(false); }} onCancel={() => setShowCreateGoal(false)} />}
          {goalList.length > 0 ? (
            <div className="space-y-2">
              {goalList.slice(0, 5).map((g: Goal) => {
                const progress = g.target_value ? Math.min(100, ((g.current_value || 0) / g.target_value) * 100) : 0;
                return (
                  <div key={g.id} className="rounded-lg bg-[#111113] px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><span className="text-xs text-[#FAFAFA]">{g.title}</span><Badge variant={g.priority === 'high' ? 'destructive' : g.priority === 'medium' ? 'warning' : 'default'} size="sm">{g.priority}</Badge></div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => updateGoal.mutate({ goalId: g.id, data: { current_value: (g.current_value || 0) + 1 } })}><Plus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(g.id)}><Trash2 className="h-3 w-3 text-[#EF4444]" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-[#27272A]"><div className="h-1.5 rounded-full bg-[#4F46E5]" style={{ width: `${progress}%` }} /></div><span className="text-[10px] font-mono text-[#71717A]">{progress.toFixed(0)}%</span></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-[#71717A] py-4 text-center">No goals set. Create one to track progress.</p>}
        </motion.div>
      </div>

      {/* Checklists + Reminders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Checklists</h3><Button variant="ghost" size="sm" onClick={() => setShowCreateChecklist(!showCreateChecklist)}><Plus className="h-3.5 w-3.5 mr-1" />New</Button></div>
          {showCreateChecklist && <CreateChecklistFormSmall onSubmit={(data) => { createChecklistTemplate.mutate(data); setShowCreateChecklist(false); }} onCancel={() => setShowCreateChecklist(false)} />}
          {templateList.length > 0 ? templateList.map((tmpl: ChecklistTemplate) => (
            <div key={tmpl.id} className="mb-2 rounded-lg bg-[#111113] p-3">
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-[#FAFAFA]">{tmpl.name}</span><Badge variant="outline" size="sm">{tmpl.checklist_type?.replace(/_/g, ' ')}</Badge></div>
              <div className="space-y-1">
                {(tmpl.items ?? []).slice(0, 4).map((it: any, i: number) => (
                  <div key={i} className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded border border-[#27272A]" /><span className="text-[11px] text-[#71717A]">{it.label}</span></div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full text-[10px]" onClick={() => createChecklistExec.mutate({ template_id: tmpl.id, execution_date: selectedDate, completed_items: (tmpl.items ?? []).map((it: any) => ({ label: it.label, completed: true })) })}><CheckCircle className="h-3 w-3 mr-1" />Complete All</Button>
            </div>
          )) : <p className="text-xs text-[#71717A] py-4 text-center">No checklists. Create a pre-market routine.</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Reminders ({reminderList.length})</h3><Button variant="ghost" size="sm" onClick={() => setShowCreateReminder(!showCreateReminder)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button></div>
          {showCreateReminder && <CreateReminderFormSmall onSubmit={(data) => { createReminder.mutate(data); setShowCreateReminder(false); }} onCancel={() => setShowCreateReminder(false)} />}
          {reminderList.length > 0 ? reminderList.map((r: Reminder) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-2 mb-1">
              <div className="flex items-center gap-2"><button onClick={() => toggleReminder.mutate(r.id)}>{r.is_active ? <Bell className="h-4 w-4 text-[#4F46E5]" /> : <BellOff className="h-4 w-4 text-[#71717A]" />}</button>
                <div><span className="text-xs text-[#FAFAFA]">{r.title}</span><p className="text-[10px] text-[#71717A]">{r.reminder_time}</p></div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteReminder.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 text-[#EF4444]" /></Button>
            </div>
          )) : <p className="text-xs text-[#71717A] py-4 text-center">No reminders. Set reminders for market opens and reviews.</p>}
        </motion.div>
      </div>

      {/* Economic Calendar + Post-Market Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Economic Events</h3><Button variant="ghost" size="sm" onClick={() => setShowCreateEconEvent(!showCreateEconEvent)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button></div>
          {showCreateEconEvent && <CreateEconEventFormSmall date={selectedDate} onSubmit={(data) => { createEconEvent.mutate(data); setShowCreateEconEvent(false); }} onCancel={() => setShowCreateEconEvent(false)} />}
          {econEvents.data && (econEvents.data as EconomicEvent[]).length > 0 ? (econEvents.data as EconomicEvent[]).map((ev: EconomicEvent) => (
            <div key={ev.id} className="flex items-center gap-2 rounded-lg bg-[#111113] px-3 py-2 mb-1">
              <Badge variant={IMPACT_COLORS[ev.impact_level as keyof typeof IMPACT_COLORS] || 'secondary'} size="sm">{ev.impact_level}</Badge>
              <span className="text-xs text-[#A1A1AA] flex-1">{ev.event_name}</span>
              <span className="text-[10px] text-[#71717A]">{ev.currency}</span>
              <span className="text-[10px] text-[#71717A] font-mono">{ev.event_time || '-'}</span>
            </div>
          )) : <p className="text-xs text-[#71717A] py-4 text-center">No economic events for this date.</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-[#FAFAFA]">Post-Market Reviews</h3><Button variant="ghost" size="sm" onClick={() => setShowCreateReview(!showCreateReview)}><Plus className="h-3.5 w-3.5 mr-1" />New</Button></div>
          {showCreateReview && <CreateReviewFormSmall date={selectedDate} onSubmit={(data) => { createReview.mutate(data); setShowCreateReview(false); }} onCancel={() => setShowCreateReview(false)} />}
          {reviewList.length > 0 ? reviewList.slice(0, 5).map((rev: DailyReview) => (
            <div key={rev.id} className="rounded-lg bg-[#111113] p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#FAFAFA]">{rev.review_date}</span>
                <div className="flex gap-1">{rev.discipline_score != null && <Badge variant="outline" size="sm">D: {rev.discipline_score}</Badge>}{rev.overall_rating != null && <Badge variant="outline" size="sm">O: {rev.overall_rating}</Badge>}</div>
              </div>
              {rev.daily_summary && <p className="text-xs text-[#71717A]">{rev.daily_summary}</p>}
            </div>
          )) : <p className="text-xs text-[#71717A] py-4 text-center">No reviews yet. Complete a post-market review.</p>}
        </motion.div>
      </div>
    </div>
  );
}

/* ── Sub-components for small forms ── */

function CreatePlanFormSmall({ date, existing, onSubmit, onCancel }: { date: string; existing?: any; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [marketBias, setMarketBias] = useState(existing?.market_bias || '');
  const [watchlist, setWatchlist] = useState(existing?.watchlist?.join(', ') || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <select value={marketBias} onChange={(e) => setMarketBias(e.target.value)} className="w-full rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA]"><option value="">Bias...</option><option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="neutral">Neutral</option></select>
    <Input value={watchlist} onChange={(e) => setWatchlist(e.target.value)} placeholder="Watchlist (comma-separated)" className="text-xs" />
    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA] placeholder-[#71717A] min-h-[50px]" placeholder="Notes..." />
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ plan_date: date, market_bias: marketBias, plan_type: 'daily', watchlist: watchlist.split(',').map((s: string) => s.trim()).filter(Boolean), notes })}>Save</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function CreateGoalFormSmall({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(''); const [target, setTarget] = useState(''); const [priority, setPriority] = useState('medium');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" className="text-xs" />
    <div className="flex gap-2"><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className="text-xs flex-1" />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA]"><option value="low">Low</option><option value="medium">Med</option><option value="high">High</option></select></div>
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ title, goal_type: 'daily', target_value: target ? parseFloat(target) : undefined, priority })}>Create</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function CreateReminderFormSmall({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(''); const [time, setTime] = useState('08:00');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" className="text-xs" />
    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-xs" />
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ title, reminder_type: 'custom', reminder_time: time })}>Create</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function CreateEconEventFormSmall({ date, onSubmit, onCancel }: { date: string; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(''); const [currency, setCurrency] = useState('USD'); const [impact, setImpact] = useState('low'); const [time, setTime] = useState('');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" className="text-xs" />
    <div className="flex gap-2"><Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" className="text-xs flex-1" />
      <select value={impact} onChange={(e) => setImpact(e.target.value)} className="rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA]"><option value="low">Low</option><option value="medium">Med</option><option value="high">High</option></select>
      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-xs w-24" /></div>
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ event_date: date, event_name: name, currency, impact_level: impact, event_time: time })}>Add</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function CreateChecklistFormSmall({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(''); const [items, setItems] = useState('');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="text-xs" />
    <textarea value={items} onChange={(e) => setItems(e.target.value)} className="w-full rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA] placeholder-[#71717A] min-h-[60px]" placeholder="One item per line" />
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ name, checklist_type: 'pre_market', items: items.split('\n').filter(Boolean).map((l: string) => ({ label: l.trim() })) })}>Create</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

function CreateReviewFormSmall({ date, onSubmit, onCancel }: { date: string; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [summary, setSummary] = useState(''); const [discipline, setDiscipline] = useState(''); const [rating, setRating] = useState('');
  return (<div className="rounded-lg bg-[#111113] p-3 mb-3 space-y-2">
    <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full rounded border border-[#27272A] bg-[#18181B] px-2 py-1 text-xs text-[#A1A1AA] placeholder-[#71717A] min-h-[60px]" placeholder="Daily summary..." />
    <div className="flex gap-2"><Input type="number" min={1} max={10} value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Discipline (1-10)" className="text-xs" />
      <Input type="number" min={1} max={10} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="Overall (1-10)" className="text-xs" /></div>
    <div className="flex gap-2"><Button size="sm" onClick={() => onSubmit({ review_date: date, daily_summary: summary, discipline_score: discipline ? parseInt(discipline) : undefined, overall_rating: rating ? parseInt(rating) : undefined })}>Save</Button><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button></div>
  </div>);
}

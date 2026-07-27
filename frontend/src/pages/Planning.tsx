import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  usePlanningDashboard, useDayView, usePlans, useCreatePlan,
  useChecklistTemplates, useCreateChecklistTemplate, useChecklistExecutions, useCreateChecklistExecution,
  useEconomicEvents, useCreateEconomicEvent,
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useReminders, useCreateReminder, useToggleReminder, useDeleteReminder,
  useCalendarEvents, useCreateCalendarEvent,
  useReviews, useCreateReview,
} from '../hooks/usePlanning';
import type {
  PlanningDashboard, DayViewData, TradingPlan, Goal, Reminder,
  CalendarEvent, EconomicEvent, ChecklistTemplate, DailyReview,
} from '../api/types';
import {
  Calendar, Target, CheckCircle, Clock, Bell, BellOff, Plus, Trash2,
  TrendingUp, AlertTriangle, FileText, ChevronLeft, ChevronRight,
  MapPin, Eye, EyeOff, Zap, Brain, Shield, BarChart3, ListTodo,
  ArrowUpRight, ArrowDownRight, Star, Flag, RotateCcw, Settings,
  Search, Filter, X, Check, Square, CheckSquare,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

type TabType = 'dashboard' | 'calendar' | 'plan' | 'checklist' | 'economic' | 'goals' | 'reminders' | 'review';

const SESSION_COLORS = { Asia: 'bg-chart-4', London: 'bg-chart-1', 'New York': 'bg-chart-2' };
const IMPACT_COLORS = { high: 'destructive', medium: 'warning', low: 'info' } as const;
const EVENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function CalendarGrid({ days, selectedDate, onSelect, dayViews }: {
  days: Date[]; selectedDate: string; onSelect: (d: string) => void;
  dayViews: Record<string, DayViewData>;
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DAYS.map((d) => (
        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
      ))}
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const isToday = dateStr === formatDate(new Date());
        const isSelected = dateStr === selectedDate;
        const dv = dayViews[dateStr];
        return (
          <button
            key={i}
            onClick={() => onSelect(dateStr)}
            className={cn(
              'relative h-24 rounded-lg border p-1.5 text-left transition-all hover:border-primary/50 hover:shadow-sm',
              isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50',
              isToday && 'ring-2 ring-primary/30',
              day.getMonth() !== new Date(selectedDate).getMonth() && 'opacity-40'
            )}
          >
            <span className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-foreground')}>
              {day.getDate()}
            </span>
            <div className="mt-1 space-y-0.5">
              {dv?.plan && <div className="h-1 rounded-full bg-primary" />}
              {dv?.checklist_completed && <div className="h-1 rounded-full bg-success" />}
              {dv?.economic_events?.slice(0, 2).map((ev, j) => (
                <div key={j} className={cn('h-1 rounded-full', ev.impact_level === 'high' ? 'bg-destructive' : ev.impact_level === 'medium' ? 'bg-warning' : 'bg-muted-foreground/30')} />
              ))}
              {dv?.events?.slice(0, 2).map((ev, j) => (
                <div key={j} className="h-1 rounded-full bg-chart-1" />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: { goal: Goal; onUpdate: (id: string, data: Record<string, unknown>) => void; onDelete: (id: string) => void }) {
  const progress = goal.target_value ? Math.min(100, ((goal.current_value || 0) / goal.target_value) * 100) : 0;
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">{goal.title}</h4>
              <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'secondary' : 'outline'}>
                {goal.priority}
              </Badge>
            </div>
            {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{goal.current_value || 0} / {goal.target_value || 0} {goal.unit || ''}</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="sm" onClick={() => onUpdate(goal.id, { current_value: (goal.current_value || 0) + 1 })}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlanningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateChecklist, setShowCreateChecklist] = useState(false);
  const [showCreateEconEvent, setShowCreateEconEvent] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);

  const dashboard = usePlanningDashboard(projectId!);
  const dayView = useDayView(projectId!, selectedDate);
  const plans = usePlans(projectId!);
  const goals = useGoals(projectId!);
  const reminders = useReminders(projectId!);
  const templates = useChecklistTemplates(projectId!);
  const execs = useChecklistExecutions(projectId!, selectedDate);
  const econEvents = useEconomicEvents(projectId!, selectedDate, selectedDate);
  const calendarEvents = useCalendarEvents(projectId!, selectedDate, selectedDate);
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

  const isLoading = dashboard.isLoading;
  const isError = dashboard.isError;

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = getWeekStart(firstDay);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentMonth]);

  const dv = dayView.data as DayViewData | undefined;
  const dash = dashboard.data as PlanningDashboard | undefined;
  const goalList = (goals.data || []) as Goal[];
  const reminderList = (reminders.data || []) as Reminder[];
  const templateList = (templates.data || []) as ChecklistTemplate[];
  const reviewList = (reviews.data || []) as DailyReview[];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Error loading planning data." onRetry={() => dashboard.refetch()} />;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'plan', label: 'Daily Plan', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle },
    { id: 'economic', label: 'Economic', icon: Globe },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'review', label: 'Review', icon: Brain },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader title="Planning & Calendar" description="Your operational headquarters before the market opens" actions={
        <Button variant="outline" size="sm" onClick={() => dashboard.refetch()}><RotateCcw className="h-4 w-4 mr-1" />Refresh</Button>
      } />

      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && dash && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Today's Plan" value={dash.has_plan ? 'Created' : 'Not Set'} icon={FileText} variant={dash.has_plan ? 'success' : 'warning'} size="sm" />
            <KpiCard title="Active Goals" value={dash.active_goals_count} icon={Target} variant="info" size="sm" />
            <KpiCard title="Goals Complete" value={`${dash.goal_progress}%`} icon={CheckCircle} variant={dash.goal_progress >= 50 ? 'success' : 'warning'} size="sm" />
            <KpiCard title="Active Reminders" value={dash.active_reminders.length} icon={Bell} variant="info" size="sm" />
            <KpiCard title="Today's Events" value={(dash.today_events ?? []).length} icon={Calendar} variant="info" size="sm" />
            <KpiCard title="Upcoming Sessions" value={(dash.upcoming_sessions ?? []).length} icon={Clock} variant="info" size="sm" />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(dash.upcoming_sessions ?? []).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{s.name}</span></div>
                    <span className="text-xs font-mono text-muted-foreground">{s.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Active Reminders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {dash.active_reminders.length > 0 ? dash.active_reminders.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><span className="text-sm">{r.title}</span></div>
                    <span className="text-xs font-mono text-muted-foreground">{r.reminder_time}</span>
                  </div>
                )) : <EmptyState message="No active reminders" />}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Today's Events</CardTitle></CardHeader>
              <CardContent>
                {dash.today_events.length > 0 ? (
                  <div className="space-y-2">
                    {(dash.today_events ?? []).map((ev, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                        {'impact_level' in ev ? (
                          <>
                            <Badge variant={IMPACT_COLORS[(ev as EconomicEvent).impact_level as keyof typeof IMPACT_COLORS] || 'secondary'}>{(ev as EconomicEvent).impact_level}</Badge>
                            <span className="text-sm">{(ev as EconomicEvent).event_name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{(ev as EconomicEvent).currency}</span>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline">{(ev as CalendarEvent).event_type}</Badge>
                            <span className="text-sm">{(ev as CalendarEvent).title}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState message="No events today" />}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Calendar */}
      {activeTab === 'calendar' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="text-sm font-medium">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(formatDate(new Date())); }}>Today</Button>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-4">
                <CalendarGrid days={calendarDays} selectedDate={selectedDate} onSelect={setSelectedDate} dayViews={{}} />
              </CardContent>
            </Card>
          </motion.div>
          {dv && (
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(dv.sessions ?? []).map((s, i) => (
                    <div key={i} className={cn('flex items-center justify-between p-2 rounded-lg', s.is_current ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30')}>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', s.is_current ? 'bg-success animate-pulse' : 'bg-muted-foreground/30')} />
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{s.start_time}-{s.end_time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Economic Events</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(dv.economic_events ?? []).length > 0 ? (dv.economic_events ?? []).map((ev, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Badge variant={IMPACT_COLORS[ev.impact_level as keyof typeof IMPACT_COLORS] || 'secondary'} className="text-[10px]">{ev.impact_level}</Badge>
                        <span className="text-sm">{ev.event_name}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{ev.currency}</span>
                        <span>Prev: {ev.previous_value || '-'}</span>
                        <span>Fcst: {ev.forecast_value || '-'}</span>
                      </div>
                    </div>
                  )) : <EmptyState message="No economic events" />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Calendar Events</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(dv.events ?? []).length > 0 ? (dv.events ?? []).map((ev, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-1 rounded-full" style={{ backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length] }} />
                        <span className="text-sm">{ev.title}</span>
                      </div>
                      {ev.event_time && <span className="text-xs text-muted-foreground ml-5">{ev.event_time}</span>}
                    </div>
                  )) : <EmptyState message="No calendar events" />}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Daily Plan */}
      {activeTab === 'plan' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Trading Plan for {selectedDate}</h3>
            <Button size="sm" onClick={() => setShowCreatePlan(!showCreatePlan)}>
              <Plus className="h-4 w-4 mr-1" />{dv?.plan ? 'Edit Plan' : 'Create Plan'}
            </Button>
          </motion.div>
          {showCreatePlan && (
            <motion.div variants={item}>
              <CreatePlanForm
                date={selectedDate}
                existing={dv?.plan}
                onSubmit={(data) => { createPlan.mutate(data); setShowCreatePlan(false); }}
                onCancel={() => setShowCreatePlan(false)}
              />
            </motion.div>
          )}
          {dv?.plan ? (
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Market Bias & Watchlist</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Market Bias</h4>
                    <p className="text-sm">{dv.plan.market_bias || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Watchlist</h4>
                    <div className="flex flex-wrap gap-1">
                      {(dv.plan.watchlist || []).map((p, i) => <Badge key={i} variant="outline">{p}</Badge>)}
                      {(!dv.plan.watchlist || dv.plan.watchlist.length === 0) && <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Pairs to Avoid</h4>
                    <div className="flex flex-wrap gap-1">
                      {(dv.plan.pairs_to_avoid || []).map((p, i) => <Badge key={i} variant="destructive">{p}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Scenarios & Risk</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Expected Scenarios</h4>
                    {(dv.plan.expected_scenarios || []).map((s, i) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/20 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={s.bias === 'bullish' ? 'default' : 'destructive'}>{s.bias}</Badge>
                          <span className="text-sm">{s.scenario}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Invalidation: {s.invalidation}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Risk Allocation</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dv.plan.risk_allocation || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs p-1.5 rounded bg-muted/20">
                          <span className="text-muted-foreground">{k}</span><span className="font-mono">{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <EmptyState message="No plan for today" description="Create a trading plan to start your day with structure." />
          )}
        </motion.div>
      )}

      {/* Checklist */}
      {activeTab === 'checklist' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Pre-Market Checklist</h3>
            <Button size="sm" onClick={() => setShowCreateChecklist(!showCreateChecklist)}>
              <Plus className="h-4 w-4 mr-1" />New Template
            </Button>
          </motion.div>
          {showCreateChecklist && (
            <CreateChecklistTemplateForm
              onSubmit={(data) => { createChecklistTemplate.mutate(data); setShowCreateChecklist(false); }}
              onCancel={() => setShowCreateChecklist(false)}
            />
          )}
          {templateList.length > 0 ? templateList.map((tmpl) => (
            <motion.div key={tmpl.id} variants={item}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{tmpl.name}</CardTitle>
                    <Badge variant="outline">{tmpl.checklist_type.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(tmpl.items ?? []).map((it, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm">{it.label}</span>
                      {it.optional && <Badge variant="secondary" className="text-[10px]">Optional</Badge>}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                    const completedItems = (tmpl.items ?? []).map((it) => ({ label: it.label, completed: true }));
                    createChecklistExec.mutate({ template_id: tmpl.id, execution_date: selectedDate, completed_items: completedItems });
                  }}>
                    <Check className="h-4 w-4 mr-1" />Complete All
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )) : <EmptyState message="No checklist templates" description="Create a template to track your pre-market routine." />}
        </motion.div>
      )}

      {/* Economic Calendar */}
      {activeTab === 'economic' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Economic Calendar</h3>
            <Button size="sm" onClick={() => setShowCreateEconEvent(!showCreateEconEvent)}>
              <Plus className="h-4 w-4 mr-1" />Add Event
            </Button>
          </motion.div>
          {showCreateEconEvent && (
            <CreateEconEventForm
              date={selectedDate}
              onSubmit={(data) => { createEconEvent.mutate(data); setShowCreateEconEvent(false); }}
              onCancel={() => setShowCreateEconEvent(false)}
            />
          )}
          {econEvents.data && (econEvents.data as EconomicEvent[]).length > 0 ? (
            <motion.div variants={item}>
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Currency</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Event</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Impact</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Previous</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Forecast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(econEvents.data as EconomicEvent[]).map((ev, i) => (
                        <tr key={ev.id} className={cn('border-b border-border/50', i % 2 === 0 && 'bg-muted/20')}>
                          <td className="px-4 py-2.5 font-mono text-xs">{ev.event_time || '-'}</td>
                          <td className="px-4 py-2.5"><Badge variant="outline">{ev.currency}</Badge></td>
                          <td className="px-4 py-2.5 font-medium">{ev.event_name}</td>
                          <td className="px-4 py-2.5 text-center"><Badge variant={IMPACT_COLORS[ev.impact_level as keyof typeof IMPACT_COLORS] || 'secondary'}>{ev.impact_level}</Badge></td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{ev.previous_value || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{ev.forecast_value || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </motion.div>
          ) : <EmptyState message="No economic events" description="Add events or import from external calendar." />}
        </motion.div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Goals ({goalList.length})</h3>
            <Button size="sm" onClick={() => setShowCreateGoal(!showCreateGoal)}>
              <Plus className="h-4 w-4 mr-1" />New Goal
            </Button>
          </motion.div>
          {showCreateGoal && (
            <CreateGoalForm
              onSubmit={(data) => { createGoal.mutate(data); setShowCreateGoal(false); }}
              onCancel={() => setShowCreateGoal(false)}
            />
          )}
          {goalList.length > 0 ? (
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goalList.map((g) => (
                <GoalCard key={g.id} goal={g}
                  onUpdate={(id, data) => updateGoal.mutate({ goalId: id, data })}
                  onDelete={(id) => deleteGoal.mutate(id)}
                />
              ))}
            </motion.div>
          ) : <EmptyState message="No goals set" description="Create goals to track your trading progress." />}
        </motion.div>
      )}

      {/* Reminders */}
      {activeTab === 'reminders' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Reminders ({reminderList.length})</h3>
            <Button size="sm" onClick={() => setShowCreateReminder(!showCreateReminder)}>
              <Plus className="h-4 w-4 mr-1" />New Reminder
            </Button>
          </motion.div>
          {showCreateReminder && (
            <CreateReminderForm
              onSubmit={(data) => { createReminder.mutate(data); setShowCreateReminder(false); }}
              onCancel={() => setShowCreateReminder(false)}
            />
          )}
          {reminderList.length > 0 ? (
            <motion.div variants={item} className="space-y-2">
              {reminderList.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleReminder.mutate(r.id)}>
                          {r.is_active ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div>
                          <h4 className="text-sm font-medium">{r.title}</h4>
                          <p className="text-xs text-muted-foreground">{r.reminder_type.replace(/_/g, ' ')} • {r.reminder_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Active' : 'Paused'}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => deleteReminder.mutate(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : <EmptyState message="No reminders" description="Set reminders for market opens, news events, and reviews." />}
        </motion.div>
      )}

      {/* Review */}
      {activeTab === 'review' && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Post-Market Review</h3>
            <Button size="sm" onClick={() => setShowCreateReview(!showCreateReview)}>
              <Plus className="h-4 w-4 mr-1" />New Review
            </Button>
          </motion.div>
          {showCreateReview && (
            <CreateReviewForm
              date={selectedDate}
              onSubmit={(data) => { createReview.mutate(data); setShowCreateReview(false); }}
              onCancel={() => setShowCreateReview(false)}
            />
          )}
          {reviewList.length > 0 ? (
            <motion.div variants={item} className="space-y-4">
              {reviewList.slice(0, 10).map((rev) => (
                <Card key={rev.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">{rev.review_date}</h4>
                      <div className="flex gap-1">
                        {rev.discipline_score != null && <Badge variant="outline">Discipline: {rev.discipline_score}/10</Badge>}
                        {rev.overall_rating != null && <Badge variant="outline">Overall: {rev.overall_rating}/10</Badge>}
                      </div>
                    </div>
                    {rev.daily_summary && <p className="text-sm text-muted-foreground mb-2">{rev.daily_summary}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {rev.best_trade && <div className="rounded-lg bg-success/10 p-2"><h5 className="text-xs font-medium text-success mb-1">Best Trade</h5><p className="text-xs">{rev.best_trade}</p></div>}
                      {rev.worst_trade && <div className="rounded-lg bg-destructive/10 p-2"><h5 className="text-xs font-medium text-destructive mb-1">Worst Trade</h5><p className="text-xs">{rev.worst_trade}</p></div>}
                      {rev.mistakes && rev.mistakes.length > 0 && <div className="rounded-lg bg-warning/10 p-2"><h5 className="text-xs font-medium text-warning mb-1">Mistakes</h5><ul className="text-xs list-disc list-inside">{rev.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
                      {rev.lessons && rev.lessons.length > 0 && <div className="rounded-lg bg-primary/10 p-2"><h5 className="text-xs font-medium text-primary mb-1">Lessons</h5><ul className="text-xs list-disc list-inside">{rev.lessons.map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : <EmptyState message="No reviews yet" description="Complete a post-market review to track your improvement." />}
        </motion.div>
      )}
    </motion.div>
  );
}

function LayoutDashboard(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
}

function CreatePlanForm({ date, existing, onSubmit, onCancel }: { date: string; existing?: TradingPlan; onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    plan_date: date, plan_type: 'daily', market_bias: existing?.market_bias || '',
    watchlist: existing?.watchlist?.join(', ') || '', pairs_to_avoid: existing?.pairs_to_avoid?.join(', ') || '',
    notes: existing?.notes || '',
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Create Trading Plan</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Market Bias</label>
            <select value={form.market_bias} onChange={(e) => setForm({ ...form, market_bias: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select bias...</option><option value="bullish">Bullish</option><option value="bearish">Bearish</option><option value="neutral">Neutral</option><option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Watchlist (comma-separated)</label>
            <input value={form.watchlist} onChange={(e) => setForm({ ...form, watchlist: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="EURUSD, GBPUSD, USDJPY" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pairs to Avoid</label>
            <input value={form.pairs_to_avoid} onChange={(e) => setForm({ ...form, pairs_to_avoid: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="USDCHF" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm h-20" placeholder="Additional notes..." />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSubmit({ ...form, watchlist: form.watchlist.split(',').map(s => s.trim()).filter(Boolean), pairs_to_avoid: form.pairs_to_avoid.split(',').map(s => s.trim()).filter(Boolean) })}>Save Plan</Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateChecklistTemplateForm({ onSubmit, onCancel }: { onSubmit: (data: { name: string; checklist_type: string; items: { label: string }[] }) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [items, setItems] = useState('');
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">New Checklist Template</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div><label className="text-xs text-muted-foreground mb-1 block">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Pre-Market Checklist" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Items (one per line)</label><textarea value={items} onChange={(e) => setItems(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm h-32" placeholder="Sleep completed&#10;News reviewed&#10;Bias defined" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSubmit({ name, checklist_type: 'pre_market', items: items.split('\n').filter(Boolean).map(l => ({ label: l.trim() })) })}>Create</Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateEconEventForm({ date, onSubmit, onCancel }: { date: string; onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ event_date: date, event_time: '', country: '', currency: '', impact_level: 'low', event_name: '', previous_value: '', forecast_value: '' });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Add Economic Event</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div><label className="text-xs text-muted-foreground mb-1 block">Time</label><input value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="08:30" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Currency</label><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="USD" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Impact</label><select value={form.impact_level} onChange={(e) => setForm({ ...form, impact_level: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div className="col-span-2 sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Event Name</label><input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Non-Farm Payrolls" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Previous</label><input value={form.previous_value} onChange={(e) => setForm({ ...form, previous_value: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Forecast</label><input value={form.forecast_value} onChange={(e) => setForm({ ...form, forecast_value: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onSubmit(form)}>Add Event</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateGoalForm({ onSubmit, onCancel }: { onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', goal_type: 'daily', target_value: '', unit: '', priority: 'medium' });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">New Goal</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Type</label><select value={form.goal_type} onChange={(e) => setForm({ ...form, goal_type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Target</label><input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onSubmit({ ...form, target_value: form.target_value ? parseFloat(form.target_value) : undefined })}>Create Goal</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateReminderForm({ onSubmit, onCancel }: { onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: '', reminder_type: 'custom', reminder_time: '08:00' });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">New Reminder</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Check news events" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Type</label><select value={form.reminder_type} onChange={(e) => setForm({ ...form, reminder_type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="market_open">Market Open</option><option value="london_open">London Open</option><option value="newyork_open">New York Open</option><option value="news_event">News Event</option><option value="journal_review">Journal Review</option><option value="weekly_review">Weekly Review</option><option value="risk_limit">Risk Limit</option><option value="custom">Custom</option></select></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Time</label><input value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onSubmit(form)}>Create Reminder</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateReviewForm({ date, onSubmit, onCancel }: { date: string; onSubmit: (data: Record<string, unknown>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ review_date: date, daily_summary: '', best_trade: '', worst_trade: '', mistakes: '', lessons: '', discipline_score: '', overall_rating: '' });
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">Post-Market Review</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div><label className="text-xs text-muted-foreground mb-1 block">Daily Summary</label><textarea value={form.daily_summary} onChange={(e) => setForm({ ...form, daily_summary: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm h-20" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Best Trade</label><input value={form.best_trade} onChange={(e) => setForm({ ...form, best_trade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Worst Trade</label><input value={form.worst_trade} onChange={(e) => setForm({ ...form, worst_trade: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Mistakes (comma-separated)</label><input value={form.mistakes} onChange={(e) => setForm({ ...form, mistakes: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Lessons (comma-separated)</label><input value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Discipline (1-10)</label><input type="number" min="1" max="10" value={form.discipline_score} onChange={(e) => setForm({ ...form, discipline_score: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Overall (1-10)</label><input type="number" min="1" max="10" value={form.overall_rating} onChange={(e) => setForm({ ...form, overall_rating: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSubmit({ ...form, mistakes: form.mistakes ? form.mistakes.split(',').map(s => s.trim()) : undefined, lessons: form.lessons ? form.lessons.split(',').map(s => s.trim()) : undefined, discipline_score: form.discipline_score ? parseInt(form.discipline_score) : undefined, overall_rating: form.overall_rating ? parseInt(form.overall_rating) : undefined })}>Save Review</Button>
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

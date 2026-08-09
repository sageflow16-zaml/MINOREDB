import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection, PageGrid } from '../components/PageHeader';
import {Card, CardContent} from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortfolioGoals } from '../hooks/usePortfolio';
import { portfolioService } from '../api/portfolio';
import {PortfolioGoal, GoalMetric} from '../api/types';
import { Plus, Edit3, Trash2, Target, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'At Risk', value: 'at_risk' },
  { label: 'Failed', value: 'failed' },
  { label: 'Paused', value: 'paused' },
];

const metricOptions = [
  { label: 'Portfolio Growth', value: 'portfolio_growth' },
  { label: 'Account Growth', value: 'account_growth' },
  { label: 'Monthly Profit', value: 'monthly_profit' },
  { label: 'Annual Return', value: 'annual_return' },
  { label: 'Max Drawdown', value: 'max_drawdown' },
  { label: 'Risk Consistency', value: 'risk_consistency' },
  { label: 'Win Rate', value: 'win_rate' },
  { label: 'Profit Factor', value: 'profit_factor' },
  { label: 'Expectancy', value: 'expectancy' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  completed: 'bg-blue-500/10 text-blue-500',
  at_risk: 'bg-amber-500/10 text-amber-500',
  failed: 'bg-destructive/10 text-destructive',
  paused: 'bg-gray-500/10 text-gray-500',
};

const tabs = ['all', 'active', 'completed', 'at_risk', 'failed', 'paused'] as const;

export default function GoalsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PortfolioGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioGoal | null>(null);
  const [form, setForm] = useState({ name: '', metric: 'portfolio_growth' as GoalMetric, target_value: 0, current_value: 0, start_value: 0, deadline: '', description: '' });

  const { data: goals, isLoading, isError, refetch } = usePortfolioGoals(projectId!);

  const createGoal = useMutation({
    mutationFn: (data: any) => portfolioService.createGoal(projectId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'goals'] }); setShowCreate(false); resetForm(); },
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => portfolioService.updateGoal(projectId!, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'goals'] }); setEditingGoal(null); resetForm(); },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => portfolioService.deleteGoal(projectId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'goals'] }); setDeleteTarget(null); },
  });

  const resetForm = () => setForm({ name: '', metric: 'portfolio_growth', target_value: 0, current_value: 0, start_value: 0, deadline: '', description: '' });

  const openEdit = (goal: PortfolioGoal) => {
    setEditingGoal(goal);
    setForm({ name: goal.name, metric: goal.metric, target_value: goal.target_value || 0, current_value: goal.current_value || 0, start_value: goal.start_value || 0, deadline: goal.deadline || '', description: goal.description || '' });
  };

  const handleSave = () => {
    if (editingGoal) updateGoal.mutate({ id: editingGoal.id, data: form });
    else createGoal.mutate(form);
  };

  const filtered = goals ? (activeTab === 'all' ? goals : goals.filter((g) => g.status === activeTab)) : [];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex h-[60vh] items-center justify-center"><LoadingSpinner /></div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <ErrorState message="Error loading goals." description="There was a problem fetching your goals." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Goals"
        description="Track portfolio and account performance targets"
        headerActions={
          <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Goal
          </Button>
        }
      >
        <div className="flex flex-wrap gap-1 mb-4">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {tab === 'at_risk' ? 'At Risk' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <PageGrid cols={3}>
            {filtered.map((goal) => {
              const progress = goal.target_value > 0 ? Math.min(100, Math.max(0, ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100)) : 0;
              return (
                <Card key={goal.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{goal.name}</span>
                        </div>
                        <Badge className={cn('text-xs mt-1.5', statusColors[goal.status])} size="sm">{goal.status}</Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(goal)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(goal)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{goal.current_value?.toLocaleString()} / {goal.target_value?.toLocaleString()}</span>
                        <span className={cn('font-medium', progress >= 100 ? 'text-success' : progress < 50 ? 'text-destructive' : 'text-warning')}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : progress < 50 ? 'bg-destructive' : 'bg-warning')} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="info" size="sm">{goal.metric.replace(/_/g, ' ')}</Badge>
                        {goal.deadline && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(goal.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </PageGrid>
        ) : (
          <EmptyState title={activeTab === 'all' ? 'No goals yet' : `No ${activeTab} goals`} description="Create a goal to start tracking your progress." action={
            <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}><Plus className="h-3.5 w-3.5 mr-1" /> New Goal</Button>
          } />
        )}
      </PageSection>

      <Dialog open={showCreate || !!editingGoal} onOpenChange={(open: boolean) => { if (!open) { setShowCreate(false); setEditingGoal(null); } }}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Goal name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Metric</label>
              <Select value={form.metric} onChange={(v) => setForm({ ...form, metric: v as GoalMetric })} options={metricOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target Value</label>
              <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Current Value</label>
              <Input type="number" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Value</label>
              <Input type="number" value={form.start_value} onChange={(e) => setForm({ ...form, start_value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Goal description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setEditingGoal(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} isLoading={createGoal.isPending || updateGoal.isPending}>Save</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteGoal.mutate(deleteTarget.id)}
      />
    </PageLayout>
  );
}

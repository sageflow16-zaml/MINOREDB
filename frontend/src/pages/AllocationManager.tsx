import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout, PageSection } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { Dialog } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortfolioAllocations } from '../hooks/usePortfolio';
import { portfolioService } from '../api/portfolio';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Edit3, Trash2, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { chartTooltipStyle } from '../lib/chart';

const tooltipStyle = chartTooltipStyle.contentStyle;
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

const entityTypeOptions = [
  { label: 'Account', value: 'account' },
  { label: 'Group', value: 'group' },
  { label: 'Strategy', value: 'strategy' },
];

export default function AllocationManagerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingAlloc, setEditingAlloc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rebalanceSuggestions, setRebalanceSuggestions] = useState<any[] | null>(null);
  const [form, setForm] = useState({ entity_name: '', entity_type: 'account', target_percentage: 0, entity_id: undefined as string | undefined });

  const { data: allocations, isLoading, isError, refetch } = usePortfolioAllocations(projectId!);

  const createAllocation = useMutation({
    mutationFn: (data: any) => portfolioService.createAllocation(projectId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'allocations'] }); setShowCreate(false); resetForm(); },
  });

  const updateAllocation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => portfolioService.updateAllocation(projectId!, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'allocations'] }); setEditingAlloc(null); resetForm(); },
  });

  const deleteAllocation = useMutation({
    mutationFn: (id: string) => portfolioService.deleteAllocation(projectId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', projectId, 'allocations'] }); setDeleteTarget(null); },
  });

  const resetForm = () => setForm({ entity_name: '', entity_type: 'account', target_percentage: 0, entity_id: undefined });

  const handleRebalance = async () => {
    try {
      const result = await portfolioService.getRebalanceSuggestions(projectId!);
      setRebalanceSuggestions(result as any[]);
    } catch {
      setRebalanceSuggestions([]);
    }
  };

  const openEdit = (alloc: any) => {
    setEditingAlloc(alloc);
    setForm({ entity_name: alloc.entity_name || '', entity_type: alloc.entity_type, target_percentage: alloc.target_percentage || 0, entity_id: alloc.entity_id || undefined });
  };

  const handleSave = () => {
    const cleaned = { ...form };
    for (const key in cleaned) {
      if ((cleaned as any)[key] === '') {
        (cleaned as any)[key] = undefined;
      }
    }
    if (editingAlloc) updateAllocation.mutate({ id: editingAlloc.id, data: cleaned });
    else createAllocation.mutate(cleaned);
  };

  const allocData = (allocations ?? []).map((a: any) => ({ name: a.entity_name || a.entity_type, value: a.current_percentage || a.target_percentage || 0 }));

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
        <ErrorState message="Error loading allocations." description="There was a problem fetching allocation data." onRetry={() => refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageSection
        title="Allocation Manager"
        description="Capital allocation across accounts and strategies"
        headerActions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRebalance}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rebalance Suggestions
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Allocation
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {allocData.length > 0 ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                          {allocData.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {allocData.map((entry: any, i: number) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {entry.name}
                        </span>
                        <span className="font-medium text-foreground">{entry.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="No data" description="Add allocations to see distribution." />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm font-medium">Allocations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {allocations && allocations.length > 0 ? (
                <DataTable
                  data={allocations}
                  columns={[
                    { id: 'entity', header: 'Entity', accessor: (r: any) => r.entity_name || r.entity_id, width: '120px' },
                    { id: 'type', header: 'Type', accessor: (r: any) => <Badge variant="info" size="sm">{r.entity_type}</Badge>, width: '70px' },
                    { id: 'target', header: 'Target %', accessor: (r: any) => r.target_percentage != null ? `${r.target_percentage.toFixed(1)}%` : '—', width: '80px' },
                    { id: 'current', header: 'Current %', accessor: (r: any) => r.current_percentage != null ? `${r.current_percentage.toFixed(1)}%` : '—', width: '80px' },
                    { id: 'deviation', header: 'Deviation', accessor: (r: any) => {
                      const dev = (r.current_percentage ?? 0) - (r.target_percentage ?? 0);
                      return <span className={cn('font-medium', Math.abs(dev) > 5 ? 'text-destructive' : Math.abs(dev) > 2 ? 'text-warning' : 'text-success')}>{dev >= 0 ? '+' : ''}{dev.toFixed(1)}%</span>;
                    }, width: '80px' },
                    { id: 'status', header: 'Status', accessor: (r: any) => r.is_active ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="info" size="sm">Inactive</Badge>, width: '70px' },
                    { id: 'actions', header: '', accessor: (r: any) => (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ), width: '70px' },
                  ]}
                  searchable={false}
                  pageSize={10}
                />
              ) : (
                <EmptyState title="No allocations" description="Create your first allocation." action={<Button size="sm" onClick={() => { setShowCreate(true); resetForm(); }}><Plus className="h-3.5 w-3.5 mr-1" /> Add Allocation</Button>} />
              )}
            </CardContent>
          </Card>
        </div>

        {rebalanceSuggestions && rebalanceSuggestions.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Rebalance Suggestions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={rebalanceSuggestions}
                columns={[
                  { id: 'entity', header: 'Entity', accessor: (r: any) => r.entity_name || r.entity_id, width: '140px' },
                  { id: 'type', header: 'Type', accessor: (r: any) => <Badge variant="info" size="sm">{r.entity_type}</Badge>, width: '80px' },
                  { id: 'current', header: 'Current %', accessor: (r: any) => r.current_pct != null ? `${r.current_pct.toFixed(1)}%` : '—', width: '80px' },
                  { id: 'target', header: 'Target %', accessor: (r: any) => r.target_pct != null ? `${r.target_pct.toFixed(1)}%` : '—', width: '80px' },
                  { id: 'action', header: 'Action', accessor: (r: any) => (
                    <Badge variant={r.action === 'increase' ? 'success' : r.action === 'decrease' ? 'destructive' : 'info'} size="sm">{r.action}</Badge>
                  ), width: '80px' },
                  { id: 'amount', header: 'Amount', accessor: (r: any) => r.amount != null ? `$${r.amount.toLocaleString()}` : '—', width: '100px', hideOnMobile: true },
                ]}
                searchable={false}
                pageSize={10}
              />
            </CardContent>
          </Card>
        )}
      </PageSection>

      <Dialog open={showCreate || !!editingAlloc} onOpenChange={(open: boolean) => { if (!open) { setShowCreate(false); setEditingAlloc(null); } }}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingAlloc ? 'Edit Allocation' : 'Add Allocation'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entity Name</label>
              <Input value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} placeholder="Account or strategy name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entity Type</label>
              <Select value={form.entity_type} onChange={(v) => setForm({ ...form, entity_type: v })} options={entityTypeOptions} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target Percentage</label>
              <Input type="number" value={form.target_percentage} onChange={(e) => setForm({ ...form, target_percentage: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setEditingAlloc(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} isLoading={createAllocation.isPending || updateAllocation.isPending}>Save</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Allocation"
        message={`Are you sure you want to delete this allocation?`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteAllocation.mutate(deleteTarget.id)}
      />
    </PageLayout>
  );
}

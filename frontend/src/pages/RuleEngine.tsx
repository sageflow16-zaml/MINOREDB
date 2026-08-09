import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useRules, useCreateRule, useDeleteRule, useUpdateRule, useEvaluateRules } from '../hooks/useAutomation';
import {Plus, Trash2, Play, ToggleLeft, ToggleRight, AlertTriangle} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function RuleEngine() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const { data: rules = [], isLoading, error } = useRules(projectId!);
  const createRule = useCreateRule(projectId!);
  const deleteRule = useDeleteRule(projectId!);
  const updateRule = useUpdateRule(projectId!);
  const evalRules = useEvaluateRules(projectId!);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', condition_expression: '', category: '', priority: '0', cooldown_minutes: '0' });
  const [evalContext, setEvalContext] = useState('{}');
  const [evalResult, setEvalResult] = useState<unknown[] | null>(null);

  const handleCreate = () => {
    createRule.mutate({
      name: form.name, description: form.description, condition_expression: form.condition_expression,
      category: form.category, priority: parseInt(form.priority), cooldown_minutes: parseInt(form.cooldown_minutes),
      conditions: [], actions_config: [],
    }, { onSuccess: () => { setShowForm(false); setForm({ name: '', description: '', condition_expression: '', category: '', priority: '0', cooldown_minutes: '0' }); } });
  };

  const handleEvaluate = () => {
    try { evalRules.mutate(JSON.parse(evalContext), { onSuccess: (data) => setEvalResult(Array.isArray(data) ? data : [data] as unknown[]) }); } catch { }
  };

  const toggleRule = (rule: Record<string, unknown>) => {
    updateRule.mutate({ id: rule.id as string, data: { enabled: !rule.enabled } });
  };

  const columns = [
    { id: 'name', header: 'Name', accessor: (row: Record<string, unknown>) => <span className="font-medium">{row.name as string}</span> },
    { id: 'enabled', header: 'Enabled', accessor: (row: Record<string, unknown>) => (
      <Button size="icon" variant="ghost" onClick={() => toggleRule(row)}>
        {row.enabled ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
      </Button>
    )},
    { id: 'category', header: 'Category', accessor: (row: Record<string, unknown>) => row.category ? <Badge variant="info">{row.category as string}</Badge> : '-' },
    { id: 'priority', header: 'Priority', accessor: 'priority' },
    { id: 'trigger_count', header: 'Triggers', accessor: 'trigger_count' },
    { id: 'last_triggered_at', header: 'Last Triggered', accessor: (row: Record<string, unknown>) => row.last_triggered_at ? new Date(row.last_triggered_at as string).toLocaleString() : '-' },
    { id: 'actions', header: 'Actions', accessor: (row: Record<string, unknown>) => (
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => deleteRule.mutate(row.id as string)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    )},
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load rules" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Rule Engine"
        description="If-then rules that automate actions based on market, performance, and psychology conditions"
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Rule</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Rule</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Daily Drawdown Alert" /></div>
              <div><label className="text-xs font-medium mb-1 block">Category</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="risk, psychology, performance" /></div>
              <div className="md:col-span-2"><label className="text-xs font-medium mb-1 block">Condition Expression</label><Input value={form.condition_expression} onChange={(e) => setForm({ ...form, condition_expression: e.target.value })} placeholder="e.g., drawdown > 3" /></div>
              <div><label className="text-xs font-medium mb-1 block">Priority</label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
              <div><label className="text-xs font-medium mb-1 block">Cooldown (min)</label><Input type="number" value={form.cooldown_minutes} onChange={(e) => setForm({ ...form, cooldown_minutes: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!form.name || createRule.isPending}>Create Rule</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle><Play className="w-4 h-4 mr-2 inline" />Test Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input value={evalContext} onChange={(e) => setEvalContext(e.target.value)} placeholder='{"drawdown": 5, "win_rate": 0.6}' className="font-mono text-xs" />
            <Button variant="outline" onClick={handleEvaluate} disabled={evalRules.isPending}><Play className="w-4 h-4 mr-2" />Evaluate</Button>
          </div>
          {evalResult && (
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Triggered Rules: {evalResult.length}</div>
              {evalResult.map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <AlertTriangle className="w-3 h-3 text-warning" />
                  <span>{(r as Record<string, unknown>).name as string}</span>
                  <Badge variant="success">triggered</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rules.length > 0 ? (
        <DataTable columns={columns} data={rules as unknown as Record<string, unknown>[]} />
      ) : (
        <EmptyState title="No rules defined" message="Create a rule to automate actions based on conditions" />
      )}
    </motion.div>
  );
}

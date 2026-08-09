import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { useWalkforwardRuns, useRunWalkforward } from '../hooks/useQuantResearch';
import {Play, TrendingUp, Activity, Layers, Target} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantWalkForwardLab() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [showForm, setShowForm] = useState(false);
  const [selectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', training_window: 252, validation_window: 63, step_size: 63,
    config: '{"num_trades": 400, "win_rate": 0.45}',
  });

  const { data: wfRuns = [], isLoading, error } = useWalkforwardRuns(projectId!);
  const runWf = useRunWalkforward(projectId!);
  const selectedWf = selectedId ? wfRuns.find(w => w.id === selectedId) : null;

  const handleRun = () => {
    let config = {};
    try { config = JSON.parse(form.config); } catch {}
    runWf.mutate({
      name: form.name || 'Walk-Forward',
      training_window: form.training_window,
      validation_window: form.validation_window,
      step_size: form.step_size,
      config,
    }, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load walk-forward runs" />;

  const wf = selectedWf || (wfRuns.length > 0 ? wfRuns[0] : null);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Walk-Forward Analysis"
        description="Validate strategy robustness through rolling out-of-sample testing"
        actions={<Button onClick={() => setShowForm(!showForm)}><Play className="w-4 h-4 mr-2" />New Analysis</Button>}
      />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>Configure Walk-Forward</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="WF Analysis" /></div>
                <div><label className="text-xs font-medium mb-1 block">Training Window</label><Input type="number" value={form.training_window} onChange={(e) => setForm({ ...form, training_window: parseInt(e.target.value) || 252 })} /></div>
                <div><label className="text-xs font-medium mb-1 block">Validation Window</label><Input type="number" value={form.validation_window} onChange={(e) => setForm({ ...form, validation_window: parseInt(e.target.value) || 63 })} /></div>
                <div><label className="text-xs font-medium mb-1 block">Step Size</label><Input type="number" value={form.step_size} onChange={(e) => setForm({ ...form, step_size: parseInt(e.target.value) || 63 })} /></div>
                <div className="md:col-span-4"><label className="text-xs font-medium mb-1 block">Config (JSON)</label><Input value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></div>
              </div>
              <Button onClick={handleRun} disabled={runWf.isPending} className="mt-4">
                {runWf.isPending ? 'Running...' : 'Run Analysis'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!wf ? (
        <EmptyState title="No walk-forward analyses" message="Run your first walk-forward analysis to validate strategy robustness" icon={<Layers className="h-6 w-6" />} />
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Stability Score" value={wf.stability_score?.toFixed(3) ?? '—'} icon={Activity} variant={(wf.stability_score ?? 0) > 0.5 ? 'success' : 'warning'} />
            <KpiCard title="Windows" value={wf.windows?.length ?? 0} icon={Layers} />
            <KpiCard title="Avg Train Sharpe" value={wf.aggregate_metrics?.avg_train_sharpe?.toFixed(2) ?? '—'} icon={TrendingUp} />
            <KpiCard title="Avg Test Sharpe" value={wf.aggregate_metrics?.avg_test_sharpe?.toFixed(2) ?? '—'} icon={Target} />
          </div>

          {/* Windows Table */}
          {wf.windows && wf.windows.length > 0 && (
            <>
              <Card>
                <CardHeader><CardTitle>Performance by Window</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {wf.windows.map((w: any, i: number) => (
                      <div key={i} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Window {w.window_index + 1}</span>
                          <Badge variant="outline">Decay: {w.decay?.toFixed(3) ?? 'N/A'}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Train Sharpe: </span>{w.train_metrics?.sharpe_ratio?.toFixed(2) ?? '—'}</div>
                          <div><span className="text-muted-foreground">Test Sharpe: </span>{w.test_metrics?.sharpe_ratio?.toFixed(2) ?? '—'}</div>
                          <div><span className="text-muted-foreground">Train WR: </span>{w.train_metrics?.win_rate != null ? `${(w.train_metrics.win_rate * 100).toFixed(1)}%` : '—'}</div>
                          <div><span className="text-muted-foreground">Test WR: </span>{w.test_metrics?.win_rate != null ? `${(w.test_metrics.win_rate * 100).toFixed(1)}%` : '—'}</div>
                          <div><span className="text-muted-foreground">Train PF: </span>{w.train_metrics?.profit_factor?.toFixed(2) ?? '—'}</div>
                          <div><span className="text-muted-foreground">Test PF: </span>{w.test_metrics?.profit_factor?.toFixed(2) ?? '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ChartCard, LineChartCard } from '../components/charts/chart';
import { useOptimizations, useRunOptimization } from '../hooks/useQuantResearch';
import {Search, Grid3X3, Activity, Target} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantOptimizationLab() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [showForm, setShowForm] = useState(false);
  const [selectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', optimization_type: 'grid', objective: 'sharpe_ratio',
    parameters: JSON.stringify({
      win_rate: { type: 'float', min: 0.3, max: 0.6, step: 0.05 },
      avg_win: { type: 'int', min: 100, max: 300, step: 50 },
      avg_loss: { type: 'int', min: 100, max: 200, step: 25 },
    }, null, 2),
  });

  const { data: optimizations = [], isLoading, error } = useOptimizations(projectId!);
  const runOpt = useRunOptimization(projectId!);
  const selectedOpt = selectedId ? optimizations.find(o => o.id === selectedId) : null;

  const handleRun = () => {
    let parameters = {};
    try { parameters = JSON.parse(form.parameters); } catch {}
    runOpt.mutate({
      name: form.name || 'Optimization',
      optimization_type: form.optimization_type,
      objective: form.objective,
      parameters,
    }, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load optimizations" />;

  const opt = selectedOpt || (optimizations.length > 0 ? optimizations[0] : null);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Parameter Optimization"
        description="Grid search and random search to find optimal strategy parameters"
        actions={<Button onClick={() => setShowForm(!showForm)}><Search className="w-4 h-4 mr-2" />New Optimization</Button>}
      />

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>Configure Optimization</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grid Search 1" /></div>
                <div><label className="text-xs font-medium mb-1 block">Type</label>
                  <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.optimization_type} onChange={(e) => setForm({ ...form, optimization_type: e.target.value })}>
                    <option value="grid">Grid Search</option>
                    <option value="random">Random Search</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Objective</label>
                  <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>
                    <option value="sharpe_ratio">Sharpe Ratio</option>
                    <option value="profit_factor">Profit Factor</option>
                    <option value="net_profit">Net Profit</option>
                    <option value="win_rate">Win Rate</option>
                    <option value="calmar_ratio">Calmar Ratio</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium mb-1 block">Parameters (JSON)</label>
                  <textarea className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
                    value={form.parameters} onChange={(e) => setForm({ ...form, parameters: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleRun} disabled={runOpt.isPending} className="mt-4">
                {runOpt.isPending ? 'Running...' : 'Run Optimization'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!opt ? (
        <EmptyState title="No optimizations" message="Run your first parameter optimization" icon={<Grid3X3 className="h-6 w-6" />} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Combinations" value={opt.total_combinations ?? opt.results?.length ?? 0} icon={Grid3X3} />
            <KpiCard title="Best Objective" value={opt.best_result ? ((opt.best_result as any).objective_value?.toFixed(4) ?? '—') : '—'} icon={Target} variant="success" />
            <KpiCard title="Best Sharpe" value={opt.best_result ? ((opt.best_result as any).metrics?.sharpe_ratio?.toFixed(2) ?? '—') : '—'} icon={Activity} />
            <KpiCard title="Best PF" value={opt.best_result ? ((opt.best_result as any).metrics?.profit_factor?.toFixed(2) ?? '—') : '—'} icon={Activity} />
          </div>

          {opt.results && opt.results.length > 0 && (
            <>
              <Card>
                <CardHeader><CardTitle>Top Results</CardTitle></CardHeader>
                <CardContent>
                  <DataTable
                    data={opt.results.slice(0, 50)}
                    columns={[
                      { id: 'parameters', header: 'Parameters', accessor: (row: any) => (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(row.parameters || {}).map(([k, val]) => (
                            <Badge key={k} variant="outline" className="text-xs">{k}: {String(val)}</Badge>
                          ))}
                        </div>
                      )},
                      { id: 'objective_value', header: 'Objective', accessor: (row: any) => <span className="font-medium">{row.objective_value?.toFixed(4)}</span> },
                      { id: 'metrics', header: 'Metrics', accessor: (row: any) => (
                        <div className="flex gap-2 text-xs">
                          <span>Sharpe: {row.metrics?.sharpe_ratio?.toFixed(2) ?? '—'}</span>
                          <span>WR: {row.metrics?.win_rate != null ? `${(row.metrics.win_rate * 100).toFixed(1)}%` : '—'}</span>
                        </div>
                      )},
                    ]}
                    searchable
                  />
                </CardContent>
              </Card>

              {opt.convergence_curve && opt.convergence_curve.length > 0 && (
                <ChartCard title="Convergence">
                  <LineChartCard data={opt.convergence_curve as any} dataKey="best" xKey="iteration" color="hsl(var(--chart-4))" />
                </ChartCard>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

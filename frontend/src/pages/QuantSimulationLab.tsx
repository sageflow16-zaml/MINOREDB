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
import { ChartCard, AreaChartCard, BarChartCard } from '../components/ui/chart';
import { cn } from '../lib/utils';
import { useSimulations, useRunSimulation, useDeleteSimulation, useSimulation } from '../hooks/useQuantResearch';
import {
  Play, Trash2, Activity, Dices, DollarSign, Percent, TrendingUp,
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantSimulationLab() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', simulation_type: 'monte_carlo', num_simulations: 1000,
    config: '{"num_trades": 200, "win_rate": 0.45, "avg_win": 200, "avg_loss": 150}',
  });

  const { data: simulations = [], isLoading, error } = useSimulations(projectId!);
  const runSim = useRunSimulation(projectId!);
  const deleteSim = useDeleteSimulation(projectId!);
  const { data: selectedSim } = useSimulation(projectId!, selectedId ?? undefined);

  const handleRun = () => {
    let config = {};
    try { config = JSON.parse(form.config); } catch {}
    runSim.mutate({
      name: form.name || 'Simulation',
      simulation_type: form.simulation_type,
      num_simulations: form.num_simulations,
      config,
    }, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load simulations" />;

  const sim = selectedSim || (simulations.length > 0 ? simulations[0] : null);
  const isMC = sim?.simulation_type === 'monte_carlo';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Simulation Lab"
        description="Monte Carlo and bootstrap analysis for edge validation"
        actions={<Button onClick={() => setShowForm(!showForm)}><Play className="w-4 h-4 mr-2" />New Simulation</Button>}
      />

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>Configure Simulation</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monte Carlo 1" /></div>
                <div><label className="text-xs font-medium mb-1 block">Type</label>
                  <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.simulation_type} onChange={(e) => setForm({ ...form, simulation_type: e.target.value })}>
                    <option value="monte_carlo">Monte Carlo</option>
                    <option value="bootstrap">Bootstrap</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Iterations</label><Input type="number" value={form.num_simulations} onChange={(e) => setForm({ ...form, num_simulations: parseInt(e.target.value) || 1000 })} /></div>
                <div className="md:col-span-3"><label className="text-xs font-medium mb-1 block">Config (JSON)</label><Input value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></div>
              </div>
              <Button onClick={handleRun} disabled={runSim.isPending} className="mt-4">
                {runSim.isPending ? 'Running...' : 'Run Simulation'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Simulations</CardTitle></CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
            {simulations.length === 0 ? (
              <EmptyState title="No simulations" message="Run your first simulation" />
            ) : simulations.map((s) => (
              <div key={s.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors',
                  selectedId === s.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                )}
                onClick={() => setSelectedId(s.id)}
              >
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.simulation_type} | {s.num_simulations} iters</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === 'completed' ? 'success' : s.status === 'running' ? 'info' : 'outline'}>{s.status}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); deleteSim.mutate(s.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Simulation Detail */}
        <div className="lg:col-span-2 space-y-6">
          {sim ? (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isMC ? (
                  <>
                    <KpiCard title="Mean Final" value={sim.results != null ? `$${((sim.results as any).mean_final_equity ?? 0).toFixed(0)}` : '—'} icon={DollarSign} />
                    <KpiCard title="Median Final" value={sim.results != null ? `$${((sim.results as any).median_final_equity ?? 0).toFixed(0)}` : '—'} icon={Activity} />
                    <KpiCard title="Prob. Profit" value={sim.results != null ? `${(((sim.results as any).probability_of_profit ?? 0) * 100).toFixed(1)}%` : '—'} icon={Percent} />
                    <KpiCard title="Simulations" value={sim.num_simulations} icon={Dices} />
                  </>
                ) : (
                  <>
                    <KpiCard title="Samples" value={sim.results?.num_samples != null ? (sim.results as any).num_samples : sim.num_simulations} icon={Dices} />
                    <KpiCard title="Sharpe (Mean)" value={(sim.results as any)?.results?.sharpe_ratio?.mean?.toFixed(2) ?? '—'} icon={TrendingUp} />
                    <KpiCard title="Win Rate (Mean)" value={(sim.results as any)?.results?.win_rate?.mean != null ? `${(((sim.results as any).results.win_rate.mean) * 100).toFixed(1)}%` : '—'} icon={Percent} />
                    <KpiCard title="Profit Factor (Mean)" value={(sim.results as any)?.results?.profit_factor?.mean?.toFixed(2) ?? '—'} icon={Activity} />
                  </>
                )}
              </div>

              {/* Equity Curves (Monte Carlo percentile bands) */}
              {isMC && sim.equity_curves && typeof sim.equity_curves === 'object' && Object.keys(sim.equity_curves).length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Monte Carlo Equity Bands</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="relative h-full">
                      {[5, 25, 50, 75, 95].map((pctl) => {
                        const curve = (sim.equity_curves as Record<string, number[]>)[String(pctl)] || [];
                        if (curve.length === 0) return null;
                        const maxVal = Math.max(...Object.values(sim.equity_curves as Record<string, number[]>).flat());
                        const minVal = Math.min(...Object.values(sim.equity_curves as Record<string, number[]>).flat());
                        const range = maxVal - minVal || 1;
                        const w = 100 / curve.length;
                        return (
                          <div key={pctl} className="absolute inset-0 flex items-end" style={{ opacity: pctl === 50 ? 1 : 0.3 }}>
                            {curve.map((val, i) => (
                              <div key={i} className="flex-1 transition-all duration-300" style={{
                                height: `${((val - minVal) / range) * 100}%`,
                                background: pctl === 50 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))',
                                margin: '0 1px',
                                borderRadius: '1px',
                              }} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Percentiles */}
              {sim.percentiles && Object.keys(sim.percentiles).length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Percentile Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(sim.percentiles).map(([k, v]) => (
                        <div key={k} className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">p{k}</div>
                          <div className="text-lg font-bold">${(v as number).toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Distribution Histogram */}
              {sim.distribution && sim.distribution.length > 0 && (
                  <ChartCard title="Final Equity Distribution">
                  <BarChartCard data={sim.distribution as any} dataKey="count" xKey="bucket" color="hsl(var(--chart-3))" />
                </ChartCard>
              )}
            </>
          ) : (
            <EmptyState title="Select a simulation" message="Choose from the list or run a new simulation" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

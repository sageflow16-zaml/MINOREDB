import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import { useCorrelations, useCorrelationMatrix, useCalculateCorrelation } from '../hooks/useMarketIntelligence';
import type { CorrelationData, CorrelationMatrix } from '../api/types';
import { Link2, Plus, X, RefreshCw, AlertTriangle } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const PERIODS = ['1d', '5d', '20d', '60d', '120d'];

function getCorrColor(v: number): string {
  if (v > 0.7) return 'bg-emerald-500/30 text-emerald-400';
  if (v > 0.3) return 'bg-emerald-500/15 text-emerald-500';
  if (v > -0.3) return 'bg-zinc-500/15 text-zinc-400';
  if (v > -0.7) return 'bg-red-500/15 text-red-500';
  return 'bg-red-500/30 text-red-400';
}

function CorrelationMatrixView({ matrix }: { matrix: CorrelationMatrix }) {
  const { symbols, matrix: data } = matrix;
  if (!symbols.length) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-muted-foreground font-medium" />
            {symbols.map((s) => (
              <th key={s} className="p-2 text-center text-muted-foreground font-medium truncate max-w-[60px]">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((row) => (
            <tr key={row}>
              <td className="p-2 text-muted-foreground font-medium whitespace-nowrap">{row}</td>
              {symbols.map((col) => {
                const key = row === col ? `${row}:${col}` : (data[`${row}:${col}`] ?? data[`${col}:${row}`]);
                const val = row === col ? 1.0 : (typeof key === 'number' ? key : null);
                return (
                  <td key={col} className="p-1 text-center">
                    {val !== null ? (
                      <span className={cn('inline-flex items-center justify-center w-full rounded px-1 py-1 font-mono', getCorrColor(val))}>
                        {val.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CorrelationCenterPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [period, setPeriod] = useState('20d');
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({ symbol_a: '', symbol_b: '', prices_a: '', prices_b: '' });

  const { data: correlations = [], isLoading } = useCorrelations(projectId!, undefined, period);
  const { data: matrix } = useCorrelationMatrix(projectId!, period);
  const calcMutation = useCalculateCorrelation(projectId!);

  const strongPositive = useMemo(() => correlations.filter((c: CorrelationData) => c.correlation > 0.7), [correlations]);
  const strongNegative = useMemo(() => correlations.filter((c: CorrelationData) => c.correlation < -0.7), [correlations]);

  const handleCalc = () => {
    const pricesA = calcForm.prices_a.split(',').map(Number).filter((n) => !isNaN(n));
    const pricesB = calcForm.prices_b.split(',').map(Number).filter((n) => !isNaN(n));
    if (pricesA.length < 2 || pricesB.length < 2) return;
    calcMutation.mutate({ symbol_a: calcForm.symbol_a, symbol_b: calcForm.symbol_b, prices_a: pricesA, prices_b: pricesB, period });
    setShowCalc(false);
    setCalcForm({ symbol_a: '', symbol_b: '', prices_a: '', prices_b: '' });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Correlation Center"
        description="Analyze relationships between trading pairs and assets"
        actions={
          <Button size="sm" onClick={() => setShowCalc(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Calculate
          </Button>
        }
      />

      {/* Period selector */}
      <div className="flex gap-1 border-b border-border/50">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn('px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              period === p ? 'border-primary text-primary-text' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>{p}</button>
        ))}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Summary cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{correlations.length}</p>
              <p className="text-xs text-muted-foreground">Total Pairs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{strongPositive.length}</p>
              <p className="text-xs text-muted-foreground">Strongly Positive</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{strongNegative.length}</p>
              <p className="text-xs text-muted-foreground">Strongly Negative</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Matrix */}
        {matrix && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Correlation Matrix</CardTitle></CardHeader>
              <CardContent><CorrelationMatrixView matrix={matrix} /></CardContent>
            </Card>
          </motion.div>
        )}

        {/* List */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">All Correlations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {correlations.length === 0 && <EmptyState />}
              {correlations.map((c: CorrelationData) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1">{c.symbol_a} / {c.symbol_b}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-medium', getCorrColor(c.correlation))}>
                    {c.correlation.toFixed(4)}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.data_points} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Calculate dialog */}
      {showCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Calculate Correlation</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCalc(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <input placeholder="Symbol A (e.g. EURUSD)" value={calcForm.symbol_a}
                onChange={(e) => setCalcForm({ ...calcForm, symbol_a: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Symbol B (e.g. GBPUSD)" value={calcForm.symbol_b}
                onChange={(e) => setCalcForm({ ...calcForm, symbol_b: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Prices A (comma-separated)" value={calcForm.prices_a}
                onChange={(e) => setCalcForm({ ...calcForm, prices_a: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-20 resize-none" />
              <textarea placeholder="Prices B (comma-separated)" value={calcForm.prices_b}
                onChange={(e) => setCalcForm({ ...calcForm, prices_b: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-20 resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCalc(false)}>Cancel</Button>
              <Button onClick={handleCalc} disabled={!calcForm.symbol_a || !calcForm.symbol_b || calcMutation.isPending}>
                {calcMutation.isPending ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

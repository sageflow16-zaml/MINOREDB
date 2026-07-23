import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { cn } from '../lib/utils';
import {
  useLiquidityLevels, useCreateLiquidity, useMarkSwept, useDeleteLiquidity,
} from '../hooks/useMarketIntelligence';
import type { LiquidityLevel } from '../api/types';
import { Layers, Plus, Trash2, CheckCircle, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const LEVEL_TYPES = ['demand', 'supply', 'order_block', 'equal_highs', 'equal_lows', 'breaker', 'fvg'];

function getLevelColor(type: string): string {
  const map: Record<string, string> = {
    demand: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    supply: 'bg-red-500/15 text-red-400 border-red-500/30',
    order_block: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    equal_highs: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    equal_lows: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    breaker: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    fvg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };
  return map[type] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}

export default function LiquidityMonitorPage() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const [symbol, setSymbol] = useState('EURUSD');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    level_type: 'demand', level_value: '', date: new Date().toISOString().split('T')[0], timeframe: 'H1', notes: '',
  });

  const { data: levels = [], isLoading } = useLiquidityLevels(projectId!, symbol);
  const createMutation = useCreateLiquidity(projectId!);
  const sweptMutation = useMarkSwept(projectId!);
  const deleteMutation = useDeleteLiquidity(projectId!);

  const handleCreate = () => {
    createMutation.mutate({
      symbol, level_type: formData.level_type, level_value: parseFloat(formData.level_value),
      date: formData.date, timeframe: formData.timeframe, notes: formData.notes || undefined,
    });
    setShowForm(false);
    setFormData({ level_type: 'demand', level_value: '', date: new Date().toISOString().split('T')[0], timeframe: 'H1', notes: '' });
  };

  const unswept = useMemo(() => levels.filter((l: LiquidityLevel) => !l.is_swept), [levels]);
  const swept = useMemo(() => levels.filter((l: LiquidityLevel) => l.is_swept), [levels]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquidity Monitor"
        description="Track demand/supply zones, order blocks and liquidity levels"
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Level
          </Button>
        }
      />

      {/* Symbol selector */}
      <div className="flex items-center gap-3">
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
          placeholder="Symbol (e.g. EURUSD)" />
        <Badge variant="info">{unswept.length} active</Badge>
        <Badge variant="default">{swept.length} swept</Badge>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Active levels */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Active Levels</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {unswept.length === 0 && <EmptyState />}
              {unswept.map((l: LiquidityLevel) => (
                <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
                  <Badge className={cn('border', getLevelColor(l.level_type))}>{l.level_type}</Badge>
                  <span className="text-sm font-mono font-medium text-foreground">{l.level_value}</span>
                  <span className="text-xs text-muted-foreground flex-1">
                    {l.timeframe} · {l.date}
                    {l.notes && <> · {l.notes}</>}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => sweptMutation.mutate(l.id)} title="Mark swept">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(l.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Swept levels */}
        {swept.length > 0 && (
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Swept Levels</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {swept.map((l: LiquidityLevel) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/30 p-3 opacity-60">
                    <Badge className="border bg-zinc-500/10 text-zinc-500 border-zinc-500/20">{l.level_type}</Badge>
                    <span className="text-sm font-mono text-muted-foreground line-through">{l.level_value}</span>
                    <span className="text-xs text-muted-foreground flex-1">{l.timeframe} · Swept {l.swept_at?.slice(0, 10) ?? '—'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Create dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Liquidity Level</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <select value={formData.level_type} onChange={(e) => setFormData({ ...formData, level_type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {LEVEL_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <input type="number" step="any" placeholder="Price level" value={formData.level_value}
                onChange={(e) => setFormData({ ...formData, level_value: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <select value={formData.timeframe} onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  {['M1', 'M5', 'M15', 'H1', 'H4', 'D1', 'W1'].map((tf) => <option key={tf} value={tf}>{tf}</option>)}
                </select>
              </div>
              <textarea placeholder="Notes (optional)" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-16 resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.level_value}>Create</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

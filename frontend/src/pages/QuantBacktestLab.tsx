import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';

import { useBacktests, useRunBacktest, useDeleteBacktest } from '../hooks/useQuantResearch';
import {Play, BarChart3} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function QuantBacktestLab() {
  const { projectId } = useParams<{ projectId: string }>()!;
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', start_date: '', end_date: '',
    symbols: '', backtest_type: 'single',
    config: '{}', costs: '{}',
  });

  const { data: backtests = [], isLoading, error } = useBacktests(projectId!);
  const runBt = useRunBacktest(projectId!);
  const deleteBt = useDeleteBacktest(projectId!);

  const handleRun = () => {
    let config = {};
    let costs = {};
    try { config = JSON.parse(form.config || '{}'); } catch {}
    try { costs = JSON.parse(form.costs || '{}'); } catch {}

    runBt.mutate({
      name: form.name || 'Backtest',
      start_date: form.start_date,
      end_date: form.end_date,
      symbols: form.symbols ? form.symbols.split(',').map((s: string) => s.trim()) : [],
      backtest_type: form.backtest_type,
      config,
      costs,
    }, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load backtests" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Backtest Lab"
        description="Execute, analyze, and compare backtests across strategies and market conditions"
        actions={<Button onClick={() => setShowForm(!showForm)}><Play className="w-4 h-4 mr-2" />New Backtest</Button>}
      />

      {/* Run Backtest Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>Configure Backtest</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="text-xs font-medium mb-1 block">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Backtest" /></div>
                <div><label className="text-xs font-medium mb-1 block">Type</label>
                  <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.backtest_type} onChange={(e) => setForm({ ...form, backtest_type: e.target.value })}>
                    <option value="single">Single Strategy</option>
                    <option value="multi">Multi Strategy</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="multi_asset">Multi Asset</option>
                    <option value="multi_timeframe">Multi Timeframe</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Symbols (comma-separated)</label><Input value={form.symbols} onChange={(e) => setForm({ ...form, symbols: e.target.value })} placeholder="EURUSD, BTCUSD" /></div>
                <div><label className="text-xs font-medium mb-1 block">Start Date</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><label className="text-xs font-medium mb-1 block">End Date</label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                <div><label className="text-xs font-medium mb-1 block">Config (JSON)</label><Input value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></div>
                <div><label className="text-xs font-medium mb-1 block">Costs (JSON)</label><Input value={form.costs} onChange={(e) => setForm({ ...form, costs: e.target.value })} /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleRun} disabled={!form.name || runBt.isPending}>
                  {runBt.isPending ? 'Running...' : 'Run Backtest'}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Backtest List */}
      {backtests.length === 0 ? (
        <EmptyState title="No backtests" message="Configure and run your first backtest" icon={<BarChart3 className="h-6 w-6" />} />
      ) : (
        <DataTable
          data={backtests}
          columns={[
            { id: 'name', header: 'Name', accessor: (row: any) => (
              <button onClick={() => navigate(`/projects/${projectId}/quant-research/backtests/${row.id}`)} className="text-primary-text hover:underline font-medium">{row.name}</button>
            )},
            { id: 'status', header: 'Status', accessor: (row: any) => <Badge variant={row.status === 'completed' ? 'success' : row.status === 'running' ? 'info' : row.status === 'failed' ? 'destructive' : 'outline'}>{row.status}</Badge> },
            { id: 'backtest_type', header: 'Type', accessor: (row: any) => <Badge variant="outline">{row.backtest_type}</Badge> },
            { id: 'sharpe_ratio', header: 'Sharpe', accessor: (row: any) => row.sharpe_ratio != null ? row.sharpe_ratio.toFixed(2) : '—' },
            { id: 'win_rate', header: 'Win Rate', accessor: (row: any) => row.win_rate != null ? `${(row.win_rate * 100).toFixed(1)}%` : '—' },
            { id: 'profit_factor', header: 'PF', accessor: (row: any) => row.profit_factor != null ? row.profit_factor.toFixed(2) : '—' },
            { id: 'net_profit', header: 'Net Profit', accessor: (row: any) => row.net_profit != null ? `$${row.net_profit.toFixed(0)}` : '—' },
            { id: 'total_trades', header: 'Trades', accessor: 'total_trades' },
            { id: 'duration_seconds', header: 'Duration', accessor: (row: any) => row.duration_seconds != null ? `${row.duration_seconds.toFixed(0)}s` : '—' },
          ]}
          searchable
        />
      )}
    </motion.div>
  );
}

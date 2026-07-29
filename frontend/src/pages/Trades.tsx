import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useTrades,
  useCreateTrade,
  useUpdateTrade,
  useDeleteTrade,
} from '../hooks/useTrades';
import { useStrategies } from '../hooks/useStrategies';
import { useMarketStructures } from '../hooks/useMarketStructures';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { FormField, SectionLabel } from '../components/ui/form-field';
import TradeImportDialog from '../components/TradeImportDialog';
import TradeExportDialog from '../components/TradeExportDialog';
import {
  Plus, X, Pencil, Trash2, Eye, TrendingUp, TrendingDown,
  DollarSign, BarChart3, Target, Activity, Search, ArrowUpDown,
  Upload, Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { TradeRead, TradeCreate, TradeUpdate } from '../types';

type FormData = TradeCreate & TradeUpdate;

const emptyForm: FormData = {
  market_structure_id: undefined,
  pair: '',
  direction: 'BUY',
  entry_price: undefined,
  stop_loss: undefined,
  take_profit: undefined,
  exit_price: undefined,
  position_size: undefined,
  risk_percent: undefined,
  rr: undefined,
  pnl: undefined,
  result: undefined,
  status: 'OPEN',
  weekly_bias: undefined,
  daily_bias: undefined,
  h4_bias: undefined,
  liquidity_sweep: undefined,
  bos: undefined,
  mss: undefined,
  order_block: undefined,
  fvg: undefined,
  asian_session: undefined,
  london_session: undefined,
  newyork_session: undefined,
  dxy: undefined,
  us10y: undefined,
  us02y: undefined,
  news_event: undefined,
  emotion: undefined,
  notes: undefined,
  before_image: undefined,
  after_image: undefined,
};

type Direction = 'BUY' | 'SELL';
type Status = 'OPEN' | 'CLOSED';

export default function TradesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: trades, isLoading, error, refetch } = useTrades(projectId!);
  const { data: strategies } = useStrategies(projectId!);
  const { data: msRecords } = useMarketStructures(projectId!);
  const createTrade = useCreateTrade(projectId!);
  const updateTrade = useUpdateTrade(projectId!);
  const deleteTrade = useDeleteTrade(projectId!);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewTrade, setViewTrade] = useState<TradeRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const wins = trades?.filter(t => t.result === 'WIN').length ?? 0;
  const losses = trades?.filter(t => t.result === 'LOSS').length ?? 0;
  const totalPnl = trades?.reduce((sum, t) => sum + (t.pnl ?? 0), 0) ?? 0;
  const avgRR = trades && trades.length > 0
    ? trades.reduce((sum, t) => sum + (t.rr ?? 0), 0) / trades.length
    : 0;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (trade: TradeRead) => {
    setForm({
      market_structure_id: trade.market_structure_id ?? undefined,
      pair: trade.pair ?? '',
      direction: (trade.direction as Direction) ?? 'BUY',
      entry_price: trade.entry_price,
      stop_loss: trade.stop_loss,
      take_profit: trade.take_profit,
      exit_price: trade.exit_price,
      position_size: trade.position_size,
      risk_percent: trade.risk_percent,
      rr: trade.rr,
      pnl: trade.pnl,
      result: trade.result ?? undefined,
      status: (trade.status as Status) ?? 'OPEN',
      weekly_bias: trade.weekly_bias ?? undefined,
      daily_bias: trade.daily_bias ?? undefined,
      h4_bias: trade.h4_bias ?? undefined,
      liquidity_sweep: trade.liquidity_sweep ?? undefined,
      bos: trade.bos ?? undefined,
      mss: trade.mss ?? undefined,
      order_block: trade.order_block ?? undefined,
      fvg: trade.fvg ?? undefined,
      asian_session: trade.asian_session ?? undefined,
      london_session: trade.london_session ?? undefined,
      newyork_session: trade.newyork_session ?? undefined,
      dxy: trade.dxy ?? undefined,
      us10y: trade.us10y ?? undefined,
      us02y: trade.us02y ?? undefined,
      news_event: trade.news_event ?? undefined,
      emotion: trade.emotion ?? undefined,
      notes: trade.notes ?? undefined,
      before_image: trade.before_image ?? undefined,
      after_image: trade.after_image ?? undefined,
    });
    setEditingId(trade.id);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const payload: TradeCreate = {
      ...form,
      entry_price: form.entry_price ?? undefined,
      stop_loss: form.stop_loss ?? undefined,
      take_profit: form.take_profit ?? undefined,
      exit_price: form.exit_price ?? undefined,
      position_size: form.position_size ?? undefined,
      risk_percent: form.risk_percent ?? undefined,
      rr: form.rr ?? undefined,
      pnl: form.pnl ?? undefined,
    };
    for (const key in payload) {
      if ((payload as any)[key] === '') {
        (payload as any)[key] = undefined;
      }
    }
    if (editingId) {
      updateTrade.mutate({ id: editingId, data: payload }, { onSuccess: () => { setDrawerOpen(false); resetForm(); } });
    } else {
      createTrade.mutate(payload, { onSuccess: () => { setDrawerOpen(false); resetForm(); } });
    }
  };

  const set = (field: keyof FormData) => (value: string) => {
    const numFields = ['entry_price', 'stop_loss', 'take_profit', 'exit_price', 'position_size', 'risk_percent', 'rr', 'pnl'] as const;
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : numFields.includes(field as typeof numFields[number]) ? parseFloat(value) : value,
    }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading trades." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trading Journal"
        description={`${trades?.length ?? 0} trades · ${wins}W / ${losses}L`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1.5 h-4 w-4" /> Import
            </Button>
            <Button onClick={openCreate} isLoading={createTrade.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> New Trade
            </Button>
          </div>
        }
      />

      {/* KPI summary */}
      {trades && trades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard title="Total P&L" value={`$${totalPnl.toFixed(2)}`} icon={DollarSign} variant={totalPnl >= 0 ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Win Rate" value={trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(1)}%` : '0%'} icon={Target} variant={wins >= losses ? 'success' : 'danger'} size="sm" />
          <KpiCard title="Avg R:R" value={avgRR.toFixed(2)} icon={Activity} variant={avgRR >= 1.5 ? 'success' : 'warning'} size="sm" />
          <KpiCard title="Total Trades" value={trades.length} icon={BarChart3} variant="info" size="sm" />
        </div>
      )}

      {!trades || trades.length === 0 ? (
        <EmptyState
          title="No trades yet"
          description="Create your first trade to start tracking your performance."
          action={<Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New Trade</Button>}
        />
      ) : (
        <DataTable
          data={trades}
          columns={[
            { header: 'Pair', accessor: (row: any) => row.pair || '-', sortable: true, className: 'font-medium' },
            { header: 'Direction', accessor: (row: any) => (
              <div className="flex items-center gap-1">
                {row.direction === 'BUY' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={row.direction === 'BUY' ? 'text-success' : 'text-destructive'}>{row.direction || '-'}</span>
              </div>
            )},
            { header: 'Entry', accessor: (row: any) => row.entry_price?.toFixed(5) ?? '-', hideOnMobile: true },
            { header: 'SL', accessor: (row: any) => row.stop_loss?.toFixed(5) ?? '-', hideOnMobile: true },
            { header: 'TP', accessor: (row: any) => row.take_profit?.toFixed(5) ?? '-', hideOnMobile: true },
            { header: 'P&L', accessor: (row: any) => {
              if (row.pnl == null) return '-';
              return <span className={cn('font-medium', row.pnl >= 0 ? 'text-success' : 'text-destructive')}>${row.pnl?.toFixed(2)}</span>;
            }, sortable: true },
            { header: 'RR', accessor: (row: any) => row.rr?.toFixed(2) ?? '-', sortable: true },
            { header: 'Result', accessor: (row: any) => {
              if (!row.result) return '-';
              const variants: Record<string, 'success' | 'destructive' | 'warning'> = { WIN: 'success', LOSS: 'destructive', BE: 'warning' };
              return <Badge variant={variants[row.result] || 'secondary'} size="sm">{row.result}</Badge>;
            }},
            { header: 'Status', accessor: (row: any) => (
              <Badge variant={row.status === 'OPEN' ? 'info' : 'secondary'} size="sm">{row.status || '-'}</Badge>
            )},
            { header: 'Date', accessor: (row: any) => new Date(row.created_at).toLocaleDateString(), hideOnMobile: true },
            { header: '', accessor: (row: any) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setViewTrade(row); }}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ), className: 'w-[100px]' },
          ]}
          searchable
          searchFields={['pair']}
          searchPlaceholder="Search by pair..."
        />
      )}

      {/* Create / Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => { setDrawerOpen(false); resetForm(); }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-border bg-background shadow-xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">{editingId ? 'Edit Trade' : 'New Trade'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => { setDrawerOpen(false); resetForm(); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <SectionLabel label="Trade Info" />
                    <FormField label="Pair" value={form.pair} onChange={set('pair')} />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-2xs font-medium text-muted-foreground">Market Structure</label>
                      <select
                        value={form.market_structure_id ?? ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, market_structure_id: e.target.value || undefined }))}
                        className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">None</option>
                        {(msRecords || [])
                          .filter((ms) => !form.pair || ms.pair === form.pair)
                          .map((ms) => (
                            <option key={ms.id} value={ms.id}>
                              {ms.date || '?'} | {ms.pair || '-'} | {ms.timeframe || '-'}
                            </option>
                          ))}
                      </select>
                    </div>
                    <FormField label="Direction" value={form.direction} onChange={set('direction')} options={['BUY', 'SELL']} />
                    <FormField label="Entry Price" value={form.entry_price} onChange={set('entry_price')} type="number" step="0.00001" />
                    <FormField label="Stop Loss" value={form.stop_loss} onChange={set('stop_loss')} type="number" step="0.00001" />
                    <FormField label="Take Profit" value={form.take_profit} onChange={set('take_profit')} type="number" step="0.00001" />
                    <FormField label="Exit Price" value={form.exit_price} onChange={set('exit_price')} type="number" step="0.00001" />
                    <FormField label="Position Size" value={form.position_size} onChange={set('position_size')} type="number" step="0.01" />
                    <FormField label="Risk %" value={form.risk_percent} onChange={set('risk_percent')} type="number" step="0.01" />
                    <FormField label="R:R" value={form.rr} onChange={set('rr')} type="number" step="0.01" />
                    <FormField label="P&L" value={form.pnl} onChange={set('pnl')} type="number" step="0.01" />
                    <FormField label="Result" value={form.result} onChange={set('result')} options={['WIN', 'LOSS', 'BE', '']} />
                    <FormField label="Status" value={form.status} onChange={set('status')} options={['OPEN', 'CLOSED']} />

                    <SectionLabel label="Market Context" />
                    <FormField label="Weekly Bias" value={form.weekly_bias} onChange={set('weekly_bias')} />
                    <FormField label="Daily Bias" value={form.daily_bias} onChange={set('daily_bias')} />
                    <FormField label="H4 Bias" value={form.h4_bias} onChange={set('h4_bias')} />

                    <SectionLabel label="ICT Concepts" />
                    <FormField label="Liquidity Sweep" value={form.liquidity_sweep} onChange={set('liquidity_sweep')} />
                    <FormField label="BOS" value={form.bos} onChange={set('bos')} />
                    <FormField label="MSS" value={form.mss} onChange={set('mss')} />
                    <FormField label="Order Block" value={form.order_block} onChange={set('order_block')} />
                    <FormField label="FVG" value={form.fvg} onChange={set('fvg')} />

                    <SectionLabel label="Sessions" />
                    <FormField label="Asian" value={form.asian_session} onChange={set('asian_session')} />
                    <FormField label="London" value={form.london_session} onChange={set('london_session')} />
                    <FormField label="New York" value={form.newyork_session} onChange={set('newyork_session')} />

                    <SectionLabel label="Macro" />
                    <FormField label="DXY" value={form.dxy} onChange={set('dxy')} />
                    <FormField label="US10Y" value={form.us10y} onChange={set('us10y')} />
                    <FormField label="US02Y" value={form.us02y} onChange={set('us02y')} />
                    <FormField label="News Event" value={form.news_event} onChange={set('news_event')} />

                    <SectionLabel label="Psychology" />
                    <FormField label="Emotion" value={form.emotion} onChange={set('emotion')} />
                    <div className="col-span-full flex flex-col gap-1.5">
                      <label className="text-2xs font-medium text-muted-foreground">Notes</label>
                      <textarea
                        value={form.notes ?? ''}
                        onChange={(e) => set('notes')(e.target.value)}
                        rows={4}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                  <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleSave} isLoading={createTrade.isPending || updateTrade.isPending}>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View Drawer */}
      <AnimatePresence>
        {viewTrade && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setViewTrade(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border bg-background shadow-xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Trade Details</h2>
                  <Button variant="ghost" size="icon" onClick={() => setViewTrade(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-3">
                    {([
                      ['Pair', viewTrade.pair],
                      ['Direction', viewTrade.direction],
                      ['Entry Price', viewTrade.entry_price?.toFixed(5)],
                      ['Stop Loss', viewTrade.stop_loss?.toFixed(5)],
                      ['Take Profit', viewTrade.take_profit?.toFixed(5)],
                      ['Exit Price', viewTrade.exit_price?.toFixed(5)],
                      ['Position Size', viewTrade.position_size],
                      ['Risk %', viewTrade.risk_percent],
                      ['R:R', viewTrade.rr],
                      ['P&L', viewTrade.pnl != null ? `$${viewTrade.pnl.toFixed(2)}` : null],
                      ['Result', viewTrade.result],
                      ['Status', viewTrade.status],
                      ['Weekly Bias', viewTrade.weekly_bias],
                      ['Daily Bias', viewTrade.daily_bias],
                      ['H4 Bias', viewTrade.h4_bias],
                      ['Liquidity Sweep', viewTrade.liquidity_sweep],
                      ['BOS', viewTrade.bos],
                      ['MSS', viewTrade.mss],
                      ['Order Block', viewTrade.order_block],
                      ['FVG', viewTrade.fvg],
                      ['Asian Session', viewTrade.asian_session],
                      ['London Session', viewTrade.london_session],
                      ['New York Session', viewTrade.newyork_session],
                      ['DXY', viewTrade.dxy],
                      ['US10Y', viewTrade.us10y],
                      ['US02Y', viewTrade.us02y],
                      ['News Event', viewTrade.news_event],
                      ['Emotion', viewTrade.emotion],
                      ['Notes', viewTrade.notes],
                    ] as const).map(([label, val]) =>
                      val ? (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-b-0">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className="text-xs font-medium text-foreground">{String(val)}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end border-t border-border px-5 py-4">
                  <Button variant="outline" onClick={() => setViewTrade(null)}>Close</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) deleteTrade.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />

      <TradeImportDialog
        projectId={projectId!}
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
      <TradeExportDialog
        projectId={projectId!}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        selectedIds={selectedIds.length > 0 ? selectedIds : undefined}
        availableStrategies={strategies?.map((s: any) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}

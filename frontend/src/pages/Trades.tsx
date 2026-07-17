import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useTrades,
  useCreateTrade,
  useUpdateTrade,
  useDeleteTrade,
} from '../hooks/useTrades';
import { useMarketStructures } from '../hooks/useMarketStructures';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { TradeRead, TradeCreate, TradeUpdate } from '../types';

type FormData = TradeCreate & TradeUpdate;

const emptyForm: FormData = {
  market_structure_id: '',
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
  result: '',
  status: 'OPEN',
  weekly_bias: '',
  daily_bias: '',
  h4_bias: '',
  liquidity_sweep: '',
  bos: '',
  mss: '',
  order_block: '',
  fvg: '',
  asian_session: '',
  london_session: '',
  newyork_session: '',
  dxy: '',
  us10y: '',
  us02y: '',
  news_event: '',
  emotion: '',
  notes: '',
  before_image: '',
  after_image: '',
};

const SectionLabel = ({ label }: { label: string }) => (
  <h4 className="col-span-full text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-200 dark:border-slate-700">
    {label}
  </h4>
);

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  step,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
    {type === 'select' ? (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
      >
        {(step?.split(',') || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value ?? ''}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
      />
    )}
  </div>
);

type Direction = 'BUY' | 'SELL';
type Result = '' | 'WIN' | 'LOSS' | 'BE';
type Status = 'OPEN' | 'CLOSED';

export default function TradesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: trades, isLoading, error } = useTrades(projectId!);
  const { data: msRecords } = useMarketStructures(projectId!);
  const createTrade = useCreateTrade(projectId!);
  const updateTrade = useUpdateTrade(projectId!);
  const deleteTrade = useDeleteTrade(projectId!);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewTrade, setViewTrade] = useState<TradeRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

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
      market_structure_id: trade.market_structure_id ?? '',
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
      result: trade.result ?? '',
      status: (trade.status as Status) ?? 'OPEN',
      weekly_bias: trade.weekly_bias ?? '',
      daily_bias: trade.daily_bias ?? '',
      h4_bias: trade.h4_bias ?? '',
      liquidity_sweep: trade.liquidity_sweep ?? '',
      bos: trade.bos ?? '',
      mss: trade.mss ?? '',
      order_block: trade.order_block ?? '',
      fvg: trade.fvg ?? '',
      asian_session: trade.asian_session ?? '',
      london_session: trade.london_session ?? '',
      newyork_session: trade.newyork_session ?? '',
      dxy: trade.dxy ?? '',
      us10y: trade.us10y ?? '',
      us02y: trade.us02y ?? '',
      news_event: trade.news_event ?? '',
      emotion: trade.emotion ?? '',
      notes: trade.notes ?? '',
      before_image: trade.before_image ?? '',
      after_image: trade.after_image ?? '',
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
      [field]: numFields.includes(field as typeof numFields[number]) ? (value === '' ? undefined : parseFloat(value)) : value,
    }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading trades." />;

  return (
    <div>
      <PageHeader title="Trading Journal">
        <button
          onClick={openCreate}
          disabled={createTrade.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          New Trade
        </button>
      </PageHeader>

      {!trades || trades.length === 0 ? (
        <EmptyState message="No trades yet. Create your first trade to start tracking." />
      ) : (
        <DataTable
          data={trades}
          columns={[
            { header: 'Pair', accessor: (row) => row.pair || '-' },
            { header: 'Direction', accessor: (row) => (
              <span className={row.direction === 'BUY' ? 'text-green-500' : 'text-red-500'}>{row.direction || '-'}</span>
            )},
            { header: 'Entry', accessor: (row) => row.entry_price?.toFixed(5) ?? '-' },
            { header: 'SL', accessor: (row) => row.stop_loss?.toFixed(5) ?? '-' },
            { header: 'TP', accessor: (row) => row.take_profit?.toFixed(5) ?? '-' },
            { header: 'P&L', accessor: (row) => {
              if (!row.pnl) return '-';
              return <span className={row.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>{row.pnl?.toFixed(2)}</span>;
            }},
            { header: 'RR', accessor: (row) => row.rr?.toFixed(2) ?? '-' },
            { header: 'Result', accessor: (row) => {
              if (!row.result) return '-';
              const colors: Record<string, string> = { WIN: 'text-green-500', LOSS: 'text-red-500', BE: 'text-yellow-500' };
              return <span className={colors[row.result] || ''}>{row.result}</span>;
            }},
            { header: 'Status', accessor: (row) => (
              <span className={row.status === 'OPEN' ? 'text-blue-500' : 'text-slate-500'}>{row.status || '-'}</span>
            )},
            { header: 'Date', accessor: (row) => new Date(row.created_at).toLocaleDateString() },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewTrade(row)} className="text-slate-600 hover:text-slate-900 dark:hover:text-white text-sm">View</button>
                <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                <button onClick={() => setDeleteId(row.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            )},
          ]}
        />
      )}

      {/* Create / Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setDrawerOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Trade' : 'New Trade'}
                </h3>
                <button onClick={() => { setDrawerOpen(false); resetForm(); }} className="text-slate-500">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SectionLabel label="Trade Info" />
                <Field label="Pair" value={form.pair} onChange={set('pair')} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Market Structure</label>
                  <select
                    value={form.market_structure_id ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, market_structure_id: e.target.value || undefined }))}
                    className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="">None</option>
                    {(msRecords || [])
                      .filter((ms) => !form.pair || ms.pair === form.pair)
                      .map((ms) => (
                        <option key={ms.id} value={ms.id}>
                          {ms.date || '?'} | {ms.pair || '-'} | {ms.timeframe || '-'} | {ms.weekly_bias || '-'}
                        </option>
                      ))}
                  </select>
                </div>
                <Field label="Direction" value={form.direction} onChange={set('direction')} type="select" step="BUY,SELL" />
                <Field label="Entry Price" value={form.entry_price} onChange={set('entry_price')} type="number" step="0.00001" />
                <Field label="Stop Loss" value={form.stop_loss} onChange={set('stop_loss')} type="number" step="0.00001" />
                <Field label="Take Profit" value={form.take_profit} onChange={set('take_profit')} type="number" step="0.00001" />
                <Field label="Exit Price" value={form.exit_price} onChange={set('exit_price')} type="number" step="0.00001" />
                <Field label="Position Size" value={form.position_size} onChange={set('position_size')} type="number" step="0.01" />
                <Field label="Risk %" value={form.risk_percent} onChange={set('risk_percent')} type="number" step="0.01" />
                <Field label="R:R" value={form.rr} onChange={set('rr')} type="number" step="0.01" />
                <Field label="P&L" value={form.pnl} onChange={set('pnl')} type="number" step="0.01" />
                <Field label="Result" value={form.result} onChange={set('result')} type="select" step="WIN,LOSS,BE," />
                <Field label="Status" value={form.status} onChange={set('status')} type="select" step="OPEN,CLOSED" />

                <SectionLabel label="Market Context" />
                <Field label="Weekly Bias" value={form.weekly_bias} onChange={set('weekly_bias')} />
                <Field label="Daily Bias" value={form.daily_bias} onChange={set('daily_bias')} />
                <Field label="H4 Bias" value={form.h4_bias} onChange={set('h4_bias')} />

                <SectionLabel label="ICT" />
                <Field label="Liquidity Sweep" value={form.liquidity_sweep} onChange={set('liquidity_sweep')} />
                <Field label="BOS" value={form.bos} onChange={set('bos')} />
                <Field label="MSS" value={form.mss} onChange={set('mss')} />
                <Field label="Order Block" value={form.order_block} onChange={set('order_block')} />
                <Field label="FVG" value={form.fvg} onChange={set('fvg')} />

                <SectionLabel label="Sessions" />
                <Field label="Asian" value={form.asian_session} onChange={set('asian_session')} />
                <Field label="London" value={form.london_session} onChange={set('london_session')} />
                <Field label="New York" value={form.newyork_session} onChange={set('newyork_session')} />

                <SectionLabel label="Macro" />
                <Field label="DXY" value={form.dxy} onChange={set('dxy')} />
                <Field label="US10Y" value={form.us10y} onChange={set('us10y')} />
                <Field label="US02Y" value={form.us02y} onChange={set('us02y')} />
                <Field label="News Event" value={form.news_event} onChange={set('news_event')} />

                <SectionLabel label="Psychology" />
                <Field label="Emotion" value={form.emotion} onChange={set('emotion')} />
                <div className="col-span-full flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(e) => set('notes')(e.target.value)}
                    rows={3}
                    className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setDrawerOpen(false); resetForm(); }}
                  className="px-4 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={createTrade.isPending || updateTrade.isPending}
                  className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      {viewTrade && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewTrade(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Trade Details</h3>
                <button onClick={() => setViewTrade(null)} className="text-slate-500">&times;</button>
              </div>
              {(
                [
                  ['Pair', viewTrade.pair],
                  ['Direction', viewTrade.direction],
                  ['Entry Price', viewTrade.entry_price?.toFixed(5)],
                  ['Stop Loss', viewTrade.stop_loss?.toFixed(5)],
                  ['Take Profit', viewTrade.take_profit?.toFixed(5)],
                  ['Exit Price', viewTrade.exit_price?.toFixed(5)],
                  ['Position Size', viewTrade.position_size],
                  ['Risk %', viewTrade.risk_percent],
                  ['R:R', viewTrade.rr],
                  ['P&L', viewTrade.pnl],
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
                ] as const
              ).map(([label, val]) =>
                val ? (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-900 dark:text-slate-100">{String(val)}</span>
                  </div>
                ) : null
              )}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewTrade(null)}
                  className="px-4 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Trade"
        message="Are you sure you want to delete this trade?"
        onConfirm={() => {
          if (deleteId) deleteTrade.mutate(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

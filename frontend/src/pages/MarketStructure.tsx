import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useMarketStructures,
  useCreateMarketStructure,
  useUpdateMarketStructure,
  useDeleteMarketStructure,
} from '../hooks/useMarketStructures';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { MarketStructureRead, MarketStructureCreate, MarketStructureUpdate } from '../types';

type FormData = MarketStructureCreate & MarketStructureUpdate;

const emptyForm: FormData = {
  date: '',
  pair: '',
  timeframe: '',
  weekly_bias: '',
  daily_bias: '',
  h4_bias: '',
  market_phase: '',
  trend: '',
  premium_discount: '',
  external_liquidity: '',
  internal_liquidity: '',
  equal_highs: '',
  equal_lows: '',
  buy_side_liquidity: '',
  sell_side_liquidity: '',
  bos: '',
  mss: '',
  choch: '',
  order_block: '',
  breaker: '',
  mitigation: '',
  fvg: '',
  ifvg: '',
  asian_high: undefined,
  asian_low: undefined,
  london_open: undefined,
  newyork_open: undefined,
  london_killzone: '',
  newyork_killzone: '',
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

export default function MarketStructurePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: records, isLoading, error } = useMarketStructures(projectId!);
  const createMs = useCreateMarketStructure(projectId!);
  const updateMs = useUpdateMarketStructure(projectId!);
  const deleteMs = useDeleteMarketStructure(projectId!);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<MarketStructureRead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (ms: MarketStructureRead) => {
    setForm({
      trade_id: ms.trade_id,
      date: ms.date ?? '',
      pair: ms.pair ?? '',
      timeframe: ms.timeframe ?? '',
      weekly_bias: ms.weekly_bias ?? '',
      daily_bias: ms.daily_bias ?? '',
      h4_bias: ms.h4_bias ?? '',
      market_phase: ms.market_phase ?? '',
      trend: ms.trend ?? '',
      premium_discount: ms.premium_discount ?? '',
      external_liquidity: ms.external_liquidity ?? '',
      internal_liquidity: ms.internal_liquidity ?? '',
      equal_highs: ms.equal_highs ?? '',
      equal_lows: ms.equal_lows ?? '',
      buy_side_liquidity: ms.buy_side_liquidity ?? '',
      sell_side_liquidity: ms.sell_side_liquidity ?? '',
      bos: ms.bos ?? '',
      mss: ms.mss ?? '',
      choch: ms.choch ?? '',
      order_block: ms.order_block ?? '',
      breaker: ms.breaker ?? '',
      mitigation: ms.mitigation ?? '',
      fvg: ms.fvg ?? '',
      ifvg: ms.ifvg ?? '',
      asian_high: ms.asian_high,
      asian_low: ms.asian_low,
      london_open: ms.london_open,
      newyork_open: ms.newyork_open,
      london_killzone: ms.london_killzone ?? '',
      newyork_killzone: ms.newyork_killzone ?? '',
    });
    setEditingId(ms.id);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const payload: MarketStructureCreate = {
      ...form,
      asian_high: form.asian_high ?? undefined,
      asian_low: form.asian_low ?? undefined,
      london_open: form.london_open ?? undefined,
      newyork_open: form.newyork_open ?? undefined,
    };
    if (editingId) {
      updateMs.mutate({ id: editingId, data: payload }, { onSuccess: () => { setDrawerOpen(false); resetForm(); } });
    } else {
      createMs.mutate(payload, { onSuccess: () => { setDrawerOpen(false); resetForm(); } });
    }
  };

  const set = (field: keyof FormData) => (value: string) => {
    const numFields = ['asian_high', 'asian_low', 'london_open', 'newyork_open'] as const;
    setForm((prev) => ({
      ...prev,
      [field]: numFields.includes(field as typeof numFields[number]) ? (value === '' ? undefined : parseFloat(value)) : value,
    }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading market structures." />;

  return (
    <div>
      <PageHeader title="Market Structure">
        <button
          onClick={openCreate}
          disabled={createMs.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          New Record
        </button>
      </PageHeader>

      {!records || records.length === 0 ? (
        <EmptyState message="No market structure records yet." />
      ) : (
        <DataTable
          data={records}
          columns={[
            { header: 'Date', accessor: (row) => row.date || '-' },
            { header: 'Pair', accessor: (row) => row.pair || '-' },
            { header: 'Timeframe', accessor: (row) => row.timeframe || '-' },
            { header: 'Weekly Bias', accessor: (row) => (
              <span className={row.weekly_bias === 'BULLISH' ? 'text-green-500' : row.weekly_bias === 'BEARISH' ? 'text-red-500' : ''}>
                {row.weekly_bias || '-'}
              </span>
            )},
            { header: 'Market Phase', accessor: (row) => row.market_phase || '-' },
            { header: 'Trend', accessor: (row) => row.trend || '-' },
            { header: 'Premium/Discount', accessor: (row) => row.premium_discount || '-' },
            { header: 'Actions', accessor: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setViewRecord(row)} className="text-slate-600 hover:text-slate-900 dark:hover:text-white text-sm">View</button>
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
                  {editingId ? 'Edit Market Structure' : 'New Market Structure'}
                </h3>
                <button onClick={() => { setDrawerOpen(false); resetForm(); }} className="text-slate-500">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SectionLabel label="General" />
                <Field label="Date" value={form.date} onChange={set('date')} type="date" />
                <Field label="Pair" value={form.pair} onChange={set('pair')} />
                <Field label="Timeframe" value={form.timeframe} onChange={set('timeframe')} type="select" step="M15,H1,H4,D1,W1" />

                <SectionLabel label="Bias" />
                <Field label="Weekly Bias" value={form.weekly_bias} onChange={set('weekly_bias')} type="select" step="BULLISH,BEARISH,NEUTRAL," />
                <Field label="Daily Bias" value={form.daily_bias} onChange={set('daily_bias')} type="select" step="BULLISH,BEARISH,NEUTRAL," />
                <Field label="H4 Bias" value={form.h4_bias} onChange={set('h4_bias')} type="select" step="BULLISH,BEARISH,NEUTRAL," />

                <SectionLabel label="Market Context" />
                <Field label="Market Phase" value={form.market_phase} onChange={set('market_phase')} />
                <Field label="Trend" value={form.trend} onChange={set('trend')} />
                <Field label="Premium / Discount" value={form.premium_discount} onChange={set('premium_discount')} type="select" step="PREMIUM,DISCOUNT," />

                <SectionLabel label="Liquidity" />
                <Field label="External Liquidity" value={form.external_liquidity} onChange={set('external_liquidity')} />
                <Field label="Internal Liquidity" value={form.internal_liquidity} onChange={set('internal_liquidity')} />
                <Field label="Equal Highs" value={form.equal_highs} onChange={set('equal_highs')} />
                <Field label="Equal Lows" value={form.equal_lows} onChange={set('equal_lows')} />
                <Field label="Buy Side Liquidity" value={form.buy_side_liquidity} onChange={set('buy_side_liquidity')} />
                <Field label="Sell Side Liquidity" value={form.sell_side_liquidity} onChange={set('sell_side_liquidity')} />

                <SectionLabel label="Structure" />
                <Field label="BOS" value={form.bos} onChange={set('bos')} />
                <Field label="MSS" value={form.mss} onChange={set('mss')} />
                <Field label="CHoCH" value={form.choch} onChange={set('choch')} />
                <Field label="Order Block" value={form.order_block} onChange={set('order_block')} />
                <Field label="Breaker" value={form.breaker} onChange={set('breaker')} />
                <Field label="Mitigation" value={form.mitigation} onChange={set('mitigation')} />
                <Field label="FVG" value={form.fvg} onChange={set('fvg')} />
                <Field label="IFVG" value={form.ifvg} onChange={set('ifvg')} />

                <SectionLabel label="Session" />
                <Field label="Asian High" value={form.asian_high} onChange={set('asian_high')} type="number" step="0.00001" />
                <Field label="Asian Low" value={form.asian_low} onChange={set('asian_low')} type="number" step="0.00001" />
                <Field label="London Open" value={form.london_open} onChange={set('london_open')} type="number" step="0.00001" />
                <Field label="New York Open" value={form.newyork_open} onChange={set('newyork_open')} type="number" step="0.00001" />

                <SectionLabel label="Killzone" />
                <Field label="London Killzone" value={form.london_killzone} onChange={set('london_killzone')} />
                <Field label="New York Killzone" value={form.newyork_killzone} onChange={set('newyork_killzone')} />
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
                  disabled={createMs.isPending || updateMs.isPending}
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
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewRecord(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Market Structure Details</h3>
                <button onClick={() => setViewRecord(null)} className="text-slate-500">&times;</button>
              </div>
              {(
                [
                  ['Date', viewRecord.date],
                  ['Pair', viewRecord.pair],
                  ['Timeframe', viewRecord.timeframe],
                  ['Weekly Bias', viewRecord.weekly_bias],
                  ['Daily Bias', viewRecord.daily_bias],
                  ['H4 Bias', viewRecord.h4_bias],
                  ['Market Phase', viewRecord.market_phase],
                  ['Trend', viewRecord.trend],
                  ['Premium/Discount', viewRecord.premium_discount],
                  ['External Liquidity', viewRecord.external_liquidity],
                  ['Internal Liquidity', viewRecord.internal_liquidity],
                  ['Equal Highs', viewRecord.equal_highs],
                  ['Equal Lows', viewRecord.equal_lows],
                  ['Buy Side Liquidity', viewRecord.buy_side_liquidity],
                  ['Sell Side Liquidity', viewRecord.sell_side_liquidity],
                  ['BOS', viewRecord.bos],
                  ['MSS', viewRecord.mss],
                  ['CHoCH', viewRecord.choch],
                  ['Order Block', viewRecord.order_block],
                  ['Breaker', viewRecord.breaker],
                  ['Mitigation', viewRecord.mitigation],
                  ['FVG', viewRecord.fvg],
                  ['IFVG', viewRecord.ifvg],
                  ['Asian High', viewRecord.asian_high],
                  ['Asian Low', viewRecord.asian_low],
                  ['London Open', viewRecord.london_open],
                  ['New York Open', viewRecord.newyork_open],
                  ['London Killzone', viewRecord.london_killzone],
                  ['New York Killzone', viewRecord.newyork_killzone],
                ] as const
              ).map(([label, val]) =>
                val !== undefined && val !== null && val !== '' ? (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-900 dark:text-slate-100">{String(val)}</span>
                  </div>
                ) : null
              )}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewRecord(null)}
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
        title="Delete Market Structure"
        message="Are you sure you want to delete this record?"
        onConfirm={() => { if (deleteId) deleteMs.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

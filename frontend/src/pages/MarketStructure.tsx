import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useMarketStructures, useCreateMarketStructure, useUpdateMarketStructure, useDeleteMarketStructure,
} from '../hooks/useMarketStructures';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, ArrowUp, ArrowDown, Minus, Eye, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MarketStructureRead, MarketStructureCreate, MarketStructureUpdate } from '../types';

type FormData = MarketStructureCreate & MarketStructureUpdate;

const emptyForm: FormData = {
  date: '', pair: '', timeframe: '', weekly_bias: '', daily_bias: '', h4_bias: '',
  market_phase: '', trend: '', premium_discount: '', external_liquidity: '',
  internal_liquidity: '', equal_highs: '', equal_lows: '', buy_side_liquidity: '',
  sell_side_liquidity: '', bos: '', mss: '', choch: '', order_block: '',
  breaker: '', mitigation: '', fvg: '', ifvg: '', asian_high: undefined,
  asian_low: undefined, london_open: undefined, newyork_open: undefined,
  london_killzone: '', newyork_killzone: '',
};

const biasBadge = (bias?: string | null) => {
  if (!bias) return null;
  return (
    <Badge variant={bias === 'BULLISH' ? 'success' : bias === 'BEARISH' ? 'destructive' : 'default'} size="sm">
      {bias === 'BULLISH' ? <ArrowUp className="h-3 w-3 mr-0.5" /> : bias === 'BEARISH' ? <ArrowDown className="h-3 w-3 mr-0.5" /> : null}
      {bias}
    </Badge>
  );
};

const SectionLabel = ({ label }: { label: string }) => (
  <h4 className="col-span-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 border-t border-border first:pt-0 first:border-0">
    {label}
  </h4>
);

function Field({ label, value, onChange, type = 'text', step, options }: {
  label: string; value: string | number | undefined; onChange: (v: string) => void;
  type?: string; step?: string; options?: string[];
}) {
  const id = label.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-medium text-muted-foreground">{label}</label>
      {type === 'select' || options ? (
        <select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">—</option>
          {(options || step?.split(',') || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value ?? ''}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}

export default function MarketStructurePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: records, isLoading, error, refetch } = useMarketStructures(projectId!);
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
      trade_id: ms.trade_id, date: ms.date ?? '', pair: ms.pair ?? '',
      timeframe: ms.timeframe ?? '', weekly_bias: ms.weekly_bias ?? '',
      daily_bias: ms.daily_bias ?? '', h4_bias: ms.h4_bias ?? '',
      market_phase: ms.market_phase ?? '', trend: ms.trend ?? '',
      premium_discount: ms.premium_discount ?? '', external_liquidity: ms.external_liquidity ?? '',
      internal_liquidity: ms.internal_liquidity ?? '', equal_highs: ms.equal_highs ?? '',
      equal_lows: ms.equal_lows ?? '', buy_side_liquidity: ms.buy_side_liquidity ?? '',
      sell_side_liquidity: ms.sell_side_liquidity ?? '', bos: ms.bos ?? '',
      mss: ms.mss ?? '', choch: ms.choch ?? '', order_block: ms.order_block ?? '',
      breaker: ms.breaker ?? '', mitigation: ms.mitigation ?? '', fvg: ms.fvg ?? '',
      ifvg: ms.ifvg ?? '', asian_high: ms.asian_high, asian_low: ms.asian_low,
      london_open: ms.london_open, newyork_open: ms.newyork_open,
      london_killzone: ms.london_killzone ?? '', newyork_killzone: ms.newyork_killzone ?? '',
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
      [field]: numFields.includes(field as any) ? (value === '' ? undefined : parseFloat(value)) : value,
    }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Error loading market structures." onRetry={refetch} />;

  const allFields: [string, string | number | undefined | null][] = [
    ['Date', viewRecord?.date], ['Pair', viewRecord?.pair], ['Timeframe', viewRecord?.timeframe],
    ['Weekly Bias', viewRecord?.weekly_bias], ['Daily Bias', viewRecord?.daily_bias],
    ['H4 Bias', viewRecord?.h4_bias], ['Market Phase', viewRecord?.market_phase],
    ['Trend', viewRecord?.trend], ['Premium/Discount', viewRecord?.premium_discount],
    ['External Liquidity', viewRecord?.external_liquidity], ['Internal Liquidity', viewRecord?.internal_liquidity],
    ['Equal Highs', viewRecord?.equal_highs], ['Equal Lows', viewRecord?.equal_lows],
    ['Buy Side Liquidity', viewRecord?.buy_side_liquidity], ['Sell Side Liquidity', viewRecord?.sell_side_liquidity],
    ['BOS', viewRecord?.bos], ['MSS', viewRecord?.mss], ['CHoCH', viewRecord?.choch],
    ['Order Block', viewRecord?.order_block], ['Breaker', viewRecord?.breaker],
    ['Mitigation', viewRecord?.mitigation], ['FVG', viewRecord?.fvg], ['IFVG', viewRecord?.ifvg],
    ['Asian High', viewRecord?.asian_high], ['Asian Low', viewRecord?.asian_low],
    ['London Open', viewRecord?.london_open], ['New York Open', viewRecord?.newyork_open],
    ['London Killzone', viewRecord?.london_killzone], ['New York Killzone', viewRecord?.newyork_killzone],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Structure"
        description="Record and analyze ICT market structure concepts"
      >
        <Button onClick={openCreate} size="sm" disabled={createMs.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> New Record
        </Button>
      </PageHeader>

      {!records || records.length === 0 ? (
        <EmptyState
          message="No market structure records"
          description="Create your first record to start tracking market structure analysis."
          action={<Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New Record</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-medium uppercase text-muted-foreground">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Pair</th>
                <th className="px-3 py-2.5">TF</th>
                <th className="px-3 py-2.5">Weekly</th>
                <th className="px-3 py-2.5">Phase</th>
                <th className="px-3 py-2.5">Trend</th>
                <th className="px-3 py-2.5">P/D</th>
                <th className="px-3 py-2.5">BOS</th>
                <th className="px-3 py-2.5">MSS</th>
                <th className="px-3 py-2.5">OB</th>
                <th className="px-3 py-2.5">FVG</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 text-foreground whitespace-nowrap">{row.date || '-'}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{row.pair || '-'}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" size="sm">{row.timeframe || '-'}</Badge>
                  </td>
                  <td className="px-3 py-2.5">{biasBadge(row.weekly_bias)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.market_phase || '-'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.trend || '-'}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={row.premium_discount === 'PREMIUM' ? 'warning' : row.premium_discount === 'DISCOUNT' ? 'info' : 'default'} size="sm">
                      {row.premium_discount || '-'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={row.bos ? 'text-success' : 'text-muted-foreground'}>{row.bos || '-'}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.mss || '-'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.order_block || '-'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.fvg || '-'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewRecord(row)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(row.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDrawerOpen(false); resetForm(); }} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-background border-l border-border shadow-xl overflow-y-auto"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingId ? 'Edit Market Structure' : 'New Market Structure'}
                  </h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setDrawerOpen(false); resetForm(); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <SectionLabel label="General" />
                  <Field label="Date" value={form.date} onChange={set('date')} type="date" />
                  <Field label="Pair" value={form.pair} onChange={set('pair')} />
                  <Field label="Timeframe" value={form.timeframe} onChange={set('timeframe')} options={['M15', 'H1', 'H4', 'D1', 'W1']} />

                  <SectionLabel label="Bias" />
                  <Field label="Weekly Bias" value={form.weekly_bias} onChange={set('weekly_bias')} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
                  <Field label="Daily Bias" value={form.daily_bias} onChange={set('daily_bias')} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />
                  <Field label="H4 Bias" value={form.h4_bias} onChange={set('h4_bias')} options={['BULLISH', 'BEARISH', 'NEUTRAL']} />

                  <SectionLabel label="Market Context" />
                  <Field label="Market Phase" value={form.market_phase} onChange={set('market_phase')} />
                  <Field label="Trend" value={form.trend} onChange={set('trend')} />
                  <Field label="Premium / Discount" value={form.premium_discount} onChange={set('premium_discount')} options={['PREMIUM', 'DISCOUNT']} />

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

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => { setDrawerOpen(false); resetForm(); }}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={createMs.isPending || updateMs.isPending}>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Drawer */}
      <AnimatePresence>
        {viewRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewRecord(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-background border-l border-border shadow-xl overflow-y-auto"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Market Structure Details</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setViewRecord(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {allFields.map(([label, val]) =>
                    val !== undefined && val !== null && val !== '' ? (
                      <div key={label} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-medium">{String(val)}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

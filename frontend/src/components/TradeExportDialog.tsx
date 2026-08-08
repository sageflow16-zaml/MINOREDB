import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileSpreadsheet, FileJson, FileText, Printer } from 'lucide-react';
import { Button } from './ui/Button';
import { FormField } from './ui/form-field';
import { useExportTrades } from '../hooks/useTradeImportExport';
import { tradeImportExportService } from '../api/tradeImportExport';
import toast from 'react-hot-toast';

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
  selectedIds?: string[];
  availableStrategies?: Array<{ id: string; name: string }>;
}

export default function TradeExportDialog({ projectId, open, onClose, selectedIds, availableStrategies }: Props) {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json' | 'pdf'>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const exportMutation = useExportTrades(projectId);

  const getParams = () => {
    const params: Record<string, any> = {};
    if (selectedIds?.length) params.ids = selectedIds;
    if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
    if (dateTo) params.date_to = new Date(dateTo).toISOString();
    if (strategyId) params.strategy_id = strategyId;
    if (symbol) params.symbol = symbol;
    if (result) params.result = result;
    if (statusFilter) params.status = statusFilter;
    return params;
  };

  const handleExport = () => {
    const params = getParams();
    if (format === 'pdf') {
      tradeImportExportService.openPdfReport(projectId, params);
      onClose();
      return;
    }
    exportMutation.mutate(
      { format, params },
      {
        onSuccess: () => onClose(),
        onError: () => toast.error('Export failed'),
      },
    );
  };

  const formatIcon = (f: string) => {
    if (f === 'csv') return <FileText className="h-4 w-4" />;
    if (f === 'xlsx') return <FileSpreadsheet className="h-4 w-4" />;
    if (f === 'pdf') return <Printer className="h-4 w-4" />;
    return <FileJson className="h-4 w-4" />;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-[15%] md:left-[30%] md:right-[30%] md:bottom-[15%] z-50 flex flex-col rounded-xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Trades
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Format selection */}
              <div>
                <label className="text-2xs font-medium text-muted-foreground mb-2 block">Format</label>
                <div className="flex gap-2">
                  {(['csv', 'xlsx', 'json', 'pdf'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        format === f
                          ? 'border-primary bg-primary/10 text-primary-text'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {formatIcon(f)}
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {selectedIds && selectedIds.length > 0 && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
                  Exporting {selectedIds.length} selected trade{selectedIds.length > 1 ? 's' : ''}
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Date From" value={dateFrom} onChange={setDateFrom} type="date" />
                <FormField label="Date To" value={dateTo} onChange={setDateTo} type="date" />
                <FormField label="Symbol" value={symbol} onChange={setSymbol} placeholder="e.g. EURUSD" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-2xs font-medium text-muted-foreground">Strategy</label>
                  <select
                    value={strategyId}
                    onChange={(e) => setStrategyId(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">All</option>
                    {(availableStrategies || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <FormField label="Result" value={result} onChange={setResult} options={['', 'WIN', 'LOSS', 'BE']} />
                <FormField label="Status" value={statusFilter} onChange={setStatusFilter} options={['', 'OPEN', 'CLOSED']} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleExport} isLoading={exportMutation.isPending}>
                <Download className="mr-1.5 h-4 w-4" /> Export {format.toUpperCase()}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertTriangle, CheckCircle, FileSpreadsheet, FileJson, FileText, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';
import { useImportPreview, useConfirmImport, useImportHistory } from '../hooks/useTradeImportExport';
import type { ImportPreview, ImportRow } from '../api/types';


interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export default function TradeImportDialog({ projectId, open, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirming' | 'done'>('upload');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewMutation = useImportPreview(projectId);
  const confirmMutation = useConfirmImport(projectId);
  const { data: history } = useImportHistory(projectId);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setStep('upload');
    setResult(null);
  }, []);

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'json'].includes(ext || '')) {
      toast.error('Unsupported format. Use .csv, .xlsx, or .json');
      return;
    }
    setFile(f);
    setStep('preview');
    const res = await previewMutation.mutateAsync(f);
    setPreview(res);
  }, [previewMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleConfirm = async () => {
    if (!preview) return;
    setStep('confirming');
    try {
      const res = await confirmMutation.mutateAsync({
        importId: preview.import_id,
        duplicateStrategy,
      });
      setResult({ imported: res.imported, updated: res.updated, skipped: res.skipped, failed: res.failed });
      setStep('done');
      toast.success(`Imported ${res.imported} trades`);
    } catch {
      setStep('preview');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return 'text-green-500';
    if (s === 'failed') return 'text-red-500';
    return 'text-yellow-500';
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
            className="fixed inset-4 md:inset-auto md:top-[5%] md:left-[10%] md:right-[10%] md:bottom-[5%] z-50 flex flex-col rounded-xl border border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" /> Import Trades
              </h2>
              <Button variant="ghost" size="icon" onClick={() => { reset(); onClose(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {step === 'upload' && (
                <div className="space-y-5">
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop your file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports CSV, Excel (.xlsx), JSON</p>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx,.json"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>

                  {/* Import History */}
                  {history && history.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Recent Imports</h3>
                      <div className="space-y-1.5">
                        {history.slice(0, 5).map((h) => (
                          <div key={h.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              {h.format === 'csv' ? <FileText className="h-3.5 w-3.5 text-muted-foreground" /> :
                               h.format === 'xlsx' ? <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" /> :
                               <FileJson className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="font-medium">{h.filename}</span>
                              <span className={statusColor(h.status)}>{h.status}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {h.imported_count + h.updated_count}/{h.total_rows} · {new Date(h.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'preview' && preview && (
                <div className="space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{preview.total_rows}</div>
                      <div className="text-3xs text-muted-foreground">Total Rows</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-green-500">{preview.valid_rows}</div>
                      <div className="text-3xs text-muted-foreground">Valid</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-yellow-500">{preview.duplicate_rows}</div>
                      <div className="text-3xs text-muted-foreground">Duplicates</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-red-500">{preview.error_rows}</div>
                      <div className="text-3xs text-muted-foreground">Errors</div>
                    </div>
                  </div>

                  {/* Duplicate strategy */}
                  {preview.duplicate_rows > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Duplicate trades detected</p>
                        <div className="flex gap-3 mt-1.5">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="dup"
                              value="skip"
                              checked={duplicateStrategy === 'skip'}
                              onChange={() => setDuplicateStrategy('skip')}
                            />
                            Skip duplicates
                          </label>
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="dup"
                              value="update"
                              checked={duplicateStrategy === 'update'}
                              onChange={() => setDuplicateStrategy('update')}
                            />
                            Update existing
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Symbol</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Direction</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entry</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">SL</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">TP</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Size</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">RR</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">PnL</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 100).map((row: ImportRow) => (
                          <tr
                            key={row.row_number}
                            className={`border-b border-border/50 ${
                              row.errors.length > 0 ? 'bg-red-500/5' :
                              row.is_duplicate ? 'bg-yellow-500/5' : ''
                            }`}
                          >
                            <td className="px-3 py-1.5">{row.row_number}</td>
                            <td className="px-3 py-1.5 font-medium">{row.data?.pair as string || '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.direction as string || '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.entry_price != null ? Number(row.data.entry_price).toFixed(5) : '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.stop_loss != null ? Number(row.data.stop_loss).toFixed(5) : '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.take_profit != null ? Number(row.data.take_profit).toFixed(5) : '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.position_size != null ? Number(row.data.position_size) : '-'}</td>
                            <td className="px-3 py-1.5">{row.data?.rr != null ? Number(row.data.rr).toFixed(2) : '-'}</td>
                            <td className={`px-3 py-1.5 ${(row.data?.pnl as number) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {row.data?.pnl != null ? `$${Number(row.data.pnl).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-1.5">
                              {row.errors.length > 0 ? (
                                <Badge variant="destructive" size="sm" title={row.errors.join('; ')}>Error</Badge>
                              ) : row.is_duplicate ? (
                                <Badge variant="warning" size="sm">Duplicate</Badge>
                              ) : (
                                <Badge variant="success" size="sm">OK</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.rows.length > 100 && (
                      <p className="text-center text-3xs text-muted-foreground py-2">
                        Showing first 100 of {preview.rows.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 'confirming' && (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Importing trades...</p>
                  {confirmMutation.isPending && (
                    <div className="w-64 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary animate-pulse" style={{ width: '60%' }} />
                    </div>
                  )}
                </div>
              )}

              {step === 'done' && result && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="text-lg font-semibold">Import Complete</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-green-500">{result.imported}</div>
                      <div className="text-3xs text-muted-foreground">Imported</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-blue-500">{result.updated}</div>
                      <div className="text-3xs text-muted-foreground">Updated</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-yellow-500">{result.skipped}</div>
                      <div className="text-3xs text-muted-foreground">Skipped</div>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <div className="text-lg font-bold text-red-500">{result.failed}</div>
                      <div className="text-3xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={() => { reset(); }}>
                      <Upload className="mr-1.5 h-4 w-4" /> Import Another
                    </Button>
                    <Button onClick={() => { reset(); onClose(); }}>
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'preview' && preview && (
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
                <Button variant="outline" onClick={() => { reset(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  isLoading={confirmMutation.isPending}
                  disabled={preview.valid_rows === 0 && preview.duplicate_rows === 0}
                >
                  <Download className="mr-1.5 h-4 w-4" /> Import {preview.valid_rows + preview.duplicate_rows} Trades
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

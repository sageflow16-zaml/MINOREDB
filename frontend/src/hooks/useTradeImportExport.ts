import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeImportExportService } from '../api/tradeImportExport';
import type { ImportPreview, ImportResult, ImportHistoryItem } from '../api/types';
import toast from 'react-hot-toast';

export function useImportPreview(projectId: string) {
  return useMutation<ImportPreview, Error, File>({
    mutationFn: (file: File) => tradeImportExportService.previewImport(projectId, file),
    onError: (err: Error) => toast.error(err.message || 'Failed to parse import file'),
  });
}

export function useConfirmImport(projectId: string) {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, { importId: string; duplicateStrategy: string }>({
    mutationFn: ({ importId, duplicateStrategy }) =>
      tradeImportExportService.confirmImport(projectId, importId, duplicateStrategy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades', projectId] });
      qc.invalidateQueries({ queryKey: ['import-history', projectId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Import failed'),
  });
}

export function useExportTrades(projectId: string) {
  return useMutation<Blob, Error, { format: string; params?: Record<string, unknown> }>({
    mutationFn: ({ format, params }) =>
      tradeImportExportService.exportTrades(projectId, format, params as any),
    onSuccess: (blob, vars) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades_export.${vars.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${vars.format.toUpperCase()} file`);
    },
    onError: (err: Error) => toast.error(err.message || 'Export failed'),
  });
}

export function useImportHistory(projectId: string) {
  return useQuery<ImportHistoryItem[]>({
    queryKey: ['import-history', projectId],
    queryFn: () => tradeImportExportService.importHistory(projectId),
    enabled: !!projectId,
  });
}

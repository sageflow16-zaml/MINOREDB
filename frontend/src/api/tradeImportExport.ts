import { supabase } from '../lib/supabase';
import type { ImportPreview, ImportResult, ImportHistoryItem } from './types';

export const tradeImportExportService = {
  previewImport: async (_projectId: string, _file: File): Promise<ImportPreview> => {
    throw new Error('Import preview requires Edge Function deployment');
  },

  confirmImport: async (_projectId: string, _importId: string, _duplicateStrategy: string = 'skip'): Promise<ImportResult> => {
    throw new Error('Import confirmation requires Edge Function deployment');
  },

  exportTrades: async (projectId: string, _format: string, _params?: Record<string, any>): Promise<Blob> => {
    const { data, error } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null);
    if (error) throw error;
    const csv = ['pair,direction,result,pnl,rr,entry_price,exit_price,open_time,close_time,notes',
      ...(data ?? []).map((t: any) =>
        `${t.pair || ''},${t.direction || ''},${t.result || ''},${t.pnl || 0},${t.rr || 0},${t.entry_price || 0},${t.exit_price || 0},${t.open_time || ''},${t.close_time || ''},"${(t.notes || '').replace(/"/g, '""')}"`
      )].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  },

  importHistory: async (projectId: string): Promise<ImportHistoryItem[]> => {
    const { data, error } = await supabase.from('trade_import').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ImportHistoryItem[];
  },
};

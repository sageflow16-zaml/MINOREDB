import api from '../services/api';
import type { AxiosResponse } from 'axios';
import type { ImportPreview, ImportResult, ImportHistoryItem } from './types';

const base = (projectId: string) => `/projects/${projectId}/trades`;

export const tradeImportExportService = {
  previewImport: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ImportPreview>(`${base(projectId)}/import`, formData).then((r: AxiosResponse<ImportPreview>) => r.data);
  },

  confirmImport: (projectId: string, importId: string, duplicateStrategy: string = 'skip') =>
    api.post<ImportResult>(`${base(projectId)}/import/${importId}/confirm`, {
      duplicate_strategy: duplicateStrategy,
    }).then((r: AxiosResponse<ImportResult>) => r.data),

  exportTrades: (
    projectId: string,
    format: string,
    params?: {
      ids?: string[];
      date_from?: string;
      date_to?: string;
      strategy_id?: string;
      symbol?: string;
      tags?: string[];
      broker?: string;
      result?: string;
      status?: string;
    },
  ) => {
    const query = new URLSearchParams();
    query.set('fmt', format);
    if (params?.ids?.length) query.set('ids', params.ids.join(','));
    if (params?.date_from) query.set('date_from', params.date_from);
    if (params?.date_to) query.set('date_to', params.date_to);
    if (params?.strategy_id) query.set('strategy_id', params.strategy_id);
    if (params?.symbol) query.set('symbol', params.symbol);
    if (params?.tags?.length) query.set('tags', params.tags.join(','));
    if (params?.broker) query.set('broker', params.broker);
    if (params?.result) query.set('result', params.result);
    if (params?.status) query.set('status', params.status);
    return api.get(`${base(projectId)}/export?${query.toString()}`, { responseType: 'blob' as const }).then((r: AxiosResponse) => r.data);
  },

  importHistory: (projectId: string) =>
    api.get<ImportHistoryItem[]>(`${base(projectId)}/import-history`).then((r: AxiosResponse<ImportHistoryItem[]>) => r.data),
};

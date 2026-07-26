import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { CollectorStatus, CollectorLog, CollectorRunResult } from './types';

export const collectorService = {
  list: async (projectId: string): Promise<CollectorStatus[]> => {
    const { data, error } = await supabase.from('collector_status').select('*').eq('project_id', projectId);
    if (error) throw error;
    if (!data || data.length === 0) {
      const defaults = ['market_news', 'economic_calendar', 'market_data'];
      for (const name of defaults) {
        await supabase.from('collector_status').insert({ project_id: projectId, collector_name: name, enabled: false, status: 'idle' }).maybeSingle();
      }
      const { data: d2 } = await supabase.from('collector_status').select('*').eq('project_id', projectId);
      return (d2 ?? []) as CollectorStatus[];
    }
    return data as CollectorStatus[];
  },

  status: async (projectId: string): Promise<CollectorStatus[]> => {
    const { data, error } = await supabase.from('collector_status').select('*').eq('project_id', projectId);
    if (error) throw error;
    return (data ?? []) as CollectorStatus[];
  },

  run: (projectId: string, name: string): Promise<CollectorRunResult> =>
    callEdgeFunction('collector', { operation: 'run', project_id: projectId, data: { collector_name: name } }),

  toggle: async (projectId: string, name: string, enabled: boolean): Promise<CollectorStatus> => {
    const { data, error } = await supabase.from('collector_status').update({ enabled }).eq('project_id', projectId).eq('collector_name', name).select().single();
    if (error) throw error;
    return data as CollectorStatus;
  },

  logs: async (projectId: string, limit = 50): Promise<CollectorLog[]> => {
    const { data, error } = await supabase.from('collector_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as CollectorLog[];
  },
};

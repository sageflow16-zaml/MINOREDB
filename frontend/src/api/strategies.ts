import { supabase } from '../lib/supabase';
import type { StrategyRead, StrategyCreate, StrategyUpdate, StrategyVersionRead, StrategyVersionCreate, StrategyAnalytics } from './types';

export const strategyService = {
  list: async (projectId: string, params?: { skip?: number; limit?: number; status?: string; category?: string; market?: string; search?: string; tag?: string }): Promise<StrategyRead[]> => {
    let query = supabase.from('strategy').select('*').eq('project_id', projectId).is('deleted_at', null);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.market) query = query.eq('market', params.market);
    if (params?.search) query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    query = query.order('created_at', { ascending: false });
    if (params?.limit) query = query.range(params.skip ?? 0, (params.skip ?? 0) + params.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as StrategyRead[];
  },

  get: async (projectId: string, id: string): Promise<StrategyRead> => {
    const { data, error } = await supabase.from('strategy').select('*').eq('id', id).eq('project_id', projectId).is('deleted_at', null).single();
    if (error) throw error;
    return data as StrategyRead;
  },

  create: async (projectId: string, data: StrategyCreate): Promise<StrategyRead> => {
    const { data: row, error } = await supabase.from('strategy').insert({ ...data, project_id: projectId, status: data.status || 'draft', version: 1 }).select().single();
    if (error) throw error;
    return row as StrategyRead;
  },

  update: async (projectId: string, id: string, data: StrategyUpdate): Promise<StrategyRead> => {
    const { data: row, error } = await supabase.from('strategy').update(data).eq('id', id).eq('project_id', projectId).select().single();
    if (error) throw error;
    return row as StrategyRead;
  },

  remove: async (projectId: string, id: string): Promise<void> => {
    const { error } = await supabase.from('strategy').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('project_id', projectId);
    if (error) throw error;
  },

  duplicate: async (projectId: string, id: string): Promise<StrategyRead> => {
    const { data: original } = await supabase.from('strategy').select('*').eq('id', id).single();
    if (!original) throw new Error('Strategy not found');
    const { data: row, error } = await supabase.from('strategy').insert({
      project_id: projectId, name: `${original.name} (Copy)`, description: original.description,
      category: original.category, market: original.market, status: 'draft', version: 1,
    }).select().single();
    if (error) throw error;
    return row as StrategyRead;
  },

  analytics: async (_projectId: string, _id: string): Promise<StrategyAnalytics> => {
    return { total_trades: 0, win_rate: 0, avg_rr: 0, total_pnl: 0 } as StrategyAnalytics;
  },

  versions: async (projectId: string, id: string): Promise<StrategyVersionRead[]> => {
    const { data, error } = await supabase.from('strategy_version').select('*').eq('strategy_id', id).eq('project_id', projectId).order('version', { ascending: false });
    if (error) throw error;
    return (data ?? []) as StrategyVersionRead[];
  },

  createVersion: async (projectId: string, id: string, data: StrategyVersionCreate): Promise<StrategyVersionRead> => {
    const { data: row, error } = await supabase.from('strategy_version').insert({ ...data, strategy_id: id, project_id: projectId }).select().single();
    if (error) throw error;
    return row as StrategyVersionRead;
  },

  compareVersions: async (projectId: string, id: string, versionA: string, versionB: string): Promise<{ version_a: unknown; version_b: unknown }> => {
    const { data: a } = await supabase.from('strategy_version').select('snapshot').eq('strategy_id', id).eq('version', parseInt(versionA)).eq('project_id', projectId).maybeSingle();
    const { data: b } = await supabase.from('strategy_version').select('snapshot').eq('strategy_id', id).eq('version', parseInt(versionB)).eq('project_id', projectId).maybeSingle();
    return { version_a: a?.snapshot, version_b: b?.snapshot };
  },
};

import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { MarketEvent, WebhookLog, WebhookResponse, WebhookStats } from './types';

function randomSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const tradingviewService = {
  events: async (projectId: string, params: { limit?: number; symbol?: string; timeframe?: string; event_type?: string } = {}): Promise<MarketEvent[]> => {
    let query = supabase.from('market_event').select('*').eq('project_id', projectId);
    if (params.symbol) query = query.eq('symbol', params.symbol);
    if (params.timeframe) query = query.eq('timeframe', params.timeframe);
    if (params.event_type) query = query.eq('event_type', params.event_type);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(params.limit ?? 50);
    if (error) throw error;
    return (data ?? []) as MarketEvent[];
  },

  event: async (id: string): Promise<MarketEvent> => {
    const { data, error } = await supabase.from('market_event').select('*').eq('id', id).single();
    if (error) throw error;
    return data as MarketEvent;
  },

  logs: async (projectId: string, limit: number = 100): Promise<WebhookLog[]> => {
    const { data, error } = await supabase.from('webhook_log').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as WebhookLog[];
  },

  stats: async (projectId: string): Promise<WebhookStats> => {
    const [{ data: logs }, { data: events }] = await Promise.all([
      supabase.from('webhook_log').select('*').eq('project_id', projectId),
      supabase.from('market_event').select('*').eq('project_id', projectId),
    ]);
    if (logs === null) throw new Error('Failed to load webhook logs');
    const rows = (logs ?? []) as WebhookLog[];
    const evs = (events ?? []) as MarketEvent[];
    const events_by_symbol: Record<string, number> = {};
    const events_by_type: Record<string, number> = {};
    const events_by_timeframe: Record<string, number> = {};
    for (const r of rows) {
      if (r.event_type) events_by_type[r.event_type] = (events_by_type[r.event_type] ?? 0) + 1;
    }
    for (const e of evs) {
      if (e.symbol) events_by_symbol[e.symbol] = (events_by_symbol[e.symbol] ?? 0) + 1;
      if (e.event_type) events_by_type[e.event_type] = (events_by_type[e.event_type] ?? 0) + 1;
      if (e.timeframe) events_by_timeframe[e.timeframe] = (events_by_timeframe[e.timeframe] ?? 0) + 1;
    }
    return { total_events: evs.length, total_logs: rows.length, events_by_symbol, events_by_type, events_by_timeframe } as WebhookStats;
  },

  getWebhookSecret: async (projectId: string): Promise<string> => {
    const { data, error } = await supabase.from('webhook_config').select('secret').eq('project_id', projectId).maybeSingle();
    if (error) throw error;
    if (data?.secret) return data.secret as string;
    const secret = randomSecret();
    const { error: insertErr } = await supabase.from('webhook_config').upsert({ project_id: projectId, secret }, { onConflict: 'project_id' });
    if (insertErr) throw insertErr;
    return secret;
  },

  rotateWebhookSecret: async (projectId: string): Promise<string> => {
    const secret = randomSecret();
    const { error } = await supabase.from('webhook_config').upsert(
      { project_id: projectId, secret, updated_at: new Date().toISOString() },
      { onConflict: 'project_id' },
    );
    if (error) throw error;
    return secret;
  },

  webhook: async (payload: Record<string, unknown>): Promise<WebhookResponse> =>
    callEdgeFunction('tv-webhook', { operation: 'webhook', data: { payload } }),
};

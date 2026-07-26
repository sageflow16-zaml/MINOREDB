import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { MarketEvent, WebhookLog, WebhookResponse, WebhookStats } from './types';

export const tradingviewService = {
  events: async (params: { limit?: number; symbol?: string; timeframe?: string; event_type?: string } = {}): Promise<MarketEvent[]> => {
    let query = supabase.from('market_event').select('*');
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

  logs: async (limit: number = 100): Promise<WebhookLog[]> => {
    const { data, error } = await supabase.from('webhook_log').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as WebhookLog[];
  },

  stats: async (): Promise<WebhookStats> => {
    const { count: total, error } = await supabase.from('webhook_log').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return { total_events: total ?? 0 } as WebhookStats;
  },

  webhook: async (payload: Record<string, unknown>): Promise<WebhookResponse> =>
    callEdgeFunction('tv-webhook', { operation: 'webhook', data: { payload } }),
};

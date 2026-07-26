import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { MacroEvent, MarketSnapshot, MacroRefreshResponse, MarketState } from './types';

export const macroService = {
  snapshot: async (): Promise<MarketSnapshot | null> => {
    const { data, error } = await supabase.from('market_snapshot').select('*').order('snapshot_time', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as MarketSnapshot | null;
  },

  events: async (limit: number = 50, importance?: string): Promise<MacroEvent[]> => {
    let query = supabase.from('macro_event').select('*').order('event_date', { ascending: false }).limit(limit);
    if (importance) query = query.eq('importance', parseInt(importance));
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MacroEvent[];
  },

  calendar: async (): Promise<MacroEvent[]> => {
    const { data, error } = await supabase.from('macro_event').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(50);
    if (error) throw error;
    return (data ?? []) as MacroEvent[];
  },

  state: async (): Promise<MarketState> => {
    const { data: snap } = await supabase.from('market_snapshot').select('*').order('snapshot_time', { ascending: false }).limit(1).maybeSingle();
    const { data: events } = await supabase.from('macro_event').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(10);
    return { snapshot: snap as MarketSnapshot | null, events: (events ?? []) as MacroEvent[], events_today: [], high_impact_events: [], recent_releases: [], upcoming_events: [] } as MarketState;
  },

  refresh: async (): Promise<MacroRefreshResponse> =>
    callEdgeFunction('collector', { operation: 'run', data: { collector_name: 'economic_calendar' } }),
};

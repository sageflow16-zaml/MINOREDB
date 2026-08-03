import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { MacroEvent, MarketSnapshot, MacroRefreshResponse, MarketState } from './types';

export const macroService = {
  snapshot: async (projectId: string): Promise<MarketSnapshot | null> => {
    const { data, error } = await supabase.from('market_snapshot').select('*').eq('project_id', projectId).order('snapshot_time', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as MarketSnapshot | null;
  },

  events: async (projectId: string, limit: number = 50, importance?: string): Promise<MacroEvent[]> => {
    let query = supabase.from('macro_event').select('*').eq('project_id', projectId).order('event_date', { ascending: false }).limit(limit);
    if (importance) query = query.eq('importance', parseInt(importance));
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MacroEvent[];
  },

  calendar: async (projectId: string): Promise<MacroEvent[]> => {
    const { data, error } = await supabase.from('macro_event').select('*').eq('project_id', projectId).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(50);
    if (error) throw error;
    return (data ?? []) as MacroEvent[];
  },

  state: async (projectId: string): Promise<MarketState> => {
    const { data: events } = await supabase.from('macro_event').select('*').eq('project_id', projectId).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(50);
    const allEvents = (events ?? []) as any[];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayEvents: MacroEvent[] = allEvents.filter((e: any) => (e.event_date || '').startsWith(todayStr));
    const highImpact: MacroEvent[] = allEvents.filter((e: any) => typeof e.importance === 'number' && e.importance >= 4);
    const upcoming: MacroEvent[] = allEvents.filter((e: any) => (e.event_date || '') > todayStr);
    return {
      snapshot: null,
      events: allEvents,
      events_today: todayEvents,
      high_impact_events: highImpact,
      upcoming_events: upcoming,
      recent_releases: [],
    } as unknown as MarketState;
  },

  refresh: async (projectId: string): Promise<MacroRefreshResponse> =>
    callEdgeFunction('collector', { operation: 'run', project_id: projectId, data: { collector_name: 'economic_calendar' } }),
};

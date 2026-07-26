import { supabase } from '../lib/supabase';

export const calendarService = {
  list: async (params: { startDate?: string; endDate?: string; impact?: string; limit?: number; offset?: number }) => {
    let query = supabase.from('news_event').select('*', { count: 'exact' }).order('event_time', { ascending: true });
    if (params.startDate) query = query.gte('event_time', params.startDate);
    if (params.endDate) query = query.lte('event_time', params.endDate);
    if (params.impact) query = query.eq('impact', params.impact);
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 100;
    query = query.range(offset, offset + limit - 1).limit(limit);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  getWeek: async (startDate: string, endDate: string, offset = 0, limit = 100) => {
    const { data, error } = await supabase.from('news_event').select('*').gte('event_time', startDate).lte('event_time', endDate).order('event_time', { ascending: true }).range(offset, offset + limit - 1).limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  getImpacts: async () => {
    const { data, error } = await supabase.from('news_event').select('impact', { count: 'exact', head: true });
    if (error) throw error;
    return [...new Set((data ?? []).map(r => r.impact))];
  },
};

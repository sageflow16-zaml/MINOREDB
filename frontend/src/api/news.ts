import { supabase } from '../lib/supabase';

export const newsService = {
  list: async (startDate?: string, endDate?: string, limit = 50, offset = 0) => {
    let query = supabase.from('news_event').select('*').order('event_time', { ascending: false }).range(offset, offset + limit - 1).limit(limit);
    if (startDate) query = query.gte('event_time', startDate);
    if (endDate) query = query.lte('event_time', endDate);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase.from('news_event').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  getImpact: async (impact: string, startDate?: string, endDate?: string, limit = 50) => {
    let query = supabase.from('news_event').select('*').eq('impact', impact).order('event_time', { ascending: false }).limit(limit);
    if (startDate) query = query.gte('event_time', startDate);
    if (endDate) query = query.lte('event_time', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  getByCurrency: async (currency: string, startDate?: string, endDate?: string, limit = 50) => {
    let query = supabase.from('news_event').select('*').or(`currency.ilike.%${currency}%,description.ilike.%${currency}%`).order('event_time', { ascending: false }).limit(limit);
    if (startDate) query = query.gte('event_time', startDate);
    if (endDate) query = query.lte('event_time', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  calendar: async (date: string, limit = 100, offset = 0) => {
    const { data, error } = await supabase.from('news_event').select('*').gte('event_time', date).lt('event_time', new Date(new Date(date).getTime() + 86400000).toISOString()).order('event_time', { ascending: true }).range(offset, offset + limit - 1).limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  getUpcoming: async (limit = 20) => {
    const { data, error } = await supabase.from('news_event').select('*').gte('event_time', new Date().toISOString()).order('event_time', { ascending: true }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  getRecent: async (limit = 20) => {
    const { data, error } = await supabase.from('news_event').select('*').lt('event_time', new Date().toISOString()).order('event_time', { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};

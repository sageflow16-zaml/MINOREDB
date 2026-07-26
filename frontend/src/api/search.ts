import { supabase } from '../lib/supabase';
import type { SearchResult } from './types';

export const searchService = {
  query: async (projectId: string, q: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase.rpc('search_knowledge', { p_project_id: projectId, p_query: q });
    if (error) throw error;
    return (data ?? []) as unknown as SearchResult[];
  },
};

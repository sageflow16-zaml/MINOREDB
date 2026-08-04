import { supabase } from '../lib/supabase';
import { callEdgeFunction } from '../lib/edgeFunctions';
import type { SearchResult } from './types';

export const searchService = {
  query: async (projectId: string, q: string, typeFilter?: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];

    const { data: knowledgeResults, error } = await supabase.rpc('search_knowledge', { p_project_id: projectId, p_query: q });
    if (!error && knowledgeResults) {
      const resultsArr = (knowledgeResults as any[]).map((r: any) => ({
        ...r,
        entity_type: r.entity_type ?? r.type,
      }));
      const filtered = typeFilter
        ? resultsArr.filter((r) => r.entity_type === typeFilter)
        : resultsArr;
      results.push(...(filtered as unknown as SearchResult[]));
    }

    const { data: trades } = await supabase
      .from('trade')
      .select('id, pair, direction, result, pnl, rr, status, notes, created_at')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .or(`pair.ilike.%${q}%,notes.ilike.%${q}%`)
      .limit(20);
    if (trades) {
      const mapped = trades.map((t: any) => ({
        id: t.id,
        entity_type: 'trade',
        text: `${t.pair} ${t.direction} ${t.result || ''} - ${t.notes?.substring(0, 100) || ''}`,
        created_at: t.created_at,
        pair: t.pair,
        result: t.result,
        pnl: t.pnl,
        rr: t.rr,
        status: t.status,
      }));
      const filtered = typeFilter && typeFilter !== 'trade' ? [] : mapped;
      results.push(...(filtered as unknown as SearchResult[]));
    }

    try {
      const semanticResults = await callEdgeFunction('ai', {
        operation: 'semantic-search',
        project_id: projectId,
        data: { query: q, match_count: 10 },
      });
      if (semanticResults?.results?.length > 0) {
        for (const r of semanticResults.results) {
          if (!results.some((ex: any) => ex.id === r.id && ex.entity_type === 'document_chunk')) {
            results.push({
              id: r.id,
              entity_type: 'document_chunk',
              text: r.content?.substring(0, 300) || '',
              filename: r.filename,
              page: r.page,
              similarity: r.similarity,
              created_at: r.created_at,
            } as unknown as SearchResult);
          }
        }
      }
    } catch { /* semantic search optional */ }

    return results.sort((a: any, b: any) => {
      const scoreA = a.similarity || a.score || 0;
      const scoreB = b.similarity || b.score || 0;
      return scoreB - scoreA;
    });
  },
};

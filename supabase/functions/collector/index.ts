import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const alphavantageKey = Deno.env.get('ALPHAVANTAGE_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data: payload } = await req.json() as any;
    const collectorName = payload?.collector_name;

    switch (operation) {
      case 'run': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const results: any = { collected: 0, errors: 0 };

        if (collectorName === 'market_news' && alphavantageKey) {
          try {
            const resp = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${alphavantageKey}&limit=10`);
            const news = await resp.json();
            if (news.feed) {
              for (const item of news.feed) {
                await supabase.from('macro_event').insert({
                  event_date: item.time_published,
                  title: item.title,
                  category: 'news',
                  source: 'alphavantage',
                });
                results.collected++;
              }
            }
          } catch { results.errors++; }
        }

        if (collectorName === 'economic_calendar') {
          try {
            const resp = await fetch(`https://www.alphavantage.co/query?function=ECONOMIC_CALENDAR&apikey=${alphavantageKey}`);
            const cal = await resp.json();
            if (cal.entries) {
              for (const entry of cal.entries) {
                await supabase.from('macro_event').insert({
                  event_date: entry.date,
                  title: entry.event,
                  country: entry.country,
                  importance: entry.importance || 1,
                  source: 'alphavantage',
                });
                results.collected++;
              }
            }
          } catch { results.errors++; }
        }

        await supabase.from('collector_status').upsert({
          project_id,
          collector_name: collectorName,
          status: 'completed',
          last_run_at: new Date().toISOString(),
          records_collected: results.collected,
        }, { onConflict: 'project_id,collector_name' });

        return successResponse(results);
      }

      case 'toggle': {
        if (!collectorName) return errorResponse('Missing collector_name');
        const { data: status } = await supabase.from('collector_status')
          .select('enabled').eq('project_id', project_id).eq('collector_name', collectorName).single();
        await supabase.from('collector_status').update({
          enabled: !status?.enabled,
        }).eq('project_id', project_id).eq('collector_name', collectorName);
        return successResponse({ toggled: !status?.enabled });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

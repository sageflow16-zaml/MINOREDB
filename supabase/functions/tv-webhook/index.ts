import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data } = await req.json() as any;

    if (operation === 'ingest') {
      const { symbol, timeframe, event_type, price, direction, raw_data } = data || {};
      const { data: event } = await supabase.from('market_event').insert({
        project_id,
        event_type: event_type || 'alert',
        symbol,
        timeframe,
        price,
        direction,
        raw_data: raw_data || {},
      }).select().single();
      return successResponse(event);
    }

    if (operation === 'webhook') {
      const payload = data?.payload || {};
      const { data: log } = await supabase.from('webhook_log').insert({
        project_id,
        source: 'tradingview',
        event_type: payload.event_type || 'unknown',
        status: 'received',
        payload,
      }).select().single();
      return successResponse({ received: true, id: log?.id });
    }

    return successResponse({ status: 'ok' });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

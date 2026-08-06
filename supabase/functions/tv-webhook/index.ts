import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger } from '../_shared/logging.ts';

const logger = new Logger({ function: 'tv-webhook' });

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function parseWebhookPayload(raw: string): Record<string, unknown> {
  if (!raw) return {};
  if (!raw.includes('=') || raw.includes(' ')) {
    return { message: raw };
  }
  try {
    return Object.fromEntries(new URLSearchParams(raw));
  } catch {
    return { message: raw };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  let projectId = '';
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    const isUser = !authErr && !!user;

    // TradingView posts the alert body to the URL without headers or JSON.
    // Auth happens via ?secret=<per-project secret> (stored in webhook_config).
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret') || '';
    const headerSecret = req.headers.get('x-webhook-secret') || '';

    const raw = await req.text();
    let body: any = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }

    const operation = body.operation || 'webhook';
    projectId = body.project_id || url.searchParams.get('project_id') || '';
    const reqLogger = logger.with({ project_id: projectId || undefined, operation });

    if (operation === 'ingest') {
      if (!isUser) return errorResponse('Unauthorized', 401);
      const { symbol, timeframe, event_type, price, direction, raw_data } = body.data || {};
      const { data: event, error } = await supabase.from('market_event').insert({
        project_id: projectId,
        event_type: event_type || 'alert',
        symbol,
        timeframe,
        price,
        direction,
        raw_data: raw_data || {},
      }).select().single();
      if (error) return errorResponse(error.message, 400);
      reqLogger.info('market event ingested', { event_type: event_type || 'alert', symbol, duration_ms: Date.now() - startedAt });
      return successResponse(event);
    }

    // webhook op: authenticated user (frontend test) OR valid per-project secret (TradingView)
    if (!isUser) {
      if (!projectId) return errorResponse('Missing project_id (add ?project_id=<project id> to the webhook URL)', 400);
      const secretClient = getServiceClient();
      const { data: config } = await secretClient.from('webhook_config')
        .select('secret').eq('project_id', projectId).maybeSingle();
      if (!config?.secret) return errorResponse('Webhook secret not configured. Open the TradingView page in the app to generate one.', 503);
      if (config.secret !== querySecret && config.secret !== headerSecret) {
        reqLogger.warn('webhook rejected: invalid secret', { duration_ms: Date.now() - startedAt });
        return errorResponse('Unauthorized', 401);
      }
    }

    if (!projectId) return errorResponse('Missing project_id', 400);
    const payload = body.data?.payload ?? parseWebhookPayload(raw);
    const client = isUser ? supabase : getServiceClient();
    const { data: log, error } = await client.from('webhook_log').insert({
      project_id: projectId,
      source: 'tradingview',
      event_type: payload.event_type || body.event_type || 'unknown',
      status: 'received',
      payload,
    }).select().single();
    if (error) return errorResponse(error.message, 400);
    reqLogger.info('webhook received', { event_type: payload.event_type || body.event_type || 'unknown', log_id: log?.id, duration_ms: Date.now() - startedAt });
    return successResponse({ received: true, id: log?.id });
  } catch (err) {
    logger.error('tv-webhook failed', { project_id: projectId || undefined, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

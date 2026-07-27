import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import type { EdgeFunctionRequest } from '../_shared/types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { operation } = await req.json() as EdgeFunctionRequest;

    switch (operation) {
      case 'fetch-candles':
        return successResponse({ message: 'replay-data:fetch-candles not yet implemented' });
      case 'next-candle':
      case 'prev-candle':
      case 'jump-to-candle':
        return successResponse({ session: null, candle: null, candles_visible: [], trades: [], bookmarks: [], annotations: [], timeline_events: [], review: null, mistakes: [], screenshots: [] });
      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

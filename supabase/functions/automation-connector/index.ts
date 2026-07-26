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
      case 'test':
      case 'sync':
        return successResponse({ message: `automation-connector:${operation} not yet implemented` });
      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

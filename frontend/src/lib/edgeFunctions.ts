import { supabase } from './supabase';
import { reportError, breadcrumb } from './observability';

type EdgeFunctionName = 'ai' | 'context' | 'tv-webhook' | 'collector' | 'broker-sync' | 'automation-connector' | 'obsidian-sync' | 'replay-data' | 'mt5' | 'quant';

interface EdgeFunctionRequest {
  operation: string;
  project_id?: string;
  data?: Record<string, unknown>;
}

/**
 * Invokes a Supabase edge function with observability: every call records
 * a breadcrumb (operation, success/failure); failures additionally report
 * a Sentry event tagged with the function and operation. Latency is
 * measured per call. Never logs request bodies, tokens or project data.
 */
export async function callEdgeFunction<T = any>(
  functionName: EdgeFunctionName,
  request: EdgeFunctionRequest
): Promise<T> {
  const startedAt = performance.now();
  try {
    const { data, error, response } = await supabase.functions.invoke(functionName, {
      body: request,
    });
    const durationMs = Math.round(performance.now() - startedAt);
    if (error) {
      const res = response || (error as any).context;
      breadcrumb('api', `${functionName} failed`, {
        operation: request.operation,
        durationMs,
      });
      reportError(error, {
        category: 'edge-function',
        operation: `${functionName}.${request.operation}`,
        route: typeof window !== 'undefined' ? window.location.pathname : '',
        details: { durationMs },
      });
      if (res && res.headers?.get?.('content-type')?.includes('json')) {
        try {
          const body = await res.clone().json();
          throw new Error(body.error || body.message || error.message);
        } catch (e) {
          if (e instanceof Error) throw e;
        }
      }
      throw error;
    }
    breadcrumb('edge', `${functionName} OK`, {
      operation: request.operation,
      durationMs,
    });
    return (data as any)?.data ?? data;
  } catch (err) {
    if (err instanceof Error && err.message === 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables') {
      // Client misconfiguration — report as config error, don't leak URIs.
      reportError(err, { category: 'config', component: 'callEdgeFunction' });
    }
    throw err;
  }
}

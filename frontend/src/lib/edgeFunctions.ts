import { supabase } from './supabase';

type EdgeFunctionName = 'ai' | 'context' | 'tv-webhook' | 'collector' | 'broker-sync' | 'automation-connector' | 'obsidian-sync' | 'replay-data' | 'mt5';

interface EdgeFunctionRequest {
  operation: string;
  project_id?: string;
  data?: Record<string, unknown>;
}

export async function callEdgeFunction<T = any>(
  functionName: EdgeFunctionName,
  request: EdgeFunctionRequest
): Promise<T> {
  const { data, error, response } = await supabase.functions.invoke(functionName, {
    body: request,
  });
  if (error) {
    if (response && response.headers.get('content-type')?.includes('json')) {
      try {
        const body = await response.clone().json();
        throw new Error(body.error || body.message || error.message);
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    throw error;
  }
  return (data as any)?.data ?? data;
}

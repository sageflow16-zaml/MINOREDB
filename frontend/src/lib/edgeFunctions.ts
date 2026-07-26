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
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: request,
  });
  if (error) throw error;
  return (data as any)?.data ?? data;
}

import { callAI, isAiError } from './index.ts';

const TOOLS = [
  { name: 'get_trades', description: 'List recent trades with filters (pair, result, limit).', parameters: { type: 'object', properties: { pair: { type: 'string' }, result: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'get_trade_stats', description: 'Summarize performance statistics (win rate, PnL, avg R:R, drawdown).', parameters: { type: 'object', properties: {} } },
  { name: 'search_knowledge', description: 'Search knowledge base (claims, concepts, sources) by keyword.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'search_chunks', description: 'Search document chunks by keyword.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'get_memories', description: 'Get stored AI memories.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'get_workflows', description: 'List AI workflows.', parameters: { type: 'object', properties: {} } },
  { name: 'get_context', description: 'Build current trading context snapshot (profile, recent trades, patterns).', parameters: { type: 'object', properties: {} } },
];

export async function listCopilotTools() {
  return TOOLS;
}

export async function executeCopilotTool(supabase: any, projectId: string, toolName: string, params: Record<string, any> = {}) {
  switch (toolName) {
    case 'get_trades': {
      let q = supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null);
      if (params.pair) q = q.eq('pair', params.pair);
      if (params.result) q = q.eq('result', params.result);
      const { data } = await q.order('created_at', { ascending: false }).limit(Number(params.limit) || 20);
      return (data || []).map((t: any) => ({ id: t.id, pair: t.pair, direction: t.direction, result: t.result, pnl: t.pnl, rr: t.rr, status: t.status, created_at: t.created_at }));
    }
    case 'get_trade_stats': {
      const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(1000);
      const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null);
      const wins = closed.filter((t: any) => t.result === 'WIN');
      const losses = closed.filter((t: any) => t.result === 'LOSS');
      const totalPnl = closed.reduce((s: number, t: any) => s + Number(t.pnl), 0);
      return {
        total_trades: (trades || []).length,
        closed_trades: closed.length,
        wins: wins.length,
        losses: losses.length,
        win_rate: closed.length ? Math.round((wins.length / closed.length) * 100) : 0,
        total_pnl: Math.round(totalPnl),
        avg_rr: closed.length ? closed.reduce((s: number, t: any) => s + (Number(t.rr) || 0), 0) / closed.length : 0,
      };
    }
    case 'search_knowledge': {
      const { data, error } = await supabase.rpc('search_knowledge', { p_project_id: projectId, p_query: params.query || '' });
      if (error) return { results: [], error: error.message };
      return { results: data || [] };
    }
    case 'search_chunks': {
      const { data } = await supabase.from('ai_document_chunk').select('*').eq('project_id', projectId)
        .ilike('content', `%${params.query || ''}%`).limit(Number(params.limit) || 10);
      return (data || []).map((c: any) => ({ id: c.id, content: c.content?.substring(0, 300), document_title: c.document_title, chunk_index: c.chunk_index }));
    }
    case 'get_memories': {
      const { data } = await supabase.from('ai_memory').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(Number(params.limit) || 20);
      return data || [];
    }
    case 'get_workflows': {
      const { data } = await supabase.from('ai_workflow').select('*').eq('project_id', projectId).eq('is_active', true).limit(20);
      return data || [];
    }
    case 'get_context': {
      const { data: profile } = await supabase.from('ai_profile').select('*').eq('project_id', projectId).maybeSingle();
      const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, status').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(10);
      return { profile, recent_trades: trades || [] };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function copilotSearch(supabase: any, projectId: string, query: string, sourceType?: string, limit = 10) {
  const results: any[] = [];
  if (!sourceType || sourceType === 'chunk') {
    const { data: chunks } = await supabase.from('ai_document_chunk').select('*').eq('project_id', projectId)
      .ilike('content', `%${query}%`).limit(limit);
    for (const c of chunks || []) {
      results.push({ chunk_id: c.id, content: c.content?.substring(0, 500), score: 1, source_type: 'chunk', metadata: { document_title: c.document_title, chunk_index: c.chunk_index, created_date: c.created_date } });
    }
  }
  if (!sourceType || sourceType === 'knowledge') {
    const { data, error } = await supabase.rpc('search_knowledge', { p_project_id: projectId, p_query: query });
    if (!error) {
      for (const r of (data || []) as any[]) {
        results.push({ chunk_id: `kn-${r.id}`, content: r.text?.substring(0, 500), score: 0.9, source_type: r.type, metadata: {} });
      }
    }
  }
  if (!sourceType || sourceType === 'trade') {
    const { data: trades } = await supabase.from('trade').select('id, pair, notes, result, pnl, created_at').eq('project_id', projectId).is('deleted_at', null).or(`pair.ilike.%${query}%,notes.ilike.%${query}%`).limit(limit);
    for (const t of trades || []) {
      results.push({ chunk_id: `tr-${t.id}`, content: `${t.pair} ${t.result} ${t.pnl ? `PnL:${t.pnl}` : ''} ${t.notes?.substring(0, 300) || ''}`, score: 0.95, source_type: 'trade', metadata: { created_at: t.created_at } });
    }
  }
  return results.slice(0, limit);
}

export async function copilotIngest(supabase: any, projectId: string) {
  const { data: sources } = await supabase.from('source').select('*').eq('project_id', projectId).is('deleted_at', null).limit(200);
  let ingested = 0;
  const errors: string[] = [];
  for (const s of sources || []) {
    const text = s.normalized_text || s.raw_text || '';
    if (!text) { errors.push(`Source ${s.id}: empty text`); continue; }
    const filename = s.source_metadata?.original_name || s.id;
    const { data: existing } = await supabase.from('ai_document_ingestion').select('id').eq('filename', filename).maybeSingle();
    const ingestion = {
      project_id: projectId,
      filename,
      source_type: 'source',
      status: 'completed',
      chunk_count: Math.max(1, Math.ceil(text.length / 4000)),
      metadata: { source_id: s.id, origin_type: s.origin_type || 'document' },
    };
    if (existing) {
      await supabase.from('ai_document_ingestion').update(ingestion).eq('id', existing.id);
    } else {
      const { error } = await supabase.from('ai_document_ingestion').insert(ingestion);
      if (error) { errors.push(`Source ${s.id}: ${error.message}`); continue; }
    }
    ingested++;
  }
  return { ingested: sources?.length ?? 0, indexed_chunks: ingested, errors };
}

export async function executeCopilotWorkflow(supabase: any, projectId: string, workflowId: string) {
  const { data: workflow } = await supabase.from('ai_workflow').select('*').eq('id', workflowId).eq('project_id', projectId).single();
  if (!workflow) throw new Error('Workflow not found');

  const startedAt = Date.now();
  const { data: exec } = await supabase.from('ai_workflow_execution').insert({
    project_id: projectId,
    workflow_id: workflowId,
    status: 'running',
    started_at: new Date().toISOString(),
  }).select().single();

  try {
    const nodes = workflow.nodes || [];
    const outputs: any[] = [];
    for (const node of nodes) {
      if (node.type === 'prompt') {
        const result = await callAI(node.prompt || 'Continue.', '', undefined, 1024);
        if (isAiError(result)) throw new Error(JSON.parse(result)._error);
        outputs.push({ node: node.id, type: node.type, output: result });
      } else {
        outputs.push({ node: node.id, type: node.type, output: null });
      }
    }
    const durationMs = Date.now() - startedAt;
    const { data: updated } = await supabase.from('ai_workflow_execution').update({
      status: 'completed',
      output_data: { node_outputs: outputs },
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    }).eq('id', exec?.id).select().single();
    return updated;
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : 'Unknown error';
    const { data: updated } = await supabase.from('ai_workflow_execution').update({
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    }).eq('id', exec?.id).select().single();
    return updated;
  }
}

export async function getMessageCitations(supabase: any, _projectId: string, messageId: string) {
  const { data: message } = await supabase.from('ai_message').select('citations, contexts, content, created_at, model').eq('id', messageId).maybeSingle();
  if (!message) return { citations: [], context_used: {} };
  return { citations: message.citations || [], context_used: (message.contexts && message.contexts[0]) || {} };
}

export async function copilotChat(supabase: any, projectId: string, message: string, conversationId?: string, agentType?: string, options: Record<string, any> = {}) {
  const startedAt = Date.now();

  let convId = conversationId;
  if (!convId) {
    const { data: conv, error } = await supabase.from('ai_conversation').insert({
      project_id: projectId,
      title: message.substring(0, 80),
      agent_type: agentType || 'copilot',
    }).select().single();
    if (error) throw error;
    convId = conv.id;
  }

  const { data: history } = await supabase.from('ai_message').select('*').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20);
  const chatHistory = (history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n');

  const memories = await executeCopilotTool(supabase, projectId, 'get_memories', { limit: 5 });
  const stats = await executeCopilotTool(supabase, projectId, 'get_trade_stats', {});
  const recentTrades = await executeCopilotTool(supabase, projectId, 'get_trades', { limit: 10 });

  const contextUsed = { memories, trade_stats: stats, recent_trades: recentTrades };
  const systemPrompt = `You are a trading copilot. Use the provided context to answer precisely. If asked for analysis, reason step by step. Be concise and data-driven.
Context:
${JSON.stringify(contextUsed)}`;

  const result = await callAI(systemPrompt, `Chat history:\n${chatHistory}\n\nUser: ${message}`, options.model, 2048);
  if (isAiError(result)) throw new Error(JSON.parse(result)._error);

  const citations = options.citations || [];
  const latencyMs = Date.now() - startedAt;
  const chunksRetrieved = (options.chunks_retrieved ?? citations.length) || 0;

  const { data: userMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: convId,
    role: 'user',
    content: message,
    agent_type: agentType || 'copilot',
  }).select().single();

  const { data: aiMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: convId,
    role: 'assistant',
    content: result,
    agent_type: agentType || 'copilot',
    citations,
    contexts: [{ context_used: contextUsed, chunks_retrieved: chunksRetrieved }],
    latency_ms: latencyMs,
  }).select().single();

  try {
    await supabase.from('ai_token_usage').insert({
      project_id: projectId,
      model: options.model || null,
      endpoint: 'copilot/chat',
    });
  } catch { /* non-fatal */ }

  await supabase.from('ai_conversation').update({ message_count: (history?.length ?? 0) + 2, total_tokens: 0 }).eq('id', convId);

  return {
    message: aiMsg,
    citations,
    context_used: contextUsed,
    token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    latency_ms: latencyMs,
  };
}

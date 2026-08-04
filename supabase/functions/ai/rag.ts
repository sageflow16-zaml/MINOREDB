import { callAI, isAiError, generateEmbedding, openaiApiKey, openaiBaseUrl, aiNotConfiguredMsg } from './index.ts';

export async function ragChat(supabase: any, projectId: string, conversationId: string, message: string) {
  const { data: conversation } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).single();
  if (!conversation) throw new Error('Conversation not found');

  const { data: history } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(20);
  const chatHistory = (history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n');

  const { data: rules } = await supabase.from('knowledge_rule').select('*').eq('project_id', projectId).limit(10);
  const { data: trades } = await supabase.from('trade').select('pair, result, pnl').eq('project_id', projectId).is('deleted_at', null).limit(20);

  const context = [
    'Knowledge Rules:', (rules || []).map((r: any) => `- ${r.title}: ${r.description}`).join('\n'),
    '\nRecent Trades:', (trades || []).map((t: any) => `- ${t.pair} ${t.result} (${t.pnl})`).join('\n'),
  ].join('\n');

  const systemPrompt = `You are a trading AI copilot. Help the user with trading analysis, questions, and insights.
Current context:\n${context}\n\nBe concise and data-driven.`;

  const result = await callAI(systemPrompt, `Chat history:\n${chatHistory}\n\nUser: ${message}`, undefined, 4096);
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const { data: aiMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: conversationId,
    role: 'user',
    content: message,
  }).select().single();

  const { data: responseMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: conversationId,
    role: 'assistant',
    content: result,
  }).select().single();

  return { user_message: aiMsg, assistant_message: responseMsg };
}

export async function ragSearch(supabase: any, projectId: string, query: string) {
  if (!openaiApiKey) {
    return { results: [], method: 'disabled', warning: aiNotConfiguredMsg() };
  }
  const embeddingResponse = await fetch(`${openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  });
  if (!embeddingResponse.ok) {
    console.error('Embedding API error:', await embeddingResponse.text());
    return { results: [], method: 'disabled', warning: 'Embedding service unavailable.' };
  }
  const embedJson = await embeddingResponse.json();
  const embedding = embedJson.data[0].embedding;

  const { data: results } = await supabase.rpc('search_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 10,
    p_project_id: projectId,
  });

  if (!results) {
    const { data: fallback } = await supabase.from('ai_document_chunk')
      .select('content, ingestion_id')
      .eq('project_id', projectId)
      .limit(10);
    return { results: fallback || [], method: 'fallback' };
  }
  return { results, method: 'vector' };
}

export async function researchChat(supabase: any, projectId: string, conversationId: string, message: string, documentIds?: string[]) {
  const { data: conversation } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).single();
  if (!conversation) throw new Error('Conversation not found');

  const { data: history } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(20);
  const chatHistory = (history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n');

  let documentContext = '';
  if (documentIds && documentIds.length > 0) {
    const { data: docs } = await supabase.from('source').select('*').in('id', documentIds);
    for (const doc of docs || []) {
      const text = doc.normalized_text || doc.raw_text || '';
      documentContext += `\n\n--- Document: ${doc.name || doc.id} ---\n${text.substring(0, 4000)}`;
    }
  } else {
    if (openaiApiKey) {
      try {
        const embeddingResp = await fetch(`${openaiBaseUrl}/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
        });
        if (embeddingResp.ok) {
          const embedJson = await embeddingResp.json();
          const embedding = embedJson.data[0].embedding;
          const { data: results } = await supabase.rpc('search_documents', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 15,
            p_project_id: projectId,
          });
          if (results && results.length > 0) {
            documentContext = '\n\nRelevant document chunks:\n' + results.map((c: any) =>
              `[${c.filename || 'Doc'}${c.page ? ` p.${c.page}` : ''}] ${c.content}`
            ).join('\n');
          }
        }
      } catch { /* fall through to random chunks */ }
    }
    if (!documentContext) {
      const { data: chunks } = await supabase.from('ai_document_chunk')
        .select('content, page, ai_document_ingestion!inner(filename)')
        .eq('project_id', projectId)
        .limit(15);
      if (chunks && chunks.length > 0) {
        documentContext = '\n\nRelevant document chunks:\n' + chunks.map((c: any) =>
          `[${c.ai_document_ingestion?.filename || 'Doc'}${c.page ? ` p.${c.page}` : ''}] ${c.content}`
        ).join('\n');
      }
    }
  }

  const systemPrompt = `You are Minore Research, a trading research AI assistant. You analyze uploaded documents to answer questions.

CRITICAL RULES:
- Answer ONLY from the provided document context. Do NOT use external knowledge unless the user explicitly asks.
- Every factual claim MUST include a citation in the format: [Source: filename, Page N]
- If the context doesn't contain enough information, say "I don't have enough information in the uploaded documents to answer that."
- Be precise, specific, and reference exact text from the documents.
- When asked to summarize, extract rules, find patterns, etc., structure your response clearly.

Available context from uploaded documents:${documentContext}`;

  const result = await callAI(systemPrompt, `Chat history:\n${chatHistory}\n\nUser: ${message}`, undefined, 4096);
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const { data: aiMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: conversationId,
    role: 'user',
    content: message,
    document_ids: documentIds || [],
    metadata: { research_v3: true },
  }).select().single();

  let citations: any[] = [];
  let aiContent = result;
  try {
    const citeMatches = result.match(/\[Source:\s*([^\]]+),\s*Page\s*(\d+)\]/gi);
    if (citeMatches) {
      for (const cite of citeMatches) {
        const parts = cite.match(/\[Source:\s*([^\]]+),\s*Page\s*(\d+)\]/i);
        if (parts) {
          citations.push({
            source_name: parts[1].trim(),
            page: parseInt(parts[2]),
            excerpt: '',
          });
        }
      }
    }
  } catch { /* ignore citation parsing errors */ }

  const { data: responseMsg } = await supabase.from('ai_message').insert({
    project_id: projectId,
    conversation_id: conversationId,
    role: 'assistant',
    content: aiContent,
    citations: citations.length > 0 ? citations : undefined,
    document_ids: documentIds || [],
    metadata: { research_v3: true },
  }).select().single();

  return { user_message: aiMsg, assistant_message: responseMsg, citations };
}

export async function semanticSearch(supabase: any, projectId: string, query: string, documentIds?: string[]) {
  if (!openaiApiKey) return { results: [], method: 'disabled', warning: aiNotConfiguredMsg() };

  const embeddingResponse = await fetch(`${openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  });
  if (!embeddingResponse.ok) return { results: [], method: 'disabled', warning: 'Embedding service unavailable.' };
  const embedJson = await embeddingResponse.json();
  const embedding = embedJson.data[0].embedding;

  const { data: results } = await supabase.rpc('search_documents', {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 20,
    p_project_id: projectId,
  });

  if (results) {
    let filtered = results;
    if (documentIds && documentIds.length > 0) {
      const { data: ingestions } = await supabase.from('ai_document_ingestion')
        .select('id, filename').in('source_id', documentIds);
      const ingIds = (ingestions || []).map((i: any) => i.id);
      filtered = results.filter((r: any) => ingIds.includes(r.ingestion_id));
    }
    return { results: filtered, method: 'vector' };
  }

  return { results: [], method: 'fallback' };
}

export async function getRelevantMemories(supabase: any, projectId: string, query: string, limit = 10) {
  if (!openaiApiKey) {
    const { data: memories } = await supabase.from('ai_memory')
      .select('id, key, value, category, memory_type, text_value, importance')
      .eq('project_id', projectId)
      .order('importance', { ascending: false })
      .limit(limit);
    return { memories: memories || [], method: 'importance' };
  }

  try {
    const embeddingResp = await fetch(`${openaiBaseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    if (embeddingResp.ok) {
      const embedJson = await embeddingResp.json();
      const embedding = embedJson.data[0].embedding;
      const { data: memories } = await supabase.rpc('search_memories', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: limit,
        p_project_id: projectId,
      });
      if (memories && memories.length > 0) return { memories, method: 'vector' };
    }
  } catch { /* fallback */ }

  const { data: memories } = await supabase.from('ai_memory')
    .select('id, key, value, category, memory_type, text_value, importance')
    .eq('project_id', projectId)
    .order('importance', { ascending: false })
    .limit(limit);
  return { memories: memories || [], method: 'importance' };
}

export async function storeMemory(supabase: any, projectId: string, key: string, value: string, category: string, importance = 1) {
  let embedding: number[] | null = null;
  if (openaiApiKey) {
    try {
      const resp = await fetch(`${openaiBaseUrl}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: `${key}: ${value}` }),
      });
      if (resp.ok) {
        const json = await resp.json();
        embedding = json.data?.[0]?.embedding ?? null;
      }
    } catch { /* continue without embedding */ }
  }

  const { data, error } = await supabase.from('ai_memory').upsert({
    project_id: projectId,
    key,
    value,
    category,
    memory_type: 'observation',
    text_value: value,
    importance,
    embedding: embedding ?? undefined,
  }, { onConflict: 'project_id,key' }).select().single();

  return { memory: data || { id: '', key, value }, error };
}

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

const openaiApiKey = Deno.env.get('OPENROUTER_API_KEY') || '';
const openaiBaseUrl = Deno.env.get('OPENAI_BASE_URL') || 'https://openrouter.ai/api/v1';
const defaultModel = Deno.env.get('AI_MODEL') || 'openrouter/auto';

function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, serviceKey);
}

function aiNotConfiguredMsg() {
  return 'AI service is not configured. Set OPENROUTER_API_KEY in your project secrets to enable AI features.';
}

async function callAI(systemPrompt: string, userPrompt: string, model = defaultModel, maxTokens = 2048) {
  if (!openaiApiKey) {
    return JSON.stringify({ _error: aiNotConfiguredMsg() });
  }
  const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
      'HTTP-Referer': 'https://minoredb.vercel.app',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    console.error(`AI API error: ${response.status} - ${err}`);
    return JSON.stringify({ _error: `AI service error (${response.status}). Please try again later.` });
  }
  const json = await response.json();
  const content = json.choices[0].message.content;
  const trimmed = content.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : trimmed;
}

function isAiError(result: string): boolean {
  try {
    const parsed = JSON.parse(result);
    return parsed && typeof parsed === 'object' && '_error' in parsed;
  } catch {
    return false;
  }
}

async function extractClaims(supabase: ReturnType<typeof createClient>, projectId: string, sourceId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', sourceId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { claims_created: 0, warning: 'Source has no text content' };

  const result = await callAI(
    'You are a claim extraction expert. Extract factual claims from the given text. Return a JSON array of objects with keys: verbatim_text (exact quote), source_location (approximate location).',
    `Extract claims from this text:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { claims_created: 0, warning: JSON.parse(result)._error };

  let claimList: any[];
  try { claimList = JSON.parse(result); } catch { return { claims_created: 0, warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(claimList)) return { claims_created: 0, warning: 'AI returned unexpected format' };
  let created = 0;
  for (const claim of claimList) {
    const { error: insertError } = await supabase.from('claim').insert({
      project_id: projectId,
      source_id: sourceId,
      verbatim_text: claim.verbatim_text,
    });
    if (!insertError) created++;
  }
  return { claims_created: created };
}

async function extractConcepts(supabase: ReturnType<typeof createClient>, projectId: string, claimId: string) {
  const { data: claim } = await supabase.from('claim').select('*').eq('id', claimId).single();
  if (!claim) throw new Error('Claim not found');

  const result = await callAI(
    'You are a concept extraction expert. Extract key concepts from a claim. Return a JSON array of objects with keys: conceptual_term (short term), definition (brief definition).',
    `Extract concepts from this claim:\n\n${claim.verbatim_text}`
  );
  if (isAiError(result)) return { concepts_created: 0, warning: JSON.parse(result)._error };

  const concepts = JSON.parse(result);
  const created = [];
  for (const c of concepts) {
    const { data: concept } = await supabase.from('concept').insert({
      project_id: projectId,
      conceptual_term: c.conceptual_term,
      definition: c.definition,
    }).select().single();
    if (concept) {
      await supabase.from('association').insert({
        project_id: projectId,
        claim_id: claimId,
        concept_id: concept.id,
      });
      created.push(concept);
    }
  }
  return { concepts_created: created.length };
}

async function detectConflicts(supabase: ReturnType<typeof createClient>, projectId: string, sourceId: string) {
  const { data: claims } = await supabase.from('claim').select('*').eq('source_id', sourceId).is('deleted_at', null);
  if (!claims || claims.length < 2) {
    return { conflicts_created: 0, warning: 'Need at least 2 claims to detect conflicts' };
  }

  const claimsText = claims.map((c: any) => `[${c.id}] ${c.verbatim_text}`).join('\n');
  const result = await callAI(
    'You are a conflict detection expert. Analyze claims for logical contradictions or disagreements. Return a JSON array of objects with keys: claim_ids (array of 2+ claim IDs), conflict_classification (type of conflict), contextual_applicability_check (notes).',
    `Analyze these claims for conflicts:\n\n${claimsText}`
  );
  if (isAiError(result)) return { conflicts_created: 0, warning: JSON.parse(result)._error };

  let conflicts: any[];
  try { conflicts = JSON.parse(result); } catch { return { conflicts_created: 0, warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(conflicts)) return { conflicts_created: 0, warning: 'AI returned unexpected format' };
  for (const conflict of conflicts) {
    const { data: c } = await supabase.from('conflict').insert({
      project_id: projectId,
      conflict_classification: conflict.conflict_classification,
      contextual_applicability_check: conflict.contextual_applicability_check || '',
    }).select().single();
    if (c) {
      for (const claimId of conflict.claim_ids) {
        await supabase.from('claim_conflict').insert({
          project_id: projectId,
          claim_id: claimId,
          conflict_id: c.id,
        });
      }
    }
  }
  return { conflicts_created: conflicts.length };
}

async function interpretClaim(supabase: ReturnType<typeof createClient>, projectId: string, claimId: string) {
  const { data: claim } = await supabase.from('claim').select('*').eq('id', claimId).single();
  if (!claim) throw new Error('Claim not found');
  const { data: associations } = await supabase.from('association').select('concept_id').eq('claim_id', claimId);
  const conceptIds = (associations || []).map((a: any) => a.concept_id);
  let conceptsContext = '';
  if (conceptIds.length > 0) {
    const { data: concepts } = await supabase.from('concept').select('*').in('id', conceptIds);
    conceptsContext = (concepts || []).map((c: any) => `${c.conceptual_term}: ${c.definition}`).join('\n');
  }

  const result = await callAI(
    'You are an interpretation expert. Generate an interpretation that explains the significance and implications of a claim. Return JSON with keys: interpretation_statement, reasoning_chain, interpretation_foundation.',
    `Claim: ${claim.verbatim_text}\n\nRelated concepts:\n${conceptsContext || 'None'}\n\nGenerate an interpretation.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const interpretation = JSON.parse(result);
  const { data: created } = await supabase.from('interpretation').insert({
    project_id: projectId,
    claim_id: claimId,
    interpretation_statement: interpretation.interpretation_statement,
    reasoning_chain: interpretation.reasoning_chain || '',
    interpretation_foundation: interpretation.interpretation_foundation || '',
  }).select().single();
  return created;
}

async function generateQuestion(supabase: ReturnType<typeof createClient>, projectId: string, conflictId: string) {
  const { data: conflict } = await supabase.from('conflict').select('*').eq('id', conflictId).single();
  if (!conflict) throw new Error('Conflict not found');

  const result = await callAI(
    'You are a research question generator. Given a conflict between claims, generate research questions that could help resolve it. Return JSON with keys: question_statement, inquiry_origin, domain_relevance.',
    `Conflict: ${conflict.conflict_classification}\nDetails: ${conflict.contextual_applicability_check || ''}\n\nGenerate a research question.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const question = JSON.parse(result);
  const { data: created } = await supabase.from('research_question').insert({
    project_id: projectId,
    conflict_id: conflictId,
    question_statement: question.question_statement,
    inquiry_origin: question.inquiry_origin || '',
    domain_relevance: question.domain_relevance || '',
  }).select().single();
  return created;
}

async function generateHypothesis(supabase: ReturnType<typeof createClient>, projectId: string, questionId: string) {
  const { data: question } = await supabase.from('research_question').select('*').eq('id', questionId).single();
  if (!question) throw new Error('Research question not found');

  const result = await callAI(
    'You are a hypothesis generator. Generate a testable hypothesis from a research question. Return JSON with keys: hypothesis_statement, variable_specification, measurement_specification.',
    `Question: ${question.question_statement}\n\nGenerate a hypothesis.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const hypothesis = JSON.parse(result);
  const { data: created } = await supabase.from('hypothesis').insert({
    project_id: projectId,
    research_question_id: questionId,
    hypothesis_statement: hypothesis.hypothesis_statement,
    variable_specification: hypothesis.variable_specification || '',
    measurement_specification: hypothesis.measurement_specification || '',
  }).select().single();
  return created;
}

async function generateDebrief(supabase: ReturnType<typeof createClient>, projectId: string, tradeId: string) {
  const { data: trade } = await supabase.from('trade').select('*').eq('id', tradeId).single();
  if (!trade) throw new Error('Trade not found');

  const result = await callAI(
    'You are a trade debrief expert. Analyze a trade and generate a detailed debrief. Return JSON with keys: entry_review, execution_review, exit_review, psychology_review, lessons_learned, strengths, weaknesses, mistakes, improvements, overall_rating (1-10), summary.',
    `Analyze this trade:\nPair: ${trade.pair || 'N/A'}\nDirection: ${trade.direction || 'N/A'}\nEntry: ${trade.entry_price}\nExit: ${trade.exit_price}\nResult: ${trade.result}\nPnL: ${trade.pnl}\nRR: ${trade.rr}\nNotes: ${trade.notes || ''}\n\nGenerate a debrief.`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const debrief = JSON.parse(result);
  const { data: created } = await supabase.from('trade_debrief').insert({
    project_id: projectId,
    trade_id: tradeId,
    entry_review: debrief.entry_review || '',
    execution_review: debrief.execution_review || '',
    exit_review: debrief.exit_review || '',
    psychology_review: debrief.psychology_review || '',
    lessons_learned: debrief.lessons_learned || '',
    strengths: JSON.stringify(debrief.strengths || []),
    weaknesses: JSON.stringify(debrief.weaknesses || []),
    mistakes: JSON.stringify(debrief.mistakes || []),
    improvements: JSON.stringify(debrief.improvements || []),
    overall_rating: debrief.overall_rating || 5,
    summary: debrief.summary || '',
  }).select().single();
  return created;
}

async function detectPatterns(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).order('open_time', { ascending: false }).limit(200);
  if (!trades || trades.length < 5) throw new Error('Need at least 5 trades for pattern detection');

  const tradesSummary = trades.map((t: any) =>
    `${t.pair} ${t.direction} ${t.result} PnL:${t.pnl} RR:${t.rr} bias:${t.weekly_bias}/${t.daily_bias}`
  ).join('\n');

  const result = await callAI(
    'You are a pattern detection expert. Analyze trading data to identify recurring patterns. Return a JSON array of pattern objects with keys: name, category, signature (JSON), description, confidence (0-1).',
    `Analyze these trades for patterns:\n\n${tradesSummary}`
  );
  if (isAiError(result)) return { patterns_created: 0, warning: JSON.parse(result)._error };

  const patterns = JSON.parse(result);
  const created = [];
  for (const p of patterns) {
    const { data: pattern } = await supabase.from('personal_pattern').insert({
      project_id: projectId,
      name: p.name,
      category: p.category || 'general',
      signature: p.signature || {},
      description: p.description || '',
      confidence: p.confidence || 0.5,
    }).select().single();
    if (pattern) created.push(pattern);
  }
  return { patterns_created: created.length };
}

async function generateRules(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(100);
  const { data: patterns } = await supabase.from('personal_pattern').select('*').eq('project_id', projectId).eq('active', true);

  const context = [
    'Recent trades:',
    (trades || []).slice(0, 20).map((t: any) => `- ${t.pair} ${t.direction} ${t.result} (${t.pnl}, RR:${t.rr})`).join('\n'),
    '\nDetected patterns:',
    (patterns || []).map((p: any) => `- ${p.name} (${p.category}): ${p.description}`).join('\n'),
  ].join('\n');

  const result = await callAI(
    'You are a trading rule generator. Generate actionable trading rules based on trade history and patterns. Return a JSON array of rule objects with keys: title, description, category, evidence.',
    `Generate rules from this data:\n\n${context}`
  );
  if (isAiError(result)) return { rules_created: 0, warning: JSON.parse(result)._error };

  const rules = JSON.parse(result);
  const created = [];
  for (const r of rules) {
    const { data: rule } = await supabase.from('personal_rule').insert({
      project_id: projectId,
      name: r.title,
      description: r.description || '',
      category: r.category || 'general',
      evidence: r.evidence || '',
      status: 'draft',
    }).select().single();
    if (rule) created.push(rule);
  }
  return { rules_created: created.length };
}

async function buildProfile(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(200);
  const { data: debriefs } = await supabase.from('trade_debrief').select('*').eq('project_id', projectId);

  const context = [
    'Trades:', (trades || []).slice(0, 50).map((t: any) =>
      `${t.pair} ${t.direction} ${t.result} PnL:${t.pnl} RR:${t.rr}`).join('\n'),
    '\nDebriefs:', (debriefs || []).map((d: any) =>
      `Strengths: ${d.strengths} Weaknesses: ${d.weaknesses} Mistakes: ${d.mistakes}`).join('\n'),
  ].join('\n');

  const result = await callAI(
    'You are a trader profile builder. Analyze trading history to build a comprehensive trader profile. Return JSON with keys: strengths (array), weaknesses (array), trading_habits (array), discipline_score (0-100), rule_adherence (0-100), improvement_suggestions (array), notes.',
    `Build a trader profile from:\n\n${context}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const profile = JSON.parse(result);
  const { data: existing } = await supabase.from('trader_profile').select('id').eq('project_id', projectId).maybeSingle();
  if (existing) {
    await supabase.from('trader_profile').update({
      strengths: profile.strengths || [],
      weaknesses: profile.weaknesses || [],
      trading_habits: profile.trading_habits || [],
      discipline_score: profile.discipline_score,
      rule_adherence: profile.rule_adherence,
      improvement_suggestions: profile.improvement_suggestions || [],
      notes: profile.notes || '',
      total_trades_analyzed: (trades || []).length,
      total_debriefs: (debriefs || []).length,
    }).eq('id', existing.id);
  } else {
    await supabase.from('trader_profile').insert({
      project_id: projectId,
      strengths: profile.strengths || [],
      weaknesses: profile.weaknesses || [],
      trading_habits: profile.trading_habits || [],
      discipline_score: profile.discipline_score,
      rule_adherence: profile.rule_adherence,
      improvement_suggestions: profile.improvement_suggestions || [],
      notes: profile.notes || '',
      total_trades_analyzed: (trades || []).length,
      total_debriefs: (debriefs || []).length,
    });
  }
  return { profile_built: true };
}

async function generateTradeMemory(supabase: ReturnType<typeof createClient>, projectId: string, tradeId: string) {
  const { data: trade } = await supabase.from('trade').select('*').eq('id', tradeId).single();
  if (!trade) throw new Error('Trade not found');
  const { data: ms } = await supabase.from('market_structure').select('*').eq('project_id', projectId).eq('trade_id', tradeId).maybeSingle();

  const context = `Trade: ${trade.pair} ${trade.direction} ${trade.result} PnL:${trade.pnl} RR:${trade.rr}
Bias: ${trade.weekly_bias}/${trade.daily_bias}
Market Structure: ${ms ? JSON.stringify(ms) : 'N/A'}`;

  const result = await callAI(
    'You are a trade memory expert. Generate a structured trade memory entry. Return JSON with keys: summary, strengths (array), weaknesses (array), mistakes (array), lessons (array), tags (array), confidence (0-1).',
    `Generate trade memory from:\n\n${context}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const memory = JSON.parse(result);
  const { data: created } = await supabase.from('trade_memory').insert({
    project_id: projectId,
    trade_id: tradeId,
    summary: memory.summary || '',
    strengths: memory.strengths || [],
    weaknesses: memory.weaknesses || [],
    mistakes: memory.mistakes || [],
    lessons: memory.lessons || [],
    tags: memory.tags || [],
    confidence: memory.confidence || 0.5,
  }).select().single();
  return created;
}

async function ragChat(supabase: ReturnType<typeof createClient>, projectId: string, conversationId: string, message: string) {
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

  const result = await callAI(systemPrompt, `Chat history:\n${chatHistory}\n\nUser: ${message}`, defaultModel, 4096);
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

async function ragSearch(supabase: ReturnType<typeof createClient>, projectId: string, query: string) {
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

async function analyzeTrade(supabase: ReturnType<typeof createClient>, projectId: string, tradeId: string) {
  const { data: trade } = await supabase.from('trade').select('*').eq('id', tradeId).single();
  if (!trade) throw new Error('Trade not found');

  const result = await callAI(
    'You are a trade analyst. Evaluate this trade and provide constructive analysis. Return JSON with keys: strength_score (0-100), risk_score (0-100), execution_score (0-100), psychology_score (0-100), overall_quality (0-100), critique (text).',
    `Evaluate this trade:\nPair: ${trade.pair}\nDirection: ${trade.direction}\nEntry: ${trade.entry_price}\nExit: ${trade.exit_price}\nSL: ${trade.stop_loss}\nTP: ${trade.take_profit}\nResult: ${trade.result}\nPnL: ${trade.pnl}\nRR: ${trade.rr}\nNotes: ${trade.notes || ''}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const evaluation = JSON.parse(result);
  const { data: created } = await supabase.from('trade_evaluation').insert({
    project_id: projectId,
    trade_id: tradeId,
    strength_score: evaluation.strength_score,
    risk_score: evaluation.risk_score,
    execution_score: evaluation.execution_score,
    psychology_score: evaluation.psychology_score,
    overall_quality: evaluation.overall_quality,
    critique: evaluation.critique || '',
    provider: 'ai',
  }).select().single();
  return created;
}

async function generateSummary(supabase: ReturnType<typeof createClient>, projectId: string, summaryType: string, period: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(100);

  const stats = {
    total: (trades || []).length,
    wins: (trades || []).filter((t: any) => t.result === 'WIN').length,
    losses: (trades || []).filter((t: any) => t.result === 'LOSS').length,
    totalPnl: (trades || []).reduce((s: number, t: any) => s + (t.pnl || 0), 0),
  };

  const result = await callAI(
    'You are a trading summary generator. Create a concise performance summary. Return JSON with keys: content (detailed), text_summary (one paragraph), keywords (array), sentiment (positive/neutral/negative), importance (high/medium/low).',
    `Generate a ${summaryType} summary for ${period} period.\n\nStats: ${JSON.stringify(stats)}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const summary = JSON.parse(result);
  const { data: created } = await supabase.from('ai_summary').insert({
    project_id: projectId,
    summary_type: summaryType,
    period: period,
    content: summary.content || '',
    text_summary: summary.text_summary || '',
    keywords: summary.keywords || [],
    sentiment: summary.sentiment || 'neutral',
    importance: summary.importance || 'medium',
  }).select().single();
  return created;
}

async function refreshKnowledgeRules(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(200);
  if (!trades || trades.length < 3) throw new Error('Not enough trades');

  const summary = trades.map((t: any) =>
    `${t.pair} ${t.direction} ${t.result} PnL:${t.pnl} RR:${t.rr}`
  ).join('\n');

  const result = await callAI(
    'You are a knowledge discovery engine. Analyze trade data to discover trading rules/knowledge. Return a JSON array of rule objects with keys: title, description, category, confidence (0-1), wins, losses, avg_rr, signature (string).',
    `Discover knowledge from these trades:\n\n${summary}`
  );
  if (isAiError(result)) return { rules_created: 0, warning: JSON.parse(result)._error };

  const rules = JSON.parse(result);
  const created = [];
  for (const r of rules) {
    const { data: rule } = await supabase.from('knowledge_rule').insert({
      project_id: projectId,
      name: r.title,
      title: r.title,
      description: r.description || '',
      category: r.category || 'discovered',
      confidence: r.confidence != null ? Math.round(r.confidence * 100) : 50,
      wins: typeof r.wins === 'number' ? r.wins : 0,
      losses: typeof r.losses === 'number' ? r.losses : 0,
      avg_rr: typeof r.avg_rr === 'number' ? r.avg_rr : 0,
      signature: r.signature || '',
    }).select().single();
    if (rule) created.push(rule);
  }
  return { rules_created: created.length };
}

async function refreshKnowledgeGraph(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: sources } = await supabase.from('source').select('id, normalized_text').eq('project_id', projectId).limit(50);
  const { data: claims } = await supabase.from('claim').select('id, verbatim_text').eq('project_id', projectId).limit(100);
  const { data: concepts } = await supabase.from('concept').select('id, conceptual_term').eq('project_id', projectId).limit(100);

  const existingCount = (concepts || []).length;
  const result = await callAI(
    'You are a knowledge graph builder. Given sources, claims, and concepts, identify important relationships to build a knowledge graph. Return a JSON array of edge objects with keys: source (concept name), target (concept name), relationship (string), strength (0-1).',
    `Build knowledge graph edges from:\nConcepts: ${(concepts || []).map((c: any) => c.conceptual_term).join(', ')}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  const edges = JSON.parse(result);

  const created = [];
  for (const e of edges) {
    const getOrCreateNode = async (name: string) => {
      const { data: existing } = await supabase.from('knowledge_node').select('id').eq('project_id', projectId).eq('name', name).maybeSingle();
      if (existing) return existing;
      const { data: node } = await supabase.from('knowledge_node').insert({
        project_id: projectId, type: 'concept', name,
      }).select().single();
      return node;
    };

    const sourceNode = await getOrCreateNode(e.source);
    const targetNode = await getOrCreateNode(e.target);
    if (sourceNode && targetNode) {
      await supabase.from('knowledge_edge').upsert({
        project_id: projectId,
        source_node_id: sourceNode.id,
        target_node_id: targetNode.id,
        relationship: e.relationship || 'CORRELATED',
        strength: e.strength || 0.5,
      }, { onConflict: 'source_node_id,target_node_id,relationship' });
      created.push({ source: e.source, target: e.target, relationship: e.relationship });
    }
  }

  await supabase.from('knowledge_graph_snapshot').insert({
    project_id: projectId,
    total_nodes: existingCount,
    total_edges: created.length,
    summary: `Graph built from ${existingCount} concepts and ${created.length} relationships`,
  });

  return { nodes: existingCount, edges_created: created.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { operation, project_id, data } = await req.json() as { operation: string; project_id: string; data?: Record<string, any> };
    if (!operation) return errorResponse('Missing operation');
    if (!project_id) return errorResponse('Missing project_id');

    const supabase = getSupabaseClient(req);

    switch (operation) {
      case 'extract-claims': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await extractClaims(supabase, project_id, sourceId);
        return successResponse(result);
      }
      case 'extract-concepts': {
        const claimId = data?.claim_id;
        if (!claimId) return errorResponse('Missing claim_id');
        const result = await extractConcepts(supabase, project_id, claimId);
        return successResponse(result);
      }
      case 'detect-conflicts': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await detectConflicts(supabase, project_id, sourceId);
        return successResponse(result);
      }
      case 'interpret': {
        const claimId = data?.claim_id;
        if (!claimId) return errorResponse('Missing claim_id');
        const result = await interpretClaim(supabase, project_id, claimId);
        return successResponse(result);
      }
      case 'generate-question': {
        const conflictId = data?.conflict_id;
        if (!conflictId) return errorResponse('Missing conflict_id');
        const result = await generateQuestion(supabase, project_id, conflictId);
        return successResponse(result);
      }
      case 'generate-hypothesis': {
        const questionId = data?.research_question_id;
        if (!questionId) return errorResponse('Missing research_question_id');
        const result = await generateHypothesis(supabase, project_id, questionId);
        return successResponse(result);
      }
      case 'generate-debrief': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await generateDebrief(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'detect-patterns': {
        const result = await detectPatterns(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-rules': {
        const result = await generateRules(supabase, project_id);
        return successResponse(result);
      }
      case 'build-profile': {
        const result = await buildProfile(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-trade-memory': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await generateTradeMemory(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'rag-chat': {
        const conversationId = data?.conversation_id;
        const message = data?.message;
        if (!conversationId || !message) return errorResponse('Missing conversation_id or message');
        const result = await ragChat(supabase, project_id, conversationId, message);
        return successResponse(result);
      }
      case 'rag-search': {
        const query = data?.query;
        if (!query) return errorResponse('Missing query');
        const result = await ragSearch(supabase, project_id, query);
        return successResponse(result);
      }
      case 'analyze-trade': {
        const tradeId = data?.trade_id;
        if (!tradeId) return errorResponse('Missing trade_id');
        const result = await analyzeTrade(supabase, project_id, tradeId);
        return successResponse(result);
      }
      case 'generate-summary': {
        const summaryType = data?.summary_type;
        const period = data?.period;
        if (!summaryType || !period) return errorResponse('Missing summary_type or period');
        const result = await generateSummary(supabase, project_id, summaryType, period);
        return successResponse(result);
      }
      case 'refresh-knowledge-rules': {
        const result = await refreshKnowledgeRules(supabase, project_id);
        return successResponse(result);
      }
      case 'refresh-knowledge-graph': {
        const result = await refreshKnowledgeGraph(supabase, project_id);
        return successResponse(result);
      }
      case 'evaluate-current': {
        const env = data?.environment;
        if (!env) return errorResponse('Missing environment');
        const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, weekly_bias, daily_bias').eq('project_id', project_id).is('deleted_at', null).limit(50);
        const envStr = Object.entries(env).map(([k, v]) => `${k}: ${v}`).join(', ');
        const result = await callAI(
          'You are a trade decision support AI. Evaluate a potential trade against the trader\'s history. Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text. Return a JSON object with keys: market_alignment (object with score 0-100, details string), ict_components (object with score 0-100, present array, missing array, details string), session_alignment (object with score 0-100, active_sessions array, details string), pattern_match (object with found bool, win_rate number, occurrences number, confidence number, avg_rr number), confidence (object with score 0-100, level string), execution (object with status string, criteria array, satisfied number, total number), explanation (array of strings).',
          `Trader history: ${JSON.stringify((trades || []).slice(0, 20))}\n\nProposed trade environment: ${envStr}`
        );
        if (isAiError(result)) return successResponse({
          market_alignment: { score: 0, details: '' },
          ict_components: { score: 0, present: [], missing: [], details: '' },
          session_alignment: { score: 0, active_sessions: [], details: '' },
          pattern_match: { found: false, win_rate: 0, occurrences: 0, confidence: 0, avg_rr: 0 },
          similarity: { matches_found: 0, average_win_rate: 0, average_rr: 0, average_pnl: 0, average_drawdown: 0, top_matches: [] },
          statistics: { overall_win_rate: 0, overall_avg_rr: 0, overall_expectancy: 0, overall_total_trades: 0, overall_profit_factor: 0, overall_max_drawdown: 0 },
          confidence: { score: 0, level: 'unknown' },
          execution: { status: 'pending', criteria: [], satisfied: 0, total: 0 },
          explanation: ['AI evaluation not available. Configure OPENROUTER_API_KEY to enable this feature.'],
        });
        const parsed = JSON.parse(result);
        return successResponse({
          market_alignment: parsed.market_alignment || { score: 0, details: '' },
          ict_components: parsed.ict_components || { score: 0, present: [], missing: [], details: '' },
          session_alignment: parsed.session_alignment || { score: 0, active_sessions: [], details: '' },
          pattern_match: parsed.pattern_match || { found: false, win_rate: 0, occurrences: 0, confidence: 0, avg_rr: 0 },
          similarity: parsed.similarity || { matches_found: 0, average_win_rate: 0, average_rr: 0, average_pnl: 0, average_drawdown: 0, top_matches: [] },
          statistics: parsed.statistics || { overall_win_rate: 0, overall_avg_rr: 0, overall_expectancy: 0, overall_total_trades: 0, overall_profit_factor: 0, overall_max_drawdown: 0 },
          confidence: parsed.confidence || { score: 0, level: 'unknown' },
          execution: parsed.execution || { status: 'pending', criteria: [], satisfied: 0, total: 0 },
          explanation: parsed.explanation || ['Evaluation not available'],
        });
      }
      case 'learning-status': {
        const [trades, sources, claims, concepts, interpretations, patterns, mstructs, events, lastEvent, lastSnapshot] = await Promise.all([
          supabase.from('trade').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('source').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('claim').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('concept').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('interpretation').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('personal_pattern').select('id').eq('project_id', project_id),
          supabase.from('market_structure').select('id').eq('project_id', project_id),
          supabase.from('learning_event').select('id').eq('project_id', project_id),
          supabase.from('learning_event').select('event_type, status, created_at').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('knowledge_snapshot').select('created_at, knowledge_growth').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        return successResponse({
          total_trades: (trades.data || []).length,
          total_sources: (sources.data || []).length,
          total_claims: (claims.data || []).length,
          total_concepts: (concepts.data || []).length,
          total_interpretations: (interpretations.data || []).length,
          total_patterns: (patterns.data || []).length,
          total_market_structures: (mstructs.data || []).length,
          total_events: (events.data || []).length,
          last_event: lastEvent.data || null,
          last_snapshot: lastSnapshot.data || null,
        });
      }
      case 'rebuild-learning': {
        const [tRes, sRes, clRes, coRes, iRes, pRes, mRes] = await Promise.all([
          supabase.from('trade').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('source').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('claim').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('concept').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('interpretation').select('id').eq('project_id', project_id).is('deleted_at', null),
          supabase.from('personal_pattern').select('id').eq('project_id', project_id),
          supabase.from('market_structure').select('id').eq('project_id', project_id),
        ]);
        const totals = {
          total_trades: (tRes.data || []).length,
          total_patterns: (pRes.data || []).length,
          total_claims: (clRes.data || []).length,
          total_concepts: (coRes.data || []).length,
          total_sources: (sRes.data || []).length,
          total_interpretations: (iRes.data || []).length,
          total_similarities: 0,
        };
        const startedAt = Date.now();
        const { data: snapshot } = await supabase.from('knowledge_snapshot').insert({
          project_id,
          ...totals,
          win_rate: 0, avg_rr: 0, expectancy: 0, knowledge_growth: 0,
        }).select().single();
        const { data: event } = await supabase.from('learning_event').insert({
          project_id, event_type: 'rebuild', entity_type: 'knowledge_snapshot', status: 'SUCCESS', duration_ms: Date.now() - startedAt, summary: `Rebuilt knowledge: ${JSON.stringify(totals)}`,
        }).select().single();
        return successResponse({
          event_id: event?.id || '',
          status: 'SUCCESS',
          duration_ms: Date.now() - startedAt,
          steps_completed: ['count_trades', 'count_sources', 'count_claims', 'count_concepts', 'count_interpretations', 'count_patterns', 'count_market_structures', 'create_snapshot', 'log_event'],
          errors: [],
        });
      }
      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

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

  let profile: any;
  try { profile = JSON.parse(result); } catch { return { warning: 'Failed to parse AI profile response' }; }
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

async function generateInsights(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, entry_price, exit_price, notes').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(20);
  if (!trades || trades.length === 0) return { insights: [], warning: 'Not enough trades to generate insights' };

  const result = await callAI(
    'You are a trading insight generator. Analyze recent trades and generate actionable insights. Return a JSON array of objects with keys: title (short title), description (1-2 sentence insight), category (one of: pattern, risk, psychology, strategy, execution, market), priority (high/medium/low).',
    `Generate insights from these recent trades:\n\n${JSON.stringify(trades)}`
  );
  if (isAiError(result)) return { insights: [], warning: JSON.parse(result)._error };

  let insightList: any[];
  try { insightList = JSON.parse(result); } catch { return { insights: [], warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(insightList)) return { insights: [], warning: 'AI returned unexpected format' };

  const created = [];
  for (const insight of insightList) {
    const { data: row } = await supabase.from('ai_insight').insert({
      project_id: projectId,
      title: insight.title,
      description: insight.description,
      category: insight.category || 'general',
      priority: insight.priority || 'medium',
      source: 'ai',
    }).select().single();
    if (row) created.push(row);
  }
  return { insights: created };
}

async function detectObservations(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, entry_price, exit_price, notes, created_at').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(30);
  if (!trades || trades.length < 3) return { observations: [], warning: 'Not enough trades to detect patterns' };

  const result = await callAI(
    'You are a trading psychology analyst. Analyze recent trades and identify behavioral patterns and observations. Return a JSON array of objects with keys: title (short title), description (1-2 sentence observation), category (one of: behavior, psychology, habit, pattern, risk, discipline), severity (high/medium/low).',
    `Analyze these trades for behavioral observations:\n\n${JSON.stringify(trades)}`
  );
  if (isAiError(result)) return { observations: [], warning: JSON.parse(result)._error };

  let obsList: any[];
  try { obsList = JSON.parse(result); } catch { return { observations: [], warning: 'Failed to parse AI response' }; }
  if (!Array.isArray(obsList)) return { observations: [], warning: 'AI returned unexpected format' };

  const created = [];
  for (const obs of obsList) {
    const { data: row } = await supabase.from('learning_observation').insert({
      project_id: projectId,
      title: obs.title,
      description: obs.description,
      category: obs.category || 'behavior',
      severity: obs.severity || 'medium',
      source: 'ai',
    }).select().single();
    if (row) created.push(row);
  }
  return { observations: created };
}

async function generateCoaching(supabase: ReturnType<typeof createClient>, projectId: string, coachingType?: string) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, entry_price, exit_price, notes, created_at').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(20);
  if (!trades || trades.length < 3) return { coaching: null, warning: 'Not enough trades for coaching' };

  const result = await callAI(
    'You are a trading coach. Analyze recent trades and provide actionable coaching advice. Return a JSON object with keys: title (coaching topic), summary (2-3 sentence actionable advice), category (technical/psychological/risk/strategy/discipline), priority (high/medium/low), action_items (array of strings).',
    `Generate coaching advice for these recent trades:\n\n${JSON.stringify(trades)}`
  );
  if (isAiError(result)) return { coaching: null, warning: JSON.parse(result)._error };

  let coaching: any;
  try { coaching = JSON.parse(result); } catch { return { coaching: null, warning: 'Failed to parse AI response' }; }

  const { data: row } = await supabase.from('coaching_session').insert({
    project_id: projectId,
    session_type: coachingType || 'general',
    title: coaching.title || 'Coaching Session',
    summary: coaching.summary || '',
    category: coaching.category || 'general',
    priority: coaching.priority || 'medium',
    action_items: coaching.action_items || [],
    is_read: false,
  }).select().single();
  return { coaching: row };
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

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openaiApiKey) return null;
  try {
    const resp = await fetch(`${openaiBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
        'HTTP-Referer': 'https://minoredb.vercel.app',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

function chunkText(text: string, maxTokens = 500): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const word of words) {
    const estimatedTokens = Math.ceil(word.length / 4) || 1;
    if (currentTokens + estimatedTokens > maxTokens && current.length > 0) {
      chunks.push(current.join(' '));
      current = [];
      currentTokens = 0;
    }
    current.push(word);
    currentTokens += estimatedTokens;
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}

async function ingestDocument(supabase: ReturnType<typeof createClient>, projectId: string, sourceId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', sourceId).single();
  if (!source) throw new Error('Source not found');

  const text = source.normalized_text || source.raw_text;
  if (!text) return { chunks_created: 0, warning: 'Source has no text content' };

  const wordCount = text.split(/\s+/).length;
  const pageEstimate = Math.ceil(wordCount / 300) || 1;
  const chunks = chunkText(text);
  if (chunks.length === 0) return { chunks_created: 0, warning: 'Text too short to chunk' };

  const filename = source.source_metadata?.original_name ?? source.id;

  const { data: ingestion, error: ingestError } = await supabase.from('ai_document_ingestion').insert({
    project_id: projectId,
    source_id: sourceId,
    filename,
    source_type: 'source',
    status: 'processing',
    progress: { stage: 'chunking', pct: 10 },
    page_count: pageEstimate,
    word_count: wordCount,
  }).select().single();

  if (ingestError || !ingestion) throw new Error('Failed to create ingestion record');

  let created = 0;
  for (let i = 0; i < chunks.length; i++) {
    await supabase.from('ai_document_ingestion').update({
      progress: { stage: 'embeddings', pct: Math.round(10 + (i / chunks.length) * 80) },
    }).eq('id', ingestion.id);

    const embedding = await generateEmbedding(chunks[i]);
    const pageNum = Math.min(Math.ceil((chunks.slice(0, i + 1).join(' ').split(/\s+/).length) / 300) || 1, pageEstimate);
    const { error: chunkError } = await supabase.from('ai_document_chunk').insert({
      project_id: projectId,
      ingestion_id: ingestion.id,
      chunk_index: i,
      content: chunks[i],
      page: pageNum,
      embedding: embedding ?? undefined,
      token_count: Math.ceil(chunks[i].split(/\s+/).length),
    });
    if (!chunkError) created++;
  }

  await supabase.from('ai_document_ingestion').update({
    status: 'completed',
    chunk_count: created,
    progress: { stage: 'indexed', pct: 100 },
  }).eq('id', ingestion.id);

  const docIds = [sourceId];

  const autoExtract = async (label: string, fn: () => Promise<any>) => {
    try {
      const result = await fn();
      await supabase.from('learning_event').insert({
        project_id: projectId, event_type: 'document_analysis', entity_type: 'source',
        status: 'completed', summary: `${label}: ${JSON.stringify(result).substring(0, 200)}`,
      });
    } catch (e: any) {
      await supabase.from('learning_event').insert({
        project_id: projectId, event_type: 'document_analysis', entity_type: 'source',
        status: 'failed', summary: `${label}: ${e?.message || 'unknown error'}`,
      });
    }
  };

  await Promise.allSettled([
    autoExtract('Summary', () => {
      const prompt = `Summarize this trading document concisely. Extract: summary (2-3 sentences), keywords (up to 10), trading_relevance (high/medium/low), action_items (array of strings). Return JSON.`;
      return callAI(prompt, text.substring(0, 6000), defaultModel, 1024);
    }),
    autoExtract('Rules', () => extractRules(supabase, projectId, sourceId)),
    autoExtract('Flashcards', () => generateFlashcards(supabase, projectId, docIds)),
    autoExtract('Questions', () => suggestQuestions(supabase, projectId, sourceId)),
    autoExtract('StudyNotes', () => generateStudyNotes(supabase, projectId, docIds)),
  ]);

  return {
    chunks_created: created,
    total_chunks: chunks.length,
    ingestion_id: ingestion.id,
    page_count: pageEstimate,
    word_count: wordCount,
  };
}

async function researchChat(supabase: ReturnType<typeof createClient>, projectId: string, conversationId: string, message: string, documentIds?: string[]) {
  const { data: conversation } = await supabase.from('ai_conversation').select('*').eq('id', conversationId).single();
  if (!conversation) throw new Error('Conversation not found');

  const { data: history } = await supabase.from('ai_message').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(20);
  const chatHistory = (history || []).map((m: any) => `${m.role}: ${m.content}`).join('\n');

  let documentContext = '';
  if (documentIds && documentIds.length > 0) {
    const { data: docs } = await supabase.from('source').select('id, name, normalized_text, raw_text').in('id', documentIds);
    for (const doc of docs || []) {
      const text = doc.normalized_text || doc.raw_text || '';
      documentContext += `\n\n--- Document: ${doc.name || doc.id} ---\n${text.substring(0, 4000)}`;
    }
  } else {
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

  const systemPrompt = `You are Minore Research, a trading research AI assistant. You analyze uploaded documents to answer questions.

CRITICAL RULES:
- Answer ONLY from the provided document context. Do NOT use external knowledge unless the user explicitly asks.
- Every factual claim MUST include a citation in the format: [Source: filename, Page N]
- If the context doesn't contain enough information, say "I don't have enough information in the uploaded documents to answer that."
- Be precise, specific, and reference exact text from the documents.
- When asked to summarize, extract rules, find patterns, etc., structure your response clearly.

Available context from uploaded documents:${documentContext}`;

  const result = await callAI(systemPrompt, `Chat history:\n${chatHistory}\n\nUser: ${message}`, defaultModel, 4096);
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

async function semanticSearch(supabase: ReturnType<typeof createClient>, projectId: string, query: string, documentIds?: string[]) {
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

async function journalAnalyze(supabase: ReturnType<typeof createClient>, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('*').eq('id', documentId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { warning: 'No text content' };

  const result = await callAI(
    `You are a trading journal analyst. Analyze this journal entry and identify:
1. Repeated mistakes - list each mistake with specific examples from the text
2. Trading patterns - identify recurring patterns in behavior
3. Psychological observations - note emotional/psychological patterns
4. Strengths - what the trader does well
5. Actionable improvements - specific recommendations

Return a JSON object with keys: mistakes (array of {mistake, examples[], severity}), patterns (array of {pattern, frequency, impact}), psychology (array of {observation, evidence}), strengths (array of string), improvements (array of string).`,
    `Analyze this trading journal:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  try {
    const analysis = JSON.parse(result);
    const { data: stored } = await supabase.from('document_journal_analysis').insert({
      project_id: projectId,
      document_id: documentId,
      analysis_type: 'journal_analysis',
      content: analysis,
    }).select().single();
    return { analysis: stored || analysis };
  } catch {
    return { analysis: { raw: result } };
  }
}

async function generateFlashcards(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', docId).single();
    if (source) {
      context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
    }
  }
  if (!context) return { flashcards: [], warning: 'No document content found' };

  const result = await callAI(
    'You are a flashcard generator. Create study flashcards from the provided document content. Return a JSON array of objects with keys: front (question/concept), back (answer/definition), topic, difficulty (beginner/intermediate/advanced). Generate 10-20 flashcards.',
    `Generate flashcards from:\n${context}`
  );
  if (isAiError(result)) return { flashcards: [], warning: JSON.parse(result)._error };
  try { return { flashcards: JSON.parse(result) }; } catch { return { flashcards: [], warning: 'Failed to parse AI response' }; }
}

async function compareDocuments(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let contexts: any[] = [];
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('id, name, normalized_text, raw_text').eq('id', docId).single();
    if (source) {
      contexts.push({
        id: source.id,
        name: source.name || source.id,
        text: (source.normalized_text || source.raw_text || '').substring(0, 4000),
      });
    }
  }
  if (contexts.length < 2) return { comparison: null, warning: 'Need at least 2 documents to compare' };

  const docsText = contexts.map(d => `--- Document: ${d.name} ---\n${d.text}`).join('\n\n');
  const result = await callAI(
    `You are a document comparison expert. Compare the provided documents and identify:
1. Key similarities between documents
2. Key differences
3. Complementary information (what each document adds)
4. Contradictions or conflicts
5. Synthesis - integrated summary

Return a JSON object with keys: similarities (array), differences (array), complementary (array), contradictions (array), synthesis (string).`,
    `Compare these documents:\n\n${docsText}`
  );
  if (isAiError(result)) return { comparison: null, warning: JSON.parse(result)._error };
  try { return { comparison: JSON.parse(result) }; } catch { return { comparison: null, warning: 'Failed to parse AI response' }; }
}

async function extractRules(supabase: ReturnType<typeof createClient>, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', documentId).single();
  if (!source) throw new Error('Source not found');
  const text = source.normalized_text || source.raw_text;
  if (!text) return { rules: [], warning: 'No text content' };

  const result = await callAI(
    'You are a trading rules extraction expert. Extract every trading rule, principle, and key concept from the document. Return a JSON array of objects with keys: rule (the rule statement), category (entry/exit/risk/psychology/management/confluence/other), page (approximate page number if inferable), importance (critical/important/supplementary).',
    `Extract trading rules from:\n\n${text.substring(0, 8000)}`
  );
  if (isAiError(result)) return { rules: [], warning: JSON.parse(result)._error };
  try { return { rules: JSON.parse(result) }; } catch { return { rules: [], warning: 'Failed to parse AI response' }; }
}

async function generateQuiz(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
  }
  if (!context) return { questions: [], warning: 'No document content found' };

  const result = await callAI(
    'You are a quiz generator. Create test questions from the provided document content. Generate 10 questions with varying difficulty. Return a JSON array of objects with keys: question (string), options (array of 4 strings), correct_index (0-3), explanation (string), topic (string), difficulty (easy/medium/hard).',
    `Generate quiz questions from:\n${context}`
  );
  if (isAiError(result)) return { questions: [], warning: JSON.parse(result)._error };
  try { return { questions: JSON.parse(result) }; } catch { return { questions: [], warning: 'Failed to parse AI response' }; }
}

async function generateStudyNotes(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 4000)}`;
  }
  if (!context) return { notes: null, warning: 'No document content found' };

  const result = await callAI(
    `You are a study notes generator. Create comprehensive, well-structured study notes from the provided documents. Organize by topics and subtopics. Include key concepts, definitions, examples, and important quotes.

Return a JSON object with keys: title (string), topics (array of {topic, subtopics: array of {subtopic, content, key_points: string[], quotes: string[]}}), summary (string), key_takeaways (string[]).`,
    `Generate study notes from:\n${context}`
  );
  if (isAiError(result)) return { notes: null, warning: JSON.parse(result)._error };
  try { return { notes: JSON.parse(result) }; } catch { return { notes: null, warning: 'Failed to parse AI response' }; }
}

async function findConfluences(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 3000)}`;
  }
  if (!context) return { confluences: [], warning: 'No document content found' };
  if (documentIds.length < 2) return { confluences: [], warning: 'Need at least 2 documents to find confluences' };

  const result = await callAI(
    `You are a trading confluence analyst. Analyze the provided documents and identify areas of confluence (agreement/correlation) between them.

For example, if one document talks about liquidity sweeps and another discusses entries after sweeps, that's a confluence.

Return a JSON array of objects with keys: concept (string), documents (string[] - document names), description (string), confidence (0-1), trading_application (string).`,
    `Find confluences across these documents:\n${context}`
  );
  if (isAiError(result)) return { confluences: [], warning: JSON.parse(result)._error };
  try { return { confluences: JSON.parse(result) }; } catch { return { confluences: [], warning: 'Failed to parse AI response' }; }
}

async function suggestQuestions(supabase: ReturnType<typeof createClient>, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', documentId).single();
  if (!source) return { questions: [], warning: 'Document not found' };
  const text = (source.normalized_text || source.raw_text || '').substring(0, 4000);

  const result = await callAI(
    `You are an AI research assistant. Given a document, generate 6-8 specific, insightful questions that a trader could ask about this document to deepen their understanding.

Return ONLY a JSON array of strings. Each question should:
- Be specific to the document content (not generic)
- Test understanding of key concepts
- Ask about practical trading applications
- Probe for contradictions or unclear points
- Challenge assumptions in the document

Example: "How does the concept of liquidity sweeps in this document differ from conventional ICT teachings when applied to lower timeframes?"`,
    `Generate suggested questions for this document (${source.name || 'Untitled'}):\n\n${text}`
  );
  if (isAiError(result)) return { questions: [], warning: JSON.parse(result)._error };
  try { const parsed = JSON.parse(result); return { questions: Array.isArray(parsed) ? parsed : parsed.questions || [] }; }
  catch { return { questions: [], warning: 'Failed to parse AI response' }; }
}

async function findRelatedDocuments(supabase: ReturnType<typeof createClient>, projectId: string, documentId: string) {
  const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', documentId).single();
  if (!source) return { related: [], warning: 'Document not found' };

  const query = (source.normalized_text || source.raw_text || '').substring(0, 2000);
  if (!openaiApiKey) return { related: [], method: 'disabled' };

  const embeddingResponse = await fetch(`${openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  });
  if (!embeddingResponse.ok) return { related: [], method: 'disabled' };
  const embedJson = await embeddingResponse.json();
  const embedding = embedJson.data[0].embedding;

  const { data: results } = await supabase.rpc('search_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
    p_project_id: projectId,
  });

  const related = (results || [])
    .filter((r: any) => r.source_id !== documentId)
    .map((r: any) => ({
      source_id: r.source_id,
      title: r.filename || r.source_id.slice(0, 8),
      similarity: r.similarity,
      snippet: r.content?.substring(0, 200) || '',
    }));

  return { related, method: 'vector' };
}

async function crossDocumentReasoning(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  for (const docId of documentIds) {
    const { data: source } = await supabase.from('source').select('name, normalized_text, raw_text').eq('id', docId).single();
    if (source) context += `\n\n--- ${source.name || docId} ---\n${(source.normalized_text || source.raw_text || '').substring(0, 2500)}`;
  }
  if (!context) return { reasoning: null, warning: 'No document content found' };

  const result = await callAI(
    `You are a cross-document reasoning engine for trading research. Analyze the provided documents and produce a structured analysis.

Return ONLY valid JSON with this structure:
{
  "shared_concepts": [{"concept": "string", "documents": ["doc1", "doc2"], "explanation": "string"}],
  "contradictions": [{"concept": "string", "docs_disagreeing": ["doc1", "doc2"], "explanation": "string", "resolution_suggestion": "string"}],
  "complementary_insights": [{"insight": "string", "source_docs": ["doc1"], "supported_by": ["doc2"], "trading_application": "string"}],
  "synthesis": "string - a unified summary that integrates all documents",
  "gaps": ["string - areas not covered that would be useful to research"]
}`,
    `Perform cross-document reasoning on these documents:\n${context}`
  );
  if (isAiError(result)) return { reasoning: null, warning: JSON.parse(result)._error };
  try { return { reasoning: JSON.parse(result) }; }
  catch { return { reasoning: null, warning: 'Failed to parse AI response' }; }
}

async function getRecommendations(supabase: ReturnType<typeof createClient>, projectId: string, documentIds: string[]) {
  let context = '';
  const { data: allSources } = await supabase.from('source')
    .select('id, name, normalized_text, raw_text, origin_type')
    .eq('project_id', projectId)
    .limit(10);
  const docsToAnalyze = documentIds.length > 0
    ? (allSources || []).filter((s: any) => documentIds.includes(s.id))
    : (allSources || []).slice(0, 5);

  for (const source of docsToAnalyze) {
    context += `\n\n--- ${source.name || source.id} (${source.origin_type || 'unknown'}) ---\n${(source.normalized_text || source.raw_text || '').substring(0, 2000)}`;
  }
  if (!context) return { recommendations: [], warning: 'No documents available for analysis' };

  const result = await callAI(
    `You are a trading intelligence AI. Based on the user's uploaded documents (trading journals, educational materials, research papers), generate personalized actionable recommendations.

Return ONLY valid JSON with this structure:
{
  "recommendations": [
    {
      "category": "trading_rule|risk_management|psychology|strategy|learning",
      "priority": "high|medium|low",
      "title": "string",
      "description": "string",
      "rationale": "string - why this recommendation is relevant to THIS trader's specific materials",
      "document_references": ["document names that support this"],
      "action_items": ["specific actionable step 1", "step 2"]
    }
  ],
  "summary": "string - a brief summary of the overall recommendation theme"
}

Generate 3-6 recommendations. Be specific to the content, not generic advice.`,
    `Analyze these uploaded documents and generate personalized trading recommendations:\n${context}`
  );
  if (isAiError(result)) return { recommendations: [], warning: JSON.parse(result)._error };
  try { const parsed = JSON.parse(result); return { recommendations: parsed.recommendations || [], summary: parsed.summary || '' }; }
  catch { return { recommendations: [], warning: 'Failed to parse AI response' }; }
}

async function getKnowledgeGraphData(supabase: ReturnType<typeof createClient>, projectId: string) {
  const { data: nodes } = await supabase.from('knowledge_node')
    .select('id, name, type')
    .eq('project_id', projectId)
    .limit(100);
  const { data: edges } = await supabase.from('knowledge_edge')
    .select('id, source_node_id, target_node_id, relationship, strength')
    .eq('project_id', projectId)
    .limit(200);

  if (!nodes || nodes.length === 0) {
    const { data: concepts } = await supabase.from('knowledge_concept')
      .select('id, title, summary, category_id, knowledge_category!inner(name, color)')
      .eq('project_id', projectId)
      .limit(100);
    const { data: relationships } = await supabase.from('knowledge_relationship')
      .select('id, source_concept_id, target_concept_id, relationship_type, strength')
      .eq('project_id', projectId)
      .limit(200);

    const graphNodes = (concepts || []).map((c: any) => ({
      id: c.id,
      name: c.title,
      type: 'concept',
      category: c.knowledge_category?.name || 'General',
      color: c.knowledge_category?.color || '#6366f1',
      summary: c.summary || '',
    }));
    const graphEdges = (relationships || []).map((r: any) => ({
      id: r.id,
      source: r.source_concept_id,
      target: r.target_concept_id,
      relationship: r.relationship_type,
      strength: r.strength || 0.5,
    }));
    return { nodes: graphNodes, edges: graphEdges };
  }

  return {
    nodes: nodes.map((n: any) => ({ id: n.id, name: n.name, type: n.type })),
    edges: edges.map((e: any) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      relationship: e.relationship,
      strength: e.strength,
    })),
  };
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
      case 'generate-insights': {
        const result = await generateInsights(supabase, project_id);
        return successResponse(result);
      }
      case 'detect-observations': {
        const result = await detectObservations(supabase, project_id);
        return successResponse(result);
      }
      case 'generate-coaching': {
        const coachingType = data?.coaching_type;
        const result = await generateCoaching(supabase, project_id, coachingType);
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
      case 'ingest-document': {
        const sourceId = data?.source_id;
        if (!sourceId) return errorResponse('Missing source_id');
        const result = await ingestDocument(getServiceClient(), project_id, sourceId);
        return successResponse(result);
      }
      case 'research-chat': {
        const conversationId = data?.conversation_id;
        const message = data?.message;
        const documentIds = data?.document_ids;
        if (!conversationId || !message) return errorResponse('Missing conversation_id or message');
        const result = await researchChat(supabase, project_id, conversationId, message, documentIds);
        return successResponse(result);
      }
      case 'semantic-search': {
        const query = data?.query;
        const docIds = data?.document_ids;
        if (!query) return errorResponse('Missing query');
        const result = await semanticSearch(supabase, project_id, query, docIds);
        return successResponse(result);
      }
      case 'journal-analyze': {
        const docId = data?.document_id;
        if (!docId) return errorResponse('Missing document_id');
        const result = await journalAnalyze(supabase, project_id, docId);
        return successResponse(result);
      }
      case 'generate-flashcards': {
        const flashDocIds = data?.document_ids;
        if (!flashDocIds || !Array.isArray(flashDocIds)) return errorResponse('Missing document_ids array');
        const result = await generateFlashcards(supabase, project_id, flashDocIds);
        return successResponse(result);
      }
      case 'compare-documents': {
        const compDocIds = data?.document_ids;
        if (!compDocIds || !Array.isArray(compDocIds) || compDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const compResult = await compareDocuments(supabase, project_id, compDocIds);
        return successResponse(compResult);
      }
      case 'extract-rules': {
        const ruleDocId = data?.document_id;
        if (!ruleDocId) return errorResponse('Missing document_id');
        const ruleResult = await extractRules(supabase, project_id, ruleDocId);
        return successResponse(ruleResult);
      }
      case 'generate-quiz': {
        const quizDocIds = data?.document_ids;
        if (!quizDocIds || !Array.isArray(quizDocIds)) return errorResponse('Missing document_ids array');
        const quizResult = await generateQuiz(supabase, project_id, quizDocIds);
        return successResponse(quizResult);
      }
      case 'generate-study-notes': {
        const notesDocIds = data?.document_ids;
        if (!notesDocIds || !Array.isArray(notesDocIds)) return errorResponse('Missing document_ids array');
        const notesResult = await generateStudyNotes(supabase, project_id, notesDocIds);
        return successResponse(notesResult);
      }
      case 'find-confluences': {
        const confDocIds = data?.document_ids;
        if (!confDocIds || !Array.isArray(confDocIds) || confDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const confResult = await findConfluences(supabase, project_id, confDocIds);
        return successResponse(confResult);
      }
      case 'knowledge-graph-data': {
        const graphResult = await getKnowledgeGraphData(supabase, project_id);
        return successResponse(graphResult);
      }
      case 'suggest-questions': {
        const suggestDocId = data?.document_id;
        if (!suggestDocId) return errorResponse('Missing document_id');
        const questionsResult = await suggestQuestions(supabase, project_id, suggestDocId);
        return successResponse(questionsResult);
      }
      case 'find-related': {
        const relatedDocId = data?.document_id;
        if (!relatedDocId) return errorResponse('Missing document_id');
        const relatedResult = await findRelatedDocuments(supabase, project_id, relatedDocId);
        return successResponse(relatedResult);
      }
      case 'cross-document-reasoning': {
        const crossDocIds = data?.document_ids;
        if (!crossDocIds || !Array.isArray(crossDocIds) || crossDocIds.length < 2) return errorResponse('Need at least 2 document_ids');
        const crossResult = await crossDocumentReasoning(supabase, project_id, crossDocIds);
        return successResponse(crossResult);
      }
      case 'get-recommendations': {
        const recDocIds = data?.document_ids || [];
        const recResult = await getRecommendations(supabase, project_id, recDocIds);
        return successResponse(recResult);
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

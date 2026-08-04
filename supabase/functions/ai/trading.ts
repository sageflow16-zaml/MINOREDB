import { callAI, isAiError } from './index.ts';

export async function generateDebrief(supabase: any, projectId: string, tradeId: string) {
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

export async function detectPatterns(supabase: any, projectId: string) {
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

export async function generateRules(supabase: any, projectId: string) {
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

export async function buildProfile(supabase: any, projectId: string) {
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

export async function generateCoaching(supabase: any, projectId: string, coachingType?: string, sessionDate?: string) {
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
    session_date: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString(),
    summary: `${coaching.title || 'Coaching Session'}: ${coaching.summary || ''}`,
    key_findings: [coaching.category || 'general', coaching.priority || 'medium'],
    action_items: coaching.action_items || [],
    metrics_snapshot: { trade_count: (trades || []).length },
    is_read: false,
  }).select().single();
  return { coaching: row };
}

export async function generateTradeMemory(supabase: any, projectId: string, tradeId: string) {
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

export async function analyzeTrade(supabase: any, projectId: string, tradeId: string) {
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

export async function evaluateCurrent(supabase: any, projectId: string, environment: Record<string, any>) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, rr, weekly_bias, daily_bias').eq('project_id', projectId).is('deleted_at', null).limit(50);
  const envStr = Object.entries(environment).map(([k, v]) => `${k}: ${v}`).join(', ');
  const result = await callAI(
    'You are a trade decision support AI. Evaluate a potential trade against the trader\'s history. Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text. Return a JSON object with keys: market_alignment (object with score 0-100, details string), ict_components (object with score 0-100, present array, missing array, details string), session_alignment (object with score 0-100, active_sessions array, details string), pattern_match (object with found bool, win_rate number, occurrences number, confidence number, avg_rr number), confidence (object with score 0-100, level string), execution (object with status string, criteria array, satisfied number, total number), explanation (array of strings).',
    `Trader history: ${JSON.stringify((trades || []).slice(0, 20))}\n\nProposed trade environment: ${envStr}`
  );
  if (isAiError(result)) return {
    market_alignment: { score: 0, details: '' },
    ict_components: { score: 0, present: [], missing: [], details: '' },
    session_alignment: { score: 0, active_sessions: [], details: '' },
    pattern_match: { found: false, win_rate: 0, occurrences: 0, confidence: 0, avg_rr: 0 },
    similarity: { matches_found: 0, average_win_rate: 0, average_rr: 0, average_pnl: 0, average_drawdown: 0, top_matches: [] },
    statistics: { overall_win_rate: 0, overall_avg_rr: 0, overall_expectancy: 0, overall_total_trades: 0, overall_profit_factor: 0, overall_max_drawdown: 0 },
    confidence: { score: 0, level: 'unknown' },
    execution: { status: 'pending', criteria: [], satisfied: 0, total: 0 },
    explanation: ['AI evaluation not available. Configure OPENROUTER_API_KEY to enable this feature.'],
  };
  const parsed = JSON.parse(result);
  return {
    market_alignment: parsed.market_alignment || { score: 0, details: '' },
    ict_components: parsed.ict_components || { score: 0, present: [], missing: [], details: '' },
    session_alignment: parsed.session_alignment || { score: 0, active_sessions: [], details: '' },
    pattern_match: parsed.pattern_match || { found: false, win_rate: 0, occurrences: 0, confidence: 0, avg_rr: 0 },
    similarity: parsed.similarity || { matches_found: 0, average_win_rate: 0, average_rr: 0, average_pnl: 0, average_drawdown: 0, top_matches: [] },
    statistics: parsed.statistics || { overall_win_rate: 0, overall_avg_rr: 0, overall_expectancy: 0, overall_total_trades: 0, overall_profit_factor: 0, overall_max_drawdown: 0 },
    confidence: parsed.confidence || { score: 0, level: 'unknown' },
    execution: parsed.execution || { status: 'pending', criteria: [], satisfied: 0, total: 0 },
    explanation: parsed.explanation || ['Evaluation not available'],
  };
}

export async function learningStatus(supabase: any, projectId: string) {
  const [trades, sources, claims, concepts, interpretations, patterns, mstructs, events, lastEvent, lastSnapshot] = await Promise.all([
    supabase.from('trade').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('source').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('claim').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('concept').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('interpretation').select('id').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('personal_pattern').select('id').eq('project_id', projectId),
    supabase.from('market_structure').select('id').eq('project_id', projectId),
    supabase.from('learning_event').select('id').eq('project_id', projectId),
    supabase.from('learning_event').select('event_type, status, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('knowledge_snapshot').select('created_at, knowledge_growth').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
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
  };
}

export async function analyzeProfile(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(500);
  const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null);
  const wins = closed.filter((t: any) => t.result === 'WIN');
  const losses = closed.filter((t: any) => t.result === 'LOSS');
  const totalPnl = closed.reduce((s: number, t: any) => s + Number(t.pnl), 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgRr = closed.length ? closed.reduce((s: number, t: any) => s + (Number(t.rr) || 0), 0) / closed.length : 0;
  const avgRisk = closed.length ? closed.reduce((s: number, t: any) => s + (Number(t.risk_percent) || 0), 0) / closed.length : 0;

  let maxDrawdownPct = 0;
  let equity = 10000, peak = 10000;
  for (const t of closed) {
    equity += Number(t.pnl) || 0;
    if (equity > peak) peak = equity;
    if (peak > 0) maxDrawdownPct = Math.max(maxDrawdownPct, (peak - equity) / peak * 100);
  }

  let avgHoldingMin: number | null = null;
  const holding = closed.filter((t: any) => t.open_time && t.close_time)
    .map((t: any) => (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) / 60000);
  if (holding.length) avgHoldingMin = Math.round(holding.reduce((a: number, b: number) => a + b, 0) / holding.length);

  const sessions: Record<string, number> = {};
  const timeframes: Record<string, number> = {};
  const pairs: Record<string, number> = {};
  for (const t of closed) {
    for (const s of ['asian_session', 'london_session', 'newyork_session']) if (t[s]) sessions[t[s]] = (sessions[t[s]] || 0) + 1;
    if (t.timeframe) timeframes[t.timeframe] = (timeframes[t.timeframe] || 0) + 1;
    if (t.pair) pairs[t.pair] = (pairs[t.pair] || 0) + 1;
  }
  const top = (o: Record<string, number>, n: number) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  const emotions = [...new Set(closed.map((t: any) => t.emotion).filter(Boolean))];
  const { data: debriefs } = await supabase.from('trade_debrief').select('*').eq('project_id', projectId).limit(50);

  const statsBlock = JSON.stringify({
    trades: closed.length, wins: wins.length, losses: losses.length, winRate: Math.round(winRate),
    totalPnl: Math.round(totalPnl), avgRr: Number(avgRr.toFixed(2)), avgRiskPct: Number(avgRisk.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(1)), avgHoldingMin,
    topPairs: top(pairs, 5), topTimeframes: top(timeframes, 5), sessions: top(sessions, 3), emotions,
    debriefMistakes: (debriefs || []).slice(0, 10).map((d: any) => d.mistakes).filter(Boolean),
    debriefStrengths: (debriefs || []).slice(0, 10).map((d: any) => d.strengths).filter(Boolean),
  });

  const result = await callAI(
    'You are a trading psychologist. Build a trader profile from statistics. Return JSON ONLY with keys: trading_style (string), risk_profile (conservative/balanced/aggressive), best_conditions (object of string->string), worst_conditions (object of string->string), psychological_patterns (array of {pattern: string, frequency: number, impact: string}), most_common_mistakes (array of {note: string}), most_successful_behaviors (array of {behavior: string}), overall_score (0-100).',
    `Trading statistics:\n${statsBlock}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  let p: any;
  try { p = JSON.parse(result); } catch { return { warning: 'Failed to parse AI profile response' }; }

  const profile = {
    trading_style: p.trading_style || null,
    risk_profile: p.risk_profile || null,
    preferred_sessions: top(sessions, 3),
    preferred_markets: top(pairs, 3),
    preferred_timeframes: top(timeframes, 3),
    preferred_pairs: top(pairs, 3),
    avg_rr: Number(avgRr.toFixed(2)),
    avg_holding_time_min: avgHoldingMin,
    avg_risk_per_trade: Number(avgRisk.toFixed(2)),
    max_drawdown_pct: Number(maxDrawdownPct.toFixed(2)),
    best_conditions: p.best_conditions || {},
    worst_conditions: p.worst_conditions || {},
    psychological_patterns: p.psychological_patterns || [],
    most_common_mistakes: p.most_common_mistakes || [],
    most_successful_behaviors: p.most_successful_behaviors || [],
    overall_score: p.overall_score ?? Math.round(winRate * 0.7 + Math.min(Math.max(avgRr, 0), 3) / 3 * 30),
    total_trades_analyzed: closed.length,
    last_analyzed_at: new Date().toISOString(),
  };

  const { data: row, error } = await supabase.from('ai_profile').upsert(
    { project_id: projectId, ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'project_id' },
  ).select().single();
  if (error) throw error;
  return { profile: row, profile_built: true };
}

export async function generateRecommendations(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(300);
  const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null);
  const { data: patterns } = await supabase.from('personal_pattern').select('*').eq('project_id', projectId).eq('active', true).limit(20);
  const { data: rules } = await supabase.from('personal_rule').select('*').eq('project_id', projectId).eq('status', 'active').limit(20);

  const result = await callAI(
    'You are a trading improvement coach. Based on trade history, patterns and rules, return JSON ONLY: an array of objects with keys: recommendation_type (strategy/risk/psychology/process), title, description, rationale, priority (high/medium/low). Max 5 items.',
    `Trades (${closed.length}):\n${JSON.stringify(closed.slice(-30).map((t: any) => ({ pair: t.pair, result: t.result, pnl: t.pnl, rr: t.rr, emotion: t.emotion, notes: t.notes?.substring(0, 80) })))}\n\nPatterns:\n${JSON.stringify((patterns || []).map((p: any) => ({ name: p.name, category: p.category, description: p.description })))}\n\nRules:\n${JSON.stringify((rules || []).map((r: any) => ({ name: r.name, description: r.description })))}`
  );
  if (isAiError(result)) return { recommendations_created: 0, warning: JSON.parse(result)._error };

  let recs: any[];
  try { recs = JSON.parse(result); } catch { return { recommendations_created: 0, warning: 'Failed to parse AI response' }; }

  let created = 0;
  for (const r of recs) {
    const { error } = await supabase.from('ai_recommendation').insert({
      project_id: projectId,
      recommendation_type: r.recommendation_type || 'strategy',
      priority: r.priority || 'medium',
      title: r.title || 'Recommendation',
      description: r.description || '',
      rationale: r.rationale || '',
      is_dismissed: false,
      is_completed: false,
    });
    if (!error) created++;
  }
  return { recommendations_created: created };
}

export async function generatePerformanceSummary(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).limit(500);
  const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null);
  const wins = closed.filter((t: any) => t.result === 'WIN');
  const losses = closed.filter((t: any) => t.result === 'LOSS');
  const totalPnl = closed.reduce((s: number, t: any) => s + Number(t.pnl), 0);
  const stats = {
    trades: closed.length, wins: wins.length, losses: losses.length, breakevens: closed.length - wins.length - losses.length,
    winRate: closed.length ? Math.round(wins.length / closed.length * 100) : 0,
    totalPnl: Math.round(totalPnl), avgWin: wins.length ? wins.reduce((s: number, t: any) => s + Number(t.pnl), 0) / wins.length : 0,
    avgLoss: losses.length ? losses.reduce((s: number, t: any) => s + Number(t.pnl), 0) / losses.length : 0,
  };

  const result = await callAI(
    'You are a performance analyst. Write a concise performance summary. Return JSON ONLY with keys: text_summary (2-3 sentences), keywords (array of strings), sentiment (positive/neutral/negative), content (object with any extra metrics).',
    `Performance statistics:\n${JSON.stringify(stats)}`
  );
  if (isAiError(result)) return { warning: JSON.parse(result)._error };

  let s: any;
  try { s = JSON.parse(result); } catch { return { warning: 'Failed to parse AI response' }; }

  const { data: row, error } = await supabase.from('ai_summary').insert({
    project_id: projectId,
    summary_type: 'performance',
    period: 'all',
    content: s.content || {},
    text_summary: s.text_summary || '',
    keywords: s.keywords || [],
    sentiment: s.sentiment || 'neutral',
    importance: 'medium',
  }).select().single();
  if (error) throw error;
  return row;
}

export async function buildContext(supabase: any, projectId: string, options: Record<string, any> = {}) {
  const { data: profile } = await supabase.from('ai_profile').select('*').eq('project_id', projectId).maybeSingle();
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(20);
  const { data: patterns } = await supabase.from('detected_pattern').select('*').eq('project_id', projectId).eq('is_active', true).limit(10);
  const { data: insights } = await supabase.from('ai_insight').select('*').eq('project_id', projectId).eq('is_dismissed', false).limit(5);
  const { data: rules } = await supabase.from('knowledge_rule').select('*').eq('project_id', projectId).limit(10);

  const context = {
    generated_at: new Date().toISOString(),
    project_id: projectId,
    profile: profile || null,
    recent_trades: (trades || []).map((t: any) => ({
      pair: t.pair, direction: t.direction, result: t.result, pnl: t.pnl, rr: t.rr, status: t.status, emotion: t.emotion,
    })),
    active_patterns: (patterns || []).map((p: any) => ({ pattern_type: p.pattern_type, confidence: p.confidence, win_rate: p.win_rate })),
    latest_insights: (insights || []).map((i: any) => ({ title: i.title, description: i.description, confidence: i.confidence })),
    knowledge_rules: (rules || []).map((r: any) => ({ title: r.title, description: r.description })),
    ...options,
  };

  await supabase.from('ai_context_snapshot').insert({
    project_id: projectId,
    snapshot_type: 'context',
    context,
  });

  return context;
}

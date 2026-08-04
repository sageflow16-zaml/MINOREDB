import { callAI, isAiError } from './index.ts';

export async function askPortfolioAI(supabase: any, projectId: string, question: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(30);
  const { data: notes } = await supabase.from('account_note').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20);
  const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null);
  const wins = closed.filter((t: any) => t.result === 'WIN');
  const totalPnl = closed.reduce((s: number, t: any) => s + Number(t.pnl), 0);

  const stats = {
    trades: closed.length,
    wins: wins.length,
    losses: closed.length - wins.length,
    winRate: closed.length ? Math.round((wins.length / closed.length) * 100) : 0,
    totalPnl: Math.round(totalPnl),
    avgRr: closed.length ? (closed.reduce((s: number, t: any) => s + (Number(t.rr) || 0), 0) / closed.length).toFixed(2) : 0,
  };

  const result = await callAI(
    'You are a portfolio advisor. Answer the user question using the provided portfolio data. Return JSON ONLY with keys: answer (string), confidence (0-1 number), sources (array of strings).',
    `Portfolio stats: ${JSON.stringify(stats)}\n\nRecent trades: ${JSON.stringify((trades || []).slice(0, 10).map((t: any) => ({ pair: t.pair, result: t.result, pnl: t.pnl, rr: t.rr })))}\n\nNotes: ${JSON.stringify((notes || []).slice(0, 5).map((n: any) => n.content || n.description).filter(Boolean))}\n\nQuestion: ${question}`
  );
  if (isAiError(result)) return { question, answer: result, confidence: 0, sources: [], generated_at: new Date().toISOString() };

  let parsed: any;
  try {
    const cleaned = result.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { question, answer: result, confidence: 0.5, sources: [], generated_at: new Date().toISOString() };
  }

  return {
    question,
    answer: parsed.answer || '',
    confidence: parsed.confidence ?? 0.7,
    sources: parsed.sources || [],
    generated_at: new Date().toISOString(),
  };
}

export async function detectMarketRegime(supabase: any, projectId: string, symbol?: string, _metrics?: Record<string, any>) {
  const { data: trades } = await supabase.from('trade').select('pair, direction, result, pnl, weekly_bias, daily_bias, h4_bias, created_at').eq('project_id', projectId).is('deleted_at', null).limit(100);
  const { data: structures } = await supabase.from('market_structure').select('*').eq('project_id', projectId).order('date', { ascending: false }).limit(10);
  const { data: snapshots } = await supabase.from('market_snapshot').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20);

  const relevantTrades = (trades || []).filter((t: any) => !symbol || t.pair === symbol);
  const wins = relevantTrades.filter((t: any) => t.result === 'WIN').length;
  const losses = relevantTrades.filter((t: any) => t.result === 'LOSS').length;
  const totalPnl = relevantTrades.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0);

  let regime: any;
  const hasData = relevantTrades.length >= 5 || (structures || []).length > 0 || (snapshots || []).length > 0;
  if (!hasData) return { regime: null, warning: 'Not enough market data to detect a regime' };

  const result = await callAI(
    'You are a market regime classifier. Return JSON ONLY with keys: regime_type (trending/ranging/volatile/quiet), direction (bullish/bearish/neutral), strength (0-100), description (1 sentence).',
    `Trades (${relevantTrades.length}): ${JSON.stringify(relevantTrades.slice(0, 20).map((t: any) => ({ pair: t.pair, result: t.result, pnl: t.pnl, weekly: t.weekly_bias, daily: t.daily_bias, h4: t.h4_bias })))}\n\nRecent structures: ${JSON.stringify((structures || []).slice(0, 5))}\n\nRecent snapshots: ${JSON.stringify((snapshots || []).slice(0, 5))}\n\nWins: ${wins} Losses: ${losses} Net PnL: ${Math.round(totalPnl)}`
  );
  if (isAiError(result)) return { regime: null, warning: JSON.parse(result)._error };

  try { regime = JSON.parse(result); } catch { return { regime: null, warning: 'Failed to parse AI response' }; }

  await supabase.from('market_regime').update({ is_active: false }).eq('project_id', projectId).eq('is_active', true);

  const { data: row, error } = await supabase.from('market_regime').insert({
    project_id: projectId,
    regime_type: regime.regime_type || 'quiet',
    symbol: symbol || 'ALL',
    timeframe: 'multi',
    direction: regime.direction || 'neutral',
    strength: regime.strength ?? 50,
    description: regime.description || '',
    is_active: true,
    detected_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return { regime: row };
}

export async function checkMarketAlerts(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(50);
  const { data: regime } = await supabase.from('market_regime').select('*').eq('project_id', projectId).eq('is_active', true).order('detected_at', { ascending: false }).limit(1).maybeSingle();

  const alerts: any[] = [];
  const closed = (trades || []).filter((t: any) => t.status === 'CLOSED' && t.pnl != null).slice(0, 10);
  const losses = closed.filter((t: any) => t.result === 'LOSS');
  if (losses.length >= 3) {
    const total = losses.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0);
    alerts.push({
      alert_type: 'losing_streak',
      title: `${losses.length} consecutive losses (${Math.round(total)})`,
      message: 'Review recent losses for risk management adjustments.',
      severity: 'warning',
    });
  }
  const bigWin = closed.find((t: any) => Number(t.pnl) > 500);
  if (bigWin) {
    alerts.push({
      alert_type: 'big_win',
      title: `Big win on ${bigWin.pair} (${Math.round(Number(bigWin.pnl))})`,
      message: 'Notable winning trade — consider what conditions worked.',
      severity: 'info',
    });
  }
  const openTrades = (trades || []).filter((t: any) => t.status === 'OPEN');
  if (openTrades.length > 5) {
    alerts.push({
      alert_type: 'overexposure',
      title: `${openTrades.length} open positions`,
      message: 'Open exposure is high — consider tightening risk.',
      severity: 'warning',
    });
  }
  if (regime && (regime.regime_type === 'volatile' || regime.regime_type === 'trending')) {
    alerts.push({
      alert_type: 'regime_shift',
      title: `${regime.regime_type} regime (${regime.direction || 'neutral'})`,
      message: regime.description || 'Active market regime may affect strategy performance.',
      severity: 'info',
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      alert_type: 'all_clear',
      title: 'No significant alerts',
      message: 'Market conditions look normal.',
      severity: 'info',
    });
  }

  const created: any[] = [];
  for (const a of alerts) {
    const { data: row, error } = await supabase.from('market_alert').insert({
      project_id: projectId,
      alert_type: a.alert_type,
      message: a.title,
      condition: a.message,
      severity: a.severity,
      triggered_at: new Date().toISOString(),
    }).select().single();
    if (!error && row) created.push(row);
  }
  return created;
}

export async function autoPopulateTimeline(supabase: any, projectId: string) {
  const { data: trades } = await supabase.from('trade').select('*').eq('project_id', projectId).is('deleted_at', null).order('created_at', { ascending: false }).limit(100);

  let count = 0;
  for (const t of trades || []) {
    if (!t.open_time) continue;
    const open = `${t.pair} opened ${t.direction || ''}`;
    const { error } = await supabase.from('market_timeline').insert({
      project_id: projectId,
      event_type: 'trade_open',
      title: open.trim(),
      description: t.notes || '',
      symbol: t.pair || null,
      importance: 'normal',
      event_time: t.open_time,
    });
    if (!error) count++;
    if (t.status === 'CLOSED' && t.close_time) {
      const { error: closeErr } = await supabase.from('market_timeline').insert({
        project_id: projectId,
        event_type: 'trade_close',
        title: `${t.pair} closed ${t.result || ''} (${Math.round(Number(t.pnl) || 0)})`,
        description: '',
        symbol: t.pair || null,
        importance: t.result === 'WIN' ? 'high' : 'normal',
        event_time: t.close_time,
      });
      if (!closeErr) count++;
    }
  }
  return { count };
}

export async function marketAIContext(supabase: any, projectId: string) {
  const { data: regime } = await supabase.from('market_regime').select('*').eq('project_id', projectId).eq('is_active', true).order('detected_at', { ascending: false }).limit(1).maybeSingle();
  const { data: alerts } = await supabase.from('market_alert').select('*').eq('project_id', projectId).eq('is_read', false).order('triggered_at', { ascending: false }).limit(5);
  const { data: correlation } = await supabase.from('correlation_data').select('*').eq('project_id', projectId).order('calculated_at', { ascending: false }).limit(5);
  const { data: snapshots } = await supabase.from('market_snapshot').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
  const { data: watchlist } = await supabase.from('watchlist_item').select('symbol, bias, notes').eq('project_id', projectId);

  const snapVol = (snapshots || []).map((s: any) => Number(s.volatility) || 0).filter((v: number) => v > 0);
  const avgVol = snapVol.length ? snapVol.reduce((a: number, b: number) => a + b, 0) / snapVol.length : 0;

  const upcoming = (snapshots || [])
    .filter((s: any) => s.high_impact_events && s.high_impact_events.length)
    .slice(0, 3)
    .flatMap((s: any) => s.high_impact_events);

  return {
    current_regime: regime ? `${regime.regime_type} (${regime.direction || 'neutral'})` : null,
    usd_direction: null,
    risk_sentiment: 'neutral',
    volatility_level: avgVol > 1.5 ? 'high' : avgVol > 0.5 ? 'medium' : 'low',
    upcoming_high_impact: upcoming || [],
    active_alerts: (alerts || []).map((a: any) => ({ title: a.message || a.alert_type || '', severity: a.severity || 'info' })),
    correlation_highlights: (correlation || []).map((c: any) => ({ symbol_a: c.symbol_a, symbol_b: c.symbol_b, correlation: c.correlation })),
    watchlist_biases: Object.fromEntries((watchlist || []).filter((w: any) => w.bias).map((w: any) => [w.symbol, w.bias])),
  };
}

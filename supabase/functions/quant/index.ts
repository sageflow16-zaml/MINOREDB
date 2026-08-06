import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger, CircuitBreaker } from '../_shared/logging.ts';
import { mapInterval, fetchTwelveData } from '../_shared/marketdata.ts';

const logger = new Logger({ function: 'quant' });
const twelvedataBreaker = new CircuitBreaker('twelvedata', 5, 60000, 30000);

// ---------- Indicators ----------

function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = values[0];
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function bollinger(values: number[], period: number, mult: number): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = mid[i]!;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { mid, upper, lower };
}

function atr(highs: number[], lows: number[], closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let prevClose = closes[0];
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose));
    trs.push(tr);
    prevClose = closes[i];
  }
  let prev = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out[period] = prev;
  for (let i = period; i < trs.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out[i + 1] = prev;
  }
  return out;
}

function macd(values: number[], fast: number, slow: number, signal: number): { macd: (number | null)[]; signal: (number | null)[] } {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine: (number | null)[] = values.map((_, i) => {
    const f = fastEma[i], s = slowEma[i];
    return f != null && s != null ? f - s : null;
  });
  const signalLine: (number | null)[] = new Array(values.length).fill(null);
  const macdVals: number[] = [];
  const signalVals: number[] = [];
  for (const v of macdLine) {
    if (v == null) continue;
    macdVals.push(v);
    const k = 2 / (signal + 1);
    if (signalVals.length === 0) signalVals.push(v);
    else signalVals.push(v * k + signalVals[signalVals.length - 1] * (1 - k));
  }
  let offset = 0;
  while (macdLine[offset] == null) offset++;
  signalVals.forEach((v, i) => { signalLine[offset + i] = v; });
  return { macd: macdLine, signal: signalLine };
}

// ---------- Candle loading ----------

function toIso(date: string | null): string | null {
  if (!date) return null;
  const cleaned = /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : null;
  return cleaned ? `${cleaned}T00:00:00Z` : null;
}

async function selectAllCandles(base: any): Promise<any[]> {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await base.range(from, from + 999);
    if (error) throw new Error(`Failed to load candles: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function ensureCandles(supabase: any, projectId: string, symbol: string, timeframe: string, startDate: string | null, endDate: string | null): Promise<any[]> {
  const startIso = toIso(startDate);
  const endIso = toIso(endDate);
  let base = supabase.from('market_candle').select('*').eq('symbol', symbol).eq('timeframe', timeframe);
  if (startIso) base = base.gte('open_time', startIso);
  if (endIso) base = base.lte('open_time', endIso);
  base = base.order('open_time', { ascending: true });
  const data = await selectAllCandles(base);
  if (data.length > 0) return data;

  if (!Deno.env.get('TWELVEDATA_API_KEY')) throw new Error('No cached candles and TWELVEDATA_API_KEY not configured. Add this secret in Supabase project settings.');
  const from = startIso ? startIso.replace('T', ' ').replace('Z', '') : undefined;
  const to = endIso ? endIso.replace('T', ' ').replace('Z', '') : undefined;
  const result = await twelvedataBreaker.call(() => fetchTwelveData(symbol, mapInterval(timeframe), from, to)).catch((err): Awaited<ReturnType<typeof fetchTwelveData>> => {
    logger.error('TwelveData circuit breaker failure', { symbol, timeframe, error: err instanceof Error ? err.message : 'unknown' });
    return { status: 'error', error: err instanceof Error ? err.message : 'Market data unavailable.' };
  });
  if (result.status !== 'ok' || !result.values) throw new Error(result.error || 'Failed to fetch candles.');

  const rows = (result.values as any[])
    .map((v: any) => {
      const raw = v.datetime.endsWith('Z') ? v.datetime : v.datetime.includes(' ') ? v.datetime.replace(' ', 'T') + 'Z' : v.datetime + 'T00:00:00Z';
      return {
        project_id: projectId, symbol, timeframe, open_time: new Date(raw).toISOString(),
        open: parseFloat(v.open), high: parseFloat(v.high), low: parseFloat(v.low), close: parseFloat(v.close),
        volume: parseInt(v.volume) || 0,
      };
    })
    .filter((c: any) => !isNaN(Date.parse(c.open_time)))
    .sort((a: any, b: any) => a.open_time.localeCompare(b.open_time));
  if (rows.length > 0) {
    const { error: upsertErr } = await supabase.from('market_candle').upsert(rows, { onConflict: 'project_id,symbol,timeframe,open_time', ignoreDuplicates: true });
    if (upsertErr) throw new Error(`Failed to cache candles: ${upsertErr.message}`);
  }
  if (rows.length === 0) throw new Error(`No candle data returned for ${symbol} ${timeframe}`);
  return rows;
}

// ---------- Backtest engine ----------

interface Candle { open_time: string; open: number; high: number; low: number; close: number; volume: number }

function computeSignals(candles: Candle[], cfg: Record<string, any>): ('LONG' | 'SHORT' | null)[] {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const strategy = cfg.strategy || 'sma_cross';
  const signals: ('LONG' | 'SHORT' | null)[] = new Array(candles.length).fill(null);
  const allowShort = cfg.entry !== 'long_only';
  const allowLong = cfg.entry !== 'short_only';

  if (strategy === 'sma_cross') {
    const fast = sma(closes, cfg.fast || 9);
    const slow = sma(closes, cfg.slow || 21);
    for (let i = 1; i < candles.length; i++) {
      if (fast[i] == null || slow[i] == null) continue;
      if (fast[i - 1] != null && slow[i - 1] != null) {
        if (allowLong && (fast[i - 1] as number) <= (slow[i - 1] as number) && fast[i]! > slow[i]!) signals[i] = 'LONG';
        else if (allowShort && (fast[i - 1] as number) >= (slow[i - 1] as number) && fast[i]! < slow[i]!) signals[i] = 'SHORT';
      }
    }
  } else if (strategy === 'rsi') {
    const period = cfg.rsi_period || 14;
    const r = rsi(closes, period);
    const overbought = cfg.overbought ?? 70;
    const oversold = cfg.oversold ?? 30;
    for (let i = 1; i < candles.length; i++) {
      if (r[i] == null || r[i - 1] == null) continue;
      if (allowLong && (r[i - 1] as number) <= oversold && r[i]! > oversold) signals[i] = 'LONG';
      else if (allowShort && (r[i - 1] as number) >= overbought && r[i]! < overbought) signals[i] = 'SHORT';
    }
  } else if (strategy === 'bollinger') {
    const period = cfg.bb_period || 20;
    const mult = cfg.bb_mult || 2;
    const { lower, upper } = bollinger(closes, period, mult);
    for (let i = 1; i < candles.length; i++) {
      if (lower[i] == null) continue;
      if (allowLong && closes[i - 1] >= (lower[i - 1] as number) && closes[i] < (lower[i] as number)) signals[i] = 'LONG';
      else if (allowShort && closes[i - 1] <= (upper[i - 1] as number) && closes[i] > (upper[i] as number)) signals[i] = 'SHORT';
    }
  } else if (strategy === 'macd') {
    const { macd: m, signal: s } = macd(closes, cfg.fast || 12, cfg.slow || 26, cfg.signal || 9);
    for (let i = 1; i < candles.length; i++) {
      if (m[i] == null || s[i] == null || m[i - 1] == null || s[i - 1] == null) continue;
      if (allowLong && (m[i - 1] as number) <= (s[i - 1] as number) && m[i]! > s[i]!) signals[i] = 'LONG';
      else if (allowShort && (m[i - 1] as number) >= (s[i - 1] as number) && m[i]! < s[i]!) signals[i] = 'SHORT';
    }
  } else if (strategy === 'price_range') {
    const low = cfg.low ?? null;
    const high = cfg.high ?? null;
    for (let i = 0; i < candles.length; i++) {
      if (low != null && allowLong && closes[i] <= low) signals[i] = 'LONG';
      else if (high != null && allowShort && closes[i] >= high) signals[i] = 'SHORT';
    }
  }
  return signals;
}

function pipSize(symbol: string): number {
  const s = (symbol || '').toUpperCase();
  if (s.endsWith('JPY')) return 0.01;
  if (s === 'XAUUSD' || s === 'XAGUSD') return 0.1;
  if (s.startsWith('BTC') || s.startsWith('ETH') || s.startsWith('SOL') || s.startsWith('XRP')) return 1;
  return 0.0001;
}

function runBacktestEngine(symbol: string, candles: Candle[], cfg: Record<string, any>, costs: Record<string, any>, initialCapital: number): { trades: any[]; equity: number[] } {
  const signals = computeSignals(candles, cfg);
  const atrPeriod = cfg.atr_period || 14;
  const atrValues = atr(candles.map((c) => c.high), candles.map((c) => c.low), candles.map((c) => c.close), atrPeriod);
  const slAtr = cfg.sl_atr ?? 2;
  const tpAtr = cfg.tp_atr ?? 3;
  const riskPercent = (cfg.risk_percent ?? 1) / 100;
  const pip = pipSize(symbol);
  const commission = Number(costs?.commission ?? 0);
  const spreadPrice = Number(costs?.spread ?? 0) * pip;
  const slippagePrice = Number(costs?.slippage ?? 0) * pip;

  const trades: any[] = [];
  const equity: number[] = [];
  let balance = initialCapital;
  let open: { direction: string; entry: number; sl: number; tp: number; size: number; entryTime: string; entryIndex: number } | null = null;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (open) {
      let exitPrice: number | null = null;
      let exitReason = 'signal_close';
      const isLong = open.direction === 'LONG';
      if (isLong) {
        if (c.low <= open.sl) { exitPrice = open.sl; exitReason = 'stop_loss'; }
        else if (c.high >= open.tp) { exitPrice = open.tp; exitReason = 'take_profit'; }
      } else {
        if (c.high >= open.sl) { exitPrice = open.sl; exitReason = 'stop_loss'; }
        else if (c.low <= open.tp) { exitPrice = open.tp; exitReason = 'take_profit'; }
      }
      if (exitPrice != null) {
        const rawProfit = (exitPrice - open.entry) * open.size * (isLong ? 1 : -1);
        const fees = commission + (spreadPrice + slippagePrice) * open.size;
        const profit = rawProfit - fees;
        balance += profit;
        const rr = open.tp - open.entry !== 0
          ? Math.abs((exitPrice - open.entry) / (open.sl - open.entry || 1))
          : 0;
        trades.push({
          entry_date: open.entryTime,
          exit_date: c.open_time,
          direction: open.direction,
          entry_price: Math.round(open.entry * 100000) / 100000,
          exit_price: Math.round(exitPrice * 100000) / 100000,
          position_size: Math.round(open.size * 100000) / 100000,
          profit: Math.round(profit * 100) / 100,
          profit_pct: Math.round((profit / open.size / open.entry) * 10000) / 10000,
          rr_ratio: Math.round(rr * 100) / 100,
          exit_reason: exitReason,
          tags: [],
        });
        open = null;
      }
    }
    if (!open) {
      const signal = signals[i];
      if (signal) {
        const atrNow = atrValues[i] || cfg.fallback_atr || (c.high - c.low) * 2;
        const entry = c.close + (signal === 'LONG' ? spreadPrice : -spreadPrice);
        const sl = signal === 'LONG' ? entry - slAtr * atrNow : entry + slAtr * atrNow;
        const tp = signal === 'LONG' ? entry + tpAtr * atrNow : entry - tpAtr * atrNow;
        const riskPerUnit = Math.abs(entry - sl);
        const size = riskPerUnit > 0 ? (balance * riskPercent) / riskPerUnit : 0;
        open = { direction: signal, entry, sl, tp, size: size || 1, entryTime: c.open_time, entryIndex: i };
      }
    }
    equity.push(balance + (open ? (open.direction === 'LONG' ? (c.close - open.entry) * open.size : (open.entry - c.close) * open.size) : 0));
  }
  if (open) {
    const c = candles[candles.length - 1];
    const rawProfit = (c.close - open.entry) * open.size * (open.direction === 'LONG' ? 1 : -1);
    const fees = commission + (spreadPrice + slippagePrice) * open.size;
    trades.push({
      entry_date: open.entryTime,
      exit_date: c.open_time,
      direction: open.direction,
      entry_price: Math.round(open.entry * 100000) / 100000,
      exit_price: Math.round(c.close * 100000) / 100000,
      position_size: Math.round(open.size * 100000) / 100000,
      profit: Math.round((rawProfit - fees) * 100) / 100,
      profit_pct: Math.round(((rawProfit - fees) / open.size / open.entry) * 10000) / 10000,
      rr_ratio: 0,
      exit_reason: 'end_of_data',
      tags: [],
    });
  }
  return { trades, equity };
}

function computeMetrics(trades: any[], initialCapital: number): Record<string, any> {
  const profits = trades.map((t) => Number(t.profit) || 0);
  const winners = profits.filter((p) => p > 0);
  const losers = profits.filter((p) => p < 0);
  const grossProfit = winners.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losers.reduce((s, p) => s + p, 0));
  const net = profits.reduce((s, p) => s + p, 0);
  let peak = 0, maxDd = 0, running = 0;
  for (const p of profits) {
    running += p;
    peak = Math.max(peak, running);
    maxDd = Math.min(maxDd, running - peak);
  }
  const mean = net / (trades.length || 1);
  const variance = profits.length > 1 ? profits.reduce((s, p) => s + (p - mean) ** 2, 0) / (profits.length - 1) : 0;
  const sharpe = variance > 0 ? mean / Math.sqrt(variance) : 0;
  return {
    total_trades: trades.length,
    win_rate: trades.length ? winners.length / trades.length : 0,
    profit_factor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0,
    net_profit: Math.round(net * 100) / 100,
    gross_profit: Math.round(grossProfit * 100) / 100,
    gross_loss: Math.round(grossLoss * 100) / 100,
    max_drawdown: Math.round(maxDd * 100) / 100,
    sharpe_ratio: Math.round(sharpe * 100) / 100,
    total_return: Math.round((net / initialCapital) * 10000) / 100,
    avg_win: winners.length ? Math.round((grossProfit / winners.length) * 100) / 100 : 0,
    avg_loss: losers.length ? Math.round((grossLoss / losers.length) * 100) / 100 : 0,
    expectancy: Math.round(mean * 100) / 100,
    max_win: profits.length ? Math.max(...profits) : 0,
    max_loss: profits.length ? Math.min(...profits) : 0,
  };
}

// ---------- Simulation ----------

function runSimulationEngine(cfg: Record<string, any>, iterations: number, type: string): { results: any; distribution: { bucket: number; count: number }[]; percentiles: Record<string, number>; equityCurves: Record<string, number[]> } {
  const numTrades = Number(cfg.num_trades ?? 200);
  const winRate = Number(cfg.win_rate ?? 0.45);
  const avgWin = Number(cfg.avg_win ?? 200);
  const avgLoss = Number(cfg.avg_loss ?? 150);
  const seedTrades: { profit: number }[] = Array.isArray(cfg.trades) ? cfg.trades : [];
  const seedWins = seedTrades.filter((t) => (t.profit ?? 0) > 0);
  const seedLosses = seedTrades.filter((t) => (t.profit ?? 0) < 0);
  const seedWinRate = seedTrades.length ? seedWins.length / seedTrades.length : winRate;
  const seedAvgWin = seedWins.length ? seedWins.reduce((s, t) => s + t.profit, 0) / seedWins.length : avgWin;
  const seedAvgLoss = seedLosses.length ? Math.abs(seedLosses.reduce((s, t) => s + t.profit, 0) / seedLosses.length) : avgLoss;
  const seedGrossWin = seedWins.reduce((s, t) => s + t.profit, 0);
  const seedGrossLoss = Math.abs(seedLosses.reduce((s, t) => s + t.profit, 0));

  const finals: number[] = [];
  const paths: number[][] = [];
  for (let sim = 0; sim < iterations; sim++) {
    let equity = 0;
    const path = [0];
    for (let t = 0; t < numTrades; t++) {
      let profit: number;
      if (seedTrades.length > 0 && type === 'bootstrap') {
        profit = seedTrades[Math.floor(Math.random() * seedTrades.length)].profit ?? 0;
      } else {
        profit = Math.random() < seedWinRate ? seedAvgWin * (0.5 + Math.random()) : -seedAvgLoss * (0.5 + Math.random());
      }
      equity += profit;
      path.push(equity);
    }
    finals.push(equity);
    if (sim < 500) paths.push(path);
  }
  const sorted = [...finals].sort((a, b) => a - b);
  const mean = finals.reduce((s, v) => s + v, 0) / iterations;
  const median = sorted[Math.floor(sorted.length / 2)];
  const probProfit = finals.filter((v) => v > 0).length / iterations;
  const variance = finals.reduce((s, v) => s + (v - mean) ** 2, 0) / iterations;
  const sd = Math.sqrt(variance);
  const percentile = (p: number) => sorted[Math.floor(sorted.length * p)] || 0;

  const bins = 20;
  const minVal = Math.min(...sorted);
  const maxVal = Math.max(...sorted);
  const range = maxVal - minVal || 1;
  const bucketCounts = new Array(bins).fill(0);
  for (const f of finals) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(((f - minVal) / range) * bins)));
    bucketCounts[idx]++;
  }
  const distribution = bucketCounts.map((count, i) => ({
    bucket: Math.round((minVal + (i + 0.5) * (range / bins)) * 100) / 100,
    count,
  }));

  const percentiles: Record<string, number> = {};
  [5, 25, 50, 75, 95].forEach((p) => { percentiles[String(p)] = Math.round(percentile(p / 100) * 100) / 100; });

  const stepCount = paths.length > 0 ? paths[0].length : 0;
  const equityCurves: Record<string, number[]> = {};
  [5, 25, 50, 75, 95].forEach((p) => {
    const curve: number[] = [];
    for (let t = 0; t < stepCount; t++) {
      const vals = paths.map((path) => path[t]).sort((a, b) => a - b);
      curve.push(Math.round((vals[Math.floor(vals.length * p / 100)] || 0) * 100) / 100);
    }
    equityCurves[String(p)] = curve;
  });

  return {
    results: {
      mean_final_equity: Math.round(mean * 100) / 100,
      median_final_equity: Math.round(median * 100) / 100,
      probability_of_profit: Math.round(probProfit * 1000) / 1000,
      std_dev: Math.round(sd * 100) / 100,
      num_samples: iterations,
      results: {
        sharpe_ratio: { mean: sd > 0 ? Math.round((mean / sd) * 100) / 100 : 0, std: 0 },
        win_rate: { mean: Math.round(seedWinRate * 1000) / 1000, std: 0 },
        profit_factor: { mean: seedGrossLoss > 0 ? Math.round((seedGrossWin / seedGrossLoss) * 100) / 100 : 0, std: 0 },
      },
    },
    distribution,
    percentiles,
    equityCurves,
  };
}

// ---------- Main ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  let op = 'unknown';
  let projectId: string | undefined;
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse('Unauthorized', 401);

    const { operation, project_id, data } = await req.json() as any;
    op = operation;
    projectId = project_id;
    if (!project_id) return errorResponse('Missing project_id');
    const reqLogger = logger.with({ project_id, operation: op });

    switch (operation) {
      case 'run-backtest': {
        const runId = data?.run_id;
        if (!runId) return errorResponse('Missing run_id');
        const { data: run, error: runErr } = await supabase.from('quant_backtest_run').select('*').eq('id', runId).eq('project_id', project_id).maybeSingle();
        if (runErr) throw new Error(runErr.message);
        if (!run) return errorResponse('Backtest run not found');

        const startedAt = Date.now();
        await supabase.from('quant_backtest_run').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', runId);

        try {
          const strategyConfig = run.strategy_config || {};
          const cfg = strategyConfig.config || {};
          const costs = strategyConfig.costs || {};
          const symbols = strategyConfig.symbols || [run.symbol].filter(Boolean);
          const symbol = symbols[0] || 'EURUSD';
          const timeframe = cfg.timeframe || run.timeframe || '1h';
          const candles = await ensureCandles(supabase, project_id, symbol, timeframe, run.start_date, run.end_date);
          if (candles.length < 50) throw new Error(`Not enough candle data for ${symbol} ${timeframe} (${candles.length} bars)`);

          const initialCapital = Number(run.initial_capital ?? cfg.initial_capital ?? 10000);
          const { trades, equity } = runBacktestEngine(symbol, candles, cfg, costs, initialCapital);
          const metrics = computeMetrics(trades, initialCapital);
          const finalEquity = equity.length > 0 ? equity[equity.length - 1] : initialCapital;

          if (trades.length > 0) {
            const rows = trades.map((t) => ({ ...t, project_id, backtest_run_id: runId }));
            const { error: insertErr } = await supabase.from('quant_backtest_trade').insert(rows);
            if (insertErr) throw new Error(insertErr.message);
          }

          const { error: updateErr } = await supabase.from('quant_backtest_run').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startedAt,
            symbol,
            timeframe,
            initial_capital: initialCapital,
            total_trades: metrics.total_trades,
            win_rate: metrics.win_rate,
            profit_factor: metrics.profit_factor,
            net_profit: metrics.net_profit,
            max_drawdown: metrics.max_drawdown,
            sharpe_ratio: metrics.sharpe_ratio,
            total_return: metrics.total_return,
            metrics: { ...metrics, final_equity: Math.round(finalEquity * 100) / 100, symbol, timeframe },
            error: null,
          }).eq('id', runId);
          if (updateErr) throw new Error(updateErr.message);

          reqLogger.info('backtest completed', { run_id: runId, symbol, timeframe, trades: trades.length, duration_ms: Date.now() - startedAt });
          return successResponse({ status: 'completed', run_id: runId, metrics, trades: trades.length });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Backtest failed';
          reqLogger.error('backtest failed', { run_id: runId, error: message, duration_ms: Date.now() - startedAt });
          await supabase.from('quant_backtest_run').update({ status: 'failed', error: message, completed_at: new Date().toISOString(), duration_ms: Date.now() - startedAt }).eq('id', runId);
          return errorResponse(message, 500);
        }
      }

      case 'run-simulation': {
        const simId = data?.simulation_id;
        if (!simId) return errorResponse('Missing simulation_id');
        const { data: sim, error: simErr } = await supabase.from('quant_simulation_run').select('*').eq('id', simId).eq('project_id', project_id).maybeSingle();
        if (simErr) throw new Error(simErr.message);
        if (!sim) return errorResponse('Simulation not found');

        const startedAt = Date.now();
        await supabase.from('quant_simulation_run').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', simId);
        try {
          const iterations = sim.iterations || 1000;
          const { results, distribution, percentiles, equityCurves } = runSimulationEngine(sim.config || {}, iterations, sim.simulation_type || 'monte_carlo');
          const { error: updateErr } = await supabase.from('quant_simulation_run').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startedAt,
            results,
            distribution,
            percentiles,
            equity_curves: equityCurves,
            metrics: results,
            error: null,
          }).eq('id', simId);
          if (updateErr) throw new Error(updateErr.message);
          reqLogger.info('simulation completed', { simulation_id: simId, iterations, duration_ms: Date.now() - startedAt });
          return successResponse({ status: 'completed', simulation_id: simId, results });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Simulation failed';
          reqLogger.error('simulation failed', { simulation_id: simId, error: message, duration_ms: Date.now() - startedAt });
          await supabase.from('quant_simulation_run').update({ status: 'failed', error: message, completed_at: new Date().toISOString() }).eq('id', simId);
          return errorResponse(message, 500);
        }
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    logger.error('quant failed', { operation: op, project_id: projectId, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

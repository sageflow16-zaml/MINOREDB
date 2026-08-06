import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger } from '../_shared/logging.ts';

const logger = new Logger({ function: 'broker-sync' });

const TIMEOUT_MS = 10_000;

async function hashImport(t: Record<string, unknown>): Promise<string> {
  const payload = [t.external_id, t.symbol, t.open_time, t.close_time, t.profit, t.volume].map((v) => String(v ?? '')).join('|');
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function log(supabase: any, connection: any, level: string, message: string, details?: Record<string, unknown>) {
  await supabase.from('broker_log').insert({
    project_id: connection.project_id,
    connection_id: connection.id,
    level,
    message,
    details: details || {},
  });
}

function probeConfig(connection: any) {
  const cfg = connection.config || {};
  const creds = (connection.credentials_encrypted || '{}');
  let parsedCreds: Record<string, unknown> = {};
  try { parsedCreds = JSON.parse(creds); } catch {}
  return { cfg, creds: parsedCreds };
}

async function httpProbe(url: string, method = 'GET', headers: Record<string, string> = {}): Promise<{ ok: boolean; latencyMs: number; status: number; body: any }> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method, headers: { Accept: 'application/json', ...headers }, signal: controller.signal });
    const latencyMs = Date.now() - startedAt;
    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch {}
    return { ok: res.ok, latencyMs, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function extractArray(body: any, keys: string[]): any[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    for (const key of keys) {
      if (Array.isArray(body[key])) return body[key];
    }
  }
  return null;
}

async function upsertHealth(supabase: any, connection: any, isReachable: boolean, latencyMs: number | null, errorMessage: string | null, details: Record<string, unknown> = {}) {
  const { data: existing } = await supabase.from('broker_health').select('id').eq('project_id', connection.project_id).eq('connection_id', connection.id).maybeSingle();
  const payload = {
    project_id: connection.project_id,
    connection_id: connection.id,
    is_reachable: isReachable,
    latency_ms: latencyMs,
    last_check_at: new Date().toISOString(),
    error_message: errorMessage,
    details,
  };
  if (existing) {
    await supabase.from('broker_health').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('broker_health').insert(payload);
  }
  const { data: row } = await supabase.from('broker_health').select('*').eq('project_id', connection.project_id).eq('connection_id', connection.id).maybeSingle();
  return row;
}

async function testConnection(supabase: any, connection: any): Promise<any> {
  const { cfg, creds } = probeConfig(connection);
  const provider = connection.provider;

  const baseUrl = (cfg.base_url || cfg.endpoint || '').toString().replace(/\/+$/, '');
  const apiKey = (cfg.api_key || creds.api_key || '').toString();
  const headers: Record<string, string> = {};
  try { Object.assign(headers, cfg.headers && typeof cfg.headers === 'object' ? cfg.headers : {}); } catch {}

  if (baseUrl) {
    const url = /^https?:\/\//.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
    const startedAt = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers: apiKey ? { ...headers, Authorization: `Bearer ${apiKey}` } : headers, signal: controller.signal });
      clearTimeout(timer);
      const latencyMs = Date.now() - startedAt;
      const reachable = res.ok || res.status === 401 || res.status === 403;
      const health = await upsertHealth(supabase, connection, reachable, latencyMs, reachable ? null : `HTTP ${res.status}`, { provider, url, status: res.status });
      const message = reachable
        ? `Reachable (HTTP ${res.status})`
        : res.status === 401 || res.status === 403 ? 'Reachable but authentication failed' : `Endpoint unreachable (HTTP ${res.status})`;
      await supabase.from('broker_connection_new').update({
        status: reachable ? 'connected' : 'error',
        last_connected_at: reachable ? new Date().toISOString() : connection.last_connected_at,
        error_count: reachable ? 0 : (connection.error_count || 0) + 1,
        last_error: reachable ? null : message,
      }).eq('id', connection.id);
      await log(supabase, connection, reachable ? 'info' : 'error', message, { latency_ms: latencyMs });
      return { success: reachable, status: reachable ? 'connected' : 'error', latency_ms: latencyMs, message };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      const message = err instanceof Error && err.name === 'AbortError' ? 'Connection timed out' : err instanceof Error ? err.message : 'Unreachable';
      await upsertHealth(supabase, connection, false, latencyMs, message, { provider });
      await supabase.from('broker_connection_new').update({ status: 'error', error_count: (connection.error_count || 0) + 1, last_error: message }).eq('id', connection.id);
      await log(supabase, connection, 'error', message, { latency_ms: latencyMs });
      return { success: false, status: 'error', latency_ms: latencyMs, message };
    }
  }

  const requiresLocal = ['metatrader4', 'metatrader5', 'ctrader', 'dxtrade'].includes(provider);
  const message = requiresLocal
    ? `${provider} requires the local terminal bridge to connect. Set a base_url/webhook endpoint on the connection to enable remote sync.`
    : apiKey ? 'Credentials configured; no remote endpoint to probe.' : 'No endpoint configured; credentials stored.';
  const health = await upsertHealth(supabase, connection, false, null, message, { provider, requiresLocal });
  await supabase.from('broker_connection_new').update({ status: 'configured', last_error: message }).eq('id', connection.id);
  await log(supabase, connection, 'info', message, { provider, requiresLocal });
  return { success: false, status: 'configured', latency_ms: null, message };
}

function mapTradeRow(raw: Record<string, unknown>, connection: any, account: any): Record<string, unknown> {
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  const str = (v: unknown) => (v == null ? null : String(v));
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
    }
    return undefined;
  };
  return {
    project_id: connection.project_id,
    connection_id: connection.id,
    account_id: account?.id ?? null,
    external_id: str(pick('id', 'ticket', 'external_id', 'deal_id')),
    symbol: str(pick('symbol', 'pair', 'instrument', 'market')),
    trade_type: str(pick('type', 'trade_type', 'direction', 'side')),
    volume: num(pick('volume', 'size', 'lots')),
    open_price: num(pick('open_price', 'entry_price', 'open', 'price_open')),
    close_price: num(pick('close_price', 'exit_price', 'close', 'price_close')),
    open_time: str(pick('open_time', 'opened_at', 'entry_time', 'open_date'))?.replace(' ', 'T') ?? null,
    close_time: str(pick('close_time', 'closed_at', 'exit_time', 'close_date', 'timestamp'))?.replace(' ', 'T') ?? null,
    profit: num(pick('profit', 'pnl', 'net_profit', 'realized_pnl')),
    commission: num(pick('commission', 'fees')),
    swap: num(pick('swap', 'rollover')),
    magic_number: raw.magic_number != null ? Number(raw.magic_number) : null,
    comment: str(pick('comment', 'notes')),
    stop_loss: num(pick('stop_loss', 'sl', 'stopLoss')),
    take_profit: num(pick('take_profit', 'tp', 'takeProfit')),
    raw_data: raw,
  };
}

function mapAccountRow(raw: Record<string, unknown>, connection: any): Record<string, unknown> {
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  const str = (v: unknown) => (v == null ? null : String(v));
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
    }
    return undefined;
  };
  return {
    connection_id: connection.id,
    project_id: connection.project_id,
    external_id: str(pick('id', 'account_id', 'login', 'external_id')),
    name: str(pick('name', 'label', 'account_name')),
    account_type: str(pick('type', 'account_type', 'kind')),
    currency: str(pick('currency', 'ccy')),
    leverage: str(pick('leverage')),
    balance: num(pick('balance')),
    equity: num(pick('equity')),
    open_pl: num(pick('open_pl', 'unrealized_pnl', 'openProfit')),
    used_margin: num(pick('used_margin', 'margin_used')),
    free_margin: num(pick('free_margin', 'margin_free')),
    margin_level: num(pick('margin_level')),
    metadata: raw,
  };
}

function mapPositionRow(raw: Record<string, unknown>, connection: any, account: any): Record<string, unknown> {
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  const str = (v: unknown) => (v == null ? null : String(v));
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
    }
    return undefined;
  };
  return {
    project_id: connection.project_id,
    connection_id: connection.id,
    account_id: account?.id ?? null,
    external_id: str(pick('id', 'ticket', 'external_id')),
    symbol: str(pick('symbol', 'pair', 'instrument', 'market')),
    position_type: str(pick('type', 'position_type', 'direction', 'side')),
    volume: num(pick('volume', 'size', 'lots')),
    open_price: num(pick('open_price', 'entry_price', 'open', 'price_open')),
    current_price: num(pick('current_price', 'price', 'close')),
    open_time: str(pick('open_time', 'opened_at', 'open_date'))?.replace(' ', 'T') ?? null,
    profit: num(pick('profit', 'pnl', 'unrealized_pnl')),
    commission: num(pick('commission', 'fees')),
    swap: num(pick('swap', 'rollover')),
    stop_loss: num(pick('stop_loss', 'sl', 'stopLoss')),
    take_profit: num(pick('take_profit', 'tp', 'takeProfit')),
    magic_number: raw.magic_number != null ? Number(raw.magic_number) : null,
    comment: str(pick('comment', 'notes')),
    raw_data: raw,
  };
}

async function fetchRows(supabase: any, connection: any): Promise<{ accounts: any[]; trades: any[]; positions: any[]; source: string; error?: string }> {
  const { cfg, creds } = probeConfig(connection);
  const baseUrl = (cfg.base_url || '').toString().replace(/\/+$/, '');
  if (!baseUrl) {
    return { accounts: [], trades: [], positions: [], source: 'none', error: 'No base_url configured; no remote data to sync.' };
  }
  const apiKey = (cfg.api_key || creds.api_key || '').toString();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) {
    const authStyle = cfg.auth_style === 'basic'
      ? { Authorization: `Basic ${btoa(`${apiKey}:${(creds.api_secret || '')}`)}` }
      : { Authorization: `Bearer ${apiKey}` };
    Object.assign(headers, authStyle);
  }
  try { Object.assign(headers, cfg.headers && typeof cfg.headers === 'object' ? cfg.headers : {}); } catch {}

  const url = (endpoint: string) => /^https?:\/\//.test(baseUrl) ? `${baseUrl}${endpoint}` : `https://${baseUrl}${endpoint}`;

  const accountsRes = await httpProbe(url(cfg.accounts_path || '/accounts'), 'GET', headers);
  const accounts = accountsRes.ok ? extractArray(accountsRes.body, ['accounts', 'data', 'results', 'items']) || [] : [];

  const tradesPath = cfg.trades_path || '/trades';
  let trades: any[] = [];
  let positions: any[] = [];
  const tradesRes = await httpProbe(url(tradesPath), 'GET', headers);
  if (tradesRes.ok) {
    const arr = extractArray(tradesRes.body, ['trades', 'data', 'results', 'items', 'deals']);
    trades = arr || [];
    positions = extractArray(tradesRes.body, ['positions', 'open_positions', 'open_trades']) || [];
  }

  if (!accountsRes.ok && !tradesRes.ok) {
    return { accounts: [], trades: [], positions: [], source: 'provider', error: `Endpoint error (accounts HTTP ${accountsRes.status}, trades HTTP ${tradesRes.status})` };
  }
  return { accounts, trades, positions, source: 'provider' };
}

async function upsertWithHash(supabase: any, table: string, rows: Record<string, unknown>[]): Promise<{ created: number; duplicates: number }> {
  if (rows.length === 0) return { created: 0, duplicates: 0 };
  const withHash = await Promise.all(rows.map(async (r) => ({ ...r, import_hash: await hashImport(r) })));
  const hashes = withHash.map((r) => r.import_hash);
  const { data: existing } = await supabase.from(table).select('import_hash').in('import_hash', hashes);
  const existingSet = new Set((existing || []).map((e: any) => e.import_hash));
  const fresh = withHash.filter((r) => !existingSet.has(r.import_hash));
  let created = 0;
  if (fresh.length > 0) {
    const { data: inserted, error } = await supabase.from(table).insert(fresh).select('id');
    if (error) throw new Error(error.message);
    created = inserted?.length ?? 0;
  }
  return { created, duplicates: rows.length - created };
}

async function syncConnection(supabase: any, connection: any, accountFilter?: string): Promise<any> {
  const startedAt = Date.now();
  const result = await fetchRows(supabase, connection);
  const syncHistory = {
    project_id: connection.project_id,
    connection_id: connection.id,
    sync_type: 'auto',
    status: 'running',
    started_at: new Date().toISOString(),
  };
  const { data: historyRow } = await supabase.from('sync_history_new').insert(syncHistory).select().single();

  let accountsCreated = 0, tradesCreated = 0, positionsCreated = 0, duplicates = 0, accountsSynced = 0;
  try {
    if (result.error) throw new Error(result.error);
    const accountRows = result.accounts.map((a) => mapAccountRow(a, connection));
    for (const a of accountRows) {
      const { data: existing } = await supabase.from('broker_account')
        .select('id').eq('connection_id', connection.id)
        .or(a.external_id ? `external_id.eq.${a.external_id}` : `name.eq.${a.name}`)
        .maybeSingle();
      if (existing) {
        await supabase.from('broker_account').update({ ...a, last_synced_at: new Date().toISOString() }).eq('id', existing.id);
        accountsSynced += 1;
      } else {
        const { data: ins } = await supabase.from('broker_account').insert({ ...a, last_synced_at: new Date().toISOString() }).select().single();
        if (ins) accountsSynced += 1;
        accountsCreated += 1;
      }
    }

    const accounts = await supabase.from('broker_account').select('*').eq('connection_id', connection.id);
    const accountList = accounts.data || [];
    const accountFor = (extId: string | null): any => {
      if (!extId) return null;
      return accountList.find((a: any) => a.external_id === extId) || null;
    };

    const tradeRows = result.trades.map((t) => mapTradeRow(t, connection, accountFor(String(t.id ?? t.ticket ?? t.external_id ?? ''))));
    const filteredTrades = accountFilter ? tradeRows.filter((t) => t.account_id === accountFilter) : tradeRows;
    const tradeResult = await upsertWithHash(supabase, 'imported_trade', filteredTrades);
    tradesCreated = tradeResult.created;
    duplicates += tradeResult.duplicates;

    if (result.positions.length > 0) {
      const positionRows = result.positions.map((p) => mapPositionRow(p, connection, accountFor(String(p.id ?? p.ticket ?? ''))));
      const filteredPositions = accountFilter ? positionRows.filter((p) => p.account_id === accountFilter) : positionRows;
      const posResult = await upsertWithHash(supabase, 'broker_position', filteredPositions);
      positionsCreated = posResult.created;
      duplicates += posResult.duplicates;
    }

    await supabase.from('broker_connection_new').update({
      status: 'connected',
      last_connected_at: new Date().toISOString(),
      error_count: 0,
      last_error: null,
    }).eq('id', connection.id);
    await supabase.from('sync_history_new').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_seconds: (Date.now() - startedAt) / 1000,
      items_synced: tradesCreated,
      items_created: tradesCreated,
      items_updated: accountsSynced,
      items_failed: 0,
    }).eq('id', historyRow.id);
    await log(supabase, connection, 'info', `Sync completed: ${tradesCreated} trades, ${accountsSynced} accounts`, { duration_ms: Date.now() - startedAt });
    return {
      status: 'completed',
      accounts_synced: accountsSynced,
      accounts_created: accountsCreated,
      created: tradesCreated,
      updated: accountsSynced,
      positions_created: positionsCreated,
      duplicates,
      source: result.source,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    await supabase.from('sync_history_new').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_seconds: (Date.now() - startedAt) / 1000,
      items_failed: 1,
    }).eq('id', historyRow.id);
    await supabase.from('broker_connection_new').update({ status: 'error', error_count: (connection.error_count || 0) + 1, last_error: message }).eq('id', connection.id);
    await log(supabase, connection, 'error', message);
    return { status: 'failed', accounts_synced: 0, created: 0, updated: 0, duplicates: 0, error: message };
  }
}

async function executionAnalysis(supabase: any, connection: any): Promise<any> {
  const { data: trades } = await supabase.from('imported_trade')
    .select('profit, commission, swap, result, raw_data')
    .eq('connection_id', connection.id)
    .eq('project_id', connection.project_id);
  const list = (trades || []) as any[];
  const profits: number[] = list.map((t: any) => Number(t.profit ?? 0));
  const winners = profits.filter((p) => p > 0);
  const losers = profits.filter((p) => p < 0);
  const grossProfit = winners.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losers.reduce((s, p) => s + p, 0));

  const slippage: number[] = [];
  const executionMs: number[] = [];
  for (const t of list) {
    const raw = t.raw_data && typeof t.raw_data === 'object' ? t.raw_data : {};
    const s = Number(raw.slippage ?? raw.slippage_points ?? 0);
    if (!isNaN(s) && s !== 0) slippage.push(s);
    const ms = Number(raw.execution_ms ?? raw.latency_ms ?? 0);
    if (!isNaN(ms) && ms > 0) executionMs.push(ms);
  }

  const { data: orders } = await supabase.from('broker_order').select('order_status').eq('connection_id', connection.id);
  const rejected = (orders || []).filter((o: any) => ['rejected', 'failed', 'error'].includes(String(o.order_status || '').toLowerCase())).length;
  const { data: health } = await supabase.from('broker_health').select('*').eq('connection_id', connection.id).eq('project_id', connection.project_id).maybeSingle();
  const { count: logErrors } = await supabase.from('broker_log').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id).eq('level', 'error');
  const { count: logTotal } = await supabase.from('broker_log').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id);

  return {
    total_trades: list.length,
    profitable_trades: winners.length,
    losing_trades: losers.length,
    win_rate: list.length ? Math.round((winners.length / list.length) * 1000) / 10 : 0,
    total_profit: Math.round(grossProfit * 100) / 100,
    total_loss: Math.round(grossLoss * 100) / 100,
    profit_factor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? null : 0,
    total_commission: Math.round(list.reduce((s, t: any) => s + Number(t.commission ?? 0), 0) * 100) / 100,
    total_swap: Math.round(list.reduce((s, t: any) => s + Number(t.swap ?? 0), 0) * 100) / 100,
    avg_execution_ms: executionMs.length ? Math.round(executionMs.reduce((s, v) => s + v, 0) / executionMs.length) : null,
    avg_slippage: slippage.length ? Math.round((slippage.reduce((s, v) => s + v, 0) / slippage.length) * 100) / 100 : null,
    avg_spread: null,
    rejected_orders: rejected,
    latency_avg_ms: health?.latency_ms ?? null,
    uptime_pct: health?.uptime_percentage ?? null,
    error_rate: logTotal ? Math.round(((logErrors ?? 0) / logTotal) * 1000) / 10 : null,
  };
}

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
    const connectionId = data?.connection_id;
    if (!connectionId) return errorResponse('Missing connection_id');
    const reqLogger = logger.with({ project_id, operation: op, connection_id: connectionId });

    const { data: connection, error: connErr } = await supabase
      .from('broker_connection_new').select('*').eq('id', connectionId).eq('project_id', project_id).maybeSingle();
    if (connErr) throw new Error(connErr.message);
    if (!connection) return errorResponse('Connection not found');

    switch (operation) {
      case 'test-connection': {
        const result = await testConnection(supabase, connection);
        reqLogger.info('connection tested', { provider: connection.provider, success: result.success, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      case 'sync': {
        const result = await syncConnection(supabase, connection);
        reqLogger.info('sync completed', { provider: connection.provider, status: result.status, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      case 'sync-account': {
        const accountId = data?.account_id;
        if (!accountId) return errorResponse('Missing account_id');
        const { data: account } = await supabase.from('broker_account').select('id').eq('id', accountId).eq('connection_id', connectionId).maybeSingle();
        if (!account) return errorResponse('Account not found');
        const result = await syncConnection(supabase, connection, accountId);
        reqLogger.info('account synced', { provider: connection.provider, account_id: accountId, status: result.status, duration_ms: Date.now() - startedAt });
        return successResponse({ status: result.status, created: result.created, duplicates: result.duplicates, accounts_synced: result.accounts_synced });
      }

      case 'execution-analysis': {
        const result = await executionAnalysis(supabase, connection);
        reqLogger.info('execution analysis done', { provider: connection.provider, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      case 'check-health': {
        const result = await testConnection(supabase, connection);
        const { data: health } = await supabase.from('broker_health')
          .select('*').eq('connection_id', connectionId).eq('project_id', project_id).maybeSingle();
        reqLogger.info('health checked', { provider: connection.provider, reachable: result.success, duration_ms: Date.now() - startedAt });
        return successResponse(health || { connection_id: connectionId, is_reachable: result.success, latency_ms: result.latency_ms, error_message: result.message });
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    logger.error('broker-sync failed', { operation: op, project_id: projectId, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

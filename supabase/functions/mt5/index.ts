import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger, CircuitBreaker, RetryStrategy } from '../_shared/logging.ts';
import { hashImport } from '../_shared/hash.ts';

const METAPI_TOKEN = Deno.env.get('METAPI_TOKEN') || '';
const METAPI_BASE = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';
const TIMEOUT_MS = 20_000;

const logger = new Logger({ function: 'mt5' });
const metaApiBreaker = new CircuitBreaker('metaapi', 5, 60000, 30000);

async function metaApi(path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  return metaApiBreaker.call(() =>
    RetryStrategy.withBackoff(
      async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const res = await fetch(`${METAPI_BASE}${path}`, {
            method,
            headers: { 'auth-token': METAPI_TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });
          const text = await res.text();
          let data: any = null;
          try { data = JSON.parse(text); } catch {}
          if (!res.ok && (res.status === 429 || res.status >= 500)) {
            const e = new Error(`MetaApi HTTP ${res.status}`) as Error & { status?: number };
            e.status = res.status;
            throw e;
          }
          return { ok: res.ok, status: res.status, data };
        } finally {
          clearTimeout(timer);
        }
      },
      {
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        shouldRetry: (err) => {
          const status = (err as { status?: number })?.status;
          if (status === 429 || (status !== undefined && status >= 500)) return true;
          const msg = err instanceof Error ? err.message : '';
          return msg.includes('timeout') || msg.includes('abort');
        },
        onRetry: (_err, attempt) => logger.warn('MetaApi retry', { path, method, attempt }),
      },
    ),
  ).catch((err) => {
    const status = (err as { status?: number })?.status ?? 502;
    logger.error('MetaApi request failed', { path, method, status, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, status, data: null };
  });
}

function activeConnection(supabase: any, rows: any[]): any | null {
  return (rows || []).find((c) => c.provider === 'metatrader5' && c.is_active !== false) || null;
}

async function findActiveMt5(supabase: any, user: any): Promise<{ connection: any; supabase: any }> {
  const { data: projects } = await supabase.from('project').select('id').eq('user_id', user.id);
  const projectIds = (projects || []).map((p: any) => p.id);
  let connection: any = null;
  if (projectIds.length > 0) {
    const { data: rows } = await supabase
      .from('broker_connection_new')
      .select('*')
      .in('project_id', projectIds)
      .eq('provider', 'metatrader5');
    connection = activeConnection(supabase, rows);
  }
  return { connection, supabase };
}

function dealToTrade(deal: any, connection: any, account: any): Record<string, unknown> | null {
  if (deal.entry !== 'DEAL_ENTRY_OUT' && deal.entry !== 'DEAL_ENTRY_INOUT') return null;
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    project_id: connection.project_id,
    connection_id: connection.id,
    account_id: account?.id ?? null,
    external_id: String(deal.id ?? ''),
    symbol: deal.symbol || null,
    trade_type: deal.type ? (deal.type === 'DEAL_TYPE_BUY' ? 'BUY' : deal.type === 'DEAL_TYPE_SELL' ? 'SELL' : deal.type) : null,
    volume: num(deal.volume),
    open_price: num(deal.price),
    close_price: null,
    open_time: new Date(deal.time).toISOString(),
    close_time: null,
    profit: num(deal.profit),
    commission: num(deal.commission),
    swap: num(deal.swap),
    magic_number: deal.magic != null ? Number(deal.magic) : null,
    comment: deal.comment || null,
    stop_loss: null,
    take_profit: null,
    raw_data: deal,
  };
}

function accountInfoToRow(info: any, connection: any): Record<string, unknown> {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    connection_id: connection.id,
    project_id: connection.project_id,
    external_id: info.login != null ? String(info.login) : null,
    name: String(info.login ?? 'MT5 Account'),
    account_type: 'mt5',
    currency: info.currency || 'USD',
    leverage: info.leverage != null ? String(info.leverage) : null,
    balance: num(info.balance),
    equity: num(info.equity),
    open_pl: num(info.profit),
    used_margin: num(info.margin),
    free_margin: num(info.marginFree),
    margin_level: num(info.marginLevel),
    metadata: info,
    last_synced_at: new Date().toISOString(),
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
    const reqLogger = logger.with({ project_id, operation: op });
    const response = await handleOperation(supabase, user, operation, project_id, data, reqLogger);
    return response;
  } catch (err) {
    logger.error('mt5 failed', { operation: op, project_id: projectId, error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

async function handleOperation(
  supabase: any,
  user: any,
  operation: string,
  project_id: string | undefined,
  data: any,
  reqLogger: Logger,
): Promise<Response> {
  const startedAt = Date.now();
  try {
    switch (operation) {
      case 'connect': {
        const account = data?.account;
        const server = data?.server;
        const password = data?.password;
        const terminalPath = data?.terminal_path;
        if (!account || !server) return errorResponse('Missing account or server');
        if (!project_id) return errorResponse('Missing project_id');

        if (!METAPI_TOKEN) {
          const { data: existing } = await supabase
            .from('broker_connection_new')
            .select('*').eq('project_id', project_id).eq('provider', 'metatrader5').maybeSingle();
          if (!existing) {
            const { data: row, error } = await supabase.from('broker_connection_new').insert({
              project_id,
              provider: 'metatrader5',
              label: `MT5 ${account} (${server})`,
              status: 'configured',
              config: { account, server, terminal_path: terminalPath, simulated: false },
              credentials_encrypted: password ? JSON.stringify({ password }) : null,
            }).select().single();
            if (error) throw new Error(error.message);
            return successResponse({
              ...row,
              last_error: 'METAPI_TOKEN not configured: set it in Supabase project settings to enable cloud sync. Connection saved locally.',
            });
          }
          return successResponse({ ...existing, last_error: 'METAPI_TOKEN not configured: set it in Supabase project settings to enable cloud sync.' });
        }

        let accountId: string | null = null;
        const { data: existing } = await supabase
          .from('broker_connection_new')
          .select('*').eq('project_id', project_id).eq('provider', 'metatrader5').maybeSingle();
        const metaAccountId = existing?.metadata?.metaapi_account_id || existing?.config?.metaapi_account_id;

        if (!metaAccountId) {
          const { data: profiles } = await metaApi('/users/current/provisioning-profiles');
          let profile = (profiles?.data || []).find((p: any) => p.name === 'MINOREDB-MT5');
          if (!profile) {
            const created = await metaApi('/users/current/provisioning-profiles', 'POST', {
              name: 'MINOREDB-MT5',
              version: 5,
              brokerTimezone: 'Etc/UTC',
              riskManagement: { maxTradeRate: 0.5, marginCutPercent: 100 },
            });
            if (created.ok) profile = created.data;
            else return errorResponse(`Failed to create MetaApi provisioning profile: ${created.data?.message || `HTTP ${created.status}`}`, 502);
          }
          const created = await metaApi(`/users/current/provisioning-profiles/${profile._id}/accounts`, 'POST', {
            name: `${account}@${server}`,
            type: 'cloud',
            login: account,
            server: { serverName: server },
            password,
          });
          if (!created.ok) return errorResponse(`Failed to create MetaApi account: ${created.data?.message || `HTTP ${created.status}`}`, 502);
          accountId = created.data._id;
          const deployed = await metaApi(`/users/current/accounts/${accountId}/deploy`, 'POST');
          if (!deployed.ok) return errorResponse(`Failed to deploy MT5 terminal: ${deployed.data?.message || `HTTP ${deployed.status}`}`, 502);
        } else {
          accountId = metaAccountId;
        }

        const info = await metaApi(`/users/current/accounts/${accountId}/account-information`);
        const row: Record<string, unknown> = {
          project_id,
          provider: 'metatrader5',
          label: `MT5 ${account} (${server})`,
          status: 'connected',
          config: { account, server, terminal_path: terminalPath, metaapi_account_id: accountId },
          credentials_encrypted: password ? JSON.stringify({ password }) : null,
          metadata: info.ok ? { metaapi: { account_id: accountId, balance: info.data?.balance, equity: info.data?.equity } } : { metaapi: { account_id: accountId } },
          last_connected_at: new Date().toISOString(),
        };
        let result: any;
        if (existing) {
          const { data: updated, error } = await supabase.from('broker_connection_new').update(row).eq('id', existing.id).select().single();
          if (error) throw new Error(error.message);
          result = updated;
        } else {
          const { data: inserted, error } = await supabase.from('broker_connection_new').insert(row).select().single();
          if (error) throw new Error(error.message);
          result = inserted;
        }

        if (info.ok) {
          const accountRow = accountInfoToRow(info.data, result);
          const { data: accountExisting } = await supabase.from('broker_account')
            .select('id').eq('connection_id', result.id).eq('external_id', String(info.data.login)).maybeSingle();
          if (accountExisting) {
            await supabase.from('broker_account').update(accountRow).eq('id', accountExisting.id);
          } else {
            await supabase.from('broker_account').insert(accountRow);
          }
        }
        return successResponse(result);
      }

      case 'disconnect': {
        const { connection } = await findActiveMt5(supabase, user);
        if (!connection) return successResponse(null);
        const metaAccountId = connection.metadata?.metaapi_account_id || connection.config?.metaapi_account_id;
        if (METAPI_TOKEN && metaAccountId) {
          await metaApi(`/users/current/accounts/${metaAccountId}/undeploy`, 'POST');
        }
        const { data: updated, error } = await supabase.from('broker_connection_new')
          .update({ status: 'disconnected', is_active: false, last_error: null })
          .eq('id', connection.id).select().single();
        if (error) throw new Error(error.message);
        return successResponse(updated);
      }

      case 'status': {
        const { connection } = await findActiveMt5(supabase, user);
        if (!connection) {
          return successResponse({ connected: false, total_trades: 0, total_synced: 0 });
        }
        const { count: totalTrades } = await supabase.from('imported_trade')
          .select('id', { count: 'exact', head: true }).eq('connection_id', connection.id);
        const metaAccountId = connection.metadata?.metaapi_account_id || connection.config?.metaapi_account_id;
        let broker: string | undefined;
        let account: string | undefined;
        let server: string | undefined;
        if (METAPI_TOKEN && metaAccountId) {
          const info = await metaApi(`/users/current/accounts/${metaAccountId}/account-information`);
          if (info.ok && info.data) {
            broker = info.data.broker;
            account = info.data.login != null ? String(info.data.login) : undefined;
            server = info.data.server;
          }
        }
        const config = connection.config || {};
        return successResponse({
          connected: connection.status === 'connected',
          broker: broker || (connection.metadata?.broker as string) || undefined,
          account: account || config.account || undefined,
          server: server || config.server || undefined,
          terminal_path: config.terminal_path || undefined,
          last_sync: connection.last_connected_at || null,
          total_trades: totalTrades ?? 0,
          total_synced: totalTrades ?? 0,
        });
      }

      case 'sync': {
        const mode = data?.mode || 'incremental';
        const { connection } = await findActiveMt5(supabase, user);
        if (!connection) return errorResponse('No MT5 connection found');
        const metaAccountId = connection.metadata?.metaapi_account_id || connection.config?.metaapi_account_id;
        if (!METAPI_TOKEN || !metaAccountId) {
          return errorResponse('METAPI_TOKEN not configured and no MetaApi account linked. Set METAPI_TOKEN in Supabase project settings to enable cloud sync.', 400);
        }
        const startedAt = Date.now();

        const accounts = await supabase.from('broker_account').select('*').eq('connection_id', connection.id);
        const account = (accounts.data || [])[0] || null;

        const params = new URLSearchParams();
        const from = mode === 'full' ? new Date(Date.now() - 365 * 24 * 3600 * 1000) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
        params.set('startTime', from.toISOString());
        params.set('endTime', new Date().toISOString());
        const deals = await metaApi(`/users/current/accounts/${metaAccountId}/history-deals?${params.toString()}`);

        let imported = 0, skipped = 0, updated = 0;
        const failures: string[] = [];
        if (deals.ok) {
          const list = (deals.data?.deals || []) as any[];
          const rows: Record<string, unknown>[] = [];
          for (const deal of list) {
            const row = dealToTrade(deal, connection, account);
            if (!row) { skipped += 1; continue; }
            row.import_hash = await hashImport(row);
            rows.push(row);
          }
          const hashes = rows.map((r) => r.import_hash);
          const { data: existing } = await supabase.from('imported_trade').select('import_hash, external_id').in('import_hash', hashes as string[]);
          const existingHashes = new Set((existing || []).map((e: any) => e.import_hash));
          const fresh = rows.filter((r) => !existingHashes.has(r.import_hash as string));
          if (fresh.length > 0) {
            const { data: inserted, error } = await supabase.from('imported_trade').insert(fresh).select('id');
            if (error) failures.push(error.message);
            else imported = inserted?.length ?? 0;
          }
          updated = (existing || []).length;
        } else {
          failures.push(`MetaApi history-deals error: ${deals.data?.message || `HTTP ${deals.status}`}`);
        }

        const info = await metaApi(`/users/current/accounts/${metaAccountId}/account-information`);
        if (info.ok && info.data) {
          const accountRow = accountInfoToRow(info.data, connection);
          if (account) {
            await supabase.from('broker_account').update(accountRow).eq('id', account.id);
          } else {
            await supabase.from('broker_account').insert(accountRow);
          }
        }

        await supabase.from('broker_connection_new').update({
          status: 'connected',
          last_connected_at: new Date().toISOString(),
          error_count: failures.length > 0 ? 0 : 0,
          last_error: failures.length > 0 ? failures[0] : null,
        }).eq('id', connection.id);

        return successResponse({
          status: failures.length > 0 ? 'partial' : 'completed',
          trades_imported: imported,
          trades_skipped: skipped,
          trades_updated: updated,
          duration_ms: Date.now() - startedAt,
          errors: failures,
        });
      }

      case 'logs': {
        const limit = Math.min(Number(data?.limit ?? 100) || 100, 500);
        const { data: projects } = await supabase.from('project').select('id').eq('user_id', user.id);
        const projectIds = (projects || []).map((p: any) => p.id);
        if (projectIds.length === 0) return successResponse([]);
        const { data: connections } = await supabase
          .from('broker_connection_new')
          .select('id, label')
          .in('project_id', projectIds)
          .eq('provider', 'metatrader5');
        const connectionIds = (connections || []).map((c: any) => c.id);
        if (connectionIds.length === 0) return successResponse([]);
        const { data: rows, error } = await supabase
          .from('sync_history_new')
          .select('*')
          .in('connection_id', connectionIds)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        const byId = new Map((connections || []).map((c: any) => [c.id, c.label || 'MT5']));
        return successResponse((rows || []).map((r: any) => ({
          id: r.id,
          broker: byId.get(r.connection_id) || 'metatrader5',
          trade_ticket: r.items_synced ?? 0,
          sync_time: r.created_at,
          status: r.status,
          message: r.error_message || `${r.items_created ?? 0} created, ${r.items_updated ?? 0} updated, ${r.items_duplicates ?? 0} duplicates`,
          created_at: r.created_at,
        })));
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } finally {
    reqLogger.info('operation finished', { duration_ms: Date.now() - startedAt });
  }
}

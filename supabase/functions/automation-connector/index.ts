import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { Logger, RetryStrategy } from '../_shared/logging.ts';

const logger = new Logger({ function: 'automation-connector' });

async function postWithRetry(url: string, headers: Record<string, string>, payload: unknown, label: string): Promise<Response> {
  return RetryStrategy.withBackoff(
    async () => {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const e = Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
        throw e;
      }
      return res;
    },
    {
      maxRetries: 1,
      baseDelayMs: 500,
      maxDelayMs: 2000,
      shouldRetry: (err) => {
        const status = (err as { status?: number })?.status;
        return status === 429 || (status !== undefined && status >= 500);
      },
      onRetry: (_err, attempt) => logger.warn('Webhook retry', { label, attempt }),
    },
  );
}

// ---------- Safe expression evaluation ----------

type Token = { type: 'num' | 'str' | 'ident' | 'op' | 'lparen' | 'rparen'; value?: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const re = /([0-9]*\.?[0-9]+)|("(?:[^"\\]|\\.)*")|([a-zA-Z_][a-zA-Z0-9_.]*)|(==|===|!=|!==|>=|<=|&&|\|\||[<>=!+\-*/%()])|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr))) {
    if (m[0].trim() === '') continue;
    if (m[1] !== undefined) tokens.push({ type: 'num', value: m[1] });
    else if (m[2] !== undefined) {
      let v = m[2].slice(1, -1);
      v = v.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      tokens.push({ type: 'str', value: v });
    } else if (m[3] !== undefined) tokens.push({ type: 'ident', value: m[3] });
    else if (m[4] === '(') tokens.push({ type: 'lparen' });
    else if (m[4] === ')') tokens.push({ type: 'rparen' });
    else tokens.push({ type: 'op', value: m[4] });
  }
  if (!re.lastIndex || re.lastIndex === 0) {
    const stripped = expr.replace(re, '').trim();
    if (stripped) throw new Error(`Invalid expression characters: "${stripped}"`);
  }
  return tokens;
}

function resolvePath(ctx: Record<string, unknown>, path: string): unknown {
  if (path in ctx) return ctx[path];
  const parts = path.split('.');
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else return undefined;
  }
  return cur;
}

function compare(op: string, left: unknown, right: unknown): boolean {
  const l = typeof left === 'string' ? left : typeof left === 'number' ? left : String(left ?? '');
  const r = typeof right === 'string' ? right : typeof right === 'number' ? right : String(right ?? '');
  switch (op) {
    case '==': case '===': return l === r;
    case '!=': case '!==': return l !== r;
    case '>': return l > r;
    case '<': return l < r;
    case '>=': return l >= r;
    case '<=': return l <= r;
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

class Parser {
  pos = 0;
  constructor(private tokens: Token[], private ctx: Record<string, unknown>) {}

  peek(): Token | undefined { return this.tokens[this.pos]; }
  next(): Token | undefined { return this.tokens[this.pos++]; }

  parse(): boolean {
    const value = this.parseOr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected trailing tokens in expression');
    return !!value;
  }

  private parseOr(): unknown {
    let left = this.parseAnd();
    while (this.peek()?.type === 'op' && (this.peek() as Token).value === '||') {
      this.next();
      const right = this.parseAnd();
      left = !!left || !!right;
    }
    return left;
  }

  private parseAnd(): unknown {
    let left = this.parseComparison();
    while (this.peek()?.type === 'op' && (this.peek() as Token).value === '&&') {
      this.next();
      const right = this.parseComparison();
      left = !!left && !!right;
    }
    return left;
  }

  private parseComparison(): unknown {
    const left = this.parseUnary();
    const t = this.peek();
    if (t?.type === 'op' && t.value && ['==', '===', '!=', '!==', '>', '<', '>=', '<='].includes(t.value)) {
      this.next();
      const right = this.parseUnary();
      return compare(t.value as string, left, right);
    }
    return left;
  }

  private parseUnary(): unknown {
    const t = this.peek();
    if (t?.type === 'op' && t.value === '!') {
      this.next();
      return !this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): unknown {
    const t = this.next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'num') return parseFloat(t.value as string);
    if (t.type === 'str') return t.value;
    if (t.type === 'ident') {
      const v = resolvePath(this.ctx, t.value as string);
      if (typeof v === 'string') {
        const num = Number(v);
        if (!isNaN(num) && v.trim() !== '') return num;
      }
      return v;
    }
    if (t.type === 'lparen') {
      const value = this.parseOr();
      const close = this.next();
      if (close?.type !== 'rparen') throw new Error('Missing closing parenthesis');
      return value;
    }
    throw new Error(`Unexpected token: ${JSON.stringify(t)}`);
  }
}

function evalExpression(expr: string, ctx: Record<string, unknown>): boolean {
  const trimmed = (expr || '').trim();
  if (!trimmed) return true;
  const tokens = tokenize(trimmed);
  return new Parser(tokens, ctx).parse();
}

// ---------- Rule evaluation ----------

function cooldownActive(rule: any): boolean {
  if (!rule.cooldown_minutes || !rule.last_triggered_at) return false;
  const elapsed = Date.now() - new Date(rule.last_triggered_at).getTime();
  return elapsed < (rule.cooldown_minutes || 0) * 60_000;
}

function evalCondition(c: any, ctx: Record<string, unknown>): boolean {
  if (c == null) return true;
  if (c.expression) return evalExpression(c.expression, ctx);
  const field = c.field || c.key;
  if (!field) return true;
  const value = resolvePath(ctx, field);
  if (c.operator) {
    return compare(c.operator, value, c.value);
  }
  return !!value;
}

async function evaluateRules(supabase: any, projectId: string, context: Record<string, unknown>): Promise<any[]> {
  const { data: rules, error } = await supabase
    .from('automation_rule')
    .select('*')
    .eq('project_id', projectId)
    .eq('enabled', true)
    .order('priority', { ascending: true });
  if (error) throw new Error(error.message);

  const matched: any[] = [];
  for (const rule of rules || []) {
    let result = true;
    if (rule.condition_expression) {
      try {
        result = evalExpression(rule.condition_expression, context);
      } catch {
        result = false;
      }
    }
    if (result && Array.isArray(rule.conditions) && rule.conditions.length > 0) {
      for (const cond of rule.conditions) {
        if (!evalCondition(cond, context)) { result = false; break; }
      }
    }
    if (result) {
      if (!cooldownActive(rule)) {
        await supabase.from('automation_rule')
          .update({ trigger_count: (rule.trigger_count || 0) + 1, last_triggered_at: new Date().toISOString() })
          .eq('id', rule.id);
      }
      matched.push({ ...rule, matched: true });
    }
  }
  return matched;
}

// ---------- Report generation ----------

function periodRange(period: string): { from: string; label: string } {
  const now = new Date();
  let from = new Date(now);
  switch (period) {
    case 'daily': from.setHours(now.getHours() - 24, now.getMinutes(), 0, 0); break;
    case 'weekly': from.setDate(now.getDate() - 7); break;
    case 'monthly': from.setMonth(now.getMonth() - 1); break;
    case 'quarterly': from.setMonth(now.getMonth() - 3); break;
    default: from = new Date(0);
  }
  const label = period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : period === 'quarterly' ? 'Quarterly' : 'All-time';
  return { from: from.toISOString(), label };
}

async function computeStats(supabase: any, projectId: string, period: string): Promise<any> {
  const { from, label } = periodRange(period);
  const { data: trades, error } = await supabase
    .from('trade')
    .select('pnl, result, rr, risk_percent, pair, direction, close_time, status')
    .eq('project_id', projectId)
    .eq('status', 'CLOSED')
    .gte('close_time', from);
  if (error) throw new Error(error.message);

  const list = (trades || []) as any[];
  const pnls = list.map((t) => Number(t.pnl) || 0);
  const wins = list.filter((t) => t.result === 'WIN' || pnls[list.indexOf(t)] > 0);
  const losses = list.filter((t) => t.result === 'LOSS' || pnls[list.indexOf(t)] < 0);
  const grossProfit = wins.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (Number(t.pnl) || 0), 0));
  const netProfit = pnls.reduce((s, p) => s + p, 0);

  const series: Record<string, number> = {};
  for (const t of list) {
    const day = (t.close_time || '').slice(0, 10);
    if (day) series[day] = (series[day] || 0) + (Number(t.pnl) || 0);
  }
  const dailySeries = Object.entries(series).sort((a, b) => a[0].localeCompare(b[0]));

  let peak = 0, maxDrawdown = 0, running = 0;
  for (const p of pnls) {
    running += p;
    peak = Math.max(peak, running);
    maxDrawdown = Math.min(maxDrawdown, running - peak);
  }

  const byPair: Record<string, { count: number; pnl: number }> = {};
  for (const t of list) {
    const pair = t.pair || 'OTHER';
    byPair[pair] = byPair[pair] || { count: 0, pnl: 0 };
    byPair[pair].count += 1;
    byPair[pair].pnl += Number(t.pnl) || 0;
  }

  const rrValues = list.map((t) => Number(t.rr) || 0).filter((r) => r !== 0);
  const riskValues = list.map((t) => Number(t.risk_percent) || 0).filter((r) => r > 0);

  const stats = {
    period: label,
    from: from.slice(0, 10),
    total_trades: list.length,
    wins: wins.length,
    losses: losses.length,
    win_rate: list.length ? Math.round((wins.length / list.length) * 1000) / 10 : 0,
    gross_profit: Math.round(grossProfit * 100) / 100,
    gross_loss: Math.round(grossLoss * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
    profit_factor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? null : 0,
    avg_win: wins.length ? Math.round((grossProfit / wins.length) * 100) / 100 : 0,
    avg_loss: losses.length ? Math.round((grossLoss / losses.length) * 100) / 100 : 0,
    avg_rr: rrValues.length ? Math.round((rrValues.reduce((s, v) => s + v, 0) / rrValues.length) * 100) / 100 : 0,
    avg_risk_percent: riskValues.length ? Math.round((riskValues.reduce((s, v) => s + v, 0) / riskValues.length) * 100) / 100 : 0,
    max_win: pnls.length ? Math.max(...pnls) : 0,
    max_loss: pnls.length ? Math.min(...pnls) : 0,
    max_drawdown: Math.round(maxDrawdown * 100) / 100,
    daily_pnl: dailySeries,
    by_pair: byPair,
  };
  return stats;
}

function renderMarkdown(stats: any, reportType: string): string {
  const lines: string[] = [];
  lines.push(`# ${stats.period} Report (${reportType})`);
  lines.push('');
  lines.push(`- **Trades:** ${stats.total_trades} (${stats.wins}W / ${stats.losses}L)`);
  lines.push(`- **Win rate:** ${stats.win_rate}%`);
  lines.push(`- **Net PnL:** ${stats.net_profit}`);
  lines.push(`- **Profit factor:** ${stats.profit_factor ?? 'n/a'}`);
  lines.push(`- **Gross profit / loss:** ${stats.gross_profit} / ${stats.gross_loss}`);
  lines.push(`- **Avg win / loss:** ${stats.avg_win} / ${stats.avg_loss}`);
  lines.push(`- **Avg R:R:** ${stats.avg_rr}`);
  lines.push(`- **Avg risk:** ${stats.avg_risk_percent}%`);
  lines.push(`- **Max drawdown:** ${stats.max_drawdown}`);
  if (stats.daily_pnl.length) {
    lines.push('');
    lines.push('### Daily PnL');
    for (const [day, pnl] of stats.daily_pnl.slice(-14)) lines.push(`- ${day}: ${pnl}`);
  }
  return lines.join('\n');
}

async function generateReportFor(supabase: any, projectId: string, reportType: string): Promise<{ report: any; stats: any }> {
  const stats = await computeStats(supabase, projectId, reportType);
  const markdown = renderMarkdown(stats, reportType);
  const { data: report, error } = await supabase
    .from('automation_report')
    .insert({
      project_id: projectId,
      name: `${stats.period} Report`,
      report_type: reportType,
      format: 'markdown',
      enabled: true,
      last_generated_at: new Date().toISOString(),
      last_generated_result: markdown,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { report, stats };
}

// ---------- Connectors ----------

async function testConnector(supabase: any, projectId: string, connectorId: string): Promise<any> {
  const { data: connector, error } = await supabase
    .from('automation_connector')
    .select('*')
    .eq('id', connectorId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!connector) throw new Error('Connector not found');

  const cfg = connector.config || {};
  let ok = false;
  let message = '';
  try {
    if (connector.connector_type === 'email') {
      ok = true;
      message = 'Email channel configured';
    } else {
      const url = cfg.url || cfg.webhook_url || '';
      if (!url) throw new Error('No webhook URL configured');
      const payload = connector.connector_type === 'discord' || connector.connector_type === 'slack'
        ? { content: 'MINOREDB connectivity test' }
        : connector.connector_type === 'telegram'
          ? { text: 'MINOREDB connectivity test' }
          : (cfg.payload || { ping: true, ts: new Date().toISOString() });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cfg.headers) Object.assign(headers, cfg.headers);
      const res = await postWithRetry(url, headers, payload, `test_${connector.connector_type}`);
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      ok = true;
      message = 'Connected';
    }
  } catch (err) {
    message = err instanceof Error ? err.message : 'Failed';
  }
  await supabase.from('automation_connector').update({
    status: ok ? 'connected' : 'error',
    error: ok ? null : message,
  }).eq('id', connectorId);
  return { id: connectorId, ok, message };
}

async function syncConnector(supabase: any, projectId: string, connectorId: string): Promise<any> {
  const { data: connector, error } = await supabase
    .from('automation_connector')
    .select('*')
    .eq('id', connectorId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!connector) throw new Error('Connector not found');

  const cfg = connector.config || {};
  const url = cfg.url || cfg.webhook_url;
  if (url) {
    try {
      await postWithRetry(url, { 'Content-Type': 'application/json', ...(cfg.headers || {}) }, { event: 'sync', connector_id: connectorId, ts: new Date().toISOString() }, `sync_${connectorId}`);
    } catch (err) {
      logger.warn('connector sync webhook failed', { connector_id: connectorId, error: err instanceof Error ? err.message : 'unknown' });
    }
  }
  await supabase.from('automation_connector').update({
    status: 'connected',
    last_sync_at: new Date().toISOString(),
    error: null,
  }).eq('id', connectorId);
  return { id: connectorId, ok: true, last_sync_at: new Date().toISOString() };
}

// ---------- Job runner ----------

function nextRunFromCron(cronExpr: string | null, from: Date): Date {
  if (!cronExpr || cronExpr.trim() === '* * * * *') {
    const d = new Date(from.getTime() + 5 * 60_000);
    return d;
  }
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return new Date(from.getTime() + 5 * 60_000);
  const [minF, hourF, , , ] = parts;
  const minutes = minF === '*' ? null : minF.startsWith('*/') ? parseInt(minF.slice(2)) : parseInt(minF);
  const hours = hourF === '*' ? null : hourF.startsWith('*/') ? parseInt(hourF.slice(2)) : parseInt(hourF);

  const d = new Date(from.getTime() + 60_000);
  d.setSeconds(0, 0);
  if (minutes === null && hours === null) return d;
  if (typeof minutes === 'number' && typeof hours === 'number') {
    d.setHours(hours, minutes, 0, 0);
    if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }
  if (typeof minutes === 'number' && hours === null) {
    if (d.getMinutes() !== minutes) {
      if (d.getMinutes() > minutes) d.setHours(d.getHours() + 1);
      d.setMinutes(minutes, 0, 0);
    }
    return d;
  }
  if (typeof hours === 'number' && minutes === null) {
    if (d.getHours() !== hours) {
      if (d.getHours() > hours) d.setDate(d.getDate() + 1);
      d.setHours(hours, d.getMinutes(), 0, 0);
    }
    return d;
  }
  const step = typeof minutes === 'number' ? minutes : 5;
  const rem = d.getMinutes() % step;
  if (rem !== 0) d.setMinutes(d.getMinutes() + (step - rem), 0, 0);
  return d;
}

async function runJob(supabase: any, job: any): Promise<string | null> {
  const cfg = job.action_config || {};
  const now = new Date().toISOString();
  let errorMsg: string | null = null;
  try {
    switch (job.action_type || 'notification') {
      case 'notification': {
        const { error } = await supabase.from('automation_notification').insert({
          project_id: job.project_id,
          title: cfg.title || job.name,
          message: cfg.message || `Scheduled job "${job.name}" ran`,
          notification_type: cfg.notification_type || 'info',
          channel: cfg.channel || 'in_app',
          status: 'sent',
          sent_at: now,
          source: 'scheduled_job',
          source_id: job.id,
        });
        if (error) throw new Error(error.message);
        break;
      }
      case 'webhook': {
        const url = cfg.url;
        if (url) {
          const res = await postWithRetry(url, { 'Content-Type': 'application/json', ...(cfg.headers || {}) }, cfg.payload || { event: 'scheduled_job', job_id: job.id, ts: now }, `job_webhook_${job.id}`);
          if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
        }
        break;
      }
      case 'report': {
        await generateReportFor(supabase, job.project_id, cfg.report_type || 'daily');
        break;
      }
      case 'api_call': {
        const url = cfg.url;
        if (url) {
          const method = cfg.method || 'GET';
          const res = await RetryStrategy.withBackoff(
            async () => {
              const r = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
                body: cfg.payload ? JSON.stringify(cfg.payload) : undefined,
              });
              if (!r.ok) {
                const e = Object.assign(new Error(`API responded ${r.status}`), { status: r.status });
                throw e;
              }
              return r;
            },
            {
              maxRetries: 1,
              baseDelayMs: 500,
              maxDelayMs: 2000,
              shouldRetry: (err) => {
                const status = (err as { status?: number })?.status;
                return status === 429 || (status !== undefined && status >= 500);
              },
            },
          );
          if (!res.ok) throw new Error(`API responded ${res.status}`);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Job failed';
  }
  const next = nextRunFromCron(job.cron_expression, new Date());
  await supabase.from('automation_scheduled_job').update({
    last_run_at: now,
    next_run_at: next.toISOString(),
    failed_runs: errorMsg ? (job.failed_runs || 0) + 1 : 0,
  }).eq('id', job.id);
  return errorMsg;
}

async function runJobs(supabase: any): Promise<any> {
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from('automation_scheduled_job')
    .select('*')
    .eq('enabled', true)
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .limit(25);
  if (error) throw new Error(error.message);

  const results: any[] = [];
  for (const job of jobs || []) {
    const startedAt = Date.now();
    const { error: execErr } = await supabase.from('automation_job_execution').insert({
      project_id: job.project_id,
      job_id: job.id,
      status: 'running',
      started_at: now,
    });
    if (execErr) {
      results.push({ job_id: job.id, error: execErr.message });
      continue;
    }
    const errorMsg = await runJob(supabase, job);
    const done = new Date().toISOString();
    await supabase.from('automation_job_execution')
      .update({
        status: errorMsg ? 'failed' : 'completed',
        completed_at: done,
        duration_ms: Date.now() - startedAt,
        error: errorMsg,
      })
      .eq('job_id', job.id)
      .eq('started_at', now)
      .order('created_at', { ascending: false })
      .limit(1);
    results.push({ job_id: job.id, status: errorMsg ? 'failed' : 'completed', error: errorMsg });
  }
  return { processed: results.length, results };
}

// ---------- Main ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const startedAt = Date.now();
  try {
    const cronHeader = req.headers.get('x-cron-secret');
    let isCron = false;

    let supabase: any;
    let projectId = '';
    let operation = '';
    let data: any = {};
    let reqLogger = logger;

    if (cronHeader) {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } },
      );
      const { data: cronRow } = await serviceClient
        .from('edge_cron_secrets')
        .select('secret')
        .eq('name', 'automation-connector')
        .maybeSingle();
      isCron = !!cronRow && cronHeader === cronRow.secret;
      if (isCron) {
        supabase = serviceClient;
        const body = await req.json().catch(() => ({}));
        operation = body.operation || 'run_jobs';
        data = body.data || {};
      }
    }
    if (!isCron) {
      const authHeader = req.headers.get('Authorization') || '';
      supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) return errorResponse('Unauthorized', 401);
      const body = await req.json().catch(() => ({}));
      operation = body.operation || '';
      projectId = body.project_id || '';
      data = body.data || {};
      if (!projectId) return errorResponse('Missing project_id');
    }
    reqLogger = logger.with({ project_id: projectId || undefined, operation });

    switch (operation) {
      case 'evaluate_rules': {
        const matched = await evaluateRules(supabase, projectId, (data?.context || {}) as Record<string, unknown>);
        reqLogger.info('rules evaluated', { matched: matched.length, duration_ms: Date.now() - startedAt });
        return successResponse({ matched });
      }

      case 'generate_report': {
        const reportId = data?.report_id;
        if (!reportId) return errorResponse('Missing report_id');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId);
        if (isUuid) {
          const { data: report, error } = await supabase.from('automation_report').select('*').eq('id', reportId).eq('project_id', projectId).maybeSingle();
          if (error) throw new Error(error.message);
          if (!report) return errorResponse('Report not found');
          const stats = await computeStats(supabase, projectId, report.report_type);
          const markdown = renderMarkdown(stats, report.report_type);
          const { data: updated, error: updErr } = await supabase.from('automation_report')
            .update({ last_generated_at: new Date().toISOString(), last_generated_result: markdown })
            .eq('id', reportId).select().single();
          if (updErr) throw new Error(updErr.message);
          reqLogger.info('report generated', { report_id: reportId, duration_ms: Date.now() - startedAt });
          return successResponse({ report: updated, stats });
        }
        const { report, stats } = await generateReportFor(supabase, projectId, reportId);
        reqLogger.info('report generated', { report_type: reportId, duration_ms: Date.now() - startedAt });
        return successResponse({ report, stats });
      }

      case 'generate_daily_report':
      case 'generate_weekly_report':
      case 'generate_monthly_report':
      case 'generate_performance_report':
      case 'generate_risk_report': {
        const typeMap: Record<string, string> = {
          generate_daily_report: 'daily',
          generate_weekly_report: 'weekly',
          generate_monthly_report: 'monthly',
          generate_performance_report: 'performance',
          generate_risk_report: 'risk',
        };
        const { report, stats } = await generateReportFor(supabase, projectId, typeMap[operation]);
        return successResponse({ report, stats });
      }

      case 'test_connector': {
        if (!data?.connector_id) return errorResponse('Missing connector_id');
        const result = await testConnector(supabase, projectId, data.connector_id);
        reqLogger.info('connector tested', { connector_id: data.connector_id, ok: result.ok, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      case 'sync_connector': {
        if (!data?.connector_id) return errorResponse('Missing connector_id');
        const result = await syncConnector(supabase, projectId, data.connector_id);
        reqLogger.info('connector synced', { connector_id: data.connector_id, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      case 'run_jobs': {
        if (!isCron) return errorResponse('Forbidden', 403);
        const result = await runJobs(supabase);
        reqLogger.info('jobs ran', { processed: result.processed, duration_ms: Date.now() - startedAt });
        return successResponse(result);
      }

      default:
        return errorResponse(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    logger.error('automation-connector failed', { error: err instanceof Error ? err.message : 'Unknown error', duration_ms: Date.now() - startedAt });
    return errorResponse(err instanceof Error ? err.message : 'Unknown error', 500);
  }
});

# MINOREDB — Database Status Audit (v1.1.0)

> Based on 43 migration files (00001–00041), ~174 tables, ~40 RPCs.

---

## 1. Broken / failing RPCs

| RPC | Migration | Failure | Consumers | Priority |
|---|---|---|---|---|
| `search_knowledge` | 00031:501-504 | references `source.title` — column **does not exist** (00003 source has no title) | `api/search.ts` (Search page) — error swallowed, results silently missing | HIGH |
| `get_analytics_time_series` | 00009 | ambiguous result variable — never fixed (00022 fixed only overview/breakdowns) | `api/statistics.ts:27` (Analytics/Performance charts render empty) | HIGH |
| `get_distinct_agent_names` | 00031:564 | queries `public.agent` — **table never created** | `api/agents.ts:33,133` (Intelligence/Brain dashboards) | HIGH |
| `get_dashboard_trade_stats` | 00008 | ambiguous result + missing GRANT | Dashboard-era consumers | MEDIUM |
| `get_dashboard_stats` | 00008 | required 6 fix migrations (00021/00022/00023/00035/00040/00041) — now OK | Dashboard (✅ verified) | DONE |

## 2. Tables without RLS (security holes)

| Table | Migration | Risk |
|---|---|---|
| `macro_event` | 00014:177 | ⚠️ also **no `project_id` column** (collector inserts fail); world-writable |
| `market_snapshot` | 00014:193 | world-readable/writable market data |
| `market_candle` | 00018:190 | world-writable OHLC cache |
| `automation_workflow_template` | 00017:205 | world-writable templates |
| `vault_statistics` | 00019 | no RLS |
| `sync_settings` | 00019 | RLS policy created in 00027 but **never enabled** |

## 3. Missing foreign keys

- `trade.strategy_id` → `strategy`
- `trade.market_structure_id` → `market_structure`
- `obsidian_note.vault_id` → `vault`
- Consequences: orphaned rows possible; cascade deletes unreliable.

## 4. Schema defects

- **00032 duplicate `CREATE TABLE IF NOT EXISTS`**: silently diverging definitions for `knowledge_relationship`, `knowledge_example`, `knowledge_reference`, `coaching_session` (adds columns that never take effect on existing tables).
- **No `updated_at` triggers** on ~90 tables (client must set manually; most don't).
- **`soft_delete()` trigger/function never invoked** by any table.
- **No Postgres enums** — statuses stored as free text (drift risk).
- **pgvector**: ivfflat index (00035) — fine at small scale, HNSW recommended later.
- **No realtime publication** configured (only internal Supabase defaults).
- **Storage**: `sources` private + RLS (00030b/00031b) ✅; `trade_screenshots` public (00037) — consider per-project folder restrictions.

## 5. Missing schema (features with no backend)

- **settings table** — Settings page has zero persistence (00027 `settings` never created).
- **agent table** — referenced by `get_distinct_agent_names` but never created (00028 only has agent_task/execution/workflow).
- **quant execution tables** — `quant_backtest_run` exists but no computed results pipeline.
- **macro_event.project_id** — required by collector, absent.

## 6. GRANT coverage

- `get_dashboard_trade_stats` missing GRANT to authenticated (00039 granted only `get_dashboard_stats`).
- Other RPCs generally granted in-file; recommend an audit pass of `REVOKE ALL ... FROM anon` across all 40 RPCs.

## 7. Verified-healthy core paths

- `get_dashboard_stats` (post 6-fix chain) ✅
- `get_analytics_overview`, `get_analytics_breakdowns` ✅
- `get_risk_dashboard`, `calculate_position_size` ✅
- `find_similar_trades` ✅
- `get_portfolio_dashboard` ✅
- `get_quant_dashboard` ✅
- `get_market_intelligence_dashboard` ✅ (00031)
- `get_coaching_sessions`, `get_learning_events` etc. ✅
- RLS on user-owned tables (trades, notes, journals, sources, projects, playbooks) ✅

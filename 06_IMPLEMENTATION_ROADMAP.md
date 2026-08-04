# MINOREDB — Implementation Roadmap (v1.1.0)

> Follows the operating priority order: fix broken → complete unfinished → connect placeholders → connect integrations → remove fake data → detect missing logic → make everything work → verify E2E → cleanup.
> No code was modified during this audit.
> Status as of 2026-08-04: Phase 0 and the flagship integration tasks (Phase 1/2) are shipped and production-verified. Remaining work is Phase 3 cleanup and Phase 4 hardening. `✅` = done + prod-verified.

---

## Phase 0 — Security & integrity (do first, ships value immediately)

| # | Task | Type | Effort | Risk |
|---|---|---|---|---|
| 0.1 | `ai`: add `getUser()` + ownership check to `ingest-document`/`store-memory`; remove client-scoped service-role usage | Fix | S | High |
| 0.2 | RLS: enable + policy `macro_event`, `market_snapshot`, `market_candle`, `automation_workflow_template`, `vault_statistics`, `sync_settings` (add `project_id` to `macro_event` first) | Fix | S–M | High |
| 0.3 | `tv-webhook`: HMAC signature verification | Fix | S | Medium |
| 0.4 | `trade_screenshots`: move to private + signed URLs (or intentional public decision) | Fix | S | Medium |

## Phase 1 — Fix broken features (P1 blockers)

| # | Task | Effort | Risk |
|---|---|---|---|
| 1.1 | ✅ `macro_event.project_id` + RLS + collector `run` error propagation (stop fake success) — 00042 | M | High |
| 1.2 | `search_knowledge` RPC — use real source columns | S | Medium |
| 1.3 | `get_analytics_time_series` — disambiguate result + GRANT | S | Low |
| 1.4 | `agent` table (or rewrite `get_distinct_agent_names` over agent_workflow) | S | Medium |
| 1.5 | Analyst: create conversation before `rag-chat` (or tolerate empty id) | S | Medium |
| 1.6 | Implement 6 missing AI Foundation ops + fix `generate-coaching` param | M | Medium |
| 1.7 | Implement Copilot ops (`chat`, `execute-workflow`, `list-tools`, `execute-tool`, `search`, `ingest`, `citations`, `context`) or disable the surface | L | Medium |
| 1.8 | ✅ collector `toggle` `.single()` 500 | S | Low |

## Phase 2 — Connect placeholders & integrations

| # | Task | Effort | Risk |
|---|---|---|---|
| 2.1 | ✅ `obsidian-sync` (check-health/import/import-data/export/resolve-conflict/auto-link) + VaultManager REST URL/token — v7 prod | L | Medium |
| 2.2 | ✅ `broker-sync` (test-connection/sync/sync-account/execution-analysis/check-health) + credentials_encrypted mapping fix — v8 prod | L | Medium |
| 2.3 | ✅ `automation-connector` (evaluate-rules/generate_*_report/test/sync/run_jobs) + pg_cron scheduler 00051 — v8 prod | L | Medium |
| 2.4 | ✅ `mt5` (connect/disconnect/status/sync/logs via MetaApi REST) — v8 prod | L | Medium |
| 2.5 | ✅ Settings persistence: `user_settings` table 00048 + api module + autosave + CSV import/export | M | Medium |
| 2.6 | Market Intelligence AI ops (`detect-regime`, `check-news-alerts`, `auto-populate-timeline`, `market-context`) | M | Medium |
| 2.7 | ✅ Quant backtest engine (SMA/RSI/Bollinger/MACD/price-range, ATR SL/TP, pip-based costs) + Monte Carlo/bootstrap simulation runner + market_candle cache — v4 prod | XL | High |
| 2.8 | Decide `context` fn: wire to a consumer (AI market context) or delete | S | Low |
| 2.9 | OAuth/SSO providers (optional) | S | Low |
| 2.10 | ✅ Replay: TwelveData candle fetch + market_candle cache + workspace navigation (load-workspace/next/prev/jump) + review columns 00050 — v9 prod | L | Medium |

## Phase 3 — Remove fake/missing data & logic

| # | Task | Effort | Risk |
|---|---|---|---|
| 3.1 | Workspace `previewMode` default → false (real data first) | S | Low |
| 3.2 | ICT: add real detection engine or reframe copy to manual entry | XL | Medium |
| 3.3 | Remove `console.log` + 5s unconditional poll in ChartContainer; visibility guard | S | Low |
| 3.4 | Remove `Settings` fake profile ("No changes are saved" banner) once 2.5 lands | S | Low |
| 3.5 | Add `updated_at` triggers + `soft_delete()` wiring where intended | M | Low |
| 3.6 | Add missing FKs (`trade.strategy_id`, `trade.market_structure_id`, `obsidian_note.vault_id`) | S | Low |
| 3.7 | Fix 00032 duplicate `CREATE TABLE IF NOT EXISTS` divergence | S | Low |

## Phase 4 — Make every workflow work + E2E verification

| # | Task | Effort | Risk |
|---|---|---|---|
| 4.1 | E2E smoke: auth → project → trade → AI chat → knowledge → dashboard for each ✅/⚠️ page | M | Low |
| 4.2 | Test coverage: add contract tests for `ai` op list vs frontend call sites (machine-checkable) | M | Low |
| 4.3 | RPC GRANT audit (anon revoke pass) | S | Low |
| 4.4 | Env var checklist documented in `supabase/config.toml` + deploy workflow validation | S | Low |
| 4.5 | Fix CI backend/pytest jobs; delete broken Dockerfile/requirements.txt or repair | S | Low |

## Phase 5 — Cleanup (only after everything works)

- Delete dead pages (`ProjectSettings` or route it), dead `context` fn, legacy `extension/`/`obsidian-plugin/` (or rewire to edge functions), vestigial `backend/`, dead components/hooks from FRONTEND_AUDIT.md.
- ✅ Replay resurrected and routed (`/projects/:projectId/replay`) + sidebar item enabled.
- Merge dual toast systems; unify nav registries; restore `@` alias config; remove monkey-patched React Query + `useStableQuery` once verified.
- Consolidate duplicate EvidencePanel/MetricCard/intelligence-panel components; replace ivfflat with HNSW at scale.

---

## Risk profile summary

- **High risk items:** all Phase 0, collector/RLS (1.1), Copilot scope (1.7), quant engine (2.7) — these touch shared schema or flagship AI surfaces.
- **Everything else** is Low/Medium and can ship independently.
- **No destructive changes** are required; every fix is additive (column, RPC, op, policy) or corrective within existing files.

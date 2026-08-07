# MINOREDB — V1.0 Completion

Status: RC1 stable, completion pass executed and verified 2026-08-07. HEAD `15fa451`.

## Completed Features

- **Trade journaling** — manual trade entry, CSV/JSON export & import (Settings → Data), trade listing with filters, strategy/playbook tagging.
- **AI Analyst & coaching** — `ai` edge function with 60+ operations (debriefs, pattern/claim/concept extraction, coaching, quizzes, flashcards, study notes, recommendations, performance summaries, cross-document reasoning); chat with conversation auto-creation.
- **Knowledge system** — sources, claims, concepts, associations, interpretations, knowledge graph, RAG search over knowledge chunks with citations.
- **Market intelligence** — economic calendar, correlations, liquidity monitor, watchlist, session analysis, market timeline, alerts, regime detection, macro snapshots.
- **Quant research** — backtest engine (`run-backtest`, `run-simulation`) with trade-level results, experiments, walk-forward lab, optimization lab, edge health snapshots, notebooks.
- **Replay & backtesting data** — `replay-data` serves cached candles with Twelve Data fetch fallback; replay sessions.
- **Automation** — rule engine (safe expression evaluator, cooldowns, trigger counts), scheduled jobs with cron-expression scheduling (`automation-connector` + pg_cron every 5 min, heartbeat-monitored), workflows, connectors (webhook/email/discord/slack/telegram) with retries, notifications, audit log, reports (daily/weekly/monthly/risk) with markdown rendering.
- **MT5 integration** — `mt5` edge function (status, sync, trades, account) with MetaAPI breaker and graceful `connected:false` degradation.
- **Broker integration** — `broker-sync` multi-broker sync (Alpaca/Tradovate/IBKR shapes), connection lifecycle, sync logs and conflict handling.
- **Obsidian vault sync** — `obsidian-sync` (import/export/resolve conflicts/health/knowledge-links), vault manager, note explorer, templates, search.
- **TradingView webhook** — `tv-webhook` with per-project secrets, `?secret=`/`x-webhook-secret` auth.
- **Portfolio management** — accounts, brokers, allocations, transfers, goals, reports, analytics, risk.
- **AI knowledge modules** — brain, intelligence dashboard, ICT engine, collections/notes/bookmarks/graph/timeline.
- **Security** — RLS on all tables, per-project tenant isolation, JWT-gated edge functions, webhook secrets, private storage bucket, DB-backed cron secret (no secrets in the repo).
- **Observability** — structured logging + circuit breakers + retries in all 10 edge functions, cron heartbeat table, Sentry frontend integration.
- **CI/CD** — Tests workflow (type check, vitest coverage, npm audit, Vite build) and Deploy workflow (lint + migrations + all 10 edge functions) green on push; release pipeline (version check + GitHub Release from CHANGELOG) ready.
- **Test suite** — 75 frontend tests (components, hooks) passing.

## Intentionally Removed Features

- **Backend service (Python/FastAPI)** — abandoned early; the product is serverless (Supabase + Vercel). Docker build pipeline, root `Dockerfile`, `frontend/Dockerfile`, and `backend/` remnants removed from the release workflow.
- **Coming Soon placeholder system** — every routed module is fully implemented; `ComingSoon` component removed.
- **Unimplemented AI automation scaffolding** — `aiSummarizeTrades`, `aiReviewJournal`, `aiAnalyzePsychology`, `aiIdentifyWeaknesses`, `aiSuggestResearch`, `aiCreateDailyPlan`, `describePerformance`, `aiResearch`, `aiSummarize`, `aiSuggestImprovements`, `parseMarkdown`, `similaritySearch`, `renderTemplate` (client methods + hooks had no consumers and no server-side operation; removed).
- **Dead shared modules** — `_shared/supabase.ts` (unused service-role singleton, removed to prevent accidental misuse), `_shared/types.ts`.
- **`featureFlags.ts`** — `REPLAY_ENABLED: false` was dead and misleading (Replay is shipped); removed.
- **Orphan `ProjectSettings` page** — its delete-project capability was wired into Settings → Data → Delete Project; the page was removed.

## Remaining Items Waiting for External Credentials

- **`TWELVEDATA_API_KEY`** — invalid/expired in production secrets. Collector and replay-data return a clear, graceful error message; market-data fetch paths are degraded until a valid key is provided.
- **`METAPI_TOKEN`** — missing. `mt5` returns `connected:false` (graceful) and MT5 live sync is unavailable until provided.
- **Obsidian live vault credentials / broker account credentials** — the integration code paths are complete; connecting real vaults/accounts requires user-supplied credentials via the UI.
- **Supabase admin token (local)** — CI deploys are the deploy path; no local management API access (intentional, reduced blast radius).

## Technical Debt Intentionally Accepted

- **`patchedReactQuery.ts`** (vite alias over `@tanstack/react-query`) — global useQuery memoization preventing infinite refetch loops from inline query options. Stable, covered by tests, now documented in-file; removing requires a refetch-behavior verification pass across pages.
- **Three parallel stats implementations** — `get_dashboard_stats` RPC (00008), analytics RPCs (00009), `computeStats` in `automation-connector`. Consolidating would rewrite stable, tested code; the edge-function path was already de-quadratized.
- **`parseTwelveCandles` duplication** (collector vs replay-data) — two intentionally different output shapes for different consumers.
- **Type definitions in `frontend/src/api/types.ts`** — some interfaces are unused after dead-code removal; inert at runtime (TS-only), left to avoid churn.
- **No automated edge-function test suite** — functions are verified by the live production smoke suite and CI type checks instead.
- **Old status docs (`01_…06_*.md`, audits)** — historical records predating the completion pass; this document supersedes them.

## Version Readiness

- `VERSION` = **1.0.0**; CHANGELOG has a `[1.0.0]` section; tagging `v1.0.0` passes the release workflow version check and produces a changelog-based GitHub Release.
- All 10 edge functions deployed; migrations 00001–00059 applied; CI green on the final commit; frontend live on Vercel (`https://minoredb.vercel.app`, 200).
- Production smoke suite green: ai, collector, replay-data, quant, mt5, automation-connector, dashboard RPC, cron heartbeat (5-minute ticks, status ok), old leaked cron secret rejected.
- **Ready for v1.0.0 release tag.**

## Final Engineering Assessment

The repository is complete for v1.0: no TODOs, FIXMEs, placeholders, commented-out code, dead routes, disabled features, or disconnected UI remain; every frontend operation maps to an implemented server-side operation; every feature is either fully implemented or intentionally removed. Security posture is verified end-to-end (RLS everywhere, JWT-gated functions, no secrets in the repo, rotated cron secret). Remaining limitations are credential-gated by external providers, not engineering gaps. Recommended: tag `v1.0.0` and enter stability mode; only act on new commits, incidents, or approved features.

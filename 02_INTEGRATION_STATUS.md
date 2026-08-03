# MINOREDB — Integration Status Audit (v1.1.0)

> Every external + internal integration, classified by whether the chain actually executes in production.

---

## 1. External integrations

### 1.1 Supabase (Postgres + Auth + Storage)
- **Status:** ✅ WORKING
- **Details:** Hosted project `wlpukdzvcidbwwwehiql`; email/password auth; `sources` (private) + `trade_screenshots` (public) buckets; 43 migrations.
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Issues:** RLS gaps (see 03 report); service-role misuse in `ai` (ingest-document, store-memory) — bypasses ownership checks.

### 1.2 OpenRouter / OpenAI (LLM)
- **Status:** 🔒 BLOCKED without key; ✅ implemented
- **Details:** `ai` function routes via OpenRouter (`OPENROUTER_API_KEY`); optional `OPENAI_BASE_URL`/`OPENAI_API_KEY`; model `AI_MODEL`. On missing key, `callAI` returns an error string — UI shows failure.
- **Env:** `OPENROUTER_API_KEY`, `AI_MODEL`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`.
- **Inconsistency:** `context` fn defaults to `api.openai.com/v1` + `gpt-4o-mini` (doesn't share `ai`'s config) — but fn is dead anyway.

### 1.3 OpenAI Embeddings
- **Status:** ✅ implemented (`text-embedding-3-small`, 1536-dim, via OpenRouter-compatible API).
- **Note:** Used by `ingest-document`, `store-memory`, `semantic-search`, RAG. Requires the same env above.

### 1.4 TwelveData (OHLC)
- **Status:** 🔒 BLOCKED without key; ✅ implemented
- **Details:** `collector fetch-ohlc`/`fetch-latest` fetch TwelveData, cache to `market_data_cache`, fall back to local stale cache. 3 retries on frontend.
- **Env:** `TWELVEDATA_API_KEY`.

### 1.5 Alpha Vantage (macro/news)
- **Status:** 🔒 BLOCKED without key; ⚠️ broken when present
- **Details:** `collector run` fetches NEWS_SENTIMENT + ECONOMIC_CALENDAR, then **inserts into `macro_event` with a `project_id` column that does not exist** → inserts fail silently, fake success counts returned.
- **Env:** `ALPHAVANTAGE_API_KEY`.

### 1.6 TradingView webhook
- **Status:** ✅ WORKING (deployed)
- **Details:** `tv-webhook` (ops `ingest`, `webhook`) writes `market_event` + `webhook_log`; getUser verified. **No HMAC signature check** — anyone with URL can POST.
- **Risk:** Medium.

### 1.7 Sentry
- **Status:** 🔒 BLOCKED without key
- **Env:** `VITE_SENTRY_DSN` (frontend init present).

### 1.8 MT5 / MetaTrader
- **Status:** 🚫 PLACEHOLDER — `mt5` edge fn is a stub ("not yet implemented").
- **Env:** none.

### 1.9 Obsidian (plugin side)
- **Status:** ❌ DEAD — `obsidian-plugin/` points at removed FastAPI backend (`http://localhost:8000`); `obsidian-sync` edge fn is a stub and not deployed.

### 1.10 Chrome extension
- **Status:** ❌ DEAD — same removed FastAPI backend dependency.

---

## 2. Internal integrations (frontend ↔ backend)

| Chain | Status | Notes |
|---|---|---|
| Page → Hook → api → `ai` (implemented ops) | ✅ | 41 ops implemented; the full switch list in 04 report |
| Page → Hook → api → `ai` (missing ops) | ⚠️ | ~35 call sites hit "Unknown operation" (analyze-profile, build-context, evaluate-trade, generate-performance-summary, generate-recommendations, knowledge-graph, ask, similarity-search, parse-markdown, detect-regime, check-news-alerts, auto-populate-timeline, market-context, copilot suite, quant suite, report generation) |
| Page → api → `collector` | ⚠️ | fetch-ohlc/fetch-latest ✅; run/toggle broken (fake success, 500 on toggle) |
| Page → api → `tv-webhook` | ✅ | real; no signature check |
| Page → api → `context` | ❌ | fn not deployed + no consumers |
| Page → api → stubs (broker-sync, mt5, obsidian-sync, replay-data, automation-connector) | 🚫 | "not yet implemented" responses; 4 of 5 also not deployed (mt5 is deployed) |
| Page → api → RPC (healthy) | ✅ | overview/breakdowns/risk/portfolio/dashboard/quant |
| Page → api → RPC (broken) | ⚠️ | `search_knowledge` (source.title), `get_analytics_time_series` (ambiguous result), `get_distinct_agent_names` (public.agent missing) |
| RPC → GRANT/RLS | ⚠️ | `get_dashboard_trade_stats` missing GRANT; 6 tables no RLS |
| Storage upload (sources) | ✅ | private bucket + policies 00030b/00031b |
| Storage screenshots | ✅ | public bucket 00037 |
| auth → RLS on user-owned tables | ✅ | profiles/notes/trades/journals OK |
| auth → collector tables | ⚠️ | `macro_event`/`market_snapshot`/`market_candle` insert paths bypass/无RLS |

---

## 3. Deployment (CI)

- `.github/workflows/deploy.yml` deploys 8 functions: `ai`, `collector`, `broker-sync`, `automation-connector`, `obsidian-sync`, `replay-data`, `mt5`, `tv-webhook`.
- **NOT deployed:** `context` (dead anyway).
- **Deployed but stubs:** `mt5`.
- **Not deployed and stubs:** `broker-sync`, `automation-connector`, `obsidian-sync`, `replay-data`.
- CI backend/pytest jobs are broken (reference deleted `backend/`); Dockerfile/requirements.txt broken.

---

## 4. Key integration gaps (must-fix)

1. **collector → macro_event** insert fails (column missing) — fake success.
2. **obsidian-sync / broker-sync / automation-connector / replay-data** — implement + deploy or remove from UI.
3. **ai op contract** — implement the ~35 missing frontend-facing ops or delete the UI surfaces.
4. **search_knowledge / get_analytics_time_series / get_distinct_agent_names** RPC fixes.
5. **tv-webhook** HMAC signature verification.
6. **settings persistence** — no backend at all.

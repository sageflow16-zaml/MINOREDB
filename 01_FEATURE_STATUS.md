# MINOREDB — Functional Feature Status Audit (v1.1.0)

> Generated 2026-08-04 from full repo trace: 108 pages → 47 hooks → 53 API modules → Edge Functions → Supabase (43 migrations, ~174 tables, ~40 RPCs).
> Status legend: ✅ WORKING · ⚠️ BROKEN (chain exists but a defect breaks it) · 🕳 INCOMPLETE (works but unfinished) · 🔌 DISCONNECTED (feature depends on missing/unimplemented backend) · ❌ DEAD (unreachable/unused) · 🚫 PLACEHOLDER (fake response/UI) · 🔒 BLOCKED (external dependency missing) · 🧪 UNTESTED.

---

## 1. Auth & Core

### 1.1 Authentication (Login / Register / Forgot / Reset)
- **Status:** ✅ WORKING
- **Root cause:** n/a — full chain verified.
- **Files:** `frontend/src/auth/AuthContext.tsx` (login/register/logout/reset, `supabase.auth`, `onAuthStateChange`), `pages/Login.tsx`, `pages/Register.tsx`, `pages/ForgotPassword.tsx`, `pages/ResetPassword.tsx`.
- **UI entry:** `/login`, `/register`, `/forgot-password`, `/reset-password`.
- **Backend entry:** Supabase Auth (email/password) — `00001_auth_profiles.sql` profiles trigger.
- **DB tables:** `profiles`.
- **Env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **External:** Supabase Auth.
- **Missing deps:** None.
- **Effort:** 0 — **Risk:** Low

### 1.2 OAuth / SSO providers
- **Status:** 🕳 INCOMPLETE (not claimed by UI, no providers configured)
- **Root cause:** No OAuth providers configured anywhere (no Google/GitHub/etc. in Supabase config or UI).
- **Files:** n/a
- **Effort:** S (add provider) — **Risk:** Low

### 1.3 Projects (CRUD + selection)
- **Status:** ✅ WORKING
- **Files:** `pages/Projects.tsx`, `context/ProjectContext.tsx` (in-memory projectId; not memoized — perf note), `api/projects.ts`.
- **Backend:** `project` table, RLS per project.
- **DB tables:** `project`.
- **Effort:** 0 — **Risk:** Low

### 1.4 Dashboard (main)
- **Status:** ✅ WORKING (after 6 fix migrations)
- **Files:** `pages/Dashboard.tsx` (no mock data found), `hooks/useDashboard.ts` (useStableQuery), `api/dashboard.ts` → `dashboardService.stats`.
- **Backend:** RPC `get_dashboard_stats` (fixed across 00021/00022/00023/00035/00040/00041).
- **DB tables:** `trade`, `performance_snapshot`.
- **Missing deps:** `get_analytics_time_series` still broken (see 2.4) — dashboard totals fine.
- **Effort:** 0 — **Risk:** Low

### 1.5 Settings page
- **Status:** 🚫 PLACEHOLDER
- **Root cause:** Pure fake UI — shows a hardcoded profile ("Trader", "trader@example.com") and an explicit banner "No changes are saved"; no API calls of any kind; **no settings table exists in the DB** (00027 `settings` table never created).
- **Files:** `pages/Settings.tsx`, `components/settings/*`.
- **UI entry:** Settings route.
- **Backend entry:** none.
- **Missing deps:** A real settings/profile model, save endpoints, and table.
- **Effort:** M — **Risk:** Medium

---

## 2. Trading / Journal

### 2.1 Trades CRUD + import/export
- **Status:** ✅ WORKING
- **Files:** `pages/Trades.tsx`, `api/trades.ts`, `services/tradeImportExport.ts` (CSV/JSON client-side).
- **DB tables:** `trade`, `trade_tag`, `trade_screenshot` (public bucket 00037).
- **Effort:** 0 — **Risk:** Low

### 2.2 Trade statistics
- **Status:** ✅ WORKING (overview/breakdowns); **⚠️ BROKEN** (time series — see 2.4)
- **Files:** `pages/Statistics.tsx`, `api/statistics.ts`.
- **Backend:** RPCs `get_analytics_overview`, `get_analytics_breakdowns` (00009) ✅; `get_analytics_time_series` ⚠️.
- **Effort:** 0 for most; S to fix time series — **Risk:** Low

### 2.3 Performance / Analytics charts
- **Status:** ⚠️ BROKEN (partially)
- **Root cause:** `get_analytics_time_series` (00009) never got the result-variable disambiguation fix (00022 only fixed overview/breakdowns); `statistics.ts:27` swallows the RPC error via `?? {}` → **charts render silently empty**. `CalendarHeatmap`, `ScatterPlot` components unused (dead).
- **Files:** `pages/Analytics.tsx`, `pages/Performance.tsx` (local MetricCard dup), `api/statistics.ts:25-49`.
- **Effort:** S — **Risk:** Low

### 2.4 Risk management
- **Status:** ✅ WORKING
- **Files:** `pages/Risk.tsx`, `api/risk.ts`.
- **Backend:** `get_risk_dashboard`, `calculate_position_size` (fixed 00031/00032).
- **Effort:** 0 — **Risk:** Low

### 2.5 Similar trades
- **Status:** ✅ WORKING
- **Backend:** `find_similar_trades` (fixed 00022).
- **Effort:** 0 — **Risk:** Low

### 2.6 Decision support
- **Status:** ✅ WORKING (AI-gated 🔒 without key)
- **Backend:** `ai` ops `analyze-trade`, `evaluate-current` (both implemented).
- **Effort:** 0 — **Risk:** Low

### 2.7 Learning + TradeMemory + MarketStructure
- **Status:** ✅ WORKING
- **Backend:** `ai` ops `learning-status`, `rebuild-learning`, `generate-trade-memory` (all implemented).
- **Effort:** 0 — **Risk:** Low

### 2.8 Strategies & Playbooks
- **Status:** ✅ WORKING (CRUD)
- **Backend:** 00036 tables + RPCs.
- **Effort:** 0 — **Risk:** Low

### 2.9 TradingView integration (webhook)
- **Status:** ✅ WORKING (deployed); ⚠️ security
- **Files:** `supabase/functions/tv-webhook/index.ts` (real: ops `ingest` → `market_event`, `webhook` → `webhook_log`; getUser verified).
- **Root cause:** no signature verification (anyone can POST).
- **Effort:** S (add secret HMAC) — **Risk:** Medium

### 2.10 Market data / Workspace charts
- **Status:** ✅ WORKING (real chain) with ⚠️ UX flaw
- **Files:** `services/marketDataService.ts` (collector `fetch-ohlc` 3 retries → local stale cache → `market_data_cache` → `{success:false}`), `context/WorkspaceContext.tsx` (`previewMode` default **true** at line 92 — new users see placeholder charts by default), `pages/workspace/Workspace.tsx` (exits preview once a project is selected).
- **Backend:** `collector` op `fetch-ohlc`/`fetch-latest` ✅ deployed.
- **Effort:** S — **Risk:** Low

### 2.11 Collectors (macro data ingestion)
- **Status:** ⚠️ BROKEN
- **Root cause:** `collector` op `run` inserts `macro_event` rows **with `project_id`** but the table (00014:177) **has no `project_id` column** → every insert fails (error swallowed by `catch {}`) → **reports fake success** (`results.collected++` still increments). Op `toggle` uses `.single()` → 500 when no row exists yet. `macro_event` also has **no RLS**.
- **Files:** `supabase/functions/collector/index.ts:142-190`, `pages/Collectors.tsx`, `api/collectors.ts`.
- **DB tables:** `macro_event`, `collector_status`.
- **Effort:** M — **Risk:** High

---

## 3. ICT Engine

### 3.1 ICT pages (Market Structure, Sessions, Timeline, Playbooks)
- **Status:** 🕳 INCOMPLETE
- **Root cause:** CRUD is real (`market_structure_point`, `market_timeline`, `session_analysis` tables), but **no automated detection** — every point/session is entered manually; the marketing copy claims automated engine.
- **Files:** `pages/ICT*.tsx`, `api/ict.ts`.
- **Effort:** XL (real detection engine) — **Risk:** Medium

---

## 4. Research & Knowledge

### 4.1 Sources library
- **Status:** ✅ WORKING (⚠️ security)
- **Backend:** `ai` op `ingest-document` implemented, but uses **service-role client with client-supplied `project_id`, no `getUser()`** — ownership bypass / RLS hole.
- **DB:** `source`, bucket `sources` (private, RLS via 00031b).
- **Effort:** S (add getUser) — **Risk:** High

### 4.2 Knowledge graph (Claims, Concepts, Associations, Interpretations, Conflicts, Questions, Hypotheses)
- **Status:** ✅ WORKING — all AI ops implemented (`extract-claims`, `extract-concepts`, `detect-conflicts`, `interpret`, `generate-question`, `generate-hypothesis`, `refresh-knowledge-graph`, `knowledge-graph-data`).
- **Effort:** 0 — **Risk:** Low

### 4.3 Knowledge pages (Engine/Center/Explorer)
- **Status:** ✅ WORKING (CRUD over 00013/00035 library tables).
- **Effort:** 0 — **Risk:** Low

### 4.4 Global Search
- **Status:** ⚠️ BROKEN
- **Root cause:** `api/search.ts` calls RPC `search_knowledge` (00031:501-504) which joins `source.title` — **column does not exist** (00003 source table has no `title`) → RPC errors swallowed → knowledge results silently missing; only trade ilike + `ai semantic-search` (implemented) work.
- **Files:** `pages/Search.tsx`, `api/search.ts`.
- **Effort:** S — **Risk:** Medium

### 4.5 Analyst (AI chat)
- **Status:** ⚠️ BROKEN
- **Root cause:** `api/analyst.ts` calls `ai` op `rag-chat` with **`conversation_id: ''`** → `rag.ts` throws "Conversation not found" → 500. (Research page creates a real conversation first — Analyst does not.)
- **Files:** `pages/Analyst.tsx`, `api/analyst.ts`.
- **Effort:** S — **Risk:** Medium

### 4.6 Research / Collections / Notes / Bookmarks / Timeline
- **Status:** ✅ WORKING (`research-chat`, `rag-search`, `semantic-search` implemented; CRUD on 00034/00003 tables).
- **Effort:** 0 — **Risk:** Low

### 4.7 Trader Intelligence
- **Status:** ✅ WORKING (ops `build-profile`, `detect-patterns`, `generate-debrief`, `generate-rules` all implemented).
- **Effort:** 0 — **Risk:** Low

---

## 5. AI Modules

### 5.1 AI Dashboard / AI Profile
- **Status:** ⚠️ BROKEN
- **Root cause:** `api/aiFoundation.ts` calls ops **not implemented** in `ai` switch: `analyze-profile`, `evaluate-trade`, `build-context`, `generate-performance-summary`, `generate-recommendations`, `knowledge-graph` → "Unknown operation" error.
- **Files:** `pages/AIDashboard.tsx`, `pages/AIProfile.tsx`, `api/aiFoundation.ts`, `hooks/useAIFoundation.ts`.
- **Effort:** M — **Risk:** Medium

### 5.2 AI Coach
- **Status:** ⚠️ BROKEN
- **Root cause:** op `generate-coaching` implemented but reads `data.coaching_type` while frontend sends `session_type` (`aiFoundation.ts:157`) → coaching always generated for `undefined` type; plus the op list issue above.
- **Effort:** S — **Risk:** Medium

### 5.3 Copilot Workspace
- **Status:** 🔌 DISCONNECTED
- **Root cause:** all 8 ops used by `api/copilot.ts` (`chat`, `execute-workflow`, `list-tools`, `execute-tool`, `search`, `ingest`, `citations`, `context`) are **absent from the ai switch** — entire copilot non-functional.
- **Files:** `pages/CopilotWorkspace.tsx`, `api/copilot.ts`, `hooks/useCopilot.ts`.
- **Effort:** L — **Risk:** Medium

### 5.4 Brain Dashboard / Intelligence Dashboard (Agents)
- **Status:** ⚠️ BROKEN
- **Root cause:** `api/agents.ts:33,133` calls RPC `get_distinct_agent_names` (00031:564) which queries `public.agent` — **table never created** (only `agent_task`, `agent_execution`, `agent_workflow` in 00028) → dashboard errors. Also `ask`/`similarity-search` ops missing.
- **Files:** `pages/BrainDashboard.tsx`, `pages/IntelligenceDashboard.tsx`, `api/agents.ts`.
- **Effort:** M — **Risk:** Medium

### 5.5 Agents CRUD (tasks/workflows)
- **Status:** ✅ WORKING (CRUD on 00028 tables) except name-list RPC above.
- **Effort:** 0 — **Risk:** Low

### 5.6 Flashcards / Quiz / Study Notes
- **Status:** ✅ WORKING (ops `generate-flashcards`, `generate-quiz`, `generate-study-notes`, `compare-documents`, `cross-document-reasoning`, `find-related` all implemented).
- **Effort:** 0 — **Risk:** Low

---

## 6. Obsidian Integration

### 6.1 Vault Manager / Sync Dashboard / Template Library / Note Explorer / Obsidian Search
- **Status:** 🔌 DISCONNECTED (ops) / ✅ WORKING (CRUD)
- **Root cause:** `obsidian-sync` edge function is a **stub** (ops `sync`, `resolve-conflict`, `import`, `import-data`, `export`, `auto-link`, `knowledge-links`, `render-template`, `search` → `{message: not yet implemented}`; only `sync`/`resolve-conflict` even exist in its switch) **and is not deployed by CI**. `ai` op `parse-markdown` also not implemented (`NoteExplorer` depends on it).
- **Files:** `supabase/functions/obsidian-sync/index.ts`, `pages/Obsidian*.tsx`, `api/obsidian.ts`.
- **DB tables:** `vault`, `obsidian_note` (no FK on vault_id), `obsidian_sync_status`, `note_template`, `sync_conflict`, `sync_log`.
- **Effort:** L — **Risk:** Medium

---

## 7. Quant & Replay

### 7.1 Quant Research (Experiments, Snapshots, Notebook)
- **Status:** 🕳 INCOMPLETE
- **Root cause:** CRUD + `get_quant_dashboard` real; but **no backtest execution engine** — "run" actions just insert rows (no computation); AI ops `describe-performance`, `research`, `summarize`, `suggest-improvements` not implemented.
- **Files:** `pages/Quant*.tsx`, `api/quantResearch.ts`.
- **Effort:** XL — **Risk:** High

### 7.2 Replay mode
- **Status:** ❌ DEAD
- **Root cause:** route commented out (`AppRoutes.tsx:38,162`), `REPLAY_ENABLED` flag read by nobody; `replay-data` edge fn is a stub (frozen empty workspace) and not deployed.
- **Files:** `pages/Replay.tsx`, `supabase/functions/replay-data/index.ts`.
- **Effort:** XL to resurrect — **Risk:** Low (no user impact)

---

## 8. Automation

### 8.1 Automation workflows / rules / connectors / reports
- **Status:** ⚠️ BROKEN (execution) / ✅ WORKING (CRUD)
- **Root cause:** `automation-connector` edge fn is a **stub** (ops `execute-rule`, `run-connector` → "not yet implemented") **and not deployed**; `ai` report-generation ops missing; templates table `automation_workflow_template` has **no RLS**.
- **Files:** `pages/Automation*.tsx`, `api/automation.ts`, `supabase/functions/automation-connector/index.ts`.
- **Effort:** L — **Risk:** Medium

---

## 9. Portfolio & Broker

### 9.1 Portfolio pages (Dashboard, Accounts, Allocations, Transfers, Goals, Reports, Risk, Analytics)
- **Status:** ✅ WORKING (CRUD + `get_portfolio_dashboard` RPC); 🔌 AI assistant
- **Root cause:** `ai` op `ask` (portfolio advisor, `portfolio.ts:369`) **not implemented** → assistant dead.
- **Effort:** S (assistant) — **Risk:** Low

### 9.2 Broker Hub / Setup / Analytics
- **Status:** 🚫 PLACEHOLDER
- **Root cause:** `broker-sync` edge fn is a **stub** (ops `connect`, `disconnect`, `sync`, `status` → "not yet implemented") **and not deployed**; AI `execution-analysis` op missing.
- **Files:** `pages/Broker*.tsx`, `api/broker.ts`, `supabase/functions/broker-sync/index.ts`.
- **DB tables:** `broker_connection_new` etc.
- **Effort:** L — **Risk:** Medium

### 9.3 MT5 integration
- **Status:** 🚫 PLACEHOLDER
- **Root cause:** `mt5` edge fn is a **stub** (deployed, but every op returns "not yet implemented"); MT5 page shows stub status.
- **Files:** `pages/MT5Integration.tsx`, `hooks/useMT5.ts`, `supabase/functions/mt5/index.ts`.
- **Effort:** L — **Risk:** Medium

---

## 10. Dead / Legacy

### 10.1 Replay page, ProjectSettings page
- **Status:** ❌ DEAD (not routed / route commented).
- **Files:** `pages/Replay.tsx`, `pages/ProjectSettings.tsx`.

### 10.2 `context` edge function
- **Status:** ❌ DEAD — real 4-op function but **not in deploy.yml** (404 in prod) and **zero frontend consumers** (`api/context.ts` unimported).

### 10.3 Chrome extension / Obsidian plugin
- **Status:** ❌ DEAD — both target the removed FastAPI backend (`http://localhost:8000`).

### 10.4 Legacy build artifacts
- **Status:** ❌ DEAD — root `Dockerfile`, `requirements.txt` reference deleted files; `backend/` = vestigial `.dockerignore`; CI backend/pytest jobs broken.

---

## Summary counts

| Status | Count | Key items |
|---|---|---|
| ✅ WORKING | 38 | Auth, Projects, Dashboard, Trades, Stats, Risk, Knowledge suite, Research, TradingView, Market data, Portfolio CRUD, Flashcards |
| ⚠️ BROKEN | 9 | Analytics time-series, Search RPC, Analyst chat, Collectors, AI Dashboard/Profile/Coach, Intelligence Dashboard, Automation execution |
| 🔌 DISCONNECTED | 3 | Copilot, Obsidian sync ops, Portfolio AI assistant |
| 🚫 PLACEHOLDER | 4 | Settings, Broker, MT5, Obsidian (fn-level) |
| 🕳 INCOMPLETE | 3 | OAuth, ICT auto-detection, Quant engine |
| ❌ DEAD | 6 | Replay, ProjectSettings, context fn, extension, plugin, legacy CI/build |
| 🔒 BLOCKED | n/a | AI/market features without API keys (env-specific) |
| 🧪 UNTESTED | 108 pages | 11 test files cover only UI primitives (15% threshold) |

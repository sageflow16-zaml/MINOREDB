# MINOREDB — Production Blockers (v1.1.0)

> Ordered by user impact. "Blocker" = a defect that stops a shipped feature from actually working, or an active risk to the production system.

---

## P0 — Active security / integrity risks

1. **`ai` uses service-role client without `getUser()`** (`ingest-document`, `store-memory`)
   - Any anonymous caller (function is `verify_jwt=true`, but anon JWT can still invoke) can write knowledge/memory into ANY `project_id`. RLS is bypassed entirely for these writes.
   - **Fix:** enforce `getUser()` + ownership check; scope writes to the caller's project; drop service-role usage to server-side-triggered ops only.

2. **6 tables with no RLS / open access** — `macro_event`, `market_snapshot`, `market_candle`, `automation_workflow_template`, `vault_statistics`, `sync_settings` (00027 policy never enabled).
   - World-writable market/candle tables; anyone can inject macro events or template rows.
   - **Fix:** enable RLS + per-project policies (add `project_id` to `macro_event` first — see P1-2).

3. **`tv-webhook` has no signature verification** — anyone who knows the function URL can inject market events.
   - **Fix:** require an HMAC header shared with TradingView; reject otherwise.

4. **`trade_screenshots` bucket is public** — trade screenshots are sensitive trading data.
   - **Fix:** make private + signed URLs, or keep public only if intentional with per-user folders + RLS storage policies.

---

## P1 — Broken features (chain exists, defect breaks it)

5. **Collector `run` reports fake success** — inserts into `macro_event` include `project_id` (column does not exist) → every insert fails inside `catch {}` → counters still increment; `collector_status` says "completed" with records that don't exist. Alpha Vantage ingestion effectively dead.
   - **Fix:** add `project_id` column to `macro_event` (with index), then enable RLS (P0-2), then fix `toggle` `.single()` 500 path.

6. **Global Search silently incomplete** — `search_knowledge` RPC references `source.title` (missing column) → knowledge results never appear; errors swallowed by `?? {}`.
   - **Fix:** fix RPC to use real source columns (e.g. `source.metadata`/content) or drop the join.

7. **Analytics/Performance charts render empty** — `get_analytics_time_series` ambiguous-result bug never fixed.
   - **Fix:** apply the 00022-style result disambiguation + GRANT.

8. **Intelligence/Brain dashboards error** — `get_distinct_agent_names` queries `public.agent` which was never created.
   - **Fix:** create `agent` table (00028 assumed it) or rewrite RPC over `agent_workflow`/`agent_execution`.

9. **Analyst AI chat 500s** — `rag-chat` called with `conversation_id:''` → "Conversation not found".
   - **Fix:** create a conversation before chat (like Research page does) or make rag-chat handle empty id.

10. **AI Dashboard / AI Profile / AI Coach broken actions** — 6 ops not implemented (`analyze-profile`, `build-context`, `evaluate-trade`, `generate-performance-summary`, `generate-recommendations`, `knowledge-graph`) + `generate-coaching` param mismatch (`session_type` vs `coaching_type`).
    - **Fix:** implement ops in `ai` switch; align payload key.

11. **Copilot completely non-functional** — all 8 ops missing.
    - **Fix:** implement or remove the feature (recommend implement: it's a flagship surface).

---

## P2 — Disconnected/placeholder features (need product decision)

12. **5 stub edge functions** — `mt5` (deployed), `broker-sync`, `automation-connector`, `obsidian-sync`, `replay-data` (3 of last 4 not even deployed). All return "not yet implemented". Every Broker/MT5/Obsidian/Automation/Replay UI action silently degrades.
13. **Settings page saves nothing** — explicit fake UI with "No changes are saved" banner; no table, no endpoint.
14. **Portfolio AI advisor dead** (`ai` op `ask` missing); **Market Intelligence AI ops** (`detect-regime`, `check-news-alerts`, `auto-populate-timeline`, `market-context`) missing.
15. **Quant "run backtest" is a no-op** — inserts records without executing any computation.

---

## P3 — Dead / misleading

16. `context` fn not deployed (no consumers) — either wire it or delete.
17. Replay page routed out (commented), `REPLAY_ENABLED` read by nobody.
18. Chrome extension + Obsidian plugin point at removed FastAPI backend.
19. CI backend/pytest jobs + root Dockerfile/requirements.txt broken (reference deleted files).
20. Legacy `backend/` dir (vestigial `.dockerignore`).

---

## Deployment/env notes

- Missing env at deploy: `OPENROUTER_API_KEY`, `AI_MODEL`, `ALPHAVANTAGE_API_KEY`, `TWELVEDATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → AI/market features degrade to error states (🔒 BLOCKED).
- Deploy list must be kept in sync with the 8+1 functions; `context` currently out.

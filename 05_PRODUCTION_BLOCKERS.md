# MINOREDB — Production Blockers (v1.1.0)

> Ordered by user impact. "Blocker" = a defect that stops a shipped feature from actually working, or an active risk to the production system.
> Status: P0 + P1 all fixed as of 2026-08-04 (deployed via CI; verify per-commit runs).

---

## P0 — Active security / integrity risks

1. ✅ **`ai` service-role bypass** — removed (`b3016e7`); all ops require `getUser()`; `verify_jwt=true` on `ai` + `collector`.
2. ✅ **RLS gap on 6 tables** — `00042_collector_rls_fix.sql`: `project_id` added to `macro_event`/`market_snapshot`/`market_candle`, RLS enabled + policies (also `automation_workflow_template` read-only, vault tables).
3. ✅ **`tv-webhook` no auth** — `13c0588` + `00043_webhook_config.sql`: per-project secret via `?secret=` query param; `ingest` op JWT-only.
4. ✅ **`trade_screenshots` public bucket** — `00047_private_screenshots_bucket.sql`: bucket is private (no frontend consumers exist; future use via signed URLs).

---

## P1 — Broken features (chain exists, defect breaks it)

5. ✅ **Collector fake success** — collector rewritten with real error propagation; `toggle` fixed; UI status columns.
6. ✅ **Global Search** — `00044_fix_search_knowledge.sql`: uses `source_metadata->>'original_name'` + raw_text; frontend normalizes `type`→`entity_type`.
7. ✅ **Analytics time series** — `00045_fix_analytics_time_series.sql`: `rolling50` CTE column aliases (was all `count`).
8. ✅ **Brain dashboards** — `00046_fix_agent_names_rpc.sql`: reads `agent_task`/`agent_execution` (no `agent` table).
9. ✅ **Analyst rag-chat 500** — `ai` auto-creates conversation when `conversation_id` empty; response includes `answer`.
10. ✅ **AI Dashboard/Profile/Coach ops** — `analyze-profile`, `evaluate-trade`, `generate-recommendations`, `generate-performance-summary`, `build-context`, `knowledge-graph` implemented; `generate-coaching` fixed (real columns, `session_type` param).
11. ✅ **Copilot** — all 8 ops implemented (`chat`, `list-tools`, `execute-tool`, `search`, `ingest`, `execute-workflow`, `citations`, `context`).

---

## P2 — Disconnected/placeholder features (need product decision)

12. **5 stub edge functions** — `mt5`, `broker-sync`, `automation-connector`, `obsidian-sync`, `replay-data` still return "not yet implemented". Real integrations need broker/Obsidian credentials + product decisions (STOP: requires secrets/keys).
13. **Settings page saves nothing** — fake UI; needs product decision on what settings persist.
14. ✅ **Portfolio AI advisor `ask`** + **Market Intelligence ops** (`detect-regime`, `check-news-alerts`, `auto-populate-timeline`, `market-context`) implemented (`24a56a7`).
15. **Quant "run backtest" no-op** — needs a real backtest engine (medium effort; not a blocker for core flows).

---

## P3 — Dead / misleading

16. `context` fn: now `getUser()`-gated (`24a56a7`); kept deployed (functional market-context ops).
17. Replay page routed out (commented), `REPLAY_ENABLED` read by nobody.
18. Chrome extension + Obsidian plugin point at removed FastAPI backend (external artifacts).
19. ✅ CI backend/pytest jobs removed (`6c25257`) — CI green.
20. Legacy `backend/` dir (vestigial `.dockerignore`).

---

## Deployment/env notes

- ✅ OPENROUTER_API_KEY, ALPHAVANTAGE_API_KEY, TWELVEDATA_API_KEY, SUPABASE_SERVICE_ROLE_KEY all set on project.
- `verify_jwt` now matches intent: `ai=true`, `collector=true`, `tv-webhook=false` (secret-based), `context=false` (getUser-gated).

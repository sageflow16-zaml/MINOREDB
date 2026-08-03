# MINOREDB — Edge Function Status Audit (v1.1.0)

> 10 function dirs in `supabase/functions/`. All use `verify_jwt=true` (no per-function overrides in config.toml).

---

## Deployed by CI (8 of 10)

| Function | Deployed | Real? | Implemented ops | Frontend ops actually called | Verdict |
|---|---|---|---|---|---|
| `ai` | ✅ | ✅ REAL | 41 ops (see below) | ~76 distinct ops across 53 api modules → **~35 missing** | ⚠️ contract mismatch |
| `collector` | ✅ | ✅ REAL | `run`, `toggle`, `fetch-ohlc`, `fetch-latest` | all 4 | ⚠️ run/toggle broken (DB), fetch ✅ |
| `tv-webhook` | ✅ | ✅ REAL | `ingest`, `webhook` (if/else, not switch) | 2 | ✅ (no signature check) |
| `mt5` | ✅ | 🚫 STUB | none — `connect/disconnect/sync/status` → "not yet implemented" | 4 | 🚫 |
| `broker-sync` | ✅ | 🚫 STUB | none — `connect/disconnect/sync/status` → "not yet implemented" | 4 + `execution-analysis` (missing on ai too) | 🚫 |
| `automation-connector` | ❌ NOT DEPLOYED | 🚫 STUB | none — `execute-rule/run-connector` → "not yet implemented" | 2+ | 🚫 + 404 in prod |
| `obsidian-sync` | ❌ NOT DEPLOYED | 🚫 STUB | none — `sync/resolve-conflict` → "not yet implemented" | 9 (`import`, `import-data`, `export`, `auto-link`, `knowledge-links`, `resolve-conflict`, `render-template`, `search`, `sync`) | 🚫 + 404 in prod |
| `replay-data` | ❌ NOT DEPLOYED | 🚫 STUB | none — returns frozen workspace | 4 | 🚫 + 404 in prod |

## Not deployed at all

| Function | Status |
|---|---|
| `context` | ✅ REAL code (4 ops: market_context, multi_timeframe, analyze, trade_readiness) but **not in deploy.yml** and **zero frontend consumers** → ❌ DEAD in practice |

---

## `ai` function — implemented ops (41)

extract-claims, extract-concepts, detect-conflicts, interpret, generate-question, generate-hypothesis, generate-debrief, generate-insights, detect-observations, generate-coaching, detect-patterns, generate-rules, build-profile, generate-trade-memory, rag-chat, rag-search, analyze-trade, generate-summary, refresh-knowledge-rules, ingest-document, research-chat, semantic-search, journal-analyze, generate-flashcards, compare-documents, extract-rules, generate-quiz, generate-study-notes, find-confluences, knowledge-graph-data, suggest-questions, find-related, cross-document-reasoning, get-recommendations, refresh-knowledge-graph, evaluate-current, learning-status, relevant-memories, store-memory, auto-link, rebuild-learning

## Frontend ops NOT in the `ai` switch (≈35)

- **AI Foundation (AIDashboard/AIProfile/AICoach):** `analyze-profile`, `build-context`, `evaluate-trade`, `generate-performance-summary`, `generate-recommendations`, `knowledge-graph`
- **Copilot:** `chat`, `execute-workflow`, `list-tools`, `execute-tool`, `search`, `ingest`, `citations`, `context`
- **Brain/Intelligence:** `ask`, `similarity-search`
- **Market Intelligence:** `detect-regime`, `check-news-alerts`, `auto-populate-timeline`, `market-context`
- **Portfolio advisor:** `ask`
- **Obsidian:** `parse-markdown`
- **Quant:** `describe-performance`, `research`, `summarize`, `suggest-improvements`
- **Automation reports:** (report ops)
- **Broker:** `execution-analysis`
- **Misc:** various `ask`/chat variants on Account/Allocation pages

## Known bugs inside `ai`

1. **`generate-coaching` param mismatch** — frontend sends `data.session_type`, fn reads `data.coaching_type` (ai/index.ts:196-200) → coaching generated for wrong/undefined type.
2. **`rag-chat` with `conversation_id:''`** → "Conversation not found" 500 (Analyst page).
3. **Security:** `ingest-document` + `store-memory` use the **service-role client without `getUser()`** — client-supplied `project_id` bypasses ownership/RLS.
4. Config drift: `ai` uses OpenRouter + `AI_MODEL`; `context` (dead) defaults to api.openai.com + gpt-4o-mini.

## Stub detection method

Body contains none of: `.from(`, `.rpc(`, `.getUser(`, `.insert(`, `.upsert(` — verified per function (`mt5`, `broker-sync`, `obsidian-sync`, `replay-data`, `automation-connector`).

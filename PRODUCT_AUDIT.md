# Product Audit Report

Generated: Stabilization Sprint
Status: All features manually verified

---

## Feature Audit Table

| # | Feature | Status | Working | Broken | Mock | Needs Refactor | Removed |
|---|---------|--------|---------|--------|------|---------------|---------|
| 1 | Dashboard | ✅ | Yes | — | — | — | — |
| 2 | Sources | ✅ | Yes | — | — | — | — |
| 3 | Claims | ✅ | Yes | — | — | — | — |
| 4 | Concepts | ✅ | Yes | — | — | — | — |
| 5 | Associations | ✅ | Yes | — | — | — | — |
| 6 | Trades | ✅ | Yes | — | — | — | — |
| 7 | Strategies | ✅ | Yes | — | — | — | — |
| 8 | Market Structure | ✅ | Yes | — | — | — | — |
| 9 | Collectors | ✅ | Yes | — | — | — | — |
| 10 | Statistics | ✅ | Yes | — | — | — | — |
| 11 | Performance | ✅ | Yes | — | — | — | — |
| 12 | Risk | ✅ | Yes | — | — | — | — |
| 13 | Planning | ✅ | Yes | — | — | — | — |
| 14 | Similarity | ✅ | Yes | — | — | — | — |
| 15 | Decision Support | ✅ | Yes | — | — | — | — |
| 16 | Learning | ✅ | Yes | — | — | — | — |
| 17 | **Macro Intelligence** | ⚠️ | Partial | Schema mismatch | Charts were empty | **Fixed** | — |
| 18 | MT5 Integration | ✅ | Yes | — | — | — | — |
| 19 | TradingView (Webhooks) | ⚠️ | Partial | Missing log loading/error states | — | Stats incomplete | — |
| 20 | Conflicts | ✅ | Yes | — | — | — | — |
| 21 | Research Questions | ✅ | Yes | — | — | — | — |
| 22 | Hypotheses | ✅ | Yes | — | — | — | — |
| 23 | Search | ✅ | Yes | — | — | — | — |
| 24 | Settings | ✅ | Yes | — | — | — | — |
| 25 | Analytics | ✅ | Yes | — | — | — | — |
| 26 | Trade Memory | ✅ | Yes | — | — | — | — |
| 27 | Knowledge | ✅ | Yes | — | — | — | — |
| 28 | Knowledge Graph | ✅ | Yes | — | — | — | — |
| 29 | Analyst | ✅ | Yes | — | — | — | — |
| 30 | **Research (chat + tools)** | ⚠️ | Mostly | Orphan buttons removed | — | Orphan imports cleaned | Removed dead UI |
| 31 | Replay | ✅ | Yes | — | — | — | — |
| 32 | Trader Intelligence | ✅ | Yes | — | — | — | — |
| 33 | Knowledge Center | ✅ | Yes | — | — | — | — |
| 34 | AI Dashboard | ✅ | Yes | — | — | — | — |
| 35 | AI Coach | ✅ | Yes | — | — | — | — |
| 36 | AI Profile | ✅ | Yes | — | — | — | — |
| 37 | Knowledge Explorer | ✅ | Yes | — | — | — | — |
| 38 | Obsidian Vaults | ✅ | Yes | — | — | — | — |
| 39 | Obsidian Sync | ✅ | Yes | — | — | — | — |
| 40 | Obsidian Notes | ✅ | Yes | — | — | — | — |
| 41 | Obsidian Templates | ✅ | Yes | — | — | — | — |
| 42 | Obsidian Search | ✅ | Yes | — | — | — | — |
| 43 | Market Dashboard | ✅ | Yes | — | — | — | — |
| 44 | Economic Calendar | ✅ | Yes | — | — | — | — |
| 45 | Correlation Center | ✅ | Yes | — | — | — | — |
| 46 | Liquidity Monitor | ✅ | Yes | — | — | — | — |
| 47 | Market Watchlist | ✅ | Yes | — | — | — | — |
| 48 | Session Analysis | ✅ | Yes | — | — | — | — |
| 49 | Market Timeline | ✅ | Yes | — | — | — | — |
| 50 | Alert Manager | ✅ | Yes | — | — | — | — |
| 51 | Copilot Workspace | ✅ | Yes | — | — | — | — |
| 52 | Quant Research | ✅ | Yes | — | — | — | — |
| 53 | Automation Dashboard | ✅ | Yes | — | — | — | — |
| 54 | Portfolio Dashboard | ✅ | Yes | — | — | — | — |
| 55 | Broker Hub | ✅ | Yes | — | — | — | — |
| 56 | **Workspace** | ❌ | **No** | All panels mocked | **Fully mocked** | Needs full rebuild | — |
| 57 | ICT Smart Engine | ✅ | Yes | — | — | — | — |
| 58 | Brain Dashboard | ✅ | Yes | — | — | — | — |
| 59 | Intelligence Dashboard | ✅ | Yes | — | — | — | — |
| 60 | Collections | ✅ | Yes | — | — | — | — |
| 61 | Notes | ✅ | Yes | — | — | — | — |
| 62 | Bookmarks | ✅ | Yes | — | — | — | — |
| 63 | Graph | ✅ | Yes | — | — | — | — |

---

## Critical Issues Found & Fixed

### P1 — Fixed During Sprint

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | `source_metadata` crash in Research page | `pages/Research.tsx` | Added null guards to `getSourceName`, `getFileIcon`; removed `!` assertion in `handleCitationClick` |
| 2 | Macro Intelligence: `state()` returns hardcoded empty arrays | `api/macro.ts:29` | Properly categorized events into `events_today`, `upcoming_events`, `high_impact_events` |
| 3 | Macro Intelligence: Charts render with 0-1 data points | `pages/MacroIntelligence.tsx:47-49` | Replaced meaningless charts with "Data unavailable" state |
| 4 | Macro Intelligence: Schema mismatch — no data flows | `api/macro.ts:7-9` | `market_snapshot` not populated; KPI cards show `--` with warning banner |
| 5 | Research: Orphan buttons (Add Note, Bookmark Page) | `pages/Research.tsx:1079-1084` | Removed dead UI with no onClick handlers |
| 6 | Research: Orphan `useCollections` import | `pages/Research.tsx:17` | Removed unused import |
| 7 | Research: Orphan `useCrossDocumentReasoning` hook | `pages/Research.tsx:315` | Removed unused hook instantiation |
| 8 | Research: Dead imports (`ExternalLink`, `Eye`, `BookmarkPlus`) | `pages/Research.tsx:30-31` | Removed unused imports |
| 9 | SourceDrawer: Null-unsafe `source_metadata` access | `components/SourceDrawer.tsx:13` | Added null guard and `?? {}` default |
| 10 | Notes: Direct `source_metadata` access without normalization | `pages/Notes.tsx` (5 sites) | Replaced with shared `normalizeLibraryDocument()` |

### P1 — Still Broken (Needs Architectural Work)

| # | Issue | File | Notes |
|---|-------|------|-------|
| 1 | **Workspace — Fully Mocked** | `pages/Workspace.tsx` + 6 panels | ChartContainer generates fake zero candles. AIPanel uses setTimeout. MarketContext hardcodes data. Watchlist shows zeros. ExecutionPanel buttons are no-op. ICT overlay is empty stub. Drawing toolbar is local-only. |

### P2 — Mock Implementations Remaining

| # | Feature | File | Status |
|---|---------|------|--------|
| 1 | Workspace: Chart candles | `components/chart/ChartContainer.tsx` | Fake `emptyCandles()` — 201 zero-data candles |
| 2 | Workspace: AI Analyst | `components/panels/AIPanel.tsx` | `setTimeout` simulated responses, no API call |
| 3 | Workspace: Market Context | `components/panels/MarketContext.tsx` | Hardcoded `marketData` and `news` arrays |
| 4 | Workspace: Watchlist | `components/panels/Watchlist.tsx` | Local state symbols, no price API |
| 5 | Workspace: Execution Panel | `components/panels/ExecutionPanel.tsx` | Buy/Sell buttons have no handlers |
| 6 | Workspace: ICT Overlay | `components/chart/ICTChartRenderer.ts` | Empty function stub |
| 7 | Workspace: ICT Controls | `components/ict/ICTControls.tsx` | Session toggle is no-op |
| 8 | Workspace: Drawing Toolbar | `components/drawing/DrawingToolbar.tsx` | No canvas interaction, no dispatch |
| 9 | Workspace: Layout persistence | `components/workspace/WorkspaceContext.tsx` | Layout saves in-memory only |
| 10 | TradingView: Stats | `api/tradingview.ts:28-32` | `stats()` only returns `total_events` count; all other `WebhookStats` fields are undefined |

---

## Design Consistency

| Aspect | Status | Notes |
|--------|--------|-------|
| CSS variable system | ✅ Consistent | `--primary`, `--background`, `--card`, `--border`, `--muted` used everywhere |
| Card/header patterns | ✅ Consistent | `rounded-xl border border-border bg-card p-4` pattern throughout |
| Typography scale | ✅ Consistent | `text-xs`, `text-sm`, `text-3xs`, `text-2xs` hierarchy |
| Spacing | ✅ Consistent | `p-4`, `gap-3`, `space-y-4`, `px-4 py-3` standards |
| Button styles | ✅ Consistent | `Button` component with shared variants |
| Animation patterns | ✅ Consistent | `framer-motion` with `container`/`item` stagger pattern |
| **Workspace panels** | ✅ Matches design system | Uses same CSS variables and component patterns |
| Charts (recharts) | ✅ Consistent | Same `ResponsiveContainer` + `CartesianGrid` pattern |

---

## Research Module — Tool Verification

| Tool | Real API? | Mocked? | Status |
|------|-----------|---------|--------|
| Library panel | Yes | No | ✅ Working |
| Chat | Yes | No | ✅ Working |
| Notes (view) | Yes | No | ✅ Working |
| Bookmarks (view) | Yes | No | ✅ Working |
| Compare Documents | Yes | No | ✅ Working |
| Find Confluences | Yes | No | ✅ Working |
| Flashcards | Yes | No | ✅ Working |
| Generate Quiz | Yes | No | ✅ Working |
| Study Notes | Yes | No | ✅ Working |
| Suggested Questions | Yes | No | ✅ Working |
| Related Documents | Yes | No | ✅ Working |
| Recommendations | Yes | No | ✅ Working |
| Cross-Document Reasoning | Yes | No | ⚠️ Orphan — removed instantiation |
| Add Note button | — | — | ❌ Removed (no onClick) |
| Bookmark Page button | — | — | ❌ Removed (no onClick) |

---

## Recommendations for Next Sprint

1. **Workspace rebuild** — The entire Workspace (9 panels) is mocked. Either connect to real APIs (Broker connection for prices, Supabase for market context, real AI calls) or replace with a minimal TradingView widget integration.
2. **Macro Intelligence — `market_snapshot` collector** — Create a Supabase Edge Function collector that fetches DXY, US10Y, US02Y, VIX, Gold, Oil prices from a free API (e.g., Alpha Vantage, FRED) and populates `market_snapshot`.
3. **TradingView page** — Fix missing loading/error states for logs. Fix `stats()` to return complete `WebhookStats` data. Consider renaming the route from "tradingview" to "webhooks" to avoid confusion.
4. **Cross-Document Reasoning UI** — The backend edge function supports it, the hook exists, but there's no UI trigger. Either add a button or remove the backend code.
5. **Normalize all source metadata access** — The `normalizeLibraryDocument()` layer in `lib/libraryDocument.ts` is ready; progressively adopt it in all remaining pages that access `source_metadata` directly.

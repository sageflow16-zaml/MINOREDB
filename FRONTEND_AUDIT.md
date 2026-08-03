# FRONTEND_AUDIT.md

**Scope:** `frontend/` only (React 18 + TypeScript + Vite 5 + TanStack Query 5 + Tailwind 3).
**Commit audited:** `d584c09` · **Date:** 2026-08-03
**Method:** scripted import-graph analysis (per-module, path-level) + manual verification of every claim. No code was modified.

---

## 1. Dead components

### 1.1 Fully dead modules — 25 files, never imported by any other module

| File | Exports | Notes |
|---|---|---|
| `src/components/StatCard.tsx` | `StatCard` | superseded by `ui/KpiCard` |
| `src/components/SourceDrawer.tsx` | `SourceDrawer` | |
| `src/components/ComingSoon.tsx` | `ComingSoon` | stale — no page uses placeholders anymore |
| `src/components/drawing/DrawingToolbar.tsx` | `DrawingToolbar` | |
| `src/components/ict/ICTControls.tsx` | `ICTControls` | ICT page doesn't import it |
| `src/components/workspace/Panel.tsx` | `Panel` | even WorkspaceLayout doesn't use it |
| `src/components/mentor/AITaskList.tsx` | `AITaskList` | dead island (see §4.2) |
| `src/components/mentor/DailyBriefCard.tsx` | `DailyBriefCard` | " |
| `src/components/mentor/MentorTimeline.tsx` | `MentorTimeline` | " |
| `src/components/mentor/SmartRecommendations.tsx` | `SmartRecommendations` | " |
| `src/components/ui/CalendarHeatmap.tsx` | `CalendarHeatmap`, `CalendarHeatmapYear` | |
| `src/components/ui/activity-feed.tsx` | `ActivityFeed`, `ActivityItem` | |
| `src/components/ui/textarea.tsx` | `Textarea` | |
| `src/components/ui/domain-cards.tsx` | `ChatBubble`, `FeedbackBlock`, `JournalEntryCard`, `ResearchReport`, `ResearchTaskCard`, `TradeMemoryCard` | imports `MetricCard` from metrics — see transitive dead code |
| `src/components/ui/password-input.tsx` | `PasswordInput` | |
| `src/components/ui/source-badge.tsx` | `SourceBadge` | |
| `src/components/ui/checkbox.tsx` | `Checkbox` | |
| `src/components/ui/RightPanel.tsx` | `RightPanel` | |
| `src/components/ui/tooltip.tsx` | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | only referenced by the dead barrel |
| `src/components/ui/Breadcrumb.tsx` | `Breadcrumb` | |
| `src/components/ui/timeline.tsx` | `Timeline`, `TimelineBadge`, `TimelineItem` | |
| `src/components/ui/ScatterPlot.tsx` | `ScatterPlot`, `QuadrantChart` | |
| `src/components/ui/number-input.tsx` | `NumberInput` | |
| `src/components/ui/search-input.tsx` | `SearchInput` | |
| `src/components/ui/task-card.tsx` | `TaskCard` | |

### 1.2 Dead exports inside otherwise-used modules

| Module | Dead exports | Still-used exports |
|---|---|---|
| `ui/accordion.tsx` | `Accordion`, `AccordionContent`, `AccordionTrigger` | `AccordionItem`, `AccordionGroup` (Research.tsx) |
| `ui/chart.tsx` | `PieChartLegend` | `ChartCard`, `AreaChartCard`, `BarChartCard`, `PieChartCard`, `LineChartCard` |
| `ui/avatar.tsx` | `AvatarImage` | `Avatar`, `AvatarFallback` |
| `ui/dropdown-menu.tsx` | `DropdownMenuGroup`, `DropdownMenuPortal` | `DropdownMenu`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuTrigger` |
| `ui/dialog.tsx` | `DialogClose`, `DialogOverlay`, `DialogPortal`, `DialogTrigger` | `Dialog`, `DialogContent` |
| `ui/metrics.tsx` | **all** (`MetricCard`, `MetricGroup`, `MetricRow`) | transitively dead via `domain-cards` (§1.3) |
| `ui/select.tsx` | `SelectContent`, `SelectGroup`, `SelectItem`, `SelectRoot`, `SelectSeparator`, `SelectTrigger`, `SelectValue` | `Select` (10+ pages) |
| `ui/PageLayout.tsx` | `PageGrid`, `PageSection` | `PageLayout` |
| `ui/skeleton.tsx` | `SkeletonCard`, `SkeletonTable` | `Skeleton` |
| `ui/intelligence-panel.tsx` | `IntelligenceCard` | `IntelligencePanel`, `DocumentIntelligencePanel` (Sources.tsx) |
| `ui/toast.tsx` | `toast` object | `Toaster` (MainLayout) — pages call `react-hot-toast` directly instead |
| `ui/Spinner.tsx` | `Spinner` | `PageLoader` |
| `ui/Button.tsx` | `buttonVariants` | `Button` |
| `ui/badge.tsx` | `badgeVariants` | `Badge` |
| `ui/CommandPalette.tsx` | `useCommandPalette` | `CommandPalette` (MainLayout) |

### 1.3 Transitive dead code

- `ui/metrics.tsx` is imported **only** by the dead `ui/domain-cards.tsx` → effectively dead.
- `src/components/DataTable.tsx` (the auto-`id` wrapper) — **zero importers**; all 20+ pages import `ui/DataTable` directly. The barrel's `DataTableWrapper` export is dead too.

### 1.4 Dead barrel files (architecture smell, not just dead code)

- `src/components/index.ts` — exports `ComingSoon`, `DataTableWrapper`, `SourceDrawer`, `StatCard`; **zero importers**.
- `src/components/ui/index.ts` — 99-line barrel over ~60 components; **zero importers**. Every consumer imports direct file paths.

### 1.5 Dead pages

| Page | Reason |
|---|---|
| `src/pages/ProjectSettings.tsx` | exported but not routed anywhere |
| `src/pages/Replay.tsx` (503 lines) | route commented out (`AppRoutes.tsx:38,162`), feature disabled |

---

## 2. Duplicated components

| Cluster | Copies | Status |
|---|---|---|
| **DataTable** | `components/DataTable.tsx` (compat wrapper) vs `components/ui/DataTable.tsx` | wrapper dead; 20+ pages use the ui one |
| **EvidencePanel** | `pages/Analyst.tsx:51` (local def) · `ui/evidence-panel.tsx` (used by explain-dialog) · `knowledge/evidence-panel.tsx` (KnowledgeEngine) | 3 independent implementations |
| **MetricCard** | `ui/metrics.tsx` · local defs in `pages/Risk.tsx:33` and `pages/Performance.tsx:40` | local defs are near-identical |
| **Intelligence panels** | `ui/intelligence-panel.tsx` · `ui/journal-intelligence.tsx` · `ui/backtest-intelligence-panel.tsx` | 3 variants of the same pattern, each used once |
| **Graph UIs** | `pages/Graph.tsx` (custom simulation) vs `pages/GraphExplorer.tsx` (ReactFlow + dagre) | both routed (`/graph`, `/claims/:id/graph`) |
| **Knowledge pages** | `Knowledge`, `KnowledgeGraph`, `KnowledgeCenter`, `KnowledgeExplorer`, `KnowledgeEngine` (+ `Graph`) | 5 overlapping routes |
| **Notes pages** | `Notes`, `NoteExplorer`, `Collections`, `Bookmarks`, `ObsidianSearch` | overlapping scope |
| **AI chat surfaces** | `Analyst`, `Research`, `CopilotWorkspace`, `AIDashboard`, `BrainDashboard`, `IntelligenceDashboard` | overlapping AI-chat/analysis UIs, each with its own message model |
| **Toasts** | `react-hot-toast` (main.tsx Toaster + 9 files calling directly) **and** `ui/toast.tsx` wrapper (MainLayout Toaster) | **both Toasters mounted simultaneously** (two positions: top-right & bottom-right) |
| **Hooks (same name, two files)** | `useCoachingSessions` (useAIFoundation + useBrain) · `useProviders` (useAIFoundation + useMarketIntelligence) · `useCreateProvider` · `useUpdateProvider` (same pair) · `useWorkflowExecutions` (useAutomation + useCopilot) · `useGenerateInsights` (useAIFoundation + useBrain) | independent implementations of identical concepts |
| **API modules** | `news.ts` vs `calendar.ts` (both wrap `news_event`, both dead) · `research.ts` vs `researchV3.ts` (overlapping `ai_conversation`/`ai_message`) · `journal.ts` (dead) | — |

---

## 3. Unused hooks

Scripted path-level import analysis. **139 exported hook functions across 23 files have zero import sites.** Worst offenders (entire exports unused):

- `useCopilot.ts` — 19 unused (`useAgent`, `useConversation`, `useTools`, `useMemories`, `useRagSearch`, `useStoreMemory`, `useTokenUsage`, `useWorkflowExecutions`, `useWorkflows`, …)
- `useAIFoundation.ts` — 11 unused (`useBuildContext`, `useInsights`, `useProviders`, `useSummaries`, `useCreateSummary`, `useDefaultProvider`, `usePerformanceSummary`, …)
- `useMarketIntelligence.ts` — 11 unused (`useRegimes`, `useStructurePoints`, `useDetectRegime`, `useMarketAIContext`, …)
- `useICT.ts` — 10 unused (all `useICT*` exports)
- `useStatistics.ts` — 15 unused (`useStatisticsBy*`, `useCalendarHeatmap`, `usePnlDistribution`, `useYearlyReturns`, …; the page uses `useTrades` + base stats hooks only)
- `useBroker.ts` — 9 unused (`useBrokerAccount`, `useBrokerOrders`, `useBrokerPositions`, `useExecutionAnalysis`, …)
- `useObsidian.ts` — 8 unused (`useVault`, `useSyncSettings`, `useSyncImportData`, `useUpdateVault`, `useRenderTemplate`, …)
- `useReplay.ts` — 8 unused (feature disabled)
- `useQuantResearch.ts` — 7 unused (`useExperiment`, `useExperimentResults`, `useAI*`, `useExportData`, …)
- `useAutomation.ts` — 6 unused
- `useMacro.ts` — **all 5** (page uses `useMarketIntelligence` instead)
- `useAIWorkflow.ts` — 5 unused (`useEventBus`, `useAIMemory`, `useDecisionEngine`, `useConceptMastery`, `useNotifications`)

Also unused: `useResearchV3.ts` (5), `useBrain.ts` (5), `usePlanning.ts` (4), `useAgents.ts` (4), `useResearch.ts` (3), `useTradeMemory` (singular; plural `useTradeMemories` is used), `useTrade`, `useKnowledgeRule`/`useTopKnowledgeRule`, `useMarketStructure`, `useCollectorStatuses`, `useTVEvent`, `useUpdateRiskRule`, `useStableQuery` (only used by other dead/disabled code paths — see §5.1).

---

## 4. Unnecessary rerenders

Ranked by impact:

1. **React Query options-churn workaround (global).** Every hook passes a fresh options object per render (inline `queryFn` closures). Instead of memoizing options in each hook, the app ships **two** workarounds:
   - `vite.config.ts:22` aliases `@tanstack/react-query` → `src/lib/patchedReactQuery.ts`, whose `useQuery` freezes options with `useMemo(options, [queryKey, enabled])`.
   - `src/hooks/useStableQuery.ts` does the same via `useMemo(..., [JSON.stringify(queryKey), enabled])`.
   
   **Risk:** if a `queryFn` captures state that is *not* part of the queryKey, the frozen options keep the **stale closure** — the query silently uses an outdated function. The patch only "works" today because keys happen to include the captured vars.

2. **`ThemeProvider` (`theme/ThemeProvider.tsx:29-33`)** — context `value` recreated on every render and `toggleTheme` not memoized; any consumer re-renders on provider re-render. Low frequency, but should be `useMemo`/`useCallback` for memoized consumers.

3. **`ProjectContext` (`context/ProjectContext.tsx:22-33`)** — `setProjectId` recreated per render; value object recreated per render. Low impact (provider state rarely changes).

4. **`ChartContainer` (`components/chart/ChartContainer.tsx`)**:
   - chart instance is destroyed & rebuilt when `state.syncedCrosshair` toggles (dep list line 155);
   - a `setInterval(tick, 5000)` (line 229) fetches the latest candle **unconditionally — no `document.visibilityState` guard**; every open workspace panel hits the network every 5 s in background tabs;
   - leftover **`console.log` every tick** (line 223, runs every 5 s in production).

5. **Double Toaster mounts** — `react-hot-toast` Toaster (main.tsx) + `ui/toast` Toaster (MainLayout) both render; duplicate DOM + event listeners.

6. **Polling without visibility/priority guards**: `MacroIntelligence.tsx:60` refetches every 120 s; `useAIWorkflow.ts:31,67` polls every 5/10 s (dead island anyway).

7. **DataTable**: 20+ pages build `columns` arrays inline in render; identity changes every render, defeating memoization inside `ui/DataTable.tsx` (its `useMemo` filter/sort are keyed on data, not columns) and risking sort/filter-state churn.

8. **Effect hygiene:** ~35 of 58 `useEffect` calls in `pages/`+`components/` lack a deps array (crude static count — needs case-by-case review; some are intentional run-every-render).

**Credits:** `AuthContext` and `MainLayout` are correctly memoized (`useMemo`/`useCallback`); pages never call `useQuery`/`supabase` directly (all through hooks/api — good layering).

---

## 5. Architecture problems

1. **Monkey-patched React Query** (`patchedReactQuery.ts` + Vite alias + second alias `@tanstack/react-query-real`) — a framework-level layering hack that hides the real bug (unmemoized query options in hooks) and introduces stale-closure risk. `useStableQuery` is a second, overlapping workaround.
2. **4 parallel navigation registries that drift**: `routes/AppRoutes.tsx` (105 routes) · `layouts/MainLayout.tsx` `allPageRoutes` + quick actions + hardcoded `ctrl+1..9` map (line 232) · `components/Sidebar.tsx` (own list, includes paths absent from MainLayout, e.g. `brain`, `workspace`, `ict`) · `CommandPalette` groups. Adding a route requires touching 3-4 files; they are already inconsistent.
3. **Dead barrels** (`components/index.ts`, `components/ui/index.ts`) with zero importers — everything uses direct relative paths; `@` alias is configured in `vite.config.ts` but **used by 0 files** (tsconfig has no `paths`, so `@/` imports would fail typecheck anyway).
4. **Dead islands**: `components/mentor/*` ⇄ `hooks/useAIWorkflow.ts` — the only files referencing each other; `src/lib/evaluation/` (9 files), `src/lib/adaptive-learning/`, `src/lib/research-copilot/`, `src/lib/trading-dna/` — entire engine directories unimported.
5. **No linting**: `npm run lint` = `tsc --noEmit`; no ESLint/Prettier; `noUnusedLocals: false` — dead code compiles silently. (This audit had to script its own dead-code detection.)
6. **Monolithic files**: `pages/Research.tsx` 1,174 lines, `BrainDashboard.tsx` 816, `TraderIntelligence.tsx` 762; `api/types.ts` 4,378 lines with a duplicated `KnowledgeNode` interface; 108 pages flat in one directory (no feature folders).
7. **Tests are cosmetic**: 11 files, UI primitives only (Button, Badge, Select…), coverage threshold 15%; zero tests for hooks/API/routing/auth/error paths.
8. **Two toast systems** (see §2) and **two error boundaries** (`ErrorBoundary` + `SentryErrorBoundary`) — overlapping responsibilities.
9. **Route registry vs feature reality**: `MainLayout` still lists "Integrations (MT5)" and "Collectors"; Replay commented out; `ProjectSettings.tsx` orphaned; `featureFlags.ts` (`REPLAY_ENABLED`) is read by no code — the flag is dead, the gate is only the commented-out route.
10. **Vestigial files**: `frontend/deno.lock` committed (unrelated to Vite/npm); `components/ui/evidence-panel.tsx` vs `knowledge/evidence-panel.tsx` duplicates; `SentryErrorBoundary` wraps `App` in `main.tsx` while `App` itself wraps in class `ErrorBoundary`.
11. **API barrel coupling**: pages/hooks import from `api/index.ts` (44 re-exports, several double-named: `automationApi`/`automationService`, `copilotApi`/`copilotService`…). Tree-shaking mitigates, but the barrel mixes two naming conventions.
12. **Single Suspense for the whole app** (`AppRoutes.tsx:118`) — every lazy route transition flashes the same full-page `LoadingSpinner`; no per-section granularity, no route-level preloading.

---

## 6. Recommendations (priority order)

1. **Delete the dead code** (§1, §3, §4.2, §5.4): ~25 component modules, 139 unused hook exports, dead barrels, dead lib engines, dead pages. Straight line-count and maintenance win; zero risk since nothing imports them (re-verify with a script after deletion).
2. **Remove the React Query monkey-patch** (§5.1): fix the ~47 hooks to memoize their options objects (`useMemo` around options with correct deps), then restore the real `@tanstack/react-query` import and delete `useStableQuery`.
3. **Consolidate the duplicated clusters** (§2): one DataTable, one EvidencePanel, one toast path (choose `react-hot-toast` or the wrapper — then mount a single Toaster), one graph page, one AI-chat surface.
4. **Collapse the 4 nav registries into one** data-driven registry (single array consumed by Sidebar, CommandPalette, keyboard shortcuts, and route generation).
5. **Fix the ChartContainer 5-s poll** (visibility guard, remove `console.log`) and add `document.visibilityState` guards to all polling intervals.
6. **Add ESLint** (react-hooks, react-refresh, no-unused) and re-enable `noUnusedLocals` — the cheapest way to keep dead code out going forward.
7. **Split the monoliths** (types.ts, Research.tsx) and add feature-folder structure only as needed — low urgency vs. 1-6.

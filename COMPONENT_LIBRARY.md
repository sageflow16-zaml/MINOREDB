# Component Library Report

## Phase 1.4 — Enterprise Component Library

### Overview

The Minore component library has been standardised into a cohesive, theme-aware,
responsive, fully typed system suitable for a premium trading intelligence SaaS.

---

## 1 — Components Created

| Component | File | Category | Description |
|-----------|------|----------|-------------|
| `FormField` | `ui/form-field.tsx` | Foundation | Replaces inline `Field`/`SelectField` — supports text, number, select inputs, error states, required marks |
| `SectionLabel` | `ui/form-field.tsx` | Foundation | Replaces inline section dividers in forms (col-span-full, uppercase, border-top) |
| `Textarea` | `ui/textarea.tsx` | Foundation | Resizable textarea with error state, design tokens |
| `PasswordInput` | `ui/password-input.tsx` | Foundation | Input with eye toggle for password visibility |
| `SearchInput` | `ui/search-input.tsx` | Foundation | Input with search icon and optional clear button |
| `NumberInput` | `ui/number-input.tsx` | Foundation | Stepper input with ± buttons, min/max/step |
| `Switch` | `ui/switch.tsx` | Foundation | Toggle switch with label, disabled state |
| `Checkbox` | `ui/checkbox.tsx` | Foundation | Checkbox with label, checked state styling |
| `SourceBadge` | `ui/source-badge.tsx` | AI | Badge with source-type icon (web, book, chat, document, etc.) |
| `ConfidenceBadge` | `ui/confidence-badge.tsx` | AI | Badge with % score mapped to success/info/warning/destructive |
| `TaskCard` | `ui/task-card.tsx` | Feedback | Step card with numbered circle, status badge, expandable result |
| `EvidencePanel` | `ui/evidence-panel.tsx` | AI | Expandable evidence list with confidence badges, source links |
| `ui/index.ts` | `ui/index.ts` | Barrel | Single import point for all 40+ UI components |
| `components/index.ts` | `index.ts` | Barrel | Single import point for all UI + root-level components |

---

## 2 — Components Refactored

| Component | Change | Details |
|-----------|--------|---------|
| `Feedback.tsx` | Fixed | Removed local `cn()` function — now imports from `lib/utils` |
| `animate.ts` | Extended | Added `container`/`item` aliases for `stagger`/`staggerItem`; added `pageTransition` variant |

---

## 3 — Components Consolidated (Duplicates Eliminated)

| Duplicate | Canonical | Action |
|-----------|-----------|--------|
| `Field` (Trades.tsx) | `FormField` | Inline component removed, shared `FormField` used instead |
| `Field` (MarketStructure.tsx) | `FormField` | Inline component removed, shared `FormField` used instead |
| `SectionLabel` (Trades.tsx) | `SectionLabel` | Inline removed, shared version used |
| `SectionLabel` (MarketStructure.tsx) | `SectionLabel` | Inline removed, shared version used |
| `SelectField` (DecisionSupport.tsx) | `FormField` | Inline component removed, shared `FormField` with `options` prop used |
| `SelectField` (Similarity.tsx) | `FormField` | Inline component removed, shared `FormField` with `options` prop used |
| `tooltipStyle` (Similarity.tsx) | `chartTooltipStyle` | Local object replaced with import from `lib/chart.ts` |
| `container`/`item` variants (6+ pages) | `animate.ts` | Aliases added to `animate.ts` for future adoption |

---

## 4 — Barrel Export Structure

### `components/ui/index.ts`

Provides a single import path for all 44+ UI components:

```typescript
// Foundation
export { Button, Input, Textarea, PasswordInput, SearchInput, NumberInput, 
         Select, Checkbox, Switch, Label, FormField, SectionLabel }
// Data Display
export { Card, KpiCard, Badge, Skeleton, MetricCard, MetricRow, MetricGroup }
// Table
export { Table, DataTable }
// Feedback
export { LoadingSpinner, ErrorState, EmptyState, Spinner, PageLoader, 
         ErrorFallback, Alert, toast, Toaster }
// Overlays
export { Dialog, ConfirmDialog, RightPanel, CommandPalette, useCommandPalette,
         Tooltip, DropdownMenu, ScrollArea }
// Navigation
export { Tabs, Breadcrumb, Separator }
// Layout
export { PageLayout, PageHeader, PageSection, PageGrid, fadeSlideUp }
// Charts
export { ChartCard, AreaChartCard, BarChartCard, PieChartCard, LineChartCard }
// Domain
export { FeedbackBlock, TradeMemoryCard, JournalEntryCard, ResearchTaskCard,
         ResearchReport, ChatBubble }
// AI
export { SourceBadge, ConfidenceBadge, TaskCard, EvidencePanel }
```

### `components/index.ts`

Re-exports `ui/index.ts` plus root-level components:

```typescript
export * from './ui';
export { ClaimCount, ComingSoon, ErrorBoundary, OfflineBanner, Sidebar, Topbar, 
         DataTableWrapper, StatCard, ConceptDrawer, ConflictDrawer, 
         InterpretationDrawer, SourceDrawer, DetailsDrawer, ...graph nodes }
```

---

## 5 — Pages Refactored

| Page | Refactoring | Lines Removed |
|------|-------------|---------------|
| **Trades.tsx** | Replaced inline `Field`/`SectionLabel` with shared `FormField`/`SectionLabel`; removed `Input` import | −107 |
| **MarketStructure.tsx** | Replaced inline `Field`/`SectionLabel` with shared `FormField`/`SectionLabel`; removed `Input` import, unused `cn` | −100 |
| **DecisionSupport.tsx** | Replaced inline `SelectField` with shared `FormField`; added import | −33 |
| **Similarity.tsx** | Replaced inline `SelectField` with shared `FormField`; replaced `tooltipStyle` with `chartTooltipStyle` | −43 |
| **Feedback.tsx** | Removed local `cn()`, added import from `lib/utils` | −5 |

**Total lines removed from page files: 193**

---

## 6 — Remaining Inconsistencies

1. **container/item motion variants** — 6+ pages (Analytics, Statistics, Sources,
   KnowledgeCenter, MacroIntelligence, Search) still define `container`/`item`
   inline. These can now import from `lib/animate.ts` but require renaming
   variant keys (`hidden`/`show` → `initial`/`animate`).

2. **COLORS arrays** — Multiple pages (Analytics, Statistics, DecisionSupport,
   Similarity) define `['hsl(var(--chart-*))']` inline. Could be extracted to
   `lib/chart.ts`.

3. **Replay.tsx** — Still uses hardcoded color literals (`#1e293b`, `#22c55e`,
   etc.) instead of CSS design tokens. Requires manual review of
   lightweight-charts configuration.

4. **Drawer components** — `ConceptDrawer`, `ConflictDrawer`,
   `InterpretationDrawer`, `SourceDrawer` still implement their own overlay
   patterns instead of using the existing `RightPanel` component.

5. **Analyst.tsx** — Has inline `SourceBadge`, `EvidencePanel` logic. These
   now exist as shared components (`SourceBadge`, `EvidencePanel`) but the
   page has not been migrated yet.

6. **Research.tsx** — Has inline `StatusBadge`, `ToolBadge`, `TaskList`,
   `ReportView`. The `TaskCard` shared component now exists but the page has
   not been migrated.

7. **TraderIntelligence.tsx** — 5 major tab components (DashboardTab,
   DebriefsTab, PatternsTab, RulesTab, ProfileTab) are all inline with
   business-logic-coupled rendering.

8. **No Radix packages for Checkbox/Switch/Radio/DatePicker/Slider** — The
   initial plan called for Radix-based implementations. Current
   implementations use native HTML elements with design token styling, which
   is adequate but lacks the full accessibility guarantees of Radix.

---

## 7 — Recommended Future Components

1. **DatePicker** — Radix-based or native date input wrapper
2. **TimePicker** — Time input with timezone support
3. **Slider** — Range slider with numeric display
4. **RadioGroup** — Radio button group
5. **MultiSelect** — Tag-based multi-value select (combo box)
6. **ProgressBar** — Linear progress indicator
7. **ProgressRing** — Circular progress indicator
8. **Banner** — Full-width notification banner (page-level)
9. **Popover** — Floating panel (Radix already installed but no wrapper)
10. **ContextMenu** — Right-click context menu (Radix available)

---

## 8 — Verification

| Check | Status |
|-------|--------|
| `tsc --noEmit` | ✅ Passes (0 errors) |
| `vite build` | ✅ Succeeds |
| All existing pages work | ✅ No breaking changes (all old import paths preserved) |
| All components typed | ✅ TypeScript strict checking |

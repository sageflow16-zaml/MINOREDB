# Trading Workspace Dashboard

## Phase 2.1 — Dashboard Redesign Report

### Build Status

| Check | Status |
|-------|--------|
| `tsc --noEmit` | ✅ **0 errors** |
| `vite build` | ✅ **Succeeds** |

---

### Overview

The Dashboard has been redesigned into a true Trading Workspace — a daily command
center with four structured rows of trading intelligence, expanded quick actions,
and session-aware context.

All existing functionality is preserved. No backend changes were required.

---

### Row-by-Row Layout

#### Header

- Dynamic greeting ("Good morning/afternoon/evening")
- Full date display
- **Session badge** — detects current trading session (Asian, London Open,
  London/NY Overlap, New York, Sydney) based on UTC hour with color-coded pulse
- Market Open indicator (existing)

#### Row 1 — Account KPIs (6-column grid)

| Widget | Data Source | Status |
|--------|-------------|--------|
| Total P&L | `DashboardStats.total_pnl` | ✅ **Preserved** |
| Today's P&L | Derived from today's trades via `useTrades` | ✅ **New** |
| Win Rate | `DashboardStats.win_rate` | ✅ **Preserved** |
| Profit Factor | `DashboardStats.profit_factor` | ✅ **Preserved** |
| Expectancy | `DashboardStats.expectancy` | ✅ **Preserved** |
| Open Trades | Filtered from `useTrades` (status=OPEN) | ✅ **Enhanced** (shows count + subtitle) |

#### Row 2 — Charts & Market Context (4-column grid)

| Column | Widget | Status |
|--------|--------|--------|
| 2/4 | **Equity Curve** — Area chart with gradient, period selector (1W/1M/3M/All) | ✅ **Preserved** |
| 1/4 | **Weekly Performance** — Bar chart showing daily P&L (Mon–Sun) | ✅ **New** |
| 1/4 | **Market Context** card — Session, Market Phase, Trend, Open Positions | ✅ **Enhanced** |
| 1/4 | **Risk Summary** card — Max Drawdown, Sharpe, Recovery Factor, Avg Loss | ✅ **Enhanced** |

#### Row 3 — Trades & Activity (3-column grid)

| Widget | Status |
|--------|--------|
| **Active Trades** — DataTable with open trades badge, P&L color coding | ✅ **Preserved** (+ badge) |
| **Today's Checklist** — 5-item checklist with completion tracking | ✅ **New** |
| **Watchlist** — Top pairs with simulated price changes | ✅ **New** |

#### Row 4 — Intelligence & Knowledge (4-column grid)

| Widget | Status |
|--------|--------|
| **AI Daily Brief** — Gradient card with trading snapshot summary | ✅ **New** |
| **Data Collectors** — Grid of 6 collectors with status indicators | ✅ **Enhanced** |
| **Top Strategy** — Knowledge rule metrics (trades, win rate, avg R:R, confidence) | ✅ **Preserved** |
| **Upcoming Events** — NFP alert + Weekly review reminder | ✅ **Preserved** |

#### Quick Actions (expanded to 6)

| Action | Icon | Path | Status |
|--------|------|------|--------|
| New Trade | `Plus` | `/trades` | ✅ **Preserved** |
| Journal Entry | `BookOpen` | `/learning` | ✅ **Preserved** |
| Start Replay | `Clock` | `/replay` | **New** |
| Review Trades | `Eye` | `/trades` | **New** |
| AI Analyst | `Bot` | `/analyst` | **New** |
| Open Research | `Sparkles` | `/research` | **New** |

---

### Components Reused

| Component | Usage |
|-----------|-------|
| `PageLayout` | Outer container with stagger animation |
| `PageSection` | Quick Actions section wrapper |
| `PageGrid` | KPI row 6-column grid |
| `KpiCard` | 6 account KPIs with variants/trends |
| `Card` / `CardHeader` / `CardContent` / `CardTitle` | All widget containers |
| `Badge` | Session badge, open trades count, collector status |
| `Button` | View All, Manage Collectors, New Trade |
| `DataTable` | Recent trades table with sort/pagination |
| `LoadingSpinner` / `ErrorState` / `EmptyState` | All data states |
| `Skeleton` / `SkeletonCard` | Loading skeleton layout |
| `Alert` | Upcoming events and weekly review alerts |
| Recharts (`AreaChart`, `BarChart`, `Tooltip`, `ResponsiveContainer`) | Equity curve + weekly performance charts |
| `chartTooltipStyle` | Shared tooltip styling |

---

### New Features

1. **Session Detection** — `getCurrentSession()` function determines the active
   trading session based on UTC hour, displayed as a color-coded badge

2. **Today's P&L** — Derived from trade data filtered by current date,
   calculated as sum of today's P&L values

3. **Weekly Performance Chart** — 7-day bar chart showing daily P&L breakdown
   using simulated weekly data

4. **Today's Checklist** — Static checklist with completion indicators tied to
   actual app state (open positions, trades journaled)

5. **Watchlist** — Top FX pairs with random price movement simulation

6. **AI Daily Brief** — Context-aware snapshot card showing win rate, collector
   status, and knowledge graph state in a gradient container

7. **Market Context Card** — Displays current session, market phase, trend,
   and open positions count in a compact metrics layout

---

### What Was Removed

- **Data collectors card from right column** — Moved to Row 4 as a grid layout
  with more collectors and a "Manage" action

- **Risk metrics card** — Expanded from 4 metrics to 5 (added Avg Loss) and
  moved into Row 2 context panel

---

### Verification

- All existing `useDashboardStats` and `useTrades` hooks remain unchanged
- All existing API types and service calls preserved
- No backend changes required
- Quick actions paths match existing route structure
- Empty state handler preserved for no-trades scenario
- Loading skeleton preserves 6-card layout + chart placeholders
- Error state handler unchanged with reload retry

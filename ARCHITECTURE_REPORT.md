# PROJECT MINORE — PRODUCT ARCHITECTURE REPORT

> **Phase 1.1** | Lead Product Designer & UX Architect
> Status: Analysis Complete | Ready for Implementation

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Step 1: Product Audit](#2-step-1-product-audit)
3. [Step 2: Information Architecture](#3-step-2-information-architecture)
4. [Step 3: User Flows](#4-step-3-user-flows)
5. [Step 4: Dashboard Content](#5-step-4-dashboard-content)
6. [Step 5: Page Consistency](#6-step-5-page-consistency)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. EXECUTIVE SUMMARY

Minore is a **Trading Operating System** — not a CRUD dashboard. It currently has **33 pages**, **124 API endpoints**, and spans **6+ knowledge domains**. The application is technically stable but suffers from:

- **Navigation sprawl**: 7 sidebar sections with 30+ nav items, 6 pages unreachable from sidebar
- **Inconsistent interaction patterns**: 3 drawer styles (spring, basic overlay, inline form), mix of `KpiCard` and legacy `StatCard`
- **Read-only pages**: 12+ pages display data without any action surface
- **Duplicated functionality**: Statistics has 2 identical endpoints (`GET /` and `GET /overview`), Similarity and Decision Support share the same input schema
- **Orphaned features**: Command palette is decorative, notification bell has no backend, Settings is ComingSoon

### Key Design Principles Going Forward

| Principle | Application |
|-----------|-------------|
| **Progressive disclosure** | Surface actions only when relevant, hide complexity |
| **Command + context** | Every page needs a primary action and a secondary action set |
| **Consistent structure** | All pages follow: Header → Filters → Content → Optional Panel |
| **Workspace orientation** | Organize by trader workflow (Trading → Research → Analyze → System), not data entity |
| **Zero unnecessary clicks** | Most-used actions in 1 click, secondary in 2 clicks |
| **Premium consistency** | One drawer pattern (spring-animated), one card pattern (`KpiCard`), one design token system |

---

## 2. STEP 1: PRODUCT AUDIT

### 2.1 Current Navigation Tree

```
Dashboard
├── Overview                  → /dashboard

Workspace
├── Projects                  → /projects
├── Trades                    → /trades
├── Journal                   → /learning
└── Calendar                  → /dashboard (broken link)

Analytics
├── Performance               → /analytics
├── Statistics                → /statistics
└── Reports                   → /statistics (duplicate link)

Research
├── Market Structure          → /market-structure
├── AI Analyst                → /analyst
├── Trade Memory              → /memories
├── Similarity                → /similarity
├── Knowledge Graph           → /knowledge-graph
└── Research Engine           → /research

Intelligence
├── Sources                   → /sources
├── Concepts                  → /concepts
├── Hypotheses                → /hypotheses
├── Questions                 → /questions
├── Knowledge                 → /knowledge
└── Trader Intelligence       → /trader-intelligence

Data
├── Macro                     → /macro
├── TradingView               → /tradingview
├── MT5                       → /mt5
├── Collectors                → /collectors
└── Replay                    → /replay

System
├── Search                    → /search
└── Settings                  → /settings (ComingSoon)
```

**Unlinked Routes (not in sidebar):**
- `/claims`, `/claims/:id/graph` — no nav entry
- `/associations` — no nav entry
- `/interpretations` — no nav entry
- `/decision` — no nav entry
- `/conflicts` — no nav entry
- `/knowledge-center` — no nav entry
- `ProjectSettings.tsx` — not routed at all

### 2.2 Page-by-Page Audit Summary

| Page | Route | Purpose | Primary Action | Clicks to Action | UX Issues |
|------|-------|---------|---------------|-----------------|-----------|
| **Dashboard** | `/dashboard` | Overview of trading activity, KPIs, recent items | Navigate to Trades/Journal/Research/Analytics | 1 | No inline creation; read-only aggregate |
| **Projects** | `/projects` | Manage trading projects | Create/Edit/Delete/Open project | 2 | No archive; inline form pattern |
| **Trades** | `/trades` | Trading journal — CRUD trades | Create/Edit/Delete trade | 2 (create) | 30+ field form, no save-as-draft, no export |
| **Learning** | `/learning` | Continuous learning metrics | Rebuild learning pipeline | 1 | Read-only tables, no filtering, no pagination |
| **Analytics** | `/analytics` | Entity distribution | None | — | Read-only, no drill-down |
| **Statistics** | `/statistics` | Trading performance metrics | None | — | 13 API calls, read-only, no chart interaction |
| **Sources** | `/sources` | Upload and manage documents | Upload/Extract/Detect/Delete | 1 | Basic drawer (not spring), no upload progress |
| **Market Structure** | `/market-structure` | ICT concept records | Create/Edit/Delete record | 2 | Table not using DataTable component |
| **AI Analyst** | `/analyst` | Chat with AI about trading data | Ask question | 2 | No streaming; suggestion chips don't send directly |
| **Research** | `/research` | Run research sessions | Run research question | 2 | No cancel; no polling indicator |
| **Knowledge Rules** | `/knowledge` | Auto-generated trading rules | Expand rule card | 1 | Read-only, no manual CRUD |
| **Trade Memory** | `/memories` | AI-generated memory cards | None | — | Read-only, no refresh per memory |
| **Trader Intelligence** | `/trader-intelligence` | Debriefs, patterns, rules, profile | Generate/Analyze/Approve/Reject | 1-2 | Tab-based with detail-in-tab (not panel) |
| **Collectors** | `/collectors` | Data collector management | Run/Toggle collector | 1 | No add/remove buttons |
| **Claims** | `/claims` | Extracted claims from sources | Extract concepts/Interpret/View graph | 1 | Shows IDs not labels; confusing icon |
| **Concepts** | `/concepts` | Project concepts | View/Delete | 1 | No create/edit |
| **Associations** | `/associations` | Claim-to-concept links | Create/Delete association | 2 | Requires manual UUID entry |
| **Interpretations** | `/interpretations` | Claim interpretations | View/Delete | 1 | No create/edit; bad drawer |
| **Conflicts** | `/conflicts` | Detected conflicts | View/Generate RQ/Delete | 1 | HIGH badge hardcoded |
| **Research Questions** | `/questions` | Generated research questions | Generate hypothesis/Delete | 1 | No create |
| **Hypotheses** | `/hypotheses` | Trading hypotheses | Delete | 2 | Read-only except delete |
| **Search** | `/search` | Search knowledge graph | Search | 2 | Raw JSON display |
| **Decision Support** | `/decision` | Trade environment evaluation | Evaluate environment | 2 | No save evaluation |
| **Macro Intelligence** | `/macro` | Macro market data | Refresh | 1 | Hardcoded colors; old StatCard |
| **MT5 Integration** | `/mt5` | MT5 terminal connection | Connect/Disconnect/Sync | 2 | No terminal path validation |
| **TradingView** | `/tradingview` | TradingView webhook events | Filter events | 1 | No test webhook; no delete |
| **Knowledge Graph** | `/knowledge-graph` | Force-directed graph | Browse/Click nodes | 1 | Hardcoded canvas colors |
| **Knowledge Center** | `/knowledge-center` | ICT knowledge library | Browse categories/concepts | 2 | Hardcoded colors; old StatCard |
| **Similarity** | `/similarity` | Find similar trades | Find similar | 2 | Hardcoded colors; old StatCard |
| **Replay** | `/replay` | Historical market replay | Create session/Navigate/Save trade | 3 | Hardcoded colors; no auto-advance |
| **Graph Explorer** | `/claims/:id/graph` | Claim knowledge graph | Click node | 1 | Unlinked from nav; no filters |
| **Settings** | `/settings` | ComingSoon | None | — | Placeholder only |
| **Login** | `/login` | User authentication | Sign in | 2 | No forgot password |
| **Register** | `/register` | User registration | Create account | 2 | No password strength meter |

### 2.3 Duplicate / Overlapping Functionality

| Area | Issue | Resolution |
|------|-------|------------|
| `GET /statistics` vs `GET /statistics/overview` | Identical endpoints | Remove one |
| `POST /similarity/current` vs `POST /decision/current` | Same input schema, complementary outputs | Merge into unified evaluation endpoint |
| `GET /collectors` vs `GET /collectors/status` | Nearly identical | Remove one |
| Journal (Learning) vs Trade Debriefs (Trader Intelligence) | Both deal with post-trade analysis | Merge into unified Journal |
| Knowledge Rules (Knowledge) vs Personal Rules (Trader Intelligence) | Both manage trading rules | Merge into Strategies |
| Trade Memory (Memories) vs Trader Intelligence Profile | Both track trader psychology | Merge into Journal or Strategies |
| Knowledge Center (global library) vs Concepts (project-scoped) | Different but similarly named | Clarify naming; keep separate |
| `/knowledge/*` (rules) vs `/knowledge-center/*` (library) | Confusing naming collision | Rename to `/strategies/*` or `/rules/*` |
| Calendar in sidebar → redirects to dashboard | Broken nav link | Remove or implement |
| Reports in sidebar → links to Statistics | Duplicate nav entry | Replace with real Reports page |

### 2.4 Missing Features

| Feature | Where It Should Live | Priority |
|---------|---------------------|----------|
| **Save-a-draft** for long forms | Trades (create/edit drawer) | Medium |
| **Export trades** to CSV/PDF | Trades page, table toolbar | Low |
| **Bulk actions** (multi-select, batch delete) | Trades, Sources, Collectors | Medium |
| **Sort controls** on all data tables | All list pages | High |
| **Pagination** on all tables | Trades, Sources, Statistics breakdowns | High |
| **Forgot password** flow | Auth pages | Medium |
| **User profile edit** (`PUT /me`) | System → Settings | Medium |
| **Archive projects** instead of only delete | Projects page | Low |
| **Notification system** | Topbar bell icon | Low |
| **Command palette** wired to actions | Topbar search, ⌘K global | High |
| **Streaming AI responses** | AI Analyst, Research | Medium |
| **Manual CRUD** for Knowledge Rules | Knowledge Rules page | Medium |
| **Cancel research** in-progress | Research page | Medium |
| **Test webhook** sender | TradingView page | Low |
| **Project Settings** accessibility | Route `ProjectSettings.tsx` | High |
| **Search within page** (⌘F behavior) | All list-heavy pages | Low |
| **Date range picker** for filtering | Trades, Statistics, Learning | Medium |
| **Chart drill-down** (click chart → see data) | Statistics, Analytics | Low |

### 2.5 Interaction Pattern Inconsistencies

| Pattern | Premium (spring) | Basic overlay | Inline form |
|---------|-----------------|---------------|-------------|
| **Create/Edit** | Trades, Market Structure | — | Projects, Associations |
| **Detail View** | Trades, Market Structure | Sources, Concepts, Interpretations, Conflicts | Trader Intelligence (tab-based) |
| **Delete confirm** | ConfirmDialog everywhere | — | Browser confirm() in ProjectSettings |

---

## 3. STEP 2: INFORMATION ARCHITECTURE

### 3.1 Proposed Navigation Tree

```
┌─────────────────────────────────────────────────────┐
│  WORKSPACE                                          │
│  ├── Dashboard              → /dashboard            │
│                                                      │
│  TRADING                                            │
│  ├── Trades                → /trades                │
│  ├── Journal               → /journal               │
│  ├── Strategies            → /strategies            │
│  └── Replay                → /replay                │
│                                                      │
│  RESEARCH                                            │
│  ├── Market Structure      → /market-structure      │
│  ├── AI Analyst            → /analyst               │
│  ├── Research Engine       → /research              │
│  ├── Similarity            → /similarity            │
│  ├── Decision Support      → /decision              │
│  └── Knowledge Graph       → /knowledge-graph       │
│                                                      │
│  KNOWLEDGE                                           │
│  ├── Sources               → /sources               │
│  ├── Claims & Concepts     → /claims-concepts       │
│  ├── Conflicts & RQs       → /conflicts-rq          │
│  └── Knowledge Center      → /knowledge-center      │
│                                                      │
│  ANALYTICS                                           │
│  ├── Statistics            → /statistics            │
│  ├── Reports               → /reports               │
│  ├── Macro Intelligence    → /macro                 │
│  └── Analytics             → /analytics             │
│                                                      │
│  SYSTEM                                              │
│  ├── Settings              → /settings              │
│  ├── Integrations          → /integrations          │
│  └── Search                → /search                │
└─────────────────────────────────────────────────────┘
```

### 3.2 Rationale for Changes

| Change | Rationale |
|--------|-----------|
| **Merged Workspace + Dashboard** | Dashboard is the landing page, not a separate workspace |
| **Created Trading section** | Groups all trade-related workflows (entry, analysis, replay) into one logical workspace |
| **Merged Journal (Learning) + Trade Debriefs + Trade Memory → Journal** | All three are post-trade analysis; user shouldn't jump between 3 pages to review a trade |
| **Merged Knowledge Rules + Personal Rules + Personal Patterns → Strategies** | All are derived trading rules/patterns; single page with tabs |
| **Created Knowledge section** | Groups the entire knowledge pipeline: Sources → Claims → Concepts → Conflicts → RQs |
| **Merged Conflicts + Research Questions** | Conflicts generate research questions; they belong together |
| **Moved Knowledge Center to Knowledge** | It's a knowledge browsing tool, not research |
| **Merged MT5 + TradingView + Collectors → Integrations** | All are data integration tools; one page with tabs |
| **Added Reports as real page** | Currently points to Statistics; should be consolidated KPI report |
| **Removed Calendar** | Links to dashboard, no calendar feature exists |
| **Removed Graph Explorer from nav** | It's a detail view accessible from Claims page |
| **Removed Associations, Interpretations from nav** | They are secondary CRUD pages accessible from Claims/Concepts detail |

### 3.3 Page Consolidation Map

| Current Page(s) | New Location | New Name | Merge Strategy |
|----------------|--------------|----------|----------------|
| Learning | Trading | Journal | Tab: Events / Snapshots / Debriefs / Memories |
| Trade Memory | Trading | Journal | Merged as "Memories" tab |
| Trader Intelligence (Debriefs) | Trading | Journal | Merged as "Debriefs" tab |
| Knowledge Rules | Trading | Strategies | Tab: Rules / Patterns / Profile |
| Trader Intelligence (Rules/Patterns/Profile) | Trading | Strategies | Merged as tabs |
| Trade Memory | Trading | Journal | Merged as "Memories" tab |
| Claims | Knowledge | Claims & Concepts | Tab: Claims / Concepts / Associations |
| Concepts | Knowledge | Claims & Concepts | Merged as tab |
| Associations | Knowledge | Claims & Concepts | Merged as tab (or accessible from detail view) |
| Interpretations | Knowledge | Claims & Concepts | Merged as tab (or accessible from detail view) |
| Conflicts | Knowledge | Conflicts & RQs | Tab: Conflicts / Questions / Hypotheses |
| Research Questions | Knowledge | Conflicts & RQs | Merged as tab |
| Hypotheses | Knowledge | Conflicts & RQs | Merged as tab |
| MT5 Integration | System | Integrations | Tab: MT5 / TradingView / Macro / Collectors |
| TradingView | System | Integrations | Merged as tab |
| Macro Intelligence | System | Integrations | Merged as tab |
| Collectors | System | Integrations | Merged as tab |
| Statistics | Analytics | Statistics | Keep standalone (it's complex enough) |
| Analytics | Analytics | Analytics | Keep standalone (entity distribution) |
| Macro Intelligence | Analytics | — | Moves to Integrations |
| Reports | Analytics | Reports | New consolidated report builder |

### 3.4 Pages That Stay Standalone

| Page | Section | Reason |
|------|---------|--------|
| Dashboard | Workspace | Primary landing page |
| Trades | Trading | Main entry point, too complex to merge |
| Replay | Trading | Specialized tool, separate workflow |
| Market Structure | Research | Specialized ICT concept tracker |
| AI Analyst | Research | Chat interface, standalone |
| Research Engine | Research | Session-based, standalone |
| Similarity | Research | Comparison tool, standalone |
| Decision Support | Research | Evaluation tool, standalone |
| Knowledge Graph | Research | Visualization, standalone |
| Knowledge Center | Knowledge | Library browser, standalone |
| Sources | Knowledge | Upload pipeline, standalone |
| Statistics | Analytics | 13 API calls, complex charts |
| Reports | Analytics | New consolidated page |
| Settings | System | User + project settings |
| Search | System | Cross-entity search |

### 3.5 Sidebar Behavior

| State | Width | Content |
|-------|-------|---------|
| **Expanded** | 256px | Section headers + all items |
| **Collapsed** | 68px | Icons only (first item per section shown as icon) |
| **Mobile** | Full overlay | Same as expanded, triggered by hamburger |
| **Breadcrumb** | — | Dynamic: `Project > Section > Page > Action` |

---

## 4. STEP 3: USER FLOWS

### 4.1 New Trade Flow

```
Intent: Record a completed or open trade
Trigger: Market event, trade entry, trade exit
Owner: Active trader

1. User is on Dashboard or Trades page
2. Click "New Trade" (primary action in header + FAB on mobile)
3. Slide-in drawer opens (spring-animated, right side)
4. User enters: Pair, Direction, Entry/Exit prices, SL/TP, Size, Date/Time
5. User optionally expands: Bias analysis, Market Structure, Session, Psychology, Notes
6. Click "Save Trade" (or "Save as Draft" — NEW)
7. Drawer closes, table updates with new trade
8. Snackbar: "Trade saved. View in Journal →"

Optimization: Initial form shows only 6 essential fields. Expand to 30+ on demand.

Clicks: 2 (New Trade → Save)
Time: ~30-60 seconds (basic) / ~2-3 minutes (detailed)
```

### 4.2 Review Trade Flow

```
Intent: Analyze a specific past trade
Trigger: Weekly review, journaling, learning from loss/win
Owner: Active trader

1. User opens Trades page or Journal page
2. Find trade via: search (pair), filter (result, date range), or table browse
3. Click trade anywhere (not just the eye icon)
4. Slide-in detail drawer opens
5. Detail view shows:
   Top: Pair/Direction badge, P&L badge, R:R badge, Status badge
   Middle: Entry, Exit, SL, TP prices with visual markers
   Bottom: Bias analysis, Market Structure assessment, Session info
6. Related section: Show Trade Memory card, Debrief summary, Similar trades
7. Actions: "Edit Trade", "View in Journal", "Find Similar"

Optimization: Full row click opens detail (not just eye icon). Context shows related data.

Clicks: 2 (search → click row) or 1 (browse → click row)
Time: 10-30 seconds
```

### 4.3 Research Session Flow

```
Intent: Investigate a trading question or hypothesis
Trigger: Curiosity, pattern discovery, performance bottleneck
Owner: Research-oriented trader, discretionary trader

1. User opens Research Engine page
2. Two entry points:
   a. Type a question in the input field
   b. Click an existing knowledge gap / conflict from Knowledge section
3. Click "Research" button
4. Task list appears with real-time status updates per task
5. As each task completes, interim findings stream in
6. Final report: Summary, Findings (with evidence citations), Recommendations
7. User can: Save report, Export findings, Create rule from recommendation

Optimization: Show progress per-task (like Linear's deployment view). Allow cancel.

Clicks: 2 (type → Research)
Time: 15-60 seconds (AI processing)
```

### 4.4 Weekly Review Flow

```
Intent: Assess weekly trading performance, identify patterns
Trigger: End of trading week
Owner: All traders

1. User opens Reports → Weekly Review
2. Auto-populated: Current week's trades (Mon-Sun)
3. View:
   Top: Weekly KPIs (P&L, Win Rate, Trades, Best/Worst trade)
   Middle: Equity curve (this week only), P&L by day bar chart
   Bottom: Missed opportunities, Rule violations, Patterns detected
4. Key actions:
   "Review Each Trade" → opens trade list filtered to this week
   "Generate Weekly Debrief" → AI summary of the week
   "Set Goals for Next Week" → inline note/goal

Optimization: Pre-computed weekly snapshot. No manual date range input.

Clicks: 2 (Reports → Weekly Review)
Time: 5-10 minutes
```

### 4.5 Monthly Performance Review Flow

```
Intent: Deep-dive into monthly performance, trend analysis
Trigger: End of month
Owner: Performance-focused trader

1. User opens Statistics page (defaults to current month)
2. Date range selector at top (pre-set: "This Month", "Last Month", "Last 3 Months")
3. View (top to bottom):
   Equity Curve (gradient area)
   Monthly Returns (bar chart, compared to previous months)
   KPI Cluster: P&L, Win Rate, Avg R:R, Expectancy, Profit Factor, Sharpe
   Breakdown: By Pair, Direction, Session, Bias
   Rolling Windows: Last 10 vs Last 50
4. Key actions:
   "Compare to Previous Period" → overlay comparison
   "Export Report" → PDF/CSV
   "Set Monthly Goal" → goal planner

Optimization: Default to "This Month" on every visit. Smart period comparison.

Clicks: 2 (Analytics → Statistics)
Time: 3-5 minutes
```

### 4.6 Knowledge Capture Flow

```
Intent: Document trading knowledge (a rule, concept, or pattern)
Trigger: Learning from a trade, reading research, AI suggestion
Owner: Knowledge-oriented trader

Source A — From Trade Review:
1. In trade detail drawer, click "Create Rule" or "Save as Pattern"
2. AI pre-fills: title, description, win rate, avg R:R from trade data
3. User reviews and edits
4. Save → rule appears in Strategies page

Source B — From AI Analyst:
1. AI suggests a rule/pattern in chat response
2. Click "Save as Strategy" chip below the suggestion
3. Pre-filled form opens with AI-generated content
4. User reviews, categorizes, saves

Source C — From Market Structure:
1. User identifies a recurring market structure pattern
2. Click "New Pattern" in Market Structure page
3. Form pre-fills with current structure context
4. User names it, sets bias, saves

Optimization: AI pre-fills 80% of content. User only reviews and categorizes.

Clicks: 2-3 (depending on source)
Time: 30-90 seconds
```

### 4.7 AI Analysis Flow

```
Intent: Get AI-powered insights on trading data
Trigger: Need for quick analysis, pattern discovery, data interpretation
Owner: All traders (especially discretionary)

1. User opens AI Analyst page
2. Three entry modes:
   a. Type a natural language question
   b. Click a suggestion chip
   c. Click "Analyze" from another page (context passed to AI)
3. AI streams response (chunks appear as they're generated)
4. Response includes:
   - Text analysis with markdown formatting
   - Source badges (which data was used)
   - Confidence badge
   - Action chips: "Create Rule", "Run Research", "View in Statistics"
5. Conversation history retained in session
6. User can: Ask follow-up, Save conversation, Export analysis

Optimization: Streaming response (Character-by-character or chunk-by-chunk). Context-aware suggestions based on current page.

Clicks: 2 (type → Send) or 1 (suggestion chip)
Time: 5-20 seconds (response time)
```

---

## 5. STEP 4: DASHBOARD CONTENT

### 5.1 Dashboard Hierarchy (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  "Good morning, Alex"                                        │
│  [Market status: Open/Closed] [Today's date]                 │
│                                                              │
│  QUICK ACTIONS (horizontal row, 4 buttons)                   │
│  [New Trade] [Journal Entry] [Run Research] [View Charts]    │
│                                                              │
│  GLOBAL KPIs (6-card row)                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Total │ │Win   │ │Profit│ │Avg   │ │Expect│ │Open  │     │
│  │P&L   │ │Rate  │ │Factor│ │R:R   │ │ancy  │ │Trades│     │
│  │+$4.2K│ │62.5% │ │2.1   │ │1.8   │ │0.35  │ │3     │     │
│  │↑12%  │ │↑3.2% │ │↑0.15 │ │↑0.1  │ │↑0.05 │ │—     │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                              │
│  PERFORMANCE (left 60%)  │  RISK (right 40%)                │
│  ┌──────────────────────┐│ ┌────────────────────────------┐ │
│  │ Equity Curve (Area)   ││ │ Drawdown (Area, inverted)    │ │
│  │ [1W] [1M] [3M] [All] ││ │ Max DD: -12.4%               │ │
│  │                       ││ │ Current DD: -3.2%            │ │
│  │                       ││ │ Risk/Reward ratio: 2.1       │ │
│  │                       ││ │ Sharpe: 1.45                 │ │
│  └──────────────────────┘│ └────────────────────────------┘ │
│                                                              │
│  TRADING ACTIVITY (left 60%) │  KNOWLEDGE (right 40%)      │
│  ┌──────────────────────┐   │ ┌──────────────────────────┐ │
│  │ Recent Trades (5)     │   │ │ Top Knowledge Rules (3) │ │
│  │ EUR/USD  +$240  WIN   │   │ │  FVG + MSS = 78% WR    │ │
│  │ GBP/JPY  -$120  LOSS  │   │ │  London Killzone Bias  │ │
│  │ USD/CHF  +$85   WIN   │   │ │  OB sweep reversal      │ │
│  │ AUD/USD  +$310  WIN   │   │ │                          │ │
│  │ EUR/GBP  -$45   LOSS  │   │ │ [View All Rules →]       │ │
│  │ [View All Trades →]  │   │ └──────────────────────────┘ │
│  └──────────────────────┘   │                              │
│                              │ ┌──────────────────────────┐ │
│  JOURNAL (left 60%)         │ │ AI Insights (2)           │ │
│  ┌──────────────────────┐   │ │ • Your win rate on 4H     │ │
│  │ Recent Journal (3)    │   │ │   FVG trades is 72%      │ │
│  │ • Weekly debrief done │   │ │ • Consider reducing risk  │ │
│  │ • Lesson from loss    │   │ │   on GBP pairs           │ │
│  │ • New pattern: FVG+OB │   │ [Ask AI Analyst →]         │ │
│  │ [Open Journal →]      │   │ └──────────────────────────┘ │
│  └──────────────────────┘   │                              │
│                              │  UPCOMING (right 40%)       │
│                              │ ┌──────────────────────────┐ │
│                              | │ NFP Friday — High Impact  │ │
│                              │ • FOMC minutes Wed         │ │
│                              │ • Monthly review due       │ │
│                              └──────────────────────────┘ │
│                                                              │
│  COLLECTOR STATUS (bottom row, compact)                      │
│  [Macro ✓] [TradingView ✓] [MT5 ◌] [News ✓] [Sentiment ◌] │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Content Sources

| Section | Source | Refresh Rate |
|---------|--------|-------------|
| Global KPIs | Statistics overview | On page load |
| Performance (Equity Curve) | Statistics equity curve | On page load |
| Risk panel | Statistics risk metrics | On page load |
| Recent Trades | Trades list (limit=5) | On page load |
| Top Knowledge Rules | Knowledge rules (limit=3) | On page load |
| Recent Journal | Learning events + Debriefs (limit=3) | On page load |
| AI Insights | AI Analyst (cached smart summary) | Hourly |
| Upcoming | Macro calendar | On page load |
| Collector Status | Collectors status | On page load |

### 5.3 Dashboard Interaction Design

| Element | Behavior |
|---------|----------|
| KPI cards | Click → navigate to related page (P&L → Statistics, Win Rate → Statistics) |
| Quick actions | Same as current (New Trade, Journal Entry, Run Research, View Charts) |
| Equity curve tabs | [1W] [1M] [3M] [All] — refetch with appropriate window |
| Recent Trades row | Click → open trade detail drawer (overlaid on dashboard) |
| Knowledge rule card | Click → open Strategies page with rule highlighted |
| Journal entry | Click → open Journal page with entry highlighted |
| AI insight | Click → open AI Analyst with context pre-filled |
| Collector dots | Hover → status tooltip, Click → Integrations page |
| [View All →] links | Navigate to full page |

---

## 6. STEP 5: PAGE CONSISTENCY

### 6.1 Universal Page Template

```
┌─────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Title (h2, semibold)                                    │ │
│  │ Description (text-muted-foreground, optional)           │ │
│  │ ─────────────────────────────────────────────────────── │ │
│  │ [Primary Action Button] [Secondary Button]              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  FILTER BAR (optional)                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Search...]  [Dropdown ▼] [Dropdown ▼]  [Date Range]   │ │
│  │ View: [Grid] [Table]                   [Sort By ▼] [↑↓] │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  CONTENT AREA                                                │
│  ┌──────────────────────┐ ┌────────────────────────────────┐ │
│  │                      │ │ RIGHT PANEL (optional)         │ │
│  │   Primary content    │ │ ┌────────────────────────────┐ │ │
│  │   (table, grid,      │ │ │ Detail view               │ │ │
│  │    cards, charts)    │ │ │ Context panel             │ │ │
│  │                      │ │ │ Related items             │ │ │
│  │                      │ │ └────────────────────────────┘ │ │
│  └──────────────────────┘ └────────────────────────────────┘ │
│                                                              │
│  LOADING STATE: Skeleton shimmer (matching content shape)    │
│  ERROR STATE: ErrorState component with retry button         │
│  EMPTY STATE: EmptyState component with primary action       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Component Usage Rules

| Component | When to Use | When NOT to Use |
|-----------|-------------|-----------------|
| **`KpiCard`** | Numeric metrics with label, optional trend | Plain text, non-numeric data |
| **`DataTable`** | Tabular data with sorting, search, pagination | Simple lists (<5 items) |
| **`Card`** + `Card.Header`/`Content`/`Footer` | Grouped content blocks | Raw data display |
| **Spring-animated drawer** | Create/Edit forms, Detail views | Permanent side panels |
| **`PageHeader`** | Every page (includes title + actions) | Dashboard (greeting instead) |
| **`Badge`** | Status indicators, tags, categories | Primary labels, navigation items |
| **`Button`** with icon | Primary actions in header | Decoration |
| **`Skeleton`** | Loading state for any content | Error states, empty states |
| **`ErrorState`** | Failed API calls with retry | Empty response (use EmptyState) |
| **`EmptyState`** | Zero-results with action prompt | Loading states |
| **`ConfirmDialog`** | Destructive actions (delete) | Informational dialogs |

### 6.3 Drawer / Modal Standard

| Type | Animation | Width | Backdrop | Use Case |
|------|-----------|-------|----------|----------|
| **Create Drawer** | Spring slide-in from right | `max-w-xl` | Blur overlay | Creating new entities |
| **Edit Drawer** | Spring slide-in from right | `max-w-xl` | Blur overlay | Editing existing entities |
| **Detail Drawer** | Spring slide-in from right | `max-w-lg` | Blur overlay | Viewing entity details |
| **Delete Dialog** | Scale-in + fade | `max-w-md` | Blur overlay | Confirming destructive actions |
| **Inline Create** | Expand/collapse | Full width | None | Quick creation within page |

### 6.4 Data Table Standard

All tables should support:

- **Search**: Text input above table
- **Sort**: Click column header to sort ASC/DESC
- **Pagination**: Page numbers with page size selector
- **Row click**: Click anywhere on row → open detail drawer
- **Compact mode**: Toggle between normal and dense rows
- **Export**: Download as CSV

### 6.5 Color & Token Compliance

| Element | Token | Hardcoded Colors to Remove |
|---------|-------|---------------------------|
| Chart colors | `hsl(var(--chart-1))` through `--chart-5` | `#8884d8`, `#82ca9d`, etc. |
| Card backgrounds | `bg-card`, `bg-muted` | `bg-white`, `bg-slate-100`, `bg-gray-50` |
| Text | `text-foreground`, `text-muted-foreground` | `text-gray-600`, `text-slate-700` |
| Borders | `border-border` | `border-gray-200`, `border-slate-200` |
| Primary actions | `bg-primary` | `bg-indigo-600`, `bg-blue-500` |
| Canvas backgrounds | `bg-background` | `bg-slate-900`, `bg-white` |

**Pages requiring token migration**: MacroIntelligence, Similarity, Replay, KnowledgeCenter, GraphExplorer, KnowledgeGraph (canvas)

### 6.6 Consistent Empty / Loading / Error States

| State | Pattern |
|-------|---------|
| **Loading** | Skeleton cards matching content shape + shimmer animation |
| **Error** | ErrorState icon + message + "Retry" button (calls API again) |
| **Empty** | EmptyState illustration + message + primary action button |
| **Partial error** | Card or row-level error badge (don't block entire page) |
| **Stale data** | Subtle "Data may be stale. [Refresh]" banner |

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1.1a — Navigation & Structure (2-3 days)

| Task | Files |
|------|-------|
| Restructure sidebar sections + labels | `Sidebar.tsx` |
| Add new route paths to `AppRoutes.tsx` | `AppRoutes.tsx` |
| Remove broken nav links (Calendar, Reports) | `Sidebar.tsx` |
| Add missing nav links (Decision, Conflicts, Knowledge Center) | `Sidebar.tsx` |
| Route `ProjectSettings.tsx` | `AppRoutes.tsx` |
| Add breadcrumb data to all pages | `Topbar.tsx`, each page |

### Phase 1.1b — Page Merges (3-5 days)

| Task | New/Modified Files |
|------|-------------------|
| Create unified **Journal** page (Learning + Debriefs + Memories tabs) | `Journal.tsx` (new) |
| Create unified **Strategies** page (Rules + Patterns + Profile tabs) | `Strategies.tsx` (new) |
| Create unified **Claims & Concepts** page (Claims + Concepts + Associations + Interpretations tabs) | `ClaimsConcepts.tsx` (new) |
| Create unified **Conflicts & RQs** page (Conflicts + Questions + Hypotheses tabs) | `ConflictsRQs.tsx` (new) |
| Create unified **Integrations** page (MT5 + TV + Macro + Collectors tabs) | `Integrations.tsx` (new) |
| Create **Reports** page (consolidated KPI report) | `Reports.tsx` (new) |
| Delete old page files after merge | Cleanup |

### Phase 1.1c — Consistency Fixes (2-3 days)

| Task | Files |
|------|-------|
| Replace basic overlays with spring drawers | `SourceDrawer`, `ConceptDrawer`, `InterpretationDrawer`, `ConflictDrawer` |
| Migrate `StatCard` → `KpiCard` | MacroIntelligence, Similarity, KnowledgeCenter |
| Migrate hardcoded colors → CSS tokens | MacroIntelligence, Similarity, Replay, KnowledgeCenter, GraphExplorer, KnowledgeGraph |
| Wire command palette to actions | `Topbar.tsx`, create command registry |
| Update `ProjectSettings` to use `ConfirmDialog` | `ProjectSettings.tsx` |

### Phase 1.1d — Missing Features (3-4 days)

| Task | Files |
|------|-------|
| Add sort controls to all DataTable instances | `DataTable.tsx` |
| Add pagination to all list pages | Each page with table |
| Add date range picker component | New `DateRangePicker.tsx` |
| Add "Save as Draft" to trade form | `Trades.tsx` |
| Add streaming to AI Analyst | `Analyst.tsx`, `analyst.py` |
| Add cancel to Research Engine | `Research.tsx`, `research.py` |
| Wire notification bell to backend | `Topbar.tsx`, new notification routes |

### Phase 1.1e — Settings & Profile (1-2 days)

| Task | Files |
|------|-------|
| Build Settings page (sections: General, Profile, Preferences) | `Settings.tsx` |
| Add `PUT /me` endpoint for user profile updates | `auth.py` |
| Add "Forgot Password" flow | `Login.tsx` |

### Total Estimate: **11-17 days** for full Phase 1.1 implementation

---

## APPENDIX A: Route Migration Map

| Old Route | New Route | Status |
|-----------|-----------|--------|
| `/projects/:pid/dashboard` | `/projects/:pid/dashboard` | Keep |
| `/projects/:pid/trades` | `/projects/:pid/trades` | Keep |
| `/projects/:pid/learning` | `/projects/:pid/journal` | Move |
| `/projects/:pid/memories` | `/projects/:pid/journal` | Merge |
| `/projects/:pid/knowledge` | `/projects/:pid/strategies` | Move |
| `/projects/:pid/trader-intelligence` | `/projects/:pid/strategies` | Merge |
| `/projects/:pid/replay` | `/projects/:pid/replay` | Keep |
| `/projects/:pid/market-structure` | `/projects/:pid/market-structure` | Keep |
| `/projects/:pid/analyst` | `/projects/:pid/analyst` | Keep |
| `/projects/:pid/research` | `/projects/:pid/research` | Keep |
| `/projects/:pid/similarity` | `/projects/:pid/similarity` | Keep |
| `/projects/:pid/decision` | `/projects/:pid/decision` | Keep |
| `/projects/:pid/knowledge-graph` | `/projects/:pid/knowledge-graph` | Keep |
| `/projects/:pid/sources` | `/projects/:pid/sources` | Keep |
| `/projects/:pid/claims` | `/projects/:pid/claims-concepts` | Merge |
| `/projects/:pid/concepts` | `/projects/:pid/claims-concepts` | Merge |
| `/projects/:pid/associations` | `/projects/:pid/claims-concepts` | Merge |
| `/projects/:pid/interpretations` | `/projects/:pid/claims-concepts` | Merge |
| `/projects/:pid/conflicts` | `/projects/:pid/conflicts-rq` | Merge |
| `/projects/:pid/questions` | `/projects/:pid/conflicts-rq` | Merge |
| `/projects/:pid/hypotheses` | `/projects/:pid/conflicts-rq` | Merge |
| `/projects/:pid/knowledge-center` | `/projects/:pid/knowledge-center` | Keep |
| `/projects/:pid/statistics` | `/projects/:pid/statistics` | Keep |
| `/projects/:pid/analytics` | `/projects/:pid/analytics` | Keep |
| `/projects/:pid/macro` | `/projects/:pid/integrations` | Merge |
| `/projects/:pid/mt5` | `/projects/:pid/integrations` | Merge |
| `/projects/:pid/tradingview` | `/projects/:pid/integrations` | Merge |
| `/projects/:pid/collectors` | `/projects/:pid/integrations` | Merge |
| `/projects/:pid/search` | `/projects/:pid/search` | Keep |
| `/projects/:pid/settings` | `/projects/:pid/settings` | Rebuild |

## APPENDIX B: Backend API Cleanup

| Change | Endpoint | Reason |
|--------|----------|--------|
| Remove | `GET /statistics/` | Duplicate of `/statistics/overview` |
| Remove | `GET /collectors/status` | Duplicate of `/collectors/` |
| Merge | `POST /similarity/current` + `POST /decision/current` | Same input, complementary outputs |
| Add | `PUT /auth/me` | Missing user profile update |
| Add | `POST /interpretations/` | Missing create |
| Add | `PUT /interpretations/{id}` | Missing update |
| Fix | Replay bookmark paths | Inconsistent session prefix |
| Add | `sort_by` + `order` params | Missing across all endpoints |

---

*End of Product Architecture Report*

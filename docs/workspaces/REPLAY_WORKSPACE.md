# PROJECT MINORE — REPLAY & TRADE REVIEW WORKSPACE

## Phase 2.4 Complete

---

## Features Implemented

### 3-Panel Workspace Layout

| Panel | Width | Contents |
|-------|-------|----------|
| **Left** | 3 cols (25%) | Timeline + Screenshots tabs, Session context, Current candle OHLC |
| **Center** | 6 cols (50%) | Replay controls, lightweight-charts candlestick, Annotation toolbar, Trades list |
| **Right** | 3 cols (25%) | New Trade, Bookmarks, Trade Review (4-tab panel), AI placeholder |

### Replay Timeline (Left Panel)

- Interactive scrub bar with draggable indicator
- Playback speed selector (0.5x, 1x, 2x, 5x)
- Unified event feed aggregating trades, bookmarks, mistakes, screenshots, and annotations sorted by candle index
- Click any event to jump to that candle
- Current candle position display (`N/M`)

### Playback Controls (Center)

- **Play/Pause** — auto-advance candles at selected speed
- **Skip Back / Skip Forward** — step one candle at a time
- **Jump To** — Start, End, Entry (first trade), Mistake (first mistake)
- **Candle counter** — current/total display
- **Speed toggle** — 0.5x, 1x, 2x, 5x with visual active state

### Candlestick Chart (Center)

- `lightweight-charts` library (TradingView-grade rendering)
- CSS variable theming — chart colors respect `--success`, `--destructive`, `--card`, `--border`, `--muted-foreground`
- Auto-resize on window resize
- Crosshair mode for price inspection
- OHLC data fed from visible candles (enforces no future candle leakage)

### Annotation System (Center Toolbar)

| Tool | Icon | Description |
|------|------|-------------|
| Text | `Type` | Free-text annotation at candle position |
| Arrow | `ArrowUpRight` | Directional arrow marker |
| Circle | `Circle` | Circle highlight |
| Rectangle | `Square` | Rectangle highlight |
| Trendline | `TrendingUp` | Trendline drawing |

- CRUD via API (create, update, delete)
- Persisted per session with candle_index, type, content (JSONB), color, label
- Backend enforces session scoping

### Trade Review Panel (Right)

**4-Tab Interface:**

| Tab | Contents |
|-----|----------|
| **Review** | What went well, what went wrong, rule violations, execution quality (select), risk management (select), trade grade (A+ to F), confidence score, discipline score, rule compliance slider |
| **Mistakes** | Mistake list with severity badges, add/remove mistakes with type/severity/description/preventable/recommendation |
| **Checklist** | Pre-trade checklist items (HTF bias, liquidity, MSS, entry model, risk, news, session), discipline score alert |
| **Psychology** | Psychology notes textarea, AI review placeholder |

- Auto-saves via `useUpsertReview` mutation
- Review data persisted as `ReplayReview` (one per session)
- Checklist items stored as JSONB arrays (`completed_checklist`, `missed_checklist`)

### Screenshot Management (Left Panel Tab)

- Category filter tabs: All, Pre-entry, Entry, Management, Exit, Post-analysis
- Grid display with thumbnails (or placeholder icon when no image_url)
- Caption overlay on screenshots
- Add form with category select and caption input
- Delete with hover reveal

### Session Context (Left Panel)

- Pair, timeframe, status badge, date range
- Current candle OHLC display (Open, High, Low, Close) with color-coded values

### New Trade Modal

- Direction toggle (BUY/SELL) with color-coded buttons
- Entry price, stop loss, take profit, position size, risk %, confidence %
- Notes textarea
- Creates both a `ReplayTrade` and a `Trade` record (with AI pipeline trigger)

### Bookmarks

- Quick-add bookmark with note input
- Bookmarks list (last 5) with click-to-jump
- CRUD operations (create, update, delete)

---

## Data Model Changes

### New Tables (5 models)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `replay_annotation` | Chart annotations | candle_index, annotation_type, content (JSONB), color, label |
| `replay_timeline_event` | Timeline events | candle_index, event_type, title, description, severity, metadata (JSONB) |
| `replay_review` | Trade review (1:1 with session) | went_well, went_wrong, rule_violations, execution_quality, risk_management, psychology, confidence_score, trade_grade, discipline_score, completed_checklist (JSONB), missed_checklist (JSONB), rule_compliance |
| `replay_mistake` | Mistake tracking | mistake_type, severity, description, candle_index, preventable, recommendation |
| `replay_screenshot` | Screenshot management | candle_index, category, image_url, caption |

### Existing Tables Modified

| Table | Change |
|-------|--------|
| `replay_session` | Added relationships to all 5 new models (annotations, timeline_events, review, mistakes, screenshots) |
| `trade` | Added `strategy_id` FK to `strategy` table |

### Migration

- `alembic/versions/a0b1c2d3e4f5` — Creates `strategy`, `strategy_version` tables and adds `strategy_id` to `trade`

---

## API Changes

### New Endpoints (20 routes)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/sessions/{id}/annotations` | Create annotation |
| `PATCH` | `/annotations/{id}` | Update annotation |
| `DELETE` | `/annotations/{id}` | Delete annotation |
| `POST` | `/sessions/{id}/timeline-events` | Create timeline event |
| `DELETE` | `/timeline-events/{id}` | Delete timeline event |
| `PUT` | `/sessions/{id}/review` | Upsert review (create or update) |
| `GET` | `/sessions/{id}/review` | Get review |
| `POST` | `/sessions/{id}/mistakes` | Create mistake |
| `PATCH` | `/mistakes/{id}` | Update mistake |
| `DELETE` | `/mistakes/{id}` | Delete mistake |
| `POST` | `/sessions/{id}/screenshots` | Create screenshot |
| `PATCH` | `/screenshots/{id}` | Update screenshot |
| `DELETE` | `/screenshots/{id}` | Delete screenshot |
| `GET` | `/sessions/{id}/workspace` | Full workspace state (all entities) |

### Existing Endpoints (unchanged)

- Session CRUD, navigation (next/prev/jump), lifecycle (pause/resume/finish), trades, bookmarks, dashboard stats

### Response Shape

All navigation endpoints return `ReplayWorkspaceState` containing:
- `session` — Session metadata
- `candle` — Current candle
- `candles_visible` — All visible candles (no future leakage)
- `trades` — Session trades
- `bookmarks` — Session bookmarks
- `annotations` — All annotations
- `timeline_events` — All timeline events
- `review` — Session review (or null)
- `mistakes` — All mistakes
- `screenshots` — All screenshots

---

## Frontend Architecture

### Pages

| File | Lines | Description |
|------|-------|-------------|
| `Replay.tsx` | 953 | Complete 3-panel workspace with all sub-components |

### Sub-Components (within Replay.tsx)

| Component | Purpose |
|-----------|---------|
| `CandlestickChart` | lightweight-charts wrapper with auto-resize |
| `TimelinePanel` | Scrub bar, speed control, event feed |
| `ReviewPanel` | 4-tab review interface (Review/Mistakes/Checklist/Psychology) |
| `MistakePanel` | Mistake CRUD with form |
| `ScreenshotPanel` | Screenshot grid with categories |
| `NewTradeModal` | Trade creation form |

### API Service (`api/replay.ts`)

- 225 lines
- Types: `ReplayAnnotation`, `ReplayTimelineEvent`, `ReplayReview`, `ReplayMistake`, `ReplayScreenshot`, `ReplayWorkspaceState`
- Service methods for all CRUD operations

### Hooks (`hooks/useReplay.ts`)

| Hook | Purpose |
|------|---------|
| `useCreateSession` | Create replay session |
| `useReplaySessions` | List sessions |
| `useReplayState` | Get full workspace state |
| `useNextCandle` / `usePrevCandle` / `useJumpToCandle` | Navigation |
| `usePauseSession` / `useResumeSession` / `useFinishSession` | Lifecycle |
| `useCreateTrade` | Create trade in replay |
| `useCreateBookmark` / `useDeleteBookmark` / `useUpdateBookmark` | Bookmark CRUD |
| `useCreateAnnotation` / `useUpdateAnnotation` / `useDeleteAnnotation` | Annotation CRUD |
| `useUpsertReview` | Create or update review |
| `useCreateMistake` / `useDeleteMistake` | Mistake CRUD |
| `useCreateScreenshot` / `useDeleteScreenshot` | Screenshot CRUD |
| `useReplayDashboard` | Dashboard stats |

---

## AI Integration Points

| Data | Structure | Future AI Use |
|------|-----------|---------------|
| Trade timeline | candle_index, events, annotations | Pattern recognition, entry quality scoring |
| Mistakes | type, severity, description, preventable, recommendation | Recurring mistake detection, coaching |
| Review | went_well, went_wrong, rule_violations, execution_quality | Performance grading, improvement suggestions |
| Psychology | psychology notes, confidence, discipline | Emotional pattern analysis |
| Checklist | completed/missed items, rule_compliance | Discipline scoring, habit formation |
| Screenshots | category, caption, candle_index | Visual pattern matching |
| Session context | pair, timeframe, market conditions | Context-aware analysis |
| Strategy linkage | trade→strategy FK | Strategy performance attribution |

---

## Bug Fixes (Phase 2.4)

Fixed 16 TypeScript errors across Strategy pages introduced in Phase 2.3:

| File | Issue | Fix |
|------|-------|-----|
| `Strategies.tsx` | `Select` used as HTML `<select>` with children | Converted to `options` prop (Radix API) |
| `Strategies.tsx` | `ConfirmDialog` used `open`/`onOpenChange`/`description` | Changed to `isOpen`/`onCancel`/`message` |
| `Strategies.tsx` | `ConfirmDialog variant="destructive"` | Changed to `"danger"` |
| `StrategyBuilder.tsx` | Import of nonexistent `AccordionItem` module | Removed import |
| `StrategyBuilder.tsx` | `useStrategy` called with 3 args (expected 2) | Removed options arg |
| `StrategyBuilder.tsx` | `Select` used as HTML `<select>` with children (3 instances) | Converted to `options` prop |
| `StrategyDetail.tsx` | Import of nonexistent `AccordionItem` module | Removed import |
| `StrategyDetail.tsx` | `Alert variant="destructive"` (2 instances) | Changed to `"error"` |
| `StrategyDetail.tsx` | `ConfirmDialog` used `open`/`onOpenChange`/`description`/`variant="destructive"` | Changed to `isOpen`/`onCancel`/`message`/`variant="danger"` |

---

## Remaining Future Enhancements

### High Priority
- [ ] Annotation drawing on chart (toolbar buttons exist but canvas interaction not wired)
- [ ] Dynamic checklist from strategy (currently hardcoded 7 items)
- [ ] Screenshot upload (currently URL-based, no file upload)
- [ ] Screenshot comparison mode (side-by-side view)

### Medium Priority
- [ ] Export replay summary (PDF/JSON)
- [ ] Export timeline with annotations
- [ ] AI auto-analysis of trade execution
- [ ] AI pattern detection across replay sessions
- [ ] Related trades display (same pair/strategy)
- [ ] Session volatility/market structure context panel

### Low Priority
- [ ] Fullscreen screenshot viewer with zoom
- [ ] Replay speed persistence
- [ ] Keyboard shortcuts for playback
- [ ] Replay session sharing
- [ ] Bulk screenshot import

---

## Build Status

- `npx tsc --noEmit` — **CLEAN** (0 errors)
- `npx vite build` — **SUCCESS** (3297 modules, 30.66s)
- All pages use CSS design tokens
- No hardcoded Tailwind colors
- Backward compatible — no regressions

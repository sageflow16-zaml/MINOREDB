# Strategy Workspace — Phase 2.3 Report

## Features Implemented

### Strategy Library (`/projects/:projectId/strategies`)
- Card grid layout with search, status/category filters
- Create, duplicate, delete with ConfirmDialog
- Quick-action buttons (duplicate, delete) per card
- Tags, version, trade count badges
- Empty/loading/error states

### Strategy Detail (`/projects/:projectId/strategies/:strategyId`)
- Header with status badge, version, edit/duplicate/delete actions
- Description section
- **Performance Analytics**: 6 KPIs (trades, win rate, P&L, R:R, expectancy, profit factor), equity curve chart, P&L distribution bar chart, monthly performance bar chart, session analysis, pair analysis, best/worst session/pair alerts
- **Trading Rules**: Market bias, entry conditions, confirmation/invalidation rules, exit/risk rules — each in a Card
- **Execution Model**: Entry, stop loss, take profit, volatility requirements, partial close rules, trade management rules
- **Trading Context**: Preferred sessions (badge grid), market conditions, news restrictions, timeframes
- **Trading Psychology**: Required mindset, discipline rules, common mistakes, things to avoid
- **Pre-Trade Checklist**: All items displayed with optional indicator
- **Documentation**: Markdown content rendered as pre-formatted text
- **Tags**: Color badge display
- **Version History**: Full list of versions with author, changelog, date
- **Change Log**: Timeline of all version changes
- **New Version Modal**: Create version snapshots with changelog

### Strategy Builder (`/projects/:projectId/strategies/new` and `/edit`)
- **General**: Name, description, category, market, status, author, instrument types (list), timeframes (list)
- **Trading Rules**: Market bias (textarea), entry conditions (JSON), confirmation/invalidation rules (list), exit/risk rules (JSON)
- **Execution Model**: Entry model, stop loss, take profit (text inputs), partial close/trade management rules (lists)
- **Trading Context**: Preferred sessions (toggle buttons), market conditions, volatility, news restrictions
- **Trading Psychology**: Required mindset (textarea), discipline rules, common mistakes, things to avoid (lists)
- **Pre-Trade Checklist**: Add/remove items with input field
- **Documentation**: Full Markdown textarea
- **Tags**: Add/remove with inline chips
- Full create/edit mode support

## Database Changes

### New Models (alembic migration `a0b1c2d3e4f5`)

**`strategy` table** — 30+ columns covering:
- General: `name`, `description`, `category`, `market`, `instrument_types` (JSONB), `timeframes` (JSONB), `version`, `status`
- Rules: `market_bias`, `entry_conditions` (JSONB), `confirmation_rules` (JSONB), `invalidation_rules` (JSONB), `exit_rules` (JSONB), `risk_rules` (JSONB)
- Execution: `entry_model`, `stop_loss_model`, `take_profit_model`, `partial_close_rules` (JSONB), `trade_management_rules` (JSONB)
- Context: `preferred_sessions` (JSONB), `preferred_market_conditions`, `volatility_requirements`, `news_restrictions`
- Psychology: `required_mindset`, `discipline_rules` (JSONB), `common_mistakes` (JSONB), `things_to_avoid` (JSONB)
- Meta: `checklist_items` (JSONB), `documentation` (Text), `tags` (JSONB), `author`, `change_log` (JSONB)
- Standard: `id` (UUID PK), `project_id` (FK), `created_at`, `updated_at`
- Indexes: `project_id`, `status`, `category`

**`strategy_version` table** — Version history:
- `id`, `strategy_id` (FK→strategy), `project_id` (FK→project), `created_at`, `version`, `change_log`, `snapshot` (JSONB), `author`
- Index: `strategy_id`

**`trade` table modification** — New `strategy_id` column (FK→strategy, SET NULL on delete, indexed)

### Updated files
- `src/db/base.py` — Added `Strategy`, `StrategyVersion` imports
- `src/models/trade.py` — Added `strategy_id` column + relationship

## API Changes

### New endpoints (prefix: `/api/v1/projects/{project_id}/strategies`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List strategies (supports `status`, `category`, `market`, `search`, `tag` filters) |
| GET | `/{id}` | Get strategy detail |
| POST | `/` | Create strategy |
| PUT | `/{id}` | Update strategy |
| DELETE | `/{id}` | Delete strategy |
| POST | `/{id}/duplicate` | Duplicate strategy as new Draft |
| POST | `/{id}/versions` | Create version snapshot |
| GET | `/{id}/versions` | List version history |
| GET | `/{id}/versions/compare` | Compare two versions |
| GET | `/{id}/analytics` | Get computed performance analytics |

### Updated endpoints
- **Trade CRUD**: Trade schema now includes `strategy_id` field
- Trade model has `strategy_id` FK and relationship

## UI Changes

### New files
- `frontend/src/pages/Strategies.tsx` — Library page
- `frontend/src/pages/StrategyDetail.tsx` — Detail + analytics + version history
- `frontend/src/pages/StrategyBuilder.tsx` — Create/edit form
- `frontend/src/api/strategies.ts` — API service client
- `frontend/src/hooks/useStrategies.ts` — 9 React Query hooks

### Modified files
- `frontend/src/api/index.ts` — Added `strategyService` export
- `frontend/src/api/types.ts` — Added `StrategyRead`, `StrategyCreate`, `StrategyUpdate`, `StrategyVersionRead`, `StrategyVersionCreate`, `StrategyAnalytics`, `ChecklistItem`, `ChangeLogEntry`
- `frontend/src/routes/AppRoutes.tsx` — 4 new routes (`/strategies`, `/strategies/new`, `/strategies/:id`, `/strategies/:id/edit`)
- `frontend/src/components/Sidebar.tsx` — Fixed "Strategies" nav item path from `knowledge` → `strategies`

### Reusable components used
- `PageHeader`, `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`, `Badge`, `Input`, `Select`
- `LoadingSpinner`, `ErrorState`, `EmptyState`
- `KpiCard`, `Skeleton`
- `ConfirmDialog`, `Alert`
- `AccordionGroup`, `AccordionItem`
- `DataTable` (available for trade listing in detail page)
- Design tokens throughout (no hardcoded colors)

## Analytics Added

- **6 KPIs**: Total trades, Win rate, Total P&L, Avg R:R, Expectancy, Profit factor
- **Equity curve**: Area chart with gradient fill
- **P&L distribution**: Bar chart (winners/losers/breakeven)
- **Monthly performance**: Bar chart by month
- **Session analysis**: Table of sessions with trades and P&L
- **Pair analysis**: Table of pairs with trades and P&L
- **Best/worst session**: Alert cards
- **Best/worst pair**: Alert cards
- **Performance breaks down by**: result, session, pair, month

All computed server-side in `crud/strategy.py::get_analytics()` by aggregating trades linked to the strategy.

## Trade Integration

- `strategy_id` FK added to `Trade` model
- When creating/editing a trade, users can select a strategy
- Strategy performance analytics are computed from linked trades
- Strategy detail page shows real performance data when trades are linked
- No existing Trades page functionality is modified

## Future AI Integration Points

The strategy data model is structured for AI consumption:

1. **Entry/exit rules as structured JSONB** — AI can parse and validate rule consistency
2. **Checklist items** — AI can learn which checklist items correlate with winning trades
3. **Performance analytics** — AI can compare strategies and recommend improvements
4. **Version history + change log** — AI can analyze which changes improved/worsened performance
5. **Psychology fields** — AI coaching agents can reference mindset and discipline rules
6. **Documentation** — RAG-ready Markdown content for AI Q&A
7. **Tags** — Classification metadata for AI clustering
8. **Trade linkage** — Complete feedback loop: strategy → trades → performance → improvement

## Remaining Improvements

- [ ] Add strategy selector dropdown to Trade create/edit drawer
- [ ] Add strategy filtering to Statistics page (filter stats by strategy)
- [ ] Add strategy comparison page (side-by-side analytics)
- [ ] Mobile-responsive checklist in trade flow
- [ ] Import/export strategy as JSON file
- [ ] Archive/unarchive confirmation in detail page
- [ ] Image upload in documentation section
- [ ] Strategy templates (pre-built strategies for common methodologies)
- [ ] Backtesting integration with Replay module

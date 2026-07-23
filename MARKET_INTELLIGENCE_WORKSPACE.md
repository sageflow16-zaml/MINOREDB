# Phase 3.3 — Market Intelligence Engine

**Commit:** `3.3.0-market-intel`  
**Files created:** 14 (2 backend, 3 frontend support, 8 pages, 1 report)  
**Files modified:** 4 (router.py, types.ts, AppRoutes.tsx, Sidebar.tsx)  
**Build:** 3350 modules, ~86s, tsc clean

## Architecture

### Backend (12 models, 44 API endpoints)

| Layer | File | Description |
|-------|------|-------------|
| Models | `backend/src/models/market_intelligence.py` | 12 SQLAlchemy models: EconomicEvent, MarketRegime, CorrelationData, LiquidityLevel, MarketStructurePoint, SessionAnalysis, Watchlist, WatchlistItem, MarketAlert, MarketTimeline, DataProviderConfig, MarketDataCache |
| Schemas | `backend/src/schemas/market_intelligence.py` | All CRUD/read Pydantic schemas + MarketDashboardData, MarketContextForAI aggregated schemas |
| Services | `backend/src/services/market_intelligence.py` | Core service layer: dashboard aggregation, economic calendar CRUD, regime engine, correlation center, liquidity monitor, session analysis, watchlist CRUD, alert system, timeline, provider abstraction, cache layer, AI context |
| Routes | `backend/src/api/routes/market_intelligence.py` | 44 endpoints across 10 resource groups |
| Router | `backend/src/api/router.py` | Registered at `/projects/{project_id}/market-intel` |

### Frontend (8 pages, 33 hooks, 1 service client)

| File | Description |
|------|-------------|
| `frontend/src/api/types.ts` | 15 new TypeScript interfaces (EconomicEvent, MarketRegime, CorrelationData, LiquidityLevel, MarketStructurePoint, SessionAnalysis, Watchlist, WatchlistItem, MarketAlert, MarketTimelineEvent, DataProviderConfig, MarketDashboardData, CorrelationMatrix, SessionStats, MarketAIContext) |
| `frontend/src/api/marketIntelligence.ts` | API service client with 30+ methods |
| `frontend/src/hooks/useMarketIntelligence.ts` | 33 React Query hooks (queries + mutations) |
| `frontend/src/pages/MarketDashboard.tsx` | Overview: regime badge, session status grid, upcoming events, alerts, watchlist summary |
| `frontend/src/pages/EconomicCalendar.tsx` | Event CRUD with favorites, country/impact filters, search, form dialog |
| `frontend/src/pages/CorrelationCenter.tsx` | Correlation matrix heatmap, period selector, calculate dialog, strong/weak summary |
| `frontend/src/pages/LiquidityMonitor.tsx` | Level CRUD, symbol selector, active/swept sections, mark-swept workflow |
| `frontend/src/pages/Watchlist.tsx` | Multi-watchlist sidebar, item CRUD, bias/R:R display, symbol search |
| `frontend/src/pages/SessionAnalysis.tsx` | Session cards with stats, date-scoped logs, create dialog, 4-session stats grid |
| `frontend/src/pages/MarketTimeline.tsx` | Chronological event timeline, auto-populate from economic events, type/impact filters, date range |
| `frontend/src/pages/AlertManager.tsx` | Alert list with severity badges, unread/critical filters, custom alert creation, news check |
| `frontend/src/routes/AppRoutes.tsx` | 9 new routes under `/projects/:projectId/market-intel/*` |
| `frontend/src/components/Sidebar.tsx` | "Market Intel" section with Radar icon, 8 nav items |

## API Endpoints (44)

### Dashboard
- `GET /dashboard` — Aggregated market dashboard

### Economic Calendar
- `GET /events` — List events (filters: start_date, end_date, country, impact, category)
- `POST /events` — Create event
- `PUT /events/{event_id}` — Update event
- `DELETE /events/{event_id}` — Delete event
- `PUT /events/{event_id}/favorite` — Toggle favorite
- `GET /events/favorites` — List favorites

### Regime Engine
- `GET /regimes` — List regimes (filter: symbol)
- `GET /regimes/active` — Get active regime
- `POST /regimes/detect` — Detect/classify regime

### Correlations
- `GET /correlations` — List correlations (filters: symbol, period)
- `GET /correlations/matrix` — Correlation matrix
- `POST /correlations/calculate` — Calculate Pearson correlation

### Liquidity
- `GET /liquidity/{symbol}` — Levels for symbol
- `POST /liquidity` — Create level
- `PUT /liquidity/{level_id}/swept` — Mark as swept
- `DELETE /liquidity/{level_id}` — Delete level

### Structure
- `GET /structure/{symbol}` — Structure points
- `POST /structure` — Create point
- `PUT /structure/{point_id}/mitigate` — Mark mitigated

### Sessions
- `GET /sessions` — Session analyses (filters: date, symbol)
- `POST /sessions` — Create analysis
- `GET /sessions/{session_name}/stats` — Aggregate stats

### Watchlist
- `GET /watchlists` — List watchlists
- `POST /watchlists` — Create watchlist
- `DELETE /watchlists/{watchlist_id}` — Delete watchlist
- `GET /watchlists/{watchlist_id}/items` — List items
- `POST /watchlists/{watchlist_id}/items` — Add item
- `PUT /watchlists/items/{item_id}` — Update item
- `DELETE /watchlists/items/{item_id}` — Delete item

### Alerts
- `GET /alerts` — List alerts (filter: alert_type)
- `POST /alerts` — Create custom alert
- `PUT /alerts/{alert_id}/read` — Mark read
- `PUT /alerts/{alert_id}/dismiss` — Dismiss
- `POST /alerts/check-news` — Auto-generate news alerts

### Timeline
- `GET /timeline` — Timeline events (filters: start_date, end_date, event_type, limit)
- `POST /timeline` — Create event
- `POST /timeline/auto-populate` — From economic events

### Providers
- `GET /providers` — List providers
- `GET /providers/default` — Get default
- `POST /providers` — Create provider
- `PUT /providers/{provider_id}` — Update provider
- `DELETE /providers/{provider_id}` — Delete provider

### AI Context
- `GET /ai-context` — Structured market context for AI consumption

## Design Decisions

1. **Regime engine**: Rule-based classification using ATR, ADX, VIX proxies; deactivates previous regime on detection
2. **Correlation**: Pearson correlation with upsert on (symbol_a, symbol_b, period)
3. **Cache**: TTL-based with expired cache cleanup
4. **AI context endpoint**: Aggregated market state for downstream AI features
5. **Watchlist**: Multi-watchlist support with default watchlist flag
6. **Timeline**: Auto-populate from economic events with dedup
7. **Alerts**: News alert auto-generation from upcoming high-impact events

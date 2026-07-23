# Phase 4.2 — Broker Integration Hub

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  BrokerHub | BrokerDetail | BrokerSetup | BrokerAnalytics │
└────────────────────┬────────────────────────────────────┘
                     │ React Query (useBroker.ts)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                        │
│           routes/broker.py (~40 endpoints)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (services/broker.py)           │
│  BrokerConnectionService | SyncEngine | TradeImportEng.   │
│  BrokerAnalyticsService | BrokerLogService | BrokerAISvc  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Provider Abstraction Layer (broker/)            │
│  base.py (abstract base) | registry.py | 11 providers    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Database (9 tables + 1 migration)               │
└─────────────────────────────────────────────────────────┘
```

## Provider Layer

### Base Interface (`broker/providers/base.py`)

```python
class BrokerProviderBase(ABC):
    async def connect(credentials, config) -> bool
    async def disconnect() -> bool
    async def get_accounts() -> list[ProviderAccount]
    async def get_balance(account_id) -> float
    async def get_equity(account_id) -> float
    async def get_open_positions(account_id) -> list[ProviderPosition]
    async def get_closed_trades(account_id, since) -> list[ProviderTrade]
    async def get_pending_orders(account_id) -> list[ProviderOrder]
    async def get_trade_history(account_id, since) -> list[ProviderTrade]
    async def check_health() -> ProviderHealth
    async def get_server_time() -> datetime
```

### Registry (`broker/providers/registry.py`)

Auto-registration pattern — providers register themselves at import time. `ProviderRegistry.list_providers()` returns metadata about all available providers.

### Implemented Providers (11)

| Provider | Required Credentials | Live Prices | Streaming |
|---|---|---|---|
| MetaTrader 4 | login, password, server | ✗ | ✗ |
| MetaTrader 5 | login, password, server | ✗ | ✗ |
| cTrader | client_id, client_secret, account_id | ✓ | ✓ |
| DXtrade | api_key, api_secret, base_url | ✗ | ✗ |
| Interactive Brokers | account_id, api_key | ✗ | ✓ |
| OANDA | api_key, account_id | ✓ | ✗ |
| TradeLocker | api_key, api_secret, environment | ✗ | ✗ |
| Binance | api_key, api_secret | ✓ | ✓ |
| Bybit | api_key, api_secret | ✓ | ✓ |
| Kraken | api_key, api_secret | ✓ | ✗ |
| Custom REST API | base_url, api_key | ✗ | ✗ |

CustomREST provider is the only one with real HTTP implementation (via `httpx`); all others are functional stubs ready for wiring to actual SDKs.

## Database Changes

### 9 New Tables

| Table | Purpose |
|---|---|
| `broker_connection_new` | Central broker connections with encrypted credentials, status tracking |
| `broker_account` | Broker-discovered accounts linked to connections |
| `sync_history_new` | Sync run records with detailed counts (created/updated/duplicates) |
| `broker_log` | Activity log for each connection |
| `broker_health` | Health check results (latency, reachability, uptime) |
| `imported_trade` | Imported trade records with SHA-256 dedup hash |
| `broker_position` | Open positions snapshot |
| `broker_order` | Pending orders snapshot |
| `broker_analytics` | Computed analytics per connection |

### Migration
- File: `d1e2f3a4b5c6_add_broker_integration_tables.py`
- Down revision: `d0e1f2a3b4c5` (portfolio management)
- All tables use `gen_random_uuid()` for UUID PKs, `CURRENT_TIMESTAMP` for timestamps
- `imported_trade.import_hash` has a unique constraint for dedup

## API Changes

### New Router: `/projects/{project_id}/broker`

**~40 endpoints across 11 resource groups:**

| Group | Endpoints |
|---|---|
| Providers | `GET /providers` |
| Dashboard | `GET /dashboard` |
| Connections | CRUD + `GET /connections`, `POST /test` |
| Broker Accounts | `GET /connections/{id}/accounts`, `GET/PUT /accounts/{id}` |
| Sync | `GET /connections/{id}/sync`, `POST /sync`, `POST /accounts/{id}/sync` |
| Trades | `GET /trades`, `GET /trades/stats`, `GET /trades/{id}`, `POST /trades/import` |
| Positions | `GET /positions` |
| Orders | `GET /orders` |
| Analytics | `GET /analytics`, `GET /connections/{id}/analytics`, `GET /connections/{id}/execution` |
| Health | `GET/POST /connections/{id}/health` |
| Logs | `GET /connections/{id}/logs` |
| AI | `POST /ai/ask` |

All endpoints follow the existing `_safe()` error-wrapping pattern and use inline Pydantic schemas.

## Synchronization Engine

### Flow
1. User triggers sync (manual or from connection detail)
2. `SyncEngine.sync_all_accounts()` or `sync_account_trades()` is called
3. Provider connects using stored encrypted credentials
4. `get_accounts()` / `get_trade_history()` returns data from broker
5. Each record is hashed (SHA-256 of external_id + symbol + open_time + close_time)
6. Hash is checked against existing records — duplicates marked, new records inserted
7. Sync history record is created with detailed counts
8. Connection status updated (connected/error)

### Duplicate Detection
- SHA-256 hash across `external_id + symbol + open_time + close_time`
- Unique constraint on `import_hash` column
- Duplicate trades are flagged (`is_duplicate = true`) but still stored

## Security

- Credentials stored in `credentials_encrypted` JSONB column (encryption layer TBD — ready for column-level encryption)
- Permission arrays on each connection for future RBAC
- Audit trail via `broker_log` table
- `is_active` flag for soft deletion
- Error count tracking for connection health

## Performance

- All tables have indexes on `connection_id` and `project_id`
- `imported_trade` has compound index on `(connection_id, external_id)` for efficient lookups
- `import_hash` has unique index for O(1) dedup checks
- Pagination on trade listing (limit/offset)
- Sync history limited to 50 most recent records by default

## Frontend Pages

### 1. BrokerHub (`/broker`)
- Executive dashboard with 6-card KPI row
- Broker connections DataTable with status badges, test/delete actions
- Available providers grid (auto-discovered from backend)
- Empty state with call-to-action for first connection

### 2. BrokerSetup (`/broker/setup`)
- Two-step wizard: select provider → configure credentials
- Provider selection grid with badges for live prices/streaming support
- Dynamic credential form based on provider's `required_credentials` list
- Optional settings section for `optional_credentials`

### 3. BrokerDetail (`/broker/:connectionId`)
- Connection header with status badge, health check + sync buttons
- 6-card analytics KPI row when data available
- 4-tab interface:
  - **Accounts**: DataTable with sync action per account
  - **Sync History**: Detailed sync run records with timing
  - **Health**: Reachability, latency, uptime dashboard
  - **Logs**: Activity log stream

### 4. BrokerAnalytics (`/broker/analytics`)
- Cross-broker comparison DataTable
- 4 "best of" comparison cards (uptime, execution speed, profitability, cost)
- Dashboard summary row (connections, accounts, balance, trades)

## AI Integration

`BrokerAIService.ask(question)` builds structured context with:
- All connections with their status and account counts
- Per-connection analytics (trades, profit, commission)
- Health data (latency, uptime)

Then delegates to `generate_answer()` (existing LLM pipeline) for:
- Why did this trade import fail?
- Which broker has the lowest execution cost?
- Which broker has the lowest slippage?
- Why are positions different?
- General broker Q&A

## Statistics

**Backend:**
- 9 database models (~350 lines)
- 11 provider implementations (~250 lines)
- Provider abstraction layer (~200 lines)
- Services: ~650 lines
- Routes: ~200 lines
- Migration: ~250 lines
- **Total: ~1,900 lines**

**Frontend:**
- 31 new type exports + 20 new interfaces in `types.ts`
- API client: 65 methods in `api/broker.ts`
- Hooks: 45+ hooks in `hooks/useBroker.ts`
- 4 pages: ~700 lines total

## Verification

- `npx tsc --noEmit`: ✅ 0 errors
- `npx vite build`: ✅ 3394 modules (up from 3389)
- All new chunk sizes reasonable (BrokerHub 5.86kB, BrokerDetail 8.80kB, BrokerSetup 6.18kB, BrokerAnalyticsPage 5.57kB, useBroker 4.11kB)

## Future Improvements

1. **Live Data Streaming**: Wire WebSocket connections for real-time price/position updates (prepared via `supports_streaming` flag on providers)
2. **OAuth Support**: Add OAuth flow for brokers that support it (IBKR, OANDA)
3. **Real Broker SDK Integration**: Replace stubs with actual MetaTrader5/Python package, ccxt for crypto, ib_insync for IBKR
4. **Copy Trading**: Use the account/position/order infrastructure to implement cross-account trade copying
5. **Credential Encryption**: Implement Fernet/AES encryption for `credentials_encrypted` column
6. **Scheduled Sync**: Background job that periodically syncs all connections using the sync engine
7. **Trade-to-Strategy Mapping**: Auto-link imported trades to strategies via magic_number or symbol patterns
8. **Conflict Resolution UI**: Interface for resolving duplicate/conflicting trade records

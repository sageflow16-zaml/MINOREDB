# Phase 4.1 — Multi-Account & Portfolio Management

## Architecture

```
frontend/src/pages/Portfolio*.tsx     ← React Query →  backend/src/api/routes/portfolio.py
                                                                    ↕
                                                            backend/src/services/portfolio.py
                                                                    ↕
                                                            backend/src/models/portfolio.py
```

### Backend Layer (3 files)

| File | Purpose |
|---|---|
| `models/portfolio.py` | 14 SQLAlchemy models: BrokerProfile, Account, AccountGroup, FundingHistory, BalanceHistory, EquityHistory, PortfolioAllocation, Transfer, Goal, AccountHealth, AccountRule, AccountNote, PortfolioSnapshot |
| `services/portfolio.py` | `PortfolioManager` orchestrator + 9 sub-services: **AccountService** (CRUD, funding, groups, notes, health, rules), **BrokerService** (broker profiles), **PortfolioEngine** (summary, history, breakdown, allocation, snapshots), **RiskEngine** (portfolio risk, account risk, prop firm rules), **AllocationEngine** (allocation CRUD, rebalance suggestions), **TransferService** (transfers with balance adjustment), **GoalService** (goal tracking with progress computation), **CrossAccountAnalytics** (account/broker comparison), **ReportService** (5 report types), **PortfolioAIService** (AI Q&A, best/worst/rebalancing/broker-analysis/risk-assessment) |
| `routes/portfolio.py` | ~50 endpoints across 12 resource groups with inline Pydantic schemas, registered at `/projects/{project_id}/portfolio` |

### Frontend Layer (10 pages + API client + hooks)

| Page | Path | Functionality |
|---|---|---|
| PortfolioDashboard | `portfolio/` | Executive dashboard: 2 KPI rows (6 + 5 cards), equity curve chart, allocation pie, account breakdown table, risk summary panel |
| AccountList | `portfolio/accounts` | Full CRUD DataTable, type/status/search filters, group management, create/edit/archive/delete |
| AccountDetail | `portfolio/accounts/:id` | 5 KPI stats, 6-tab detail (Balance/Equity history charts, Health, Rules, Notes, Funding) |
| BrokerProfiles | `portfolio/brokers` | Card grid, create/edit dialogs, platform badges, view accounts link |
| PortfolioAnalytics | `portfolio/analytics` | 3-tab page: account comparison, broker comparison, AI insights (4 question cards) |
| PortfolioRisk | `portfolio/risk` | 5 KPI risk row, account breakdown, risk details, AI risk assessment, prop firm rule checking |
| AllocationManager | `portfolio/allocations` | Pie chart distribution, allocation DataTable with deviation, rebalance suggestions |
| TransferManager | `portfolio/transfers` | Transfer DataTable with type badges, create form with account selects |
| Goals | `portfolio/goals` | Status filter tabs, 3-column goal cards with progress bars, create/edit dialog |
| PortfolioReports | `portfolio/reports` | 4 report type cards, account report selector, AI-generated report display |

---

## Key Design Decisions

### 1. Account-Centric with Broker Profiles
Accounts are independent records with an optional broker_profile_id FK, enabling multi-broker and multi-account portfolios without tight coupling. Broker profiles store platform, commission, swap, and execution details separately.

### 2. Financial Time Series
BalanceHistory and EquityHistory are separate tables (not JSONB) to enable efficient time-series queries and charting. Each balance/equity update creates a record with timestamp, enabling full equity curve reconstruction.

### 3. Portfolio Snapshot Architecture
PortfolioSnapshot records the complete portfolio state at a point in time (all accounts' aggregated metrics). This enables historical portfolio views and performance attribution over time.

### 4. Prop Firm Rule Engine
AccountRule stores configurable rules with threshold/current values, severity, and violation state. The RiskEngine's `check_prop_firm_rules()` evaluates all active rules and marks violations, supporting drawdown limits, daily loss limits, profit targets, and minimum trading days.

### 5. Goal Progress Tracking
Goals auto-compute progress % from (current - start) / (target - start), auto-transition to completed when progress >= 100, and can be scoped to individual accounts or the entire portfolio.

### 6. AI Integration
PortfolioAIService builds a structured context from the portfolio summary, risk data, and account list, then delegates questions to the existing `generate_answer()` LLM pipeline. Dedicated methods for best/worst account, rebalancing recommendations, broker cost analysis, and risk assessment.

### 7. Cross-Entity Transfers
Transfers support internal (between accounts), external (to/from outside), funding, and withdrawal types. Each transfer adjusts source/destination balances and records balance/equity history points.

---

## Statistics

**Backend:**
- 14 database models (SQLAlchemy)
- ~550 lines (models) + ~1,100 lines (services) + ~500 lines (routes) = **~2,150 lines**

**Frontend:**
- 31 new TypeScript type exports + 20 new interfaces
- 50+ API client methods
- 40+ React Query hooks
- 10 pages + 1 hooks file + 1 API client file: **~1,800 lines**

**Total new code: ~4,000 lines**

---

## Verification

- `npx tsc --noEmit`: ✅ 0 errors
- `npx vite build`: ✅ 3389 modules, 2m 19s
- All chunk sizes reasonable (largest portfolio page: AccountDetail 15.97kB, hooks bundle: 6.10kB)

---

## API Endpoint Summary

| Group | Endpoints |
|---|---|
| Dashboard | `GET /dashboard` — portfolio summary + risk + allocations + breakdown + history |
| Brokers | `GET/POST /brokers`, `GET/PUT/DELETE /brokers/{id}`, `GET /brokers/{id}/accounts` |
| Accounts | `GET/POST /accounts`, `GET/PUT/DELETE /accounts/{id}`, `POST /accounts/{id}/archive`, `PUT /accounts/{id}/metrics` |
| Balance/Equity | `GET /accounts/{id}/balance-history`, `GET /accounts/{id}/equity-history` |
| Funding | `GET /funding`, `POST /funding` |
| Groups | `GET/POST /groups`, `PUT/DELETE /groups/{id}` |
| Notes | `GET /accounts/{id}/notes`, `POST /notes`, `PUT/DELETE /notes/{id}` |
| Health | `GET/PUT /accounts/{id}/health` |
| Rules | `GET /accounts/{id}/rules`, `POST /rules`, `PUT/DELETE /rules/{id}`, `POST /accounts/{id}/rules/check` |
| Risk | `GET /risk`, `GET /accounts/{id}/risk` |
| Allocations | `GET/POST /allocations`, `PUT/DELETE /allocations/{id}`, `GET /allocations/rebalance-suggestions`, `GET /allocations/compute-from-equity` |
| Transfers | `GET/POST /transfers` |
| Goals | `GET/POST /goals`, `PUT/DELETE /goals/{id}` |
| Analytics | `GET /analytics/compare-accounts`, `GET /analytics/compare-brokers` |
| AI | `POST /ai/ask`, `POST /ai/best-account`, `POST /ai/worst-account`, `POST /ai/rebalancing`, `POST /ai/broker-analysis`, `POST /ai/risk-assessment` |
| Reports | `GET /reports/portfolio`, `GET /reports/risk`, `GET /reports/allocation`, `GET /reports/performance-comparison`, `GET /reports/account/{id}`, `POST /reports/ai/generate` |
| History | `GET /history`, `POST /snapshot` |

---

## Future Expansion

1. **Database migration**: Run `alembic upgrade head` for the 14 new portfolio tables
2. **Live Broker Sync**: Real-time MT5/CTrader API integration to auto-update account metrics
3. **Copy Trading**: Cross-account trade copying with allocation-based position sizing
4. **Managed Accounts**: Read-only view for external stakeholders
5. **Institutional Mode**: Multi-user portfolio access with role-based permissions
6. **Trade-Account Linking**: Associate trades with specific accounts via metadata
7. **Periodic Snapshots**: Background job to record portfolio snapshots on schedule
8. **Advanced Allocation**: Markowitz-optimized capital allocation suggestions

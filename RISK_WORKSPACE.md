# RISK WORKSPACE — Phase 2.6 Completion Report

## Objective
Build a professional Risk Management Workspace that serves as the central hub for controlling trading risk before, during, and after execution.

## Status: COMPLETE

---

## Features Implemented

### 1. Risk Dashboard (7 tabs total)

**Dashboard Tab** — 15 KPIs across 3 rows:
- **Account & P&L**: Account Balance, Equity, Daily P&L, Weekly P&L, Monthly P&L
- **Risk Usage**: Current Risk %, Open Risk, Available Risk, Daily Risk Remaining, Open Positions
- **Drawdown**: Max Drawdown, Current Drawdown, Recovery Progress

**Alert Banner** — Active alerts + rule violations summary with navigation to Alerts tab

**Drawdown Timeline** — Area chart showing drawdown over time

**Exposure Breakdown** — Pie charts for exposure by pair and by direction

### 2. Position Size Calculator
- **Inputs**: Account Balance, Risk %, Entry Price, Stop Loss, Take Profit, Pip Value, Instrument
- **Outputs**: Position Size (units), Lot Size, Dollar Risk, Expected R:R, Potential Profit, Potential Loss, Risk Per Pip, Stop Distance (pips)
- **Instruments**: Forex, Crypto, Stocks, Futures

### 3. Risk Rules Engine
- **Rule Types**: Max Daily Loss, Max Weekly Loss, Max Monthly Loss, Max Risk Per Trade, Max Open Trades, Max Correlated Trades, Max Total Exposure, Max Consecutive Losses, Session Restriction, News Restriction
- **CRUD Operations**: Create, Read, Update (toggle active/inactive), Delete
- **Severity Levels**: Info, Warning, Critical
- **Violation Tracking**: Count violations per rule

### 4. Exposure Analysis
- **Total Exposure** with KPI cards
- **By Pair** breakdown table
- **By Direction** breakdown table
- **Max Single Exposure** and **Correlation Risk** metrics

### 5. Risk Alerts
- **Alert Types**: Drawdown, Exposure, Rule Violation, Daily Limit, Weekly Limit, Monthly Limit
- **Severity Levels**: Info, Warning, Critical
- **Actions**: Dismiss individual alerts
- **Color-coded borders** based on severity

### 6. Trade Validation
- **Pre-trade checks**: Entry/SL validation, Stop Distance, Rule compliance, High Risk Warning
- **Result**: Approved / Warning / Rejected with detailed check breakdown
- **Metrics**: Risk Amount, Potential Profit/Loss, R:R Ratio

### 7. Risk History
- **30-day trend chart**: Daily P&L, Drawdown %, Risk % over time
- **Rule Violations table**: Rule name, type, limit, actual, severity, timestamp

---

## Database Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `risk_rule` | Configurable risk rules with limits, violations, and configs |
| `risk_alert` | Active/dismissed risk alerts |
| `risk_snapshot` | Daily risk snapshots for historical tracking |
| `trade_validation` | Pre-trade validation results |

### Migration Required
```sql
-- Tables are created via SQLAlchemy Base metadata
-- Run: alembic revision --autogenerate -m "add risk tables"
-- Then: alembic upgrade head
```

---

## API Changes

### New Endpoints (`/projects/{project_id}/risk`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/dashboard` | Full risk dashboard with all metrics |
| `GET` | `/drawdown` | Drawdown timeline data |
| `GET` | `/history?days=30` | Historical risk snapshots |
| `GET` | `/rules` | List all risk rules |
| `POST` | `/rules` | Create new risk rule |
| `PUT` | `/rules/{rule_id}` | Update risk rule |
| `DELETE` | `/rules/{rule_id}` | Delete risk rule |
| `GET` | `/alerts` | List active alerts |
| `POST` | `/alerts` | Create alert |
| `POST` | `/alerts/{alert_id}/dismiss` | Dismiss alert |
| `POST` | `/validate` | Validate proposed trade |
| `POST` | `/position-size` | Calculate position size |
| `GET` | `/violations` | Get rule violations |

**Total: 13 new endpoints**

---

## New Calculations

### Position Size Calculator
```
dollar_risk = account_balance × (risk_percent / 100)
stop_distance_pips = abs(entry - stop_loss) × 10000 (forex) or × 100 (other)
lot_size = (dollar_risk / stop_distance_pips) / pip_value
position_size = lot_size × 100000
```

### Drawdown Calculation
```
running_eq += trade.pnl
peak_eq = max(peak_eq, running_eq)
drawdown = ((peak_eq - running_eq) / peak_eq) × 100
```

### Risk Dashboard
- Account balance derived from initial $10,000 + cumulative P&L
- Daily/Weekly/Monthly P&L filtered by trade timestamps
- Open risk = sum of absolute risk_percent for open trades
- Available risk = 10% max - current open risk
- Recovery progress = (1 - current_dd / max_dd) × 100

---

## Charts Added

| Chart | Type | Usage |
|-------|------|-------|
| Drawdown Timeline | AreaChart | Visualize drawdown over time |
| Exposure by Pair | PieChart | Pair-level exposure breakdown |
| Exposure by Direction | PieChart | Direction-level exposure breakdown |
| Risk History | LineChart | 30-day trend (P&L, drawdown, risk %) |

---

## Validation Logic

### Pre-Trade Validation
1. **Entry/SL Check**: Ensures both are provided and non-zero
2. **Stop Distance Check**: Verifies stop distance > 0
3. **Rule Engine Check**: Evaluates all active rules against proposed trade
4. **High Risk Warning**: Flags trades with risk > 2%

### Validation Result
- **Approved**: All checks passed
- **Warning**: Non-critical checks failed (e.g., high risk)
- **Critical**: Critical checks failed (e.g., rule violation)

---

## Future AI Integration Points

| AI Module | Data Source | Endpoint |
|-----------|-------------|----------|
| **Risk Coaching** | Dashboard + Violations | `/dashboard`, `/violations` |
| **Behavior Analysis** | History + Alerts | `/history`, `/alerts` |
| **Capital Protection** | Drawdown + Rules | `/drawdown`, `/rules` |
| **Risk Optimization** | Calculator + Exposure | `/position-size`, `/dashboard` |
| **Rule Compliance** | Rules + Violations | `/rules`, `/violations` |

---

## Files Created

### Backend
- `backend/src/models/risk.py` — 4 models (RiskRule, RiskAlert, RiskSnapshot, TradeValidation)
- `backend/src/schemas/risk.py` — 15 Pydantic schemas
- `backend/src/services/risk.py` — 350+ lines risk computation service
- `backend/src/api/routes/risk.py` — 13 API endpoints

### Frontend
- `frontend/src/pages/Risk.tsx` — 867-line 7-tab risk management page
- `frontend/src/api/risk.ts` — API service (13 methods)
- `frontend/src/hooks/useRisk.ts` — 12 React Query hooks
- `frontend/src/api/types.ts` — 12 new risk interfaces

### Modified
- `backend/src/api/router.py` — Registered risk router
- `frontend/src/routes/AppRoutes.tsx` — Added Risk route + lazy import
- `frontend/src/components/Sidebar.tsx` — Added Risk nav item + Shield import

---

## Remaining & Future Enhancements

### Potential Phase 2.7
- **Real-time risk monitoring** — WebSocket push for live position updates
- **Risk limits auto-adjustment** — Dynamic limits based on equity curve
- **Correlation engine** — Real-time cross-pair correlation matrix
- **Portfolio VaR** — Value at Risk calculation
- **Stress testing** — Scenario analysis for extreme market conditions
- **Risk budgeting** — Allocate risk across strategies
- **Automated hedging** — Suggest hedging positions when exposure is high
- **Risk-adjusted returns** — Sharpe, Sortino, Calmar ratios per strategy
- **Mobile risk alerts** — Push notifications for critical alerts
- **Risk calendar** — Upcoming high-impact events integration

---

## Build Status

- `npx tsc --noEmit` — passes clean (zero errors)
- `npx vite build` — succeeds (3325 modules, 1m 33s)
- Risk chunk: 36.59 KB (gzip: 7.24 KB)

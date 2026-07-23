# Phase 3.5 — Quantitative Research & Backtesting Lab

## Objective
Build an institutional-grade quantitative research laboratory for discovering, validating, optimizing, and monitoring trading edges — directly within the Minore platform.

---

## Architecture

```
frontend/src/pages/QuantResearch*.tsx      ← React Query →  backend/src/api/routes/quant_research.py
                                                                      ↕
                                                              backend/src/services/quant_research.py
                                                                      ↕
                                                              backend/src/models/quant_research.py
```

### Backend Layer (3 files)

| File | Purpose |
|---|---|
| `models/quant_research.py` | 10 SQLAlchemy models: Experiment, BacktestRun, BacktestTrade, SimulationRun, WalkForwardRun, OptimizationRun, EdgeHealthSnapshot, RegimePerformance, ResearchNotebook, HypothesisTestResult |
| `services/quant_research.py` | `QuantResearchLab` orchestrator class + standalone engines: statistical analysis, backtest engine, simulation (Monte Carlo + bootstrap), walk-forward analysis, parameter optimization (grid search), edge health monitor, AI research assistant, research notebook CRUD, hypothesis testing, export (CSV/JSON/Markdown) |
| `routes/quant_research.py` | ~40 endpoints across 11 resource groups with inline Pydantic schemas, registered at `/projects/{project_id}/quant-research` |

### Frontend Layer (7 pages)

| Page | Path | Functionality |
|---|---|---|
| QuantResearchDashboard | `quant-research/` | Executive dashboard: 6 KPI row, hypothesis status card, edge health panel, best model display, recent discoveries, recent backtests DataTable, experiments DataTable |
| QuantExperiments | `quant-research/experiments` | Experiment CRUD with card grid, create/edit dialog, duplicate/delete actions, status badges |
| QuantBacktestLab | `quant-research/backtest-lab` | Backtest configurator (type, symbols, dates, cost parameters), run form, results DataTable with status badges, per-run detail navigation |
| QuantBacktestDetail | `quant-research/backtests/:backtestId` | Full backtest report: metric KPI grid, equity curve (AreaChartCard), statistics panel (14 metrics), monthly returns bar chart, P&L/R:R distribution pie, regime performance table, sorted trades DataTable |
| QuantSimulationLab | `quant-research/simulations` | Monte Carlo / bootstrap configurator, run sidebar, percentile KPI grid, equity band visualization, return distribution histogram |
| QuantWalkForwardLab | `quant-research/walkforward` | Walk-forward analysis configurator, stability score KPI, per-window performance breakdown table, status badges |
| QuantOptimizationLab | `quant-research/optimization` | Grid search config with parameters JSON editor, run/create actions, best result KPI grid, top-10 results DataTable, convergence chart |
| QuantEdgeHealth | `quant-research/edge-health` | Real-time edge health: current health gauge, sub-metric bars (stability, drift, drawdown, confidence), signals & recommendations panels, history DataTable |
| QuantNotebooks | `quant-research/notebooks` | Research notebook: expandable entries with type badges (markdown, observation, conclusion, chart, code, table), create form, edit/delete actions |

---

## Key Design Decisions

### 1. Synthetic Trades for Offline Development
The backtest engine generates realistic synthetic trades via `_generate_sample_trades()` when no real strategy is linked. This allows full testing of all features (statistics, charts, export) without a live database. Switch to real trades via `BacktestConfig.use_real_trades=True`.

### 2. Inline Pydantic Schemas in Routes
Rather than splitting schemas into a separate file, all request/response schemas are defined as inline classes at the top of `routes/quant_research.py`. This matches the existing pattern used by other route files in the project.

### 3. Standalone Statistical Module
The `StatisticalAnalysis` class provides 17+ metrics (Sharpe, Sortino, Calmar, Sterling, Information Ratio, Treynor, Jensen's Alpha, downside deviation, VaR, CVaR, max drawdown, profit factor, SQN, Z-score, edge stability, confidence intervals) — computed on trade lists, callable from any part of the system.

### 4. Export Format Support
Three export formats:
- **CSV**: Trade-level data for Excel/analysis
- **JSON**: Full structured output for programmatic access
- **Markdown**: Formatted report with metrics, charts, summary — ideal for Notion/share

### 5. React Query Integration
All 40+ API endpoints are wrapped in 20+ React Query hooks (`useQuery` / `useMutation`) following the project's `useStandardQuery` / `useStandardMutation` pattern with proper refetch-on-mount and error handling.

### 6. Lazy-Loaded Pages
Each page is lazy-loaded via `React.lazy() + Suspense` to keep the initial bundle small. Individual chunks range from 5.13kB to 9.82kB.

---

## Statistics

**Backend:**
- 10 database models (SQLAlchemy)
- ~450 lines (models) + ~580 lines (services) + ~320 lines (routes) = **~1,350 lines new**

**Frontend:**
- 15+ new TypeScript interfaces
- 40+ API client methods
- 20+ React Query hooks
- 9 pages (including the detail view): **~3,400 lines new**

**Total new code: ~4,750 lines**

---

## Verification

- `npx tsc --noEmit`: ✅ 0 errors
- `npx vite build`: ✅ 3383 modules, 21.96s
- All chunk sizes are reasonable (largest Quant page: 9.82kB)

---

## Next Steps

1. **Database migration**: Run `alembic revision --autogenerate` to create tables for the 10 new models
2. **Backend testing**: Start the FastAPI server and verify endpoints with synthetic trades
3. **Frontend testing**: Navigate through all 9 pages in development mode
4. **Strategy linking**: Wire up `strategy_id` in backtest/simulation config to actual strategy data
5. **Real data**: Set `use_real_trades=True` when strategy data is available in production
6. **Code splitting**: Consider further lazy loading for large pages (BacktestDetail, Dashboard) if needed

# Testing Strategy — Project Minore

## Test Types

### Frontend Tests (Vitest + Testing Library)

**Location:** `frontend/src/tests/`
**Runner:** Vitest 4
**Environment:** jsdom
**Framework:** @testing-library/react + @testing-library/jest-dom

| Test Type | Files | Tests | Status |
|-----------|-------|-------|--------|
| Component tests | 10 | 70 | ✅ All pass |
| Hook tests | 1 | 5 | ✅ All pass |
| **Total** | **11** | **75** | **✅ 100%** |

### Covered Components

| Component | Tests | What's tested |
|-----------|-------|---------------|
| Button | 9 | Render, variants, sizes, loading, disabled, onClick, className |
| Card | 5 | Render, CardHeader, CardContent, CardFooter, custom className |
| Badge | 3 | Render, className, variants |
| Input | 5 | Placeholder, error styles, onChange, disabled, className |
| KpiCard | 3 | Title/value, subtitle, icon |
| Feedback | 4 | LoadingSpinner, ErrorState, EmptyState |
| DataTable | 16 | Search, sort asc/desc, pagination, loading, empty, row click, search disabled |
| Alert | 11 | 4 variants, title, children, close button, onClick |
| Select | 7 | Trigger, value, options, onChange, disabled, error styling, className |
| ConfirmDialog | 7 | Open/close, confirm/cancel, custom label, variants |
| useProject | 5 | Set, get, persist, clear, error boundary |

### Backend Tests (pytest)

**Location:** `backend/tests/`
**Runner:** pytest
**Integration tests:** Require PostgreSQL

| Test File | Focus |
|-----------|-------|
| `test_api.py` | Health checks, security headers |
| `test_analyst.py` | AI analyst endpoints |
| `test_engines_*.py` | Engine logic |
| `test_knowledge*.py` | Knowledge engine |
| `test_replay.py` | Replay engine |
| `test_research.py` | Research engine |
| `test_trader_intelligence.py` | Trader intelligence |

**Total:** ~183 tests (9 files)

## Coverage Goals

### Frontend (scoped to `src/components/ui/`)

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

### Backend (configured in `pytest.ini`)

| Metric | Threshold |
|--------|-----------|
| Overall | 70% fail-under |

## Running Tests

```bash
# Frontend - single run
cd frontend && npm run test

# Frontend - watch mode
cd frontend && npm run test:watch

# Frontend - with coverage
cd frontend && npm run test:coverage

# Frontend - single file
cd frontend && npx vitest run src/tests/components/Button.test.tsx

# Backend - all tests
cd backend && pytest tests/ -v

# Backend - with coverage
cd backend && pytest tests/ --cov=src --cov-report=term-missing
```

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to main:

1. **Frontend Tests** — `npm run test:coverage` + type check
2. **Backend Tests** — pytest with PostgreSQL service (GitHub-hosted)
3. **Security Scan** — npm audit, secrets grep, outdated dependency check
4. **Build** — `npm run build`

## Quality Gates

- All frontend tests must pass before merge
- Coverage thresholds enforced in CI
- TypeScript `tsc --noEmit` must pass
- Vite build must succeed
- Security scan warnings reviewed before merge

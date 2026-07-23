# Project Minore — AI Knowledge Pack

## Project Summary

**Project Minore** is an AI-augmented trading journal and knowledge system. It helps traders journal trades, analyze performance, detect market structures (ICT), and improve through AI coaching.

### Quick Facts

| Attribute | Value |
|-----------|-------|
| Language (Backend) | Python 3.12+ |
| Framework (Backend) | FastAPI + SQLAlchemy + Pydantic |
| Language (Frontend) | TypeScript 5 |
| Framework (Frontend) | React 18 + Vite + Tailwind |
| Database | PostgreSQL 16 |
| Migrations | Alembic (26 migrations) |
| Auth | JWT (HS256) + bcrypt |
| Testing | Vitest (frontend), pytest (backend) |
| CI/CD | GitHub Actions |
| Deployment | Railway (backend), Vercel (frontend) |

### Core Features

- Trade journaling with AI enrichment
- ICT smart engine (8 detection engines)
- Multi-agent AI system (8 specialized agents)
- Trading brain (7 intelligence engines)
- Knowledge graph with concepts, claims, sources
- Broker integration (11 exchange providers)
- Historical trade replay
- Portfolio management and risk analysis
- Research engine and RAG copilot
- Obsidian integration
- Chrome extension

### Architecture (3-Tier)

```
React SPA (Vite) → FastAPI (Uvicorn) → PostgreSQL 16
       ↕                      ↕
   Axios + JWT           Services / Agents / Brain / ICT
```

### Codebase Size

| Area | Files | Lines (approx) |
|------|-------|----------------|
| Backend routes | 46 | 5,000+ |
| Backend services | 59 | 15,000+ |
| Backend models/schemas | 69 | 8,000+ |
| Backend core/infra | 6 | 500+ |
| Frontend pages | 98 | 20,000+ |
| Frontend components | 68 | 8,000+ |
| Frontend hooks | 41 | 3,000+ |
| Frontend API | 45 | 2,000+ |
| Tests | 20 | 5,000+ |
| **Total** | **452+** | **~66,500+** |

### Domain Coverage

| Domain | Backend | Frontend | Description |
|--------|---------|----------|-------------|
| Auth | `core/jwt.py`, `api/routes/auth.py` | `auth/`, `pages/Login.tsx` | JWT authentication |
| Trading | `services/trade*.py`, `models/trade.py` | `pages/Trades.tsx`, `hooks/useTrades.ts` | Trade journal |
| ICT | `ict/*.py` (8 engines) | `pages/ICTSmartEngine.tsx`, `hooks/useICT.ts` | Market structure analysis |
| AI Brain | `brain/*.py` (7 engines) | `pages/BrainDashboard.tsx`, `hooks/useBrain.ts` | Trading intelligence |
| Agents | `agents/*.py` (8 agents) | `pages/AIDashboard.tsx`, `api/agents.ts` | Task-oriented AI |
| Knowledge | `services/knowledge*.py` | `pages/Knowledge*.tsx` | Knowledge management |
| Broker | `broker/*.py` (11 providers) | `pages/BrokerHub.tsx`, `hooks/useBroker.ts` | Exchange integration |
| Research | `services/research/*.py` | `pages/Research.tsx` | Research engine |
| Portfolio | `services/portfolio.py` | `pages/Portfolio*.tsx` | Portfolio management |
| Automation | `services/automation.py` | `pages/Automation*.tsx` | Workflow automation |
| Deployment | `Dockerfile`, `railway.json`, `.github/` | `nginx.conf` | Infrastructure |

# Project Minore

**AI-Augmented Trading Journal & Knowledge System**

Project Minore is a production-grade platform for retail traders who want to analyze, learn from, and improve their trading using AI-powered pattern recognition, knowledge graphs, and decision support.

---

## Features

- **Trade Journaling** — Log trades manually or auto-detect from FXReplay via the browser extension
- **AI Analyst** — Generates structured trade debriefs with emotional, strategic, and market-context analysis
- **Pattern Discovery** — Automatically detects winning/losing patterns across your trade history
- **Knowledge Graph** — Builds a dynamic graph of concepts, claims, sources, and relationships extracted from your analysis
- **Similarity Engine** — Compares current market conditions against historical trades to find analogous setups
- **Decision Support** — Evaluates market alignment, ICT conformance, session alignment, and pattern matching
- **Continuous Learning** — Background pipeline that updates patterns, knowledge graph, and trader profile after every trade
- **Research Engine** — Conducts structured research with hypotheses, questions, and interpretation chains
- **Historical Replay** — Replays past trades in a simulated environment to test alternative decisions
- **Trader Intelligence** — Builds a statistical profile of your trading psychology and behavioral patterns
- **Chrome Extension** — Detects completed trades on FXReplay, captures screenshots, and syncs to the backend

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET_KEY
alembic upgrade head
uvicorn src.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

### Verify

```bash
# Backend health check
curl http://localhost:8000/health
# → {"status":"healthy","version":"1.1.0","environment":"development"}
```

---

## Docker (Full Stack)

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, the backend (port 8000), and the frontend (port 80).

---

## Testing

```bash
# Backend (requires PostgreSQL with minore_test database)
cd backend
pytest

# Frontend
cd frontend
npm test
```

All 183 backend tests pass. Coverage target: 70% (currently 49% overall, 100% on model/schema files).

---

## Technology Stack

### Backend
- **Python 3.12+** with FastAPI
- **PostgreSQL 16+** with SQLAlchemy 2.0 + Alembic
- **Pydantic v2** for validation
- **JWT** authentication with bcrypt password hashing
- **Uvicorn** ASGI server

### Frontend
- **React 18** with TypeScript
- **Vite** build tool (production build verified)
- **Tailwind CSS** (shadcn/ui design system)
- **TanStack Query** for server state
- **Recharts** for charts
- **React Router v6**

### Extension
- **Manifest V3** Chrome Extension
- **React 18** for popup/options
- **Vite** build
- **Service Worker** background script
- **Offline queue** with retry logic

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://minore:minore@localhost:5432/minore` |
| `JWT_SECRET_KEY` | JWT signing secret (min 32 chars) | (required) |
| `ENVIRONMENT` | `development`, `staging`, `production` | `development` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `RATE_LIMIT_PER_MINUTE` | Max requests per minute | `100` |
| `MAX_REQUEST_SIZE` | Max request body size (bytes) | `10485760` |

---

## Project Structure

```
project-minore/
├── backend/           # FastAPI application (264+ source files)
│   ├── src/
│   │   ├── api/       # Routes, deps, middleware
│   │   ├── core/      # Config, security, crypto
│   │   ├── crud/      # Database CRUD operations
│   │   ├── db/        # Session, base, migrations
│   │   ├── models/    # 40+ SQLAlchemy models (114 tables)
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic + AI engines
│   ├── tests/         # 183 pytest tests
│   └── alembic/       # Database migrations
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── api/       # API client services
│       ├── components/# 70+ UI components
│       ├── hooks/     # React Query hooks
│       └── pages/     # 50+ route pages
├── extension/         # Chrome Extension (Manifest V3)
└── docs/              # 40+ documentation files
```

---

## Documentation

- `docs/deployment/LOCAL.md` — Local development setup
- `docs/backend/AUTH.md` — Authentication flow
- `docs/api/OVERVIEW.md` — API reference
- `docs/database/OVERVIEW.md` — Database schema overview
- `docs/security/SECURITY_AUDIT_REPORT.md` — Security audit
- `docs/devops/DEPLOYMENT_PIPELINE.md` — CI/CD pipeline

---

## License

MIT

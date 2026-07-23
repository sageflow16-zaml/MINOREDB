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
- **Multi-Broker Integration** — Connect MT4, MT5, cTrader, OANDA, Binance, and more
- **ICT Smart Engine** — Fair Value Gaps, Order Blocks, Liquidity Zones, and Session Analysis
- **Obsidian Integration** — Bidirectional sync between trading notes and knowledge base

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│   Frontend   │────▶│   Backend    │────▶│    PostgreSQL     │
│  React + Vite│     │  FastAPI     │     │   + Alembic       │
│  shadcn/ui   │     │  SQLAlchemy  │     │                   │
│  TanStack    │     │  Pydantic v2 │     │  168 tables       │
│  Query       │     │  JWT Auth    │     │                   │
└──────────────┘     └──────┬───────┘     └───────────────────┘
                            │
                    ┌───────▼────────┐
                    │   AI Engines    │
                    │  Knowledge Graph│
                    │  Pattern Match  │
                    │  RAG Pipeline   │
                    │  ICT Analysis   │
                    └────────────────┘
```

## Tech Stack

### Backend
| Category | Technology |
|----------|-----------|
| Runtime | Python 3.12 |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 + Alembic |
| Validation | Pydantic v2 / pydantic-settings |
| Auth | JWT (PyJWT) + bcrypt |
| Server | Uvicorn (dev) / Gunicorn (prod) |
| Database | PostgreSQL 16 |
| AI/ML | NumPy, custom pattern engines |

### Frontend
| Category | Technology |
|----------|-----------|
| Runtime | Node.js 20 |
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query (React Query) |
| Charts | Recharts, Lightweight Charts |
| Routing | React Router v6 |
| HTTP | Axios |
| Animation | Framer Motion |

### Infrastructure
| Category | Technology |
|----------|-----------|
| Hosting | Vercel (frontend) / Render (backend) |
| Database | Neon PostgreSQL |
| CI/CD | GitHub Actions |
| Container | Docker / Docker Compose |
| Monitoring | Prometheus metrics |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:
- Set `DATABASE_URL` to your PostgreSQL connection string
- Generate a `JWT_SECRET_KEY`: `python -c "import secrets; print(secrets.token_hex(32))"`

```bash
alembic upgrade head
uvicorn src.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Verify

```bash
curl http://localhost:8000/health
# → {"status":"healthy","version":"1.1.0","environment":"development"}
```

### Docker (Full Stack)

```bash
docker compose up --build
```

Starts PostgreSQL, Redis, backend (port 8000), and frontend (port 80).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | — |
| `JWT_SECRET_KEY` | Yes | JWT signing key (min 32 chars) | — |
| `ENVIRONMENT` | No | `development` / `production` / `test` | `development` |
| `PORT` | No | Server port | `8000` |
| `CORS_ORIGINS` | No | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `CORS_ALLOW_CREDENTIALS` | No | Allow credentials in CORS | `true` |
| `CORS_ALLOW_METHODS` | No | Allowed HTTP methods | `GET,POST,PUT,DELETE,PATCH,OPTIONS` |
| `CORS_ALLOW_HEADERS` | No | Allowed HTTP headers | `Authorization,Content-Type,...` |
| `ALLOWED_HOSTS` | No | Allowed Host headers | `*` |
| `RATE_LIMIT_PER_MINUTE` | No | Max requests per minute per IP | `60` |
| `MAX_REQUEST_SIZE` | No | Max request body size (bytes) | `10485760` |
| `MAX_UPLOAD_SIZE` | No | Max file upload size (bytes) | `5242880` |
| `MAX_PAGE_SIZE` | No | Hard cap on pagination limit | `1000` |
| `DOCS_ENABLED` | No | Enable Swagger/ReDoc | `true` |
| `HSTS_ENABLED` | No | Enable HSTS headers | `false` |
| `HSTS_MAX_AGE` | No | HSTS max-age in seconds | `31536000` |
| `HSTS_INCLUDE_SUBDOMAINS` | No | Include subdomains in HSTS | `true` |
| `HSTS_PRELOAD` | No | Allow HSTS preload | `true` |
| `API_KEY` | No | Machine-to-machine API key | — |
| `WEBHOOK_SECRET` | No | Webhook signing secret | — |
| `JWT_ALGORITHM` | No | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Refresh token lifetime | `7` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API base URL | `/api/v1` |
| `VITE_API_PROXY` | No | Vite dev proxy target (local only) | `http://127.0.0.1:8000` |

---

## Project Structure

```
project-minore/
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── agents/           # Intelligence agents (coach, curator, etc.)
│   │   ├── api/              # HTTP routes, middleware, dependencies
│   │   ├── brain/            # AI brain (DNA, learning, reasoning engines)
│   │   ├── broker/           # Broker integration providers (14+ brokers)
│   │   ├── collectors/       # Data collectors (macro, market data)
│   │   ├── core/             # Config, security, crypto, logging
│   │   ├── crud/             # Database CRUD operations
│   │   ├── db/               # Database session, base, migrations
│   │   ├── ict/              # ICT trading engine (FVG, OB, liquidity)
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── services/         # Business logic + AI/ML services
│   ├── tests/                # Pytest test suite
│   └── alembic/              # Database migrations
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── api/              # API client services (axios)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks (TanStack Query)
│   │   ├── pages/            # Route page components (70+)
│   │   ├── layouts/          # Layout components
│   │   ├── context/          # React context providers
│   │   └── lib/              # Utility functions
│   └── public/               # Static assets
├── extension/                # Chrome Extension (Manifest V3)
├── docs/                     # Documentation
│   ├── api/                  # API reference
│   ├── architecture/         # Architecture decisions
│   ├── backend/              # Backend guides
│   ├── deployment/           # Deployment guides
│   ├── devops/               # CI/CD, monitoring
│   ├── frontend/             # Frontend guides
│   ├── security/             # Security audit, production config
│   └── testing/              # Testing guide
├── obsidian-plugin/          # Obsidian vault plugin
├── scripts/                  # Utility scripts (backup, version bump)
├── .github/workflows/        # CI/CD pipelines
├── vercel.json               # Vercel deployment config
└── render.yaml               # Render deployment blueprint
```

---

## Testing

```bash
# Backend (requires PostgreSQL with minore_test database)
cd backend
pytest

# Frontend
cd frontend
npm test

# API verification
python test_all_apis.py
```

---

## Deployment

The application is designed for free-tier deployment:

| Service | Component | Plan |
|---------|-----------|------|
| Vercel | Frontend (React) | Free |
| Render | Backend (FastAPI) | Free |
| Neon | PostgreSQL database | Free |

See `docs/deployment/` for detailed deployment instructions.

---

## Documentation

- `docs/api/OVERVIEW.md` — API reference
- `docs/backend/AUTH.md` — Authentication flow
- `docs/database/OVERVIEW.md` — Database schema
- `docs/deployment/LOCAL.md` — Local development setup
- `docs/security/PRODUCTION_CONFIG.md` — Production security configuration
- `docs/testing/OVERVIEW.md` — Testing guide

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code change that neither fixes nor adds
- `docs:` — documentation only
- `chore:` — maintenance tasks

---

## License

MIT License — see [LICENSE](LICENSE)

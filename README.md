# Project Minore

**AI-Augmented Trading Journal & Knowledge System**

Project Minore is a production-grade platform for retail traders who want to analyze, learn from, and improve their trading using AI-powered pattern recognition, knowledge graphs, and decision support — without relying on any official broker API.

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

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)          │
│  Dashboard │ Trades │ Knowledge │ Analyst │ Replay  │
│  Research  │ Statistics │ Similarity │ Settings     │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────┐
│               Backend (FastAPI + Python)             │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────────┐  │
│  │ Routes  │ │ Services │ │ AI Engine Pipeline   │  │
│  │ CRUD    │ │ Engines  │ │ Analyst │ Research    │  │
│  │ Auth    │ │ Tasks    │ │ Pattern Discovery    │  │
│  └────┬────┘ └────┬─────┘ └──────────┬───────────┘  │
│       └───────────┼──────────────────┘              │
│                   ▼                                  │
│     ┌──────────────────────────────┐                 │
│     │  PostgreSQL + SQLAlchemy     │                 │
│     │  Alembic Migrations          │                 │
│     └──────────────────────────────┘                 │
└──────────────────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│          Chrome Extension (Manifest V3)              │
│  Content Script → Detector → Notes Modal → Queue    │
│  Background Worker → Auth → API Client → Retry      │
│  Popup UI │ Options Page │ Offline Queue             │
└──────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
- **Python 3.12+** with FastAPI
- **PostgreSQL 16** with SQLAlchemy 2.0 (async)
- **Alembic** for database migrations
- **Pydantic v2** for validation
- **JWT** authentication + API key security
- **Uvicorn** ASGI server

### Frontend
- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** (shadcn/ui design system)
- **React Query** for server state
- **Recharts** for charts
- **React Router v6**

### Extension
- **Manifest V3** Chrome Extension
- **React 18** for popup/options
- **Vite** build
- **Service Worker** background script
- **Offline queue** with retry logic

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Chrome/Chromium (for extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/project-minore.git
cd project-minore

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start backend
uvicorn src.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Extension setup (new terminal)
cd extension
npm install
npm run build
# Load dist/ as unpacked extension at chrome://extensions
```

### Docker

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend (port 8000), and the frontend (port 3000).

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://minore:minore@localhost:5432/minore` |
| `SECRET_KEY` | JWT signing secret | (required) |
| `ENVIRONMENT` | `development`, `staging`, `production` | `development` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `API_KEY` | API key for backend-to-backend auth | (optional) |
| `RATE_LIMIT_PER_MINUTE` | Max requests per minute | `100` |
| `MAX_REQUEST_SIZE` | Max request body size (bytes) | `10485760` |

---

## Project Structure

```
project-minore/
├── backend/           # FastAPI application
│   ├── src/
│   │   ├── api/       # Routes, deps, middleware
│   │   ├── core/      # Config, security
│   │   ├── crud/      # Database operations
│   │   ├── db/        # Session, base models
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic + AI engines
│   ├── tests/         # Pytest test suite
│   └── alembic/       # Database migrations
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── api/       # API client services
│       ├── components/# UI components
│       ├── hooks/     # React Query hooks
│       ├── layouts/   # Page layouts
│       ├── pages/     # Route pages
│       └── routes/    # Router configuration
├── extension/         # Chrome Extension
│   └── src/
│       ├── background/# Service worker
│       ├── content/   # Content scripts
│       ├── popup/     # Popup UI
│       ├── options/   # Settings page
│       └── shared/    # Shared types, storage, logger
└── docs/              # Documentation
```

---

## Deployment

See [docs/Deployment.md](docs/Deployment.md) for Vercel (frontend), Railway/Render (backend), and GitHub Actions CI/CD.

---

## Roadmap

- **v1.0** — Core trade journaling, AI analyst, pattern discovery, FXReplay extension
- **v1.1** — Decision support, similarity engine, knowledge graph
- **v1.2** — Research engine, trader intelligence profiling
- **v1.5** — MT5 integration, live trading sync
- **v2.0** — AI overlays, real-time recommendations, community features

---

## Screenshots

*Coming soon.*

---

## License

MIT

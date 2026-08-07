# Project Minore

**AI-Augmented Trading Journal & Knowledge System**

Project Minore is a production-grade platform for retail traders who want to analyze, learn from, and improve their trading using AI-powered pattern recognition, knowledge graphs, and decision support.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Frontend (React SPA)                    │   │
│  │  React 18 + TypeScript + Vite + Tailwind CSS             │   │
│  │  shadcn/ui + TanStack Query + Recharts + Framer Motion   │   │
│  │  React Router v6 + Lightweight Charts                    │   │
│  └──────────┬───────────────────────────────────────────────┘   │
└─────────────┼─────────────────────────────────────────────────────┘
              │ supabase-js SDK
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Supabase Platform                         │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │   PostgreSQL 16  │  │         Edge Functions (Deno)        │  │
│  │  + Row Level     │  │  ┌──────┐ ┌──────────┐ ┌─────────┐ │  │
│  │    Security      │  │  │  ai  │ │ broker-  │ │ obsidian│ │  │
│  │  + 59 Migrations │  │  │      │ │ sync     │ │ -sync   │ │  │
│  │  + SQL RPCs      │  │  ├──────┤ ├──────────┤ ├─────────┤ │  │
│  │                  │  │  │replay│ │automation│ │collector│ │  │
│  │  50 API modules │  │  │-data │ │-connector│ │         │ │  │
│  │  (supabase-js)   │  │  ├──────┤ ├──────────┤ ├─────────┤ │  │
│  │                  │  │  │ mt5  │ │tv-webhook│ │ context │ │  │
│  │  Auth (email/    │  │  └──────┘ └──────────┘ └─────────┘ │  │
│  │   password)      │  └──────────────────────────────────────┘  │
│  │  + RLS Policies  │                                            │
│  │  + Storage       │                                            │
│  └─────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
```

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
- **Quant Research** — Backtesting, walk-forward analysis, simulation labs, experiment tracking
- **Automation** — Rule-based workflows, scheduled tasks, webhook triggers, notification engine
- **Copilot** — AI-assisted workspace for trade analysis and decision support
- **Intelligence Agents** — Automated agent pipeline for ongoing market and trade analysis

---

## Tech Stack

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
| Animation | Framer Motion |

### Backend (Supabase)
| Category | Technology |
|----------|-----------|
| Database | PostgreSQL 16 |
| Auth | Supabase Auth (email/password) |
| Row Security | Row Level Security (RLS) |
| API Layer | supabase-js (client-side) |
| Edge Functions | Deno / TypeScript |
| Storage | Supabase Storage (S3-compatible) |
| Migrations | 59 SQL migrations |

### Infrastructure
| Category | Technology |
|----------|-----------|
| Frontend Hosting | Vercel |
| Backend Platform | Supabase |
| CI/CD | GitHub Actions |
| Monitoring | Supabase Dashboard, Vercel Analytics |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account (free tier)
- Vercel account (free tier)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key |

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` with your Supabase project credentials:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Project Structure

```
project-minore/
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── api/              # 50 API service modules (supabase-js)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks (TanStack Query)
│   │   ├── pages/            # 100+ route page components
│   │   ├── layouts/          # Layout components
│   │   ├── context/          # React context providers
│   │   ├── lib/              # Utility functions, supabase client
│   │   ├── types/            # TypeScript type definitions
│   │   ├── auth/             # Auth components and guards
│   │   └── theme/            # Theme configuration
│   ├── public/               # Static assets
│   └── tests/                # Vitest test suite
├── supabase/                 # Supabase configuration
│   ├── migrations/           # 59 database migrations
│   ├── functions/            # 9 Edge Functions (Deno)
│   │   ├── ai/               # AI analysis engine
│   │   ├── broker-sync/      # Broker integration sync
│   │   ├── obsidian-sync/    # Obsidian vault sync
│   │   ├── replay-data/      # Historical trade replay
│   │   ├── automation-connector/  # Automation triggers
│   │   ├── collector/        # Economic data collection
│   │   ├── mt5/              # MetaTrader 5 bridge
│   │   ├── tv-webhook/       # TradingView webhook receiver
│   │   └── context/          # Context enrichment
│   └── config.toml           # Supabase local config
├── extension/                # Chrome Extension (Manifest V3)
├── obsidian-plugin/          # Obsidian vault plugin
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── .github/workflows/        # CI/CD pipelines
└── vercel.json               # Vercel deployment config
```

---

## Testing

```bash
# Frontend unit tests
cd frontend
npm test

# TypeScript type checking
npm run lint

# Production build verification
npm run build
```

---

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link
vercel login
vercel link

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

Or connect your GitHub repository in the Vercel dashboard:
1. Go to **https://vercel.com/new**
2. Import `sageflow16-zaml/minore`
3. Framework preset: **Vite**
4. Root directory: `frontend`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
8. Deploy

### Backend (Supabase)

See [MIGRATION_DESIGN.md](./MIGRATION_DESIGN.md) for the full deployment guide including:
- Creating a Supabase project
- Running migrations (`supabase db push`)
- Deploying Edge Functions (`supabase functions deploy`)
- Configuring Auth settings
- Setting up Storage buckets and RLS policies

---

## Documentation

- `MIGRATION_DESIGN.md` — Supabase deployment and setup guide
- `docs/architecture/` — Architecture decisions
- `docs/frontend/` — Frontend development guides
- `docs/deployment/` — Deployment instructions
- `docs/security/` — Security configuration

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

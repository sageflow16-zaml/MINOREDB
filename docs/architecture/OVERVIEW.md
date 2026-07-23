# System Architecture — Project Minore

## Overview

Project Minore is an AI-augmented trading journal and knowledge system. It combines trade journaling, market analysis, ICT (Inner Circle Trader) concepts, and a multi-agent AI brain to help traders improve performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │   Auth   │ │  Pages   │ │   Hooks  │ │  Components       │  │
│  │ Context  │ │  (98)    │ │  (41)    │ │  UI/ICT/Graph/etc  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                        Axios API Client                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / JWT
┌──────────────────────────▼──────────────────────────────────────┐
│                      Backend (FastAPI)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Auth    │ │  Routes  │ │ Services │ │  Core             │  │
│  │  JWT     │ │  (46)    │ │  (35+)   │ │  Config/JWT/Crypto│  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Agents   │ │  Brain   │ │  ICT     │ │  Broker (11 prov) │  │
│  │ (8)      │ │  (7 eng) │ │  (8 eng) │ │                   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                       SQLAlchemy ORM                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQL
┌──────────────────────────▼──────────────────────────────────────┐
│                      PostgreSQL 16                               │
│  38 tables: User, Project, Trade, Knowledge*, Agent*, Brain*,   │
│  ICT*, Broker*, TradeMemory, Strategy, Pattern, ...             │
└─────────────────────────────────────────────────────────────────┘
```

## Application Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | SPA with 98 page components |
| **UI Components** | Tailwind CSS + Radix + shadcn/ui | Design system (47 components) |
| **State** | React Query + Context + Zustand | Server state + client state |
| **API Client** | Axios with JWT interceptor | HTTP communication |
| **Backend API** | FastAPI + Uvicorn | REST endpoints (46 route files) |
| **Auth Layer** | JWT (HS256) + bcrypt | Authentication |
| **Business Logic** | Service layer (35+ files) | Core application logic |
| **AI Layer** | Multi-agent system + Brain engines | Trading intelligence |
| **ICT Layer** | 8 detection engines | Market structure analysis |
| **ORM** | SQLAlchemy 2.0 | Database access |
| **Database** | PostgreSQL 16 | Data persistence |
| **CI/CD** | GitHub Actions | Testing + build + security scan |

## Module Relationships

```
Frontend Pages → Hooks → API Services → [JWT] → Backend Routes → Services → ORM → DB
                                                          ↕
                                                    Agents / Brain / ICT / Broker
```

## Key Design Decisions

- **FastAPI** over Django/Flask for async support and Pydantic validation
- **React + Vite** for fast dev experience and lazy loading
- **PostgreSQL** for structured trading data + JSONB for flexible schemas
- **Multi-agent architecture** for modular, specialized AI capabilities
- **ICT engines** as standalone analyzable modules with scoring
- **JWT stateless auth** for simplicity (no server-side sessions)
- **Broker abstraction** via provider pattern for 11 exchange integrations

# Backend Architecture — Project Minore

## Stack

- **Runtime:** Python 3.12+
- **Framework:** FastAPI 0.115+
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL 16 via psycopg
- **Auth:** JWT (HS256) + bcrypt
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Server:** Uvicorn

## Directory Structure

```
backend/src/
├── main.py              # App creation, middleware, route mounting
├── core/                # Cross-cutting concerns
│   ├── config.py        # Pydantic Settings (all env vars)
│   ├── jwt.py           # create/decode access + refresh tokens
│   ├── security.py      # bcrypt hashing, CORS, TrustedHost
│   ├── crypto.py        # Fernet/PBKDF2 credential encryption
│   ├── audit.py         # Security event logging
│   └── logging.py       # JSON + human log formatters
├── api/                 # HTTP layer
│   ├── deps.py          # Dependencies: get_db, get_current_user, verify_api_key
│   ├── middleware.py     # RequestId, Logging, SecurityHeaders, RateLimit
│   ├── handlers.py      # Global exception handlers
│   ├── router.py        # Aggregates all 46 route modules
│   └── routes/          # 46 endpoint modules
├── db/                  # Database
│   ├── session.py       # Engine + SessionLocal + Base
│   └── base.py          # Imports all models for Alembic discovery
├── models/              # 38 SQLAlchemy ORM models
├── schemas/             # 31 Pydantic validation schemas
├── crud/                # 21 CRUD operation modules
├── services/            # 35+ business logic services
│   ├── ai/              # LLM, RAG, memory, embeddings (18 files)
│   └── research/        # Research engine (6 files)
├── agents/              # Multi-agent system (8 agents + orchestrator)
├── brain/               # Trading brain (7 engines)
├── ict/                 # ICT smart engine (8 detection engines)
├── broker/              # Broker abstraction (11 providers)
│   └── providers/       # Provider implementations
└── collectors/          # Data collectors (macro, etc.)
```

## Module Responsibilities

| Module | Responsibility | Files |
|--------|---------------|-------|
| `core/` | Config, auth, encryption, logging, audit | 6 |
| `api/routes/` | HTTP endpoint definitions | 46 |
| `api/deps.py` | DI: DB sessions, current user, API key | 1 |
| `api/middleware.py` | Request/response processing | 4 classes |
| `models/` | SQLAlchemy table definitions | 38 |
| `schemas/` | Pydantic request/response validation | 31 |
| `crud/` | Database query operations | 21 |
| `services/` | Business logic | 35+ |
| `agents/` | AI agent implementations | 8 agents |
| `brain/` | Trading intelligence engines | 7 engines |
| `ict/` | Market structure detection | 8 engines |
| `broker/` | Broker/provider abstraction | 11 providers |

## Authentication Flow

1. Client sends `POST /api/v1/auth/login` with email/password
2. Backend verifies bcrypt hash, returns JWT access + refresh tokens
3. All subsequent requests include `Authorization: Bearer <token>`
4. Router-level `Depends(get_current_user)` validates every request
5. Auth routes (`/auth/*`) are excluded from JWT requirement
6. On 401, client uses refresh token to get new tokens (automatic rotation)

## Configuration

All environment variables are defined in `backend/src/core/config.py` via Pydantic `BaseSettings`. Key settings: `DATABASE_URL`, `JWT_SECRET_KEY`, `RATE_LIMIT_PER_MINUTE`, `CORS_ORIGINS`, `ENVIRONMENT`.

See [Configuration Reference](./CONFIG.md) for full details.

## Middleware Stack (order of execution)

1. **CORSMiddleware** — handles preflight, outermost
2. **TrustedHostMiddleware** — validates Host header (if configured)
3. **GZipMiddleware** — compresses responses ≥1 KB
4. **SecurityHeadersMiddleware** — security headers + request size limit
5. **RateLimitMiddleware** — in-memory sliding window per IP
6. **LoggingMiddleware** — request/response logging with timing
7. **RequestIdMiddleware** — X-Request-ID generation, innermost

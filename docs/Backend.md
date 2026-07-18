# Backend

## Tech Stack

- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy 2.0 (async-compatible)
- **Database**: PostgreSQL 16
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT + API Key
- **Server**: Uvicorn

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/        # 30+ route modules
│   │   ├── deps.py        # Dependency injection
│   │   ├── middleware.py   # Logging, rate limiting
│   │   └── router.py      # Main API router
│   ├── core/
│   │   ├── config.py      # Settings from environment
│   │   └── security.py    # JWT, API key, CORS
│   ├── crud/              # Database CRUD operations
│   ├── db/
│   │   ├── base.py        # Declarative base
│   │   └── session.py     # Database session
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
│       ├── ai/            # LLM-powered analysis
│       └── research/      # Research engine
├── tests/                 # 185+ tests
└── alembic/               # Migration scripts
```

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | JWT login |
| POST | `/api/v1/auth/refresh` | Token refresh |
| POST | `/api/v1/projects/{id}/trades` | Create trade |
| GET | `/api/v1/projects/{id}/trades` | List trades |
| POST | `/api/v1/projects/{id}/analyst/debrief` | AI trade debrief |
| GET | `/api/v1/projects/{id}/patterns` | Pattern discovery |
| POST | `/api/v1/projects/{id}/similarity/current` | Compare current environment |
| GET | `/api/v1/projects/{id}/decision/history` | Decision support history |
| GET | `/api/v1/projects/{id}/knowledge` | Knowledge rules |

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

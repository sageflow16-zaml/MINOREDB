# Backend

## Tech Stack

- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 16
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT (access + refresh tokens) + bcrypt password hashing
- **Server**: Uvicorn

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/        # 30+ route modules + auth
│   │   ├── deps.py        # Dependency injection (auth, DB, project)
│   │   ├── middleware.py   # Logging, rate limiting, security headers
│   │   └── router.py      # Main API router
│   ├── core/
│   │   ├── config.py      # Settings from environment
│   │   ├── jwt.py          # JWT token creation & validation
│   │   └── security.py    # Password hashing, CORS, compression
│   ├── crud/              # Database CRUD operations
│   ├── db/
│   │   ├── base.py        # Declarative base (all models imported)
│   │   └── session.py     # Database session
│   ├── models/            # SQLAlchemy models (27+ models)
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
│       ├── ai/            # LLM-powered analysis
│       └── research/      # Research engine
├── tests/                 # 185+ tests
└── alembic/               # Migration scripts
```

## Authentication

### User Registration

```
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Optional Name"
}
```

Returns `201` with access token, refresh token, and user data.

### User Login

```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Returns `200` with access token (30 min expiry), refresh token (7 day expiry), and user data.

### Token Refresh

```
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}
```

Issues a new access/refresh token pair (refresh rotation).

### Get Current User

```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

Returns the authenticated user's profile.

### Logout

```
POST /api/v1/auth/logout
```

Stateless logout (client discards tokens).

## Authorization

All routes under `/api/v1/` (except `/api/v1/auth/*`) require a valid JWT access token in the `Authorization: Bearer <token>` header.

Projects are user-scoped: every project belongs to a user, and project routes filter by the authenticated user's ID.

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Sign in |
| POST | `/api/v1/auth/refresh` | No | Refresh tokens |
| GET | `/api/v1/auth/me` | Yes | Current user |
| POST | `/api/v1/projects/{id}/trades` | Yes | Create trade |
| GET | `/api/v1/projects/{id}/trades` | Yes | List trades |
| POST | `/api/v1/projects/{id}/analyst/debrief` | Yes | AI trade debrief |
| GET | `/api/v1/projects/{id}/patterns` | Yes | Pattern discovery |
| POST | `/api/v1/projects/{id}/similarity/current` | Yes | Compare current environment |
| GET | `/api/v1/projects/{id}/decision/history` | Yes | Decision support history |
| GET | `/api/v1/projects/{id}/knowledge` | Yes | Knowledge rules |

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

**Note**: Tests require a `minore_test` database and override auth to use a fixed test user. No token is needed in the test client.

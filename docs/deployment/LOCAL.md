# Local Development Setup

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16
- Git

## Backend Setup

```bash
# Clone and enter directory
git clone <repo>
cd Project_Minore

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET_KEY

# Run migrations
alembic upgrade head

# Start backend
uvicorn src.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install

# Configure environment (optional)
cp .env.example .env

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

## Database Setup

```bash
# Create database
createdb minore_dev
# Or via psql:
psql -U postgres -c "CREATE DATABASE minore_dev;"

# Set DATABASE_URL in backend/.env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/minore_dev

# Run migrations
cd backend
alembic upgrade head
```

## Running Tests

```bash
# Backend tests (requires PostgreSQL)
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm run test          # Single run
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | `change-me-in-production` | JWT signing secret (min 32 chars) |
| `ENVIRONMENT` | No | `development` | `development`/`production`/`test` |
| `CORS_ORIGINS` | No | localhost:5173 | Comma-separated allowed origins |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Requests per minute per IP |
| `API_KEY` | No | — | Machine-to-machine API key |
| `WEBHOOK_SECRET` | No | — | TradingView webhook secret |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api/v1` | Backend API base URL |
| `VITE_API_PROXY` | No | `http://localhost:8000` | Dev proxy target |

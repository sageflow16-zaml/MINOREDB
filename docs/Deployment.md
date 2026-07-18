# Deployment Guide

## Prerequisites

- PostgreSQL 16
- Python 3.12+
- Node.js 20+
- A `JWT_SECRET_KEY` (generate with `openssl rand -hex 32`)

## Backend (Railway / Render)

```bash
cd backend

# Build
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run with gunicorn + uvicorn
gunicorn src.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Production PostgreSQL URL |
| `JWT_SECRET_KEY` | Strong random secret (min 32 chars) |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | Comma-separated frontend URLs |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | (none) | Shared API key for machine-to-machine access |
| `RATE_LIMIT_PER_MINUTE` | `100` | Global rate limit per IP |
| `DOCS_ENABLED` | `true` | Set `false` in production |
| `HSTS_ENABLED` | `false` | Enable behind TLS only |

## Frontend (Vercel)

```bash
cd frontend
npm install
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Full backend URL (e.g. `https://api.minore.app/api/v1`)

### SPA Routing

Create `vercel.json` in the frontend root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Docker

```bash
# Set JWT_SECRET_KEY before starting
export JWT_SECRET_KEY=$(openssl rand -hex 32)
docker-compose up --build -d
```

## Chrome Extension

```bash
cd extension
npm install
npm run build
```

Load `extension/dist/` as an unpacked extension at `chrome://extensions`.

In extension settings, set:
- **Backend URL**: Your production backend URL (e.g. `https://api.minore.app`)
- **Project ID**: Your Minore project ID

Then log in via the Account tab with your email and password.

> **Note**: For the extension to work in production, the backend must set `CORS_ORIGINS=*` or include the extension's `chrome-extension://` origin. This is safe because all API routes require JWT authentication.

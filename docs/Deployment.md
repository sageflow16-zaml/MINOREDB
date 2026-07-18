# Deployment Guide

## Backend — Railway (Recommended)

### Prerequisites

- A [Railway](https://railway.app) account connected to GitHub
- Your repo pushed to GitHub with the `backend/` directory included

### Step-by-Step: Railway Dashboard

#### 1. Create a New Project

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository (`Project_Minore` or whatever it's called)
4. **IMPORTANT**: After Railway imports the repo, click **Configure** on the service card
5. Set **Root Directory** to `backend` (this tells Railway to work inside `backend/`)
6. Railway will detect `railway.json`, see `builder: "DOCKERFILE"`, and build via `backend/Dockerfile`

#### 2. Add PostgreSQL

1. In the same project, click **New** → **Database** → **Add PostgreSQL**
2. Railway automatically injects the `DATABASE_URL` environment variable into the backend service
3. No configuration needed — our code reads it via `settings.DATABASE_URL`

#### 3. Set Environment Variables

In the backend service's **Variables** tab, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET_KEY` | `openssl rand -hex 32` output | **Required** — generate locally, paste here |
| `ENVIRONMENT` | `production` | Enables JSON logging |
| `CORS_ORIGINS` | `https://your-frontend-domain.com` | Your Vercel/Netlify domain |
| `RATE_LIMIT_PER_MINUTE` | `100` | Prevent abuse |
| `DOCS_ENABLED` | `false` | Hides Swagger in production |
| `HSTS_ENABLED` | `true` | Only if behind TLS (Railway provides this) |
| `API_KEY` | _(optional)_ | For machine-to-machine access |

> **Do NOT set `DATABASE_URL` manually** — Railway's PostgreSQL plugin injects it automatically.

#### 4. Deploy

1. Railway auto-deploys when you push to the connected branch
2. Or click **Deploy** in the Railway dashboard
3. Wait for the build log to show: `"Application starting up"` and `"Migrations complete."`
4. Railway assigns a `*.railway.app` domain — use this as your backend URL

#### 5. Verify

```bash
# Health check
curl https://your-service.railway.app/health
# → {"status":"healthy","version":"1.0.0","environment":"production"}

# Readiness (checks database)
curl https://your-service.railway.app/readiness
# → {"status":"ready","database":"connected"}

# API root
curl https://your-service.railway.app/
# → {"project":"Project Minore","status":"running","version":"1.0.0"}
```

### What happens on deploy

1. Railway clones the repo, enters `backend/`
2. Builds the Docker image (`python:3.12-slim`, installs deps, copies code)
3. Starts the container with `python entrypoint.py`
4. `entrypoint.py` runs `alembic upgrade head` (migrations)
5. Starts `uvicorn` on the port Railway provides (`$PORT`)

### Files that make this work

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Docker build instructions |
| `backend/railway.json` | Railway config (Docker builder, health check, restart policy) |
| `backend/entrypoint.py` | Migration runner + uvicorn starter |
| `backend/.dockerignore` | Excludes `.venv`, `.env`, tests, scripts from Docker image |
| `backend/Procfile` | Fallback if Nixpacks is used instead of Docker |
| `backend/alembic/env.py` | Overrides DB URL with `settings.DATABASE_URL` (line 21) |

## Frontend (Vercel)

```bash
cd frontend
npm install
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL`: `https://your-service.railway.app/api/v1` (the Railway domain + `/api/v1`)

### SPA Routing

Create `vercel.json` in the frontend root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Chrome Extension

```bash
cd extension
npm install
npm run build
```

Load `extension/dist/` as an unpacked extension at `chrome://extensions`.

In extension settings, set:
- **Backend URL**: `https://your-service.railway.app`
- **Project ID**: Your Minore project ID

Then log in via the Account tab with your email and password.

> **For the extension to work**, the backend must set `CORS_ORIGINS=*` or include the extension's `chrome-extension://` origin. This is safe because all API routes require JWT authentication.

## Local Development with Docker

```bash
export JWT_SECRET_KEY=$(openssl rand -hex 32)
docker-compose up --build -d
```

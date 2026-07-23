# Deployment Pipeline

## Overview

Project Minore uses a containerized deployment pipeline with GitHub Actions for CI/CD.

```
Developer → GitHub (push) → CI (test, build) → Release (tag) → CD (deploy)
```

## Environments

| Environment | URL | Purpose |
|------------|-----|---------|
| Development | `localhost:5173` (Vite) / `localhost:8000` (API) | Local development with hot-reload |
| Staging | TBD | Pre-production validation |
| Production | TBD | Live production |

## CI Pipeline (`.github/workflows/ci.yml`)

Triggers: push to `main`/`develop`, PR to `main`

### Jobs

| Job | Description |
|-----|-------------|
| `frontend` | TypeScript type check, vitest tests + coverage, npm audit |
| `backend` | Pytest with PostgreSQL service container, pip cache |
| `security` | npm audit, secrets grep, outdated deps check |
| `build` | Vite production build |

### Fast Feedback

- Jobs run in parallel where possible
- `concurrency` grouping cancels stale runs on same branch
- Frontend `--coverage` reports uploaded as artifacts

## Release Pipeline (`.github/workflows/release.yml`)

Triggers: tag push `v*.*.*`

### Jobs

| Job | Description |
|-----|-------------|
| `check-version` | Ensures VERSION file matches git tag |
| `docker-build` | Builds & pushes `backend` + `frontend` images to GHCR |
| `create-release` | Creates GitHub Release with changelog excerpt |

### Versioning

- Follows [Semantic Versioning 2.0](https://semver.org/)
- Version stored in `VERSION` file at repo root
- Tag format: `v{major}.{minor}.{patch}`
- Bump with: `python scripts/bump_version.py {patch|minor|major}`

## Docker Images

Published to `ghcr.io/<org>/project-minore-{backend,frontend}`.

### Tagging Strategy

| Tag | Example | Use |
|-----|---------|-----|
| `1.2.3` | `ghcr.io/org/minore-backend:1.2.3` | Exact version |
| `1.2` | `ghcr.io/org/minore-backend:1.2` | Latest patch in minor line |
| `sha-<hash>` | `ghcr.io/org/minore-backend:sha-a1b2c3d` | Development builds |

### Image Features

- **Backend**: Python 3.12-slim, non-root `appuser`, health check, multi-stage build
- **Frontend**: nginx:alpine, gzip, security headers (CSP, HSTS, X-Frame-Options), static caching

## Local Development with Docker Compose

```bash
docker compose up --build
```

This starts:
- PostgreSQL 16
- Backend API on `:8000`
- Frontend on `:80`
- Redis 7 (optional, for token blacklist)

## Production Checklist

See [PRODUCTION_CONFIG.md](../security/PRODUCTION_CONFIG.md) for full checklist.

### Critical Production Steps

1. Generate strong `JWT_SECRET_KEY`: `openssl rand -hex 32`
2. Set `ENVIRONMENT=production`
3. Configure PostgreSQL with SSL
4. Enable rate limiting (`RATE_LIMIT_PER_MINUTE=60`)
5. Set `CORS_ORIGINS` to your domain
6. Disable docs in production (`DOCS_ENABLED=False`)
7. Use a reverse proxy (nginx) with TLS termination

## Rollback Procedure

1. **Revert code**: `git revert <commit>` or `git checkout <previous-tag>`
2. **Redeploy**: Push to trigger CI, or re-tag previous Docker image
3. **Database**: Run `alembic downgrade -1` if migration rollback needed
4. **Verify health**: Check `/health` and `/readiness` endpoints

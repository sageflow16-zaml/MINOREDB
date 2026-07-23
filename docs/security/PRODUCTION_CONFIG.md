# Production Configuration Guide — Project Minore

**Version:** 1.1.0

---

## Required Environment Variables

### Backend

```env
# ── Critical (must be set) ──────────────────────────────────────────
DATABASE_URL=postgresql+psycopg://user:password@host:5432/minore
JWT_SECRET_KEY=<run: openssl rand -hex 32>

# ── Strongly Recommended ───────────────────────────────────────────
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-domain.com
ALLOWED_HOSTS=your-api-domain.com
RATE_LIMIT_PER_MINUTE=100
HSTS_ENABLED=true
DOCS_ENABLED=false
API_KEY=<generate-random-api-key>
WEBHOOK_SECRET=<generate-random-webhook-secret>

# ── Optional ────────────────────────────────────────────────────────
MAX_REQUEST_SIZE=10485760       # 10 MiB
MAX_UPLOAD_SIZE=5242880         # 5 MiB
MAX_PAGE_SIZE=1000
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend

```env
VITE_API_URL=/api/v1
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate strong `JWT_SECRET_KEY` (`openssl rand -hex 32`)
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DOCS_ENABLED=false` (hide Swagger/Redoc)
- [ ] Set `HSTS_ENABLED=true` (enforce HTTPS)
- [ ] Set `CORS_ORIGINS` to exact frontend domain(s)
- [ ] Set `ALLOWED_HOSTS` to exact API domain(s)
- [ ] Enable rate limiting (`RATE_LIMIT_PER_MINUTE=100`)
- [ ] Set `API_KEY` for machine-to-machine access
- [ ] Set `WEBHOOK_SECRET` for TradingView webhook validation
- [ ] Verify `MAX_REQUEST_SIZE=10485760` (10 MiB) is set
- [ ] Run `npm audit` and resolve any HIGH/CRITICAL vulnerabilities
- [ ] Verify CSP is not blocking app functionality

### Infrastructure

- [ ] TLS certificate configured and auto-renewing
- [ ] Nginx (or reverse proxy) configured with security headers
- [ ] Database backups configured (daily auto-backup + WAL archiving)
- [ ] Monitoring and alerting configured (health check endpoints)
- [ ] Secret scanning pre-commit hook installed (`gitleaks` or similar)
- [ ] Railway `JWT_SECRET_KEY`, `API_KEY`, `WEBHOOK_SECRET` set in service variables (not `.env`)
- [ ] `.env` files excluded from Docker build context (`.dockerignore` verified)

### Post-Deployment

- [ ] Verify `/health` returns `{"status": "healthy"}`
- [ ] Verify `/readiness` returns `{"status": "ready", "database": "connected"}`
- [ ] Test login flow end-to-end
- [ ] Test CORS by visiting frontend domain
- [ ] Verify security headers in browser DevTools → Network tab
- [ ] Test rate limiting by sending >100 requests in one minute (expect 429)
- [ ] Verify audit logs are being generated

---

## Production Architecture

```
                         ┌──────────────┐
                         │   Browser    │
                         │  (React SPA) │
                         └──────┬───────┘
                                │ HTTPS
                         ┌──────▼───────┐
                         │   CDN/Edge   │
                         │ (Vercel/CF)  │
                         └──────┬───────┘
                                │
                    ┌───────────▼───────────┐
                    │  Reverse Proxy        │
                    │  (Nginx / Cloudflare)  │
                    │  - TLS termination    │
                    │  - Rate limiting      │
                    │  - Security headers   │
                    │  - Request filtering  │
                    └───────────┬───────────┘
                                │
              ┌─────────────────▼────────────────┐
              │   FastAPI Backend                │
              │   (Uvicorn, multi-worker)         │
              │   - JWT validation               │
              │   - Audit logging                │
              │   - Rate limit (in-memory tier)  │
              │   - Security headers             │
              └─────────────────┬────────────────┘
                                │
              ┌─────────────────▼────────────────┐
              │   PostgreSQL                     │
              │   - Encrypted broker creds       │
              │   - WAL archiving                │
              │   - Daily automated backups      │
              └──────────────────────────────────┘
```

---

## Railway-Specific Configuration

### Service Variables

Set these in Railway dashboard (NOT in `.env`):
- `JWT_SECRET_KEY`
- `API_KEY`
- `WEBHOOK_SECRET`
- `DATABASE_URL` (auto-injected by Railway PostgreSQL plugin)

### Health Checks

Configured in `railway.json`:
- Path: `/health`
- Timeout: 180s
- Restart: on failure, 3 max retries

---

## Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| 5xx error rate | Backend logs | >1% of requests |
| 401/403 response count | Backend logs | >10/min |
| Rate limit 429 count | Backend logs | >0 (indicates attack) |
| Authentication failures | Audit logs | >5/min per IP |
| Database connection pool | PostgreSQL metrics | >80% utilization |
| Request latency p99 | Backend X-Response-Time | >5000ms |
| Backup failures | Cron job exit status | Any failure |

### Health Endpoints

```
GET /health       → {"status": "healthy"}
GET /readiness    → {"status": "ready", "database": "connected"}
GET /liveness     → {"status": "alive", "timestamp": ...}
GET /version      → {"version": "1.1.0", "environment": "production"}
```

---

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| SEV1 | Service unavailable or data breach | Immediate |
| SEV2 | Major feature degradation | 1 hour |
| SEV3 | Minor issue, no user impact | 24 hours |

### Response Playbook

**SEV1 — Suspected Breach:**
1. Rotate all secrets (JWT_SECRET_KEY, API_KEY, WEBHOOK_SECRET, DB passwords)
2. Revoke all active tokens (requires token blacklist deployment)
3. Isolate affected instances
4. Restore from last known good backup
5. Audit logs for attacker activity
6. Notify affected users

**SEV1 — Service Down:**
1. Check Railway dashboard for instance health
2. Check `/readiness` for database connectivity
3. Review recent deployment for breaking changes
4. Rollback to previous known good version if needed
5. Restart service via Railway dashboard

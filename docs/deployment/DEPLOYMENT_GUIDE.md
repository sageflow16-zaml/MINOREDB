# DEPLOYMENT_GUIDE.md

## Project Minore: End-to-End Deployment Guide

This guide covers deploying both the frontend and backend for Project Minore to production.

---

## Table of Contents

1. [Frontend Deployment](#frontend-deployment)
2. [Backend Deployment](#backend-deployment)
3. [Infrastructure & Environment](#infrastructure--environment)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

---

## Frontend Deployment

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Hosting platform: Docker, Netlify, Vercel, AWS S3/CloudFront, Nginx, etc.

### Build for Production

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/` (ready for static hosting)

### Option 1: Docker Deployment

**Build image:**

```bash
cd frontend
docker build -t minore-frontend:latest .
```

**Run container:**

```bash
docker run -p 80:5173 \
  -e VITE_API_URL=https://api.yourdomain.com/api/v1 \
  minore-frontend:latest
```

**Push to registry (ECR, Docker Hub, etc.):**

```bash
docker tag minore-frontend:latest YOUR_REGISTRY/minore-frontend:latest
docker push YOUR_REGISTRY/minore-frontend:latest
```

### Option 2: Static Hosting (Netlify)

1. Create `netlify.toml` in frontend root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[context.production]
  environment = { VITE_API_URL = "https://api.yourdomain.com/api/v1" }

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Connect GitHub repo to Netlify.
3. Set environment variables in Netlify dashboard.
4. Deploy.

### Option 3: AWS S3 + CloudFront

1. Build: `npm run build`
2. Upload `dist/` to S3 bucket:

```bash
aws s3 sync frontend/dist s3://your-bucket --delete
```

3. Create CloudFront distribution pointing to S3 bucket.
4. Configure CloudFront to serve `index.html` for 404s (SPA routing).
5. Set custom domain in CloudFront.

### Option 4: Nginx (Self-Hosted)

**nginx.conf:**

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  root /var/www/minore-frontend;
  index index.html;

  # SPA routing: serve index.html for all routes
  location / {
    try_files $uri /index.html;
  }

  # Caching strategy
  location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location /index.html {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
  }

  # Security headers
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Deploy:**

```bash
npm run build
sudo cp -r frontend/dist/* /var/www/minore-frontend/
sudo systemctl restart nginx
```

---

## Backend Deployment

### Prerequisites

- Python 3.10+
- PostgreSQL 12+ (or compatible database)
- Docker (optional)
- Uvicorn / Gunicorn

### Environment Setup

**Create `.env` in backend root:**

```bash
# Database
DATABASE_URL=postgresql://user:password@db-host:5432/minore_db

# Runtime
ENVIRONMENT=production

# CORS: your frontend domain(s)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_CREDENTIALS=true

# Security
DOCS_ENABLED=false
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000

# Rate limiting
RATE_LIMIT_PER_MINUTE=100

# Optional API key (for extra security)
API_KEY=your-secret-api-key-here
```

### Build & Run

**Via Gunicorn (production ASGI server):**

```bash
cd backend
python -m pip install -r requirements.txt gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 src.main:app
```

**Via Docker:**

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "src.main:app"]
```

Build:

```bash
docker build -t minore-backend:latest .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e CORS_ORIGINS="https://yourdomain.com" \
  -e ENVIRONMENT=production \
  minore-backend:latest
```

### Database Migration

Before starting the backend:

```bash
cd backend
alembic upgrade head
```

This applies all pending migrations to your database.

### Health Check

```bash
curl http://localhost:8000/health
# Returns: {"status": "ok"}

curl http://localhost:8000/ready
# Returns: {"status": "ready"}
```

---

## Infrastructure & Environment

### DNS & Reverse Proxy

**Option 1: Single Domain**

```
yourdomain.com          → Frontend (hosted on S3/Netlify/Docker/Nginx)
yourdomain.com/api/v1/* → Backend (reverse proxy or subdomain)
```

**Option 2: Subdomain (Recommended)**

```
yourdomain.com       → Frontend
api.yourdomain.com   → Backend
```

**Nginx reverse proxy for backend:**

```nginx
location /api/ {
  proxy_pass http://backend-service:8000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Load Balancing & Scaling

For high availability, run multiple backend replicas behind a load balancer (AWS ALB, Nginx LB, HAProxy).

**Example: Docker Compose (3 backend replicas)**

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: minore_db
      POSTGRES_PASSWORD: secure-password
    volumes:
      - db-data:/var/lib/postgresql/data

  backend:
    image: minore-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:secure-password@db:5432/minore_db
      ENVIRONMENT: production
      CORS_ORIGINS: https://yourdomain.com
    depends_on:
      - db
    deploy:
      replicas: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
```

---

## Pre-Deployment Checklist

### Frontend

- [ ] `npm run build` succeeds with no errors
- [ ] `dist/index.html` exists
- [ ] `.env` configured with `VITE_API_URL=<backend-url>`
- [ ] No console warnings/errors in dev build
- [ ] All pages tested in browser (Dashboard, Projects, Claims, etc.)
- [ ] API calls work against staging backend
- [ ] Mobile responsive design verified
- [ ] Security headers configured (if using Nginx)

### Backend

- [ ] `DATABASE_URL` points to production database
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] `.env` configured (CORS_ORIGINS, ENVIRONMENT, RATE_LIMIT, etc.)
- [ ] `/health` and `/ready` endpoints return 200
- [ ] API endpoints tested with `curl` / Postman
- [ ] Logs configured and monitored
- [ ] SSL/TLS certificate installed (if using HTTPS)
- [ ] Rate limiting & security headers enabled

### Infrastructure

- [ ] SSL/TLS certificates valid (HTTPS)
- [ ] DNS records propagated
- [ ] CORS properly configured
- [ ] Firewall rules allow 80/443/8000 as needed
- [ ] Backup strategy in place (database, config)
- [ ] Monitoring & alerting configured
- [ ] Log aggregation set up (CloudWatch, ELK, etc.)

---

## Post-Deployment Verification

### 1. Frontend Availability

```bash
curl -I https://yourdomain.com
# Should return 200 with Content-Type: text/html
```

### 2. API Connectivity

```bash
curl https://yourdomain.com/api/v1/health
# Should return: {"status": "ok"}
```

### 3. Full Flow (Browser)

1. Open https://yourdomain.com/login
2. Enter credentials
3. Navigate to Dashboard
4. Load data (check DevTools → Network)
5. Verify no 401/403 errors

### 4. Logs

- Check frontend logs (browser console, CDN logs)
- Check backend logs (Docker logs, app logs)
- Look for errors, timeouts, 5xx responses

---

## Troubleshooting

### Issue: Frontend returns blank page

**Solution:**
- Verify `dist/index.html` is served for all routes (SPA routing).
- Check browser console for JS errors.
- Verify `VITE_API_URL` environment variable is correct.

### Issue: 401 Unauthorized from API

**Solution:**
- Verify authentication backend is accessible.
- Check token is stored in localStorage.
- Verify `Authorization` header is present in requests (DevTools → Network).

### Issue: CORS errors

**Solution:**
- Ensure backend `CORS_ORIGINS` includes your frontend domain.
- Verify backend is returning `Access-Control-Allow-Origin` header.
- Restart backend after changing CORS config.

### Issue: Database connection timeout

**Solution:**
- Verify `DATABASE_URL` is correct.
- Check database is accessible from backend host.
- Verify firewall allows connection to database port.
- Check database credentials in `.env`.

### Issue: High latency / timeouts

**Solution:**
- Check backend logs for slow queries.
- Scale backend (increase replicas, CPU, RAM).
- Enable caching (Redis, CDN).
- Optimize database indexes.

---

## Monitoring & Logging

### Application Performance Monitoring (APM)

Recommended tools:
- New Relic
- Datadog
- AWS X-Ray
- Sentry (error tracking)

### Log Aggregation

Recommended tools:
- CloudWatch (AWS)
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Papertrail

### Metrics to Monitor

- API response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Memory & CPU usage
- Request volume

---

## Security Best Practices

1. **HTTPS Only**: Redirect HTTP to HTTPS.
2. **HSTS**: Enable strict transport security.
3. **API Key**: If enabled on backend, rotate regularly.
4. **CORS**: Allowlist frontend domain only.
5. **Rate Limiting**: Enable rate limiting on backend.
6. **Database**: Use strong passwords, restrict access.
7. **Secrets Management**: Use AWS Secrets Manager, Vault, etc.
8. **Firewall**: Restrict inbound traffic to necessary ports.
9. **DDoS Protection**: Use Cloudflare, AWS Shield, etc.
10. **Backups**: Regular database backups with encryption.

---

## Support

For issues or questions:
- Check logs: `docker logs <container>`
- Review error messages in browser console / network tab
- Test API manually: `curl -v https://api.yourdomain.com/api/v1/health`
- Refer to backend README for backend-specific troubleshooting

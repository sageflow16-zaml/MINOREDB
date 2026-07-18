# Deployment Guide

## Frontend (Vercel)

```bash
cd frontend
npm install
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Backend URL (e.g. `https://api.minore.app`)

## Backend (Railway / Render)

```bash
cd backend

# Build
pip install -r requirements.txt

# Run with gunicorn + uvicorn
gunicorn src.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000
```

Set environment variables:
- `DATABASE_URL`: Production PostgreSQL URL
- `SECRET_KEY`: Strong random secret
- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: Frontend URL
- `API_KEY`: (optional) API key for extension

## Docker

```bash
docker-compose up --build -d
```

For production, use `docker-compose.prod.yml` with:
- Hardened CORS origins
- Volume-mounted secrets
- Environment-specific configuration

## Chrome Extension

```bash
cd extension
npm install
npm run build
```

Load `extension/dist/` as an unpacked extension at `chrome://extensions`.

For distribution, zip the dist folder and publish to Chrome Web Store.

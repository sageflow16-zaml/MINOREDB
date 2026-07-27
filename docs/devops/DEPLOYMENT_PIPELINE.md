# Deployment Pipeline (v1.0)

## Overview

Project Minore v1.0 uses Supabase for backend services and Vercel for frontend hosting. No Docker containers or Python backend are deployed.

```
Developer → GitHub (push) → Vercel auto-deploy (frontend) → Supabase (backend)
```

## Environments

| Environment | Frontend URL | Backend | Purpose |
|------------|-------------|---------|---------|
| Development | `localhost:5173` | `supabase start` (local) | Hot-reload local dev |
| Production | Vercel deployment | Supabase Cloud | Live production |

## CI Pipeline

Triggers: push to `main`, PR to `main`

### Jobs (configured via GitHub Actions)

| Job | Description |
|-----|-------------|
| `frontend` | TypeScript type check, vitest tests, lint |
| `build` | Vite production build verification |

## Release Pipeline

Triggers: tag push `v*.*.*`

### Jobs

| Job | Description |
|-----|-------------|
| `check-version` | Ensures package.json version matches git tag |
| `create-release` | Creates GitHub Release with changelog excerpt |

### Versioning

- Follows [Semantic Versioning 2.0](https://semver.org/)
- Tag format: `v{major}.{minor}.{patch}`

## Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

Or connect GitHub repo for auto-deploy on push to `main`.

### Environment Variables

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project dashboard → Settings → API |

## Backend Deployment (Supabase)

### Database

```bash
supabase link --project-ref <your-ref>
supabase db push
```

### Edge Functions

```bash
supabase functions deploy ai
supabase functions deploy broker-sync
supabase functions deploy obsidian-sync
supabase functions deploy replay-data
supabase functions deploy automation-connector
supabase functions deploy collector
supabase functions deploy mt5
supabase functions deploy tv-webhook
supabase functions deploy context
```

### Edge Function Secrets

```bash
supabase secrets set OPENAI_API_KEY=<key>
supabase secrets set ALPHAVANTAGE_API_KEY=<key>
```

## Rollback Procedure

1. **Frontend**: Re-deploy previous Vercel deployment from dashboard
2. **Database**: `supabase db diff` to review changes, then revert migration
3. **Edge Functions**: `supabase functions deploy <name> --version <previous-version>`

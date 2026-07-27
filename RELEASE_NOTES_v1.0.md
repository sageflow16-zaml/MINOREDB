# Project Minore v1.0.0 — Release Notes

**Release Date:** July 27, 2026

---

## Executive Summary

Project Minore v1.0.0 represents a complete architectural transformation. The entire backend has been migrated from a self-hosted FastAPI (Python) stack to the Supabase platform (PostgreSQL, Auth, Edge Functions). This migration eliminates server management, reduces operational complexity, improves security with Row Level Security, and simplifies the development workflow to a single frontend application backed by Supabase.

The migration touches every layer of the stack: 51 API service modules rewritten, 29 database migrations consolidated, 9 Edge Functions deployed, and zero references to FastAPI, Axios, or the previous Python backend remaining. The frontend continues to use React 18 + TypeScript + Vite + shadcn/ui + TanStack Query, now communicating directly with Supabase via the `supabase-js` SDK.

**Version:** 1.0.0 (supersedes pre-migration v0.9.0)

---

## What's New

### Supabase Platform (Replaces FastAPI + Render + Neon)

- **PostgreSQL 16** — Managed database with point-in-time recovery, connection pooling, and automated backups
- **Row Level Security** — Every database table has RLS policies enforcing tenant isolation at the database level
- **Supabase Auth** — Email/password authentication with built-in session management, rate limiting, and email confirmation flows
- **Supabase Storage** — S3-compatible object storage with RLS-protected buckets for trade images, avatars, and screenshots
- **Supabase Studio** — Web-based database browser, SQL editor, and table management UI included

### Edge Functions (Deno/TypeScript, Replaces FastAPI Routes)

Nine serverless Edge Functions handle all server-side business logic:

| Function | Purpose |
|----------|---------|
| `ai` | AI analysis, trade debriefing, pattern detection |
| `broker-sync` | Multi-broker data synchronization (MT4, MT5, cTrader, OANDA, Binance) |
| `obsidian-sync` | Bidirectional Obsidian vault synchronization |
| `replay-data` | Historical trade replay data serving |
| `automation-connector` | Rule-based automation triggers and workflow execution |
| `collector` | Economic calendar and market data collection (AlphaVantage) |
| `mt5` | MetaTrader 5 direct integration bridge |
| `tv-webhook` | TradingView webhook receiver and trade signal processor |
| `context` | Market context enrichment for trade analysis |

### Frontend API Layer (51 Modules, supabase-js)

All 51 API service modules now use `@supabase/supabase-js` v2 directly — no HTTP client, no REST endpoints, no Axios. The frontend queries the database and invokes Edge Functions through the Supabase client SDK.

### Simplified Deployment

- **2 environment variables** (down from 22+)
- **1 hosting platform** for the frontend (Vercel) + 1 for backend (Supabase)
- No Docker, no Python, no Redis, no server configuration

---

## Breaking Changes

### For Developers

1. **Backend Removal** — The `backend/` directory no longer contains application code. All previously served functionality is now provided by Supabase. If you were running the FastAPI backend locally, that workflow is replaced by `supabase start` for local development.

2. **Environment Variables** — All backend environment variables are removed. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required.

3. **API Architecture** — REST endpoints (`/api/v1/trades`, `/api/v1/auth/login`, etc.) are gone. The frontend now communicates directly with PostgreSQL via `supabase-js`. Edge Functions are invoked via `supabase.functions.invoke()`.

4. **Authentication** — Custom JWT tokens are replaced by Supabase Auth sessions. Login/signup now uses `supabase.auth.signInWithPassword()` / `supabase.auth.signUp()`. Session management is handled by the Supabase client.

5. **File Uploads** — Multipart HTTP uploads are replaced by `supabase.storage.from('bucket').upload()`. Previously uploaded files in the old storage system are not automatically migrated.

6. **Database Migrations** — Alembic migration files are removed. All schema changes are now managed via Supabase SQL migrations in `supabase/migrations/`.

7. **Testing** — The Python pytest test suite is removed. Testing is now done through Vitest on the frontend side.

8. **Local Development** — Requires Supabase CLI (`supabase start`) instead of `uvicorn` + local PostgreSQL.

### For End Users

- No breaking changes to the user-facing application. All features work identically or with improved performance.
- Session persistence may require re-login once after the migration is deployed.

---

## Migration Guide (For Previous FastAPI Users)

If you were running the previous FastAPI-based version of Project Minore (pre-v1.0), follow these steps:

### Step 1: Export Your Data

```bash
# Dump your existing PostgreSQL database
pg_dump -U your_user -d minore > minore_backup.sql
```

### Step 2: Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Copy your project URL and anon key

### Step 3: Run Migrations

```bash
# Link your local repo to the new Supabase project
supabase link --project-ref <your-ref>

# Apply all 29 migrations
supabase db push
```

### Step 4: Import Your Data (if needed)

```bash
# Transform and import your old backup
psql "$SUPABASE_DB_CONNECTION_STRING" < minore_backup_adapted.sql
```

> **Note:** The schema has changed significantly. Direct import of old backups may require schema adaptation. See `supabase/migrations/` for the new schema.

### Step 5: Deploy Edge Functions

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

### Step 6: Set Frontend Environment Variables

```bash
# In your Vercel project or .env file:
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 7: Deploy Frontend

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel or your hosting provider
```

---

## Deployment Checklist

### Prerequisites

- [ ] Supabase CLI installed (`npm i -g supabase`)
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Node.js 20+
- [ ] Supabase project created and linked

### Database

- [ ] All 29 migrations applied (`supabase db push`)
- [ ] Extensions enabled: `vector`, `pgcrypto`
- [ ] RLS policies verified for all tables
- [ ] Storage buckets created with RLS policies
- [ ] SQL RPC functions deployed and testable

### Edge Functions

- [ ] All 9 functions deployed (`supabase functions deploy`)
- [ ] Secrets set: `OPENAI_API_KEY`, `ALPHAVANTAGE_API_KEY`
- [ ] Function invocation works from frontend

### Authentication

- [ ] Email auth enabled in Supabase dashboard
- [ ] Email confirmation set to `true` for production
- [ ] Session duration configured (3600s access, 2592000s refresh)
- [ ] Anonymous sign-ins disabled

### Frontend

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Vercel
- [ ] TypeScript passes with zero errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] SPA rewrites configured in `vercel.json`

### Verification

- [ ] Login/register flow works end-to-end
- [ ] Dashboard loads with correct stats
- [ ] Trade CRUD operations work
- [ ] AI analysis returns results
- [ ] Knowledge graph renders
- [ ] File uploads to storage succeed
- [ ] Edge Function invocations succeed
- [ ] Mobile responsive layout verified
- [ ] Lighthouse score ≥ 80 on mobile

---

## Known Issues

1. **Edge Function Cold Starts** — The first invocation of an Edge Function after a period of inactivity may take 1–2 seconds. Subsequent calls are fast. This is expected behavior for serverless Deno functions on Supabase's free tier.

2. **Supabase Free Tier Limits** — The free tier includes 500 MB database, 5 GB bandwidth, and 50,000 Edge Function invocations per month. Heavy usage may require upgrading to a Pro plan.

3. **Local Development Requires Supabase CLI** — Unlike the previous FastAPI setup (which only needed Python), local development now requires the Supabase CLI and Docker for running the local Supabase stack.

4. **Chrome Extension** — The extension still uses the older API pattern and may need updates to work with the new architecture. It is maintained separately.

5. **Obsidian Plugin** — The Obsidian plugin retains its direct sync logic and does not use Supabase Edge Functions. It will be updated in a future release.

6. **No Offline Support** — The application requires network connectivity to Supabase. There is no local caching or offline mode.

7. **Search Performance** — Full-text search across large datasets may be slower than the previous custom search implementation. Future optimization with PostgreSQL full-text indexes is planned.

---

## Resources

- **Repository:** https://github.com/sageflow16-zaml/MINOREDB
- **Supabase Documentation:** https://supabase.com/docs
- **Vercel Deployment Guide:** https://vercel.com/docs
- **Migration Design Document:** [/MIGRATION_DESIGN.md](./MIGRATION_DESIGN.md)
- **Changelog:** [/CHANGELOG.md](./CHANGELOG.md)

---

*Project Minore v1.0.0 — Built with React, Supabase, and TypeScript.*

# Changelog

All notable changes to Project Minore are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-07-27

### Added
- **Supabase Platform Migration** — Entire backend replaced with Supabase ecosystem
  - PostgreSQL 16 database with 29 migration files covering all 168+ tables
  - Row Level Security (RLS) policies on all tables for tenant isolation
  - Supabase Auth for email/password authentication with session management
  - Supabase Storage with 4 buckets (`trade-images`, `avatars`, `replay-screenshots`, `knowledge-images`)
  - 51 API service modules rewritten to use `supabase-js` client SDK directly
- **Edge Functions (Deno/TypeScript)** — 9 serverless functions replacing FastAPI endpoints
  - `ai` — AI analysis, trade debrief, pattern detection
  - `broker-sync` — Multi-broker data synchronization
  - `obsidian-sync` — Bidirectional Obsidian vault sync
  - `replay-data` — Historical trade replay data serving
  - `automation-connector` — Rule-based automation triggers
  - `collector` — Economic calendar and market data collection
  - `mt5` — MetaTrader 5 integration bridge
  - `tv-webhook` — TradingView webhook receiver and processor
  - `context` — Context enrichment for trade analysis
- **SQL RPC Functions** — 20+ database functions for complex queries (dashboard stats, trade statistics, similarity search, analytics)
- **Frontend API Layer** — 51 service modules under `frontend/src/api/` using `@supabase/supabase-js` v2
- **Environment Configuration** — Simplified to 2 variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Edge Function Client** — `callEdgeFunction()` utility in `frontend/src/lib/edgeFunctions.ts` for invoking Supabase Edge Functions
- **100+ Page Components** — Full set of route pages migrated to Supabase data sources
- **TypeScript Strictness** — Zero type errors across the entire frontend codebase

### Removed
- **FastAPI Backend** — Entire Python backend removed (all `backend/src/` directories)
- **Axios HTTP Client** — All Axios imports and HTTP client code removed from frontend
- **SQLAlchemy ORM** — All SQLAlchemy models, sessions, and Alembic migrations removed
- **Pydantic Schemas** — Request/response validation schemas removed (handled by TypeScript + Supabase types)
- **JWT Auth (Custom)** — Custom PyJWT/bcrypt authentication removed (replaced by Supabase Auth)
- **Uvicorn/Gunicorn** — ASGI/WSGI server configuration removed
- **Redis Dependency** — Redis caching layer removed (Supabase Realtime + in-memory caching used instead)
- **Render Hosting** — `render.yaml` blueprint removed (backend now runs on Supabase)
- **Neon PostgreSQL** — External database provider removed (moved to Supabase PostgreSQL)
- **Prometheus Monitoring** — Custom metrics endpoint removed (using Supabase Dashboard + Vercel Analytics)
- **Docker Compose for Backend** — Full-stack Docker Compose deprecated (frontend-only Dockerfile retained)
- **Backend Environment Variables** — 20+ backend env vars removed (DATABASE_URL, JWT_SECRET_KEY, CORS_*, etc.)
- **Backend Requirements** — Python 3.12, `requirements.txt`, `Pipfile` all removed
- **Backend Test Suite** — Pytest suite removed (testing now via Vitest on frontend)
- **FastAPI Swagger/ReDoc** — Auto-generated API docs removed (replaced by Supabase docs)
- **Custom Rate Limiting** — Server-side rate limiting middleware removed (Supabase handles rate limits)

### Changed
- **Frontend API Calls** — All 51 service modules rewritten from Axios REST calls to `supabase-js` queries
- **Data Fetching** — Direct `supabase.from('table').select()` replaces HTTP `GET/POST/PUT/DELETE` calls
- **Authentication Flow** — Custom JWT login replaced with `supabase.auth.signInWithPassword()` / `supabase.auth.signUp()`
- **File Uploads** — Axios multipart uploads replaced with `supabase.storage.from('bucket').upload()`
- **Webhook Handling** — FastAPI webhook endpoints replaced with Supabase Edge Functions
- **Database Migrations** — Alembic (Python) migrations replaced with Supabase SQL migrations
- **API Architecture** — RESTful HTTP endpoints replaced with direct database queries + Edge Functions for business logic
- **Development Workflow** — Local backend server (uvicorn) replaced with `supabase start` (local Supabase stack)
- **Deployment** — Render + Neon deployment replaced with Supabase + Vercel
- **Environment Variables** — Reduced from 20+ backend + 2 frontend vars to just 2 frontend vars
- **Project Structure** — `backend/` directory no longer contains application code (only vestigial `.dockerignore` and `.venv`)
- **Package Dependencies** — Removed `axios`, removed all Python dependencies; added `@supabase/supabase-js` v2.110.8

### Fixed
- **TypeScript Errors** — All TypeScript strict-mode errors resolved across the codebase
- **Production Build** — Vite production build passes with zero warnings
- **Build Artifacts** — Output directory correctly configured as `dist` in `vercel.json`
- **SPA Routing** — Rewrites configured in `vercel.json` for client-side routing support

### Security
- **Row Level Security** — All database tables protected by RLS policies scoped to authenticated user's projects
- **Supabase Auth** — Battle-tested authentication with built-in rate limiting, session management, and email confirmation
- **No Backend Secrets** — Zero server-side secrets in the frontend build (only public anon key exposed)
- **SQL Injection Protection** — Parameterized queries via `supabase-js` eliminate injection vectors
- **XSS Protection** — React auto-escaping renders all user content safely
- **Storage RLS** — Storage buckets protected with RLS policies ensuring users can only access their own data

### Performance
- **Reduced Latency** — Direct database queries eliminate HTTP round-trip overhead of REST API layer
- **Supabase Connection Pooling** — Built-in PgBouncer connection pooling for efficient database access
- **Edge Function Cold Starts** — Deno Edge Functions optimized for sub-2s cold start times
- **Vite Code Splitting** — Frontend chunks optimized for initial load under 3s on 3G

---

## [0.9.0] — 2026-06-15

### Added
- Pre-migration baseline with FastAPI backend and Axios frontend
- Full feature set: Trade Journal, AI Analyst, Knowledge Graph, Pattern Discovery, Similarity Engine, Decision Support
- Chrome Extension for FXReplay trade detection
- Obsidian plugin for bidirectional note sync
- ICT Smart Engine with FVG, Order Blocks, Liquidity Zones
- Multi-broker integration framework
- Comprehensive test suite (pytest + vitest)
- Docker Compose for full-stack local development

[0.9.0]: https://github.com/sageflow16-zaml/MINOREDB/releases/tag/v0.9.0
[1.0.0]: https://github.com/sageflow16-zaml/MINOREDB/releases/tag/v1.0.0

# Minore — Deployment Guide

## Prerequisites

| Tool    | Version | Installed | Purpose                   |
| ------- | ------- | --------- | ------------------------- |
| Node.js | ≥ 18    | ✓ v24     | Frontend build            |
| npm     | ≥ 9     | ✓ v11     | Package manager           |
| Git     | ≥ 2.30  | ✓         | Version control           |
| Supabase CLI | 2.109+ | ✓    | DB migrations, Edge Functions |
| Vercel CLI | 57+    | ✓         | Frontend deployment       |

## Step 1: Create Supabase Project

1. Go to **https://supabase.com/dashboard/projects** → **New project**
2. Choose **Organization**, enter project name (e.g. `minore-prod`)
3. Set a strong **Database Password** and save it
4. Choose a **Region** close to your users
5. Click **Create new project** (takes ~2 min)
6. Once ready, go to **Project Settings > API** and copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public key**
7. Go to **Project Settings > API** and copy the **service_role key** (keep secret)

## Step 2: Enable Extensions

In the Supabase Dashboard → **SQL Editor**, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
```

Or enable via **Database → Extensions** in the dashboard.

## Step 3: Link Supabase CLI & Run Migrations

```bash
# Login to Supabase (opens browser for OAuth)
supabase login

# Link your local project to the remote project
supabase link --project-ref <your-project-ref>

# The ref is the subdomain in your project URL
# e.g. https://abcdefghijklm.supabase.co → ref = "abcdefghijklm"

# Run all 21 migrations
supabase db push

# Verify
supabase db dump --local
```

## Step 4: Set Edge Function Secrets

```bash
# Required for AI functions
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Optional: alternative API
supabase secrets set OPENROUTER_API_KEY=sk-xxxxxxxxxxxx
supabase secrets set OPENAI_BASE_URL=https://openrouter.ai/api/v1
supabase secrets set AI_MODEL=gpt-4o-mini

# Required for collector (economic calendar)
supabase secrets set ALPHAVANTAGE_API_KEY=xxxxxxxx
```

## Step 5: Deploy Edge Functions

```bash
# Deploy all 8 functions
supabase functions deploy ai
supabase functions deploy collector
supabase functions deploy broker-sync
supabase functions deploy automation-connector
supabase functions deploy obsidian-sync
supabase functions deploy replay-data
supabase functions deploy mt5
supabase functions deploy tv-webhook

# Verify deployment
supabase functions list
```

## Step 6: Configure Authentication

In Supabase Dashboard → **Authentication → Settings**:

- [ ] **Email Auth**: Enabled (already by default)
- [ ] **Confirm email**: Set to `true` for production
- [ ] **Security → Allow anonymous sign-ins**: Disabled
- [ ] **Session duration**: 3600s access token, 2592000s refresh

## Step 7: Configure Storage

In Supabase Dashboard → **Storage**:

Create the following buckets with the listed policies:

### Bucket: `trade-images`
- **Public**: No
- **RLS**: Add policy → `INSERT` with `(auth.uid() IN (SELECT user_id FROM project WHERE id = (SELECT project_id FROM trade WHERE id = (bucket_id()::uuid))))`
- **RLS**: Add policy → `SELECT` with same condition

### Bucket: `avatars`
- **Public**: Yes
- **RLS**: Add policy → `INSERT` with `(auth.uid() = (storage.foldername())[1]::uuid)`
- **RLS**: Add policy → `UPDATE` with same condition

### Bucket: `replay-screenshots`
- **Public**: No
- **RLS**: Same pattern as `trade-images` scoped to replay project

### Bucket: `knowledge-images`
- **Public**: No
- **RLS**: Same pattern scoped to knowledge concept project

## Step 8: Set Frontend Env Vars & Deploy to Vercel

```bash
# From the project root
vercel login                              # opens browser for OAuth

# Link to Vercel project
vercel link

# Set production environment variables
vercel env add VITE_SUPABASE_URL
# Paste: https://<your-project>.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: <your-anon-key>

# Set them for production only (default prompt: Y)

# Deploy
vercel --prod

# Or via GitHub integration: push to main branch
```

Alternative: Connect GitHub repo in Vercel dashboard:
1. Go to **https://vercel.com/new**
2. Import `sageflow16-zaml/minore`
3. Framework preset: **Vite**
4. Root directory: `frontend`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Environment variables: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
8. Deploy

## Step 9: Production Verification Checklist

Run each check after deployment:

### Authentication
- [ ] Visit login page → renders without errors
- [ ] Register new user → profile created in `public.profiles`
- [ ] Login → redirects to dashboard
- [ ] Session persists on page refresh
- [ ] Logout → redirects to login
- [ ] Protected routes redirect to login when unauthenticated

### Database & RLS
- [ ] Can create a project
- [ ] Can view own projects only
- [ ] Cannot view other users' projects (403)
- [ ] RPC `get_dashboard_stats` returns valid JSON
- [ ] RPC `get_trade_statistics` returns valid JSON
- [ ] RPC `find_similar_trades` returns results
- [ ] Soft-delete works (sets `deleted_at`)

### Edge Functions
- [ ] `supabase functions list` shows all 8 deployed
- [ ] AI function responds (test via dashboard or curl)
- [ ] Webhook endpoint accessible (no 404)

### Storage
- [ ] Can upload trade screenshot
- [ ] Can view own uploaded image
- [ ] Cannot access another user's image directly via URL
- [ ] Avatar upload works
- [ ] Avatar public URL is accessible

### Frontend Pages
- [ ] Dashboard loads with correct stats
- [ ] Trades page loads and lists trades
- [ ] Analytics pages show charts without errors
- [ ] Knowledge Center loads categories and concepts
- [ ] Trader Intelligence shows profile/dashboard
- [ ] Research Engine can submit a question
- [ ] Search returns results across entities
- [ ] All navigation links work
- [ ] Mobile responsive (check at 375px width)
- [ ] Page transitions smooth (no visible flickering)

### Performance
- [ ] Lighthouse score ≥ 80 on mobile
- [ ] Initial load < 3s on 3G
- [ ] Chunks are code-split (check Network tab)
- [ ] No render-blocking resources
- [ ] Images lazy-loaded

### Security
- [ ] No console errors (open DevTools)
- [ ] All API calls go through Supabase (no leaked backend URLs)
- [ ] anon key is safe (Row Level Security enforced)
- [ ] CORS headers correct for Edge Functions
- [ ] SQL injection not possible (parameterized queries via supabase-js)
- [ ] XSS not possible (React auto-escapes)

### Monitoring
- [ ] Supabase database size within limits
- [ ] Edge Function cold starts acceptable (< 2s)
- [ ] Auth rate limits not hit by normal usage
- [ ] Vercel Analytics shows no 4xx/5xx errors (enable in dashboard)

## Rollback Plan

### Database:
```bash
# Reset entire database
supabase db reset

# Or manually revert: restore from backup
```

### Edge Functions:
```bash
supabase functions delete <function-name>
# Re-deploy previous version
```

### Frontend:
```bash
vercel rollback
```

## Post-Deployment

- [ ] Enable **Vercel Analytics** for performance monitoring
- [ ] Set up **Sentry** (or similar) for error tracking
- [ ] Configure **daily database backup** in Supabase dashboard (Pro plan)
- [ ] Add **custom domain** in Vercel dashboard (if needed)
- [ ] Enable **Supabase Realtime** if real-time features are needed
- [ ] Create **health check endpoint** for uptime monitoring

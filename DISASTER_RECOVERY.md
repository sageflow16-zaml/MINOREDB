# MINOREDB — Disaster Recovery Procedures

**Version:** 1.0.1 · **Date:** 2026-08-09 · ** infra:** Vercel + Supabase

---

## 1. Vercel Deployment Rollback

**Trigger:** Production deployment introduces a critical regression (broken auth, data loss, SEV-1).

**Prerequisites:**
- Vercel CLI authenticated (`vercel login`) or access to Vercel Dashboard
- GitHub access to identify the last-known-good commit

**Procedure:**
1. Identify the last-known-good deployment:
   ```bash
   vercel ls --prod
   ```
2. Rollback to a specific deployment:
   ```bash
   vercel rollback <deployment-url>
   ```
3. Alternatively, revert the `main` branch and let CI redeploy:
   ```bash
   git revert <bad-commit>
   git push origin main
   ```
4. Verify: load `https://minoredb.vercel.app/login`, confirm auth flow works.

**Rollback/Abort:** If the rollback deployment itself is broken, promote the previous deployment again via `vercel rollback <earlier-deployment-url>`.

---

## 2. Git Commit Rollback

**Trigger:** A pushed commit introduced a regression not yet deployed.

**Prerequisites:**
- Git write access to `origin/main`
- The bad commit has not been pulled by other developers (or coordinate)

**Procedure:**
1. Revert the specific commit:
   ```bash
   git revert <commit-sha>
   git push origin main
   ```
2. If the commit is the latest and unpushed locally:
   ```bash
   git reset --soft HEAD~1
   git stash
   git push origin main
   ```
3. CI will trigger automatically; verify green at `github.com/anomalyco/minoredb/actions`.

**Rollback/Abort:** If the revert breaks something, revert the revert: `git revert <revert-commit-sha>`.

---

## 3. Supabase Migration Recovery

**Trigger:** A pushed migration corrupts schema, breaks RLS, or drops a column.

**Prerequisites:**
- Supabase CLI v2.111.0 installed
- `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` set
- Direct database access (psql) as fallback

**Procedure:**
1. **Do NOT push a "fix" migration blindly.** First assess:
   ```bash
   supabase link --project-ref $SUPABASE_PROJECT_REF
   supabase migration list
   ```
2. If the migration can be reverted by a new corrective migration, write one:
   ```sql
   -- supabase/migrations/000XX_fix_<issue>.sql
   ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <column> <type>;
   ```
   Then: `supabase db push`
3. If the migration caused data loss and a backup exists, restore (§5).
4. Emergency direct-DB fix (use with extreme caution):
   ```bash
   psql $DIRECT_DATABASE_URL -f fix.sql
   ```

**Rollback/Abort:** If the corrective migration fails, roll back the transaction (Supabase migrations run in a transaction and will auto-rollback on error).

---

## 4. Database Backup

**What exists:** Supabase automated daily backups (7-day retention on the Pro plan) + manual dump capability.

**Backup creation (manual):**
```bash
pg_dump $DIRECT_DATABASE_URI --schema-only -f schema_backup.sql
pg_dump $DIRECT_DATABASE_URI --data-only -f data_backup.sql
# Or full:
pg_dump $DIRECT_DATABASE_URI -f full_backup.sql
```

**Retention:** 7 days (Supabase Pro automated). Manual dumps should be stored outside Supabase (e.g., encrypted S3, local encrypted storage).

**Automated:** Yes — Supabase Pro runs daily automated backups.

**Restore verified:** RESTORE UNVERIFIED. Backups exist; a full restore drill has not been performed in an isolated environment.

---

## 5. Database Restore

**Trigger:** Data corruption, accidental deletion, or migration failure requiring point-in-time recovery.

**Prerequisites:**
- Supabase automated backup (within 7 days) OR manual `pg_dump` file
- A safe restore target (ideally a fresh Supabase project, NOT production, until verified)

**Procedure:**
1. **Preferred (Supabase automated):** Contact Supabase support for point-in-time recovery within the 7-day window.
2. **Manual restore to a clean project:**
   ```bash
   # Create a fresh Supabase project for verification
   createdb $CLEAN_DB_URL
   psql $CLEAN_DB_URL -f full_backup.sql
   # Verify row counts, RLS policies, and key queries
   ```
3. **If restoring over production** (destructive — only for total loss):
   ```bash
   pg_restore --clean --if-exists $DIRECT_DATABASE_URI full_backup.sql
   ```

**Verification:** After restore, run:
```sql
SELECT count(*) FROM auth.users;
SELECT count(*) FROM project;
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**RESTORE STATUS:** RESTORE UNVERIFIED. Automated backups exist; no full restore drill has been executed.

---

## 6. Secret Rotation

**Trigger:** Credential leak, suspected breach, or scheduled rotation.

**Prerequisites:**
- Access to Supabase Dashboard → Settings → API
- Access to Vercel Dashboard → Settings → Environment Variables
- `SUPABASE_ACCESS_TOKEN` with project admin rights

**Procedure:**
1. **Supabase anon key rotation:**
   - Supabase Dashboard → Settings → API → Regenerate anon key
   - Update `VITE_SUPABASE_ANON_KEY` in Vercel env vars
   - Redeploy: `vercel --prod`
2. **Supabase service_role key rotation:**
   - Same as above for service_role key
   - Update all Edge Functions that use it (they read from env)
   - Update CI secrets (`SUPABASE_ACCESS_TOKEN` in GitHub)
3. **Supabase JWT secret:**
   - Supabase Dashboard → Settings → API → JWT Settings → Regenerate
   - **WARNING:** This invalidates ALL existing user sessions. Coordinate with users.
4. **Vercel deploy tokens:** Rotate via Vercel Dashboard → Settings → Tokens.

**Verification:** After rotation, verify auth flow (login → dashboard) works with the new keys.

---

## 7. Environment Variable Recovery

**Trigger:** Env vars lost from Vercel dashboard or local `.env.local` deleted.

**Prerequisites:**
- `.env.example` in repo (documents all required vars)
- Access to Supabase Dashboard for anon/service keys

**Procedure:**
1. Copy example: `cp frontend/.env.example frontend/.env.local`
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API.
3. Sentry/PostHog keys are optional — omit for local dev; the code stays inert without them.
4. For Vercel production: Dashboard → Settings → Environment Variables → re-add from a secure vault.

**Verification:** `npm run dev` boots without errors; auth flow works.

---

## 8. Authentication Incident

**Trigger:** Users cannot login, sessions invalidated unexpectedly, auth returns 500.

**Prerequisites:**
- Supabase Dashboard access
- Sentry access (if configured) for error traces

**Procedure:**
1. Check Supabase Auth health: Dashboard → Authentication → Users (can you list users?).
2. Check for recent JWT secret rotation (see §6) — if rotated, sessions are invalidated by design.
3. Check Edge Function logs: `supabase functions logs --follow`
4. **Immediate containment:** If auth is broken for all users, rollback the last deployment (§1).
5. **If specific to MFA or OAuth:** Disable the affected provider in Supabase Dashboard → Authentication → Providers.
6. **Investigation:** Check Sentry for `auth/` error traces; check Supabase logs for 500s on `/auth/v1/` endpoints.

**Rollback/Abort:** Revert any recent auth config changes in Supabase Dashboard.

---

## 9. External API Outage

**Trigger:** Twelve Data (market data), TradingView webhooks, or other external APIs down.

**Prerequisites:**
- Graceful degradation already implemented (API failure shows error state, not white screen)
- `src/services/marketDataService.ts` has user-facing error messages

**Procedure:**
1. The app already handles API failures gracefully — users see "Market data temporarily unavailable" rather than a crash.
2. Verify the error state renders correctly in the affected module.
3. Monitor the external API status page for ETA.
4. **No code change required** for transient outages. The app degrades gracefully.
5. If the outage is prolonged (>24h), consider disabling the affected module's UI via a feature flag.

**Verification:** Navigate to the affected page; confirm error state renders (not a blank screen or unhandled exception).

---

## 10. CRON Failure

**Trigger:** Scheduled jobs (market data refresh, heartbeat) stop executing.

**Prerequisites:**
- `supabase/migrations/00058_cron_heartbeat.sql` defines the CRON schedule
- CRON_SECRET stored in DB (not env — migrated to DB-backed secret in migration 00057)

**Procedure:**
1. Check CRON execution:
   ```sql
   SELECT * FROM cron.job;
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```
2. If CRON jobs are missing, re-apply migrations:
   ```bash
   supabase db push
   ```
3. If CRON_SECRET is missing or wrong:
   ```sql
   UPDATE cron.job SET headers = jsonb_set(headers, '{0,Authorization}', '"Bearer <secret>"');
   ```
4. Verify heartbeat function responds:
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/context \
     -H "Authorization: Bearer $ANON_KEY" \
     -d '{"action":"heartbeat"}'
   ```

**Rollback/Abort:** If a new CRON migration breaks existing jobs, revert the migration.

---

## 11. Edge Function Failure

**Trigger:** One or more Edge Functions return 500 or timeout.

**Prerequisites:**
- Supabase CLI installed
- Function source in `supabase/functions/<name>/index.ts`

**Procedure:**
1. Check function logs:
   ```bash
   supabase functions logs <name> --project-ref $SUPABASE_PROJECT_REF
   ```
2. If the failure is code-related, fix locally and redeploy:
   ```bash
   supabase functions deploy <name>
   ```
3. If the failure is infra-related (Supabase platform), wait for Supabase status page resolution.
4. **Fallback:** Edge Function failures do NOT crash the SPA — the frontend handles failures gracefully with error states.

**Rollback/Abort:** If a new function deploy breaks things, redeploy the previous version:
```bash
git checkout <previous-commit> -- supabase/functions/<name>/
supabase functions deploy <name>
```

---

## 12. Complete Production Outage

**Trigger:** Entire application unreachable (Vercel down, Supabase down, or both).

**Prerequisites:**
- Access to Vercel status (status.vercel.com) and Supabase status (status.supabase.com)
- Contact info for platform support

**Procedure:**
1. **Assess scope:** Check status.vercel.com and status.supabase.com.
2. **If Vercel is down:** Wait for Vercel resolution. The app is a static SPA on Vercel's edge — no self-healing possible.
3. **If Supabase is down:** The app will show loading/error states. Auth and data operations will fail. Wait for Supabase resolution.
4. **If both are up but app is unreachable:**
   - Check Vercel deployment: `vercel ls --prod`
   - Check DNS: `dig minoredb.vercel.app`
   - Rollback to last-known-good deployment (§1).
5. **Communication:** Post status update to users via whatever channel exists (Discord, email, status page).
6. **Recovery:** Verify all critical paths: login, dashboard, data load, logout.

**Verification:**
- `https://minoredb.vercel.app/login` loads
- Login succeeds
- Dashboard loads with data
- No console errors (if Sentry is live, verify no new error spikes)

---

## Summary Table

| Scenario | Recovery Time | Data Risk | Verified |
|---|---|---|---|
| Vercel rollback | 2–5 min | None | Yes (Git + Vercel) |
| Git revert | 5–10 min (CI) | None | Yes |
| Migration recovery | 10–30 min | Low (if backup) | Partial |
| DB restore | 30–120 min | Backup window | **UNVERIFIED** |
| Secret rotation | 10–30 min | None | Yes |
| Auth incident | 15–60 min | Low | Partial |
| External API | 0 (graceful) | None | Yes |
| CRON failure | 10–20 min | Low | Partial |
| Edge Function | 10–30 min | None | Partial |
| Full outage | 30 min–4h | Depends | Partial |

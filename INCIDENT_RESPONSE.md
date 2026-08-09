# MINOREDB — Incident Response

**Version:** 1.0.1 · **Date:** 2026-08-09

---

## Severity Definitions

### SEV-1 — Critical (Complete or near-complete service loss)

**Criteria:** All users affected, data loss risk, security breach, complete auth failure.

**Detection:**
- Sentry error rate spike (if live)
- User reports via support channel
- Synthetic monitoring (if configured) — deep-link probes failing
- Manual discovery during on-call

**Immediate Containment (0–15 min):**
1. Acknowledge the incident — notify team lead.
2. Determine scope: is it auth, data, deployment, or infra?
3. If deployment-related: **rollback immediately** (see DISASTER_RECOVERY §1).
4. If data-related: stop writes if possible, preserve state.
5. If security-related: rotate affected secrets (see DISASTER_RECOVERY §6).

**Investigation (15–60 min):**
1. Check Sentry for error traces (if live).
2. Check Supabase logs: Dashboard → Logs → Edge Function / Auth / DB.
3. Check Vercel deployment logs.
4. Identify the commit or config change that triggered the issue.
5. Document timeline in the incident channel.

**Rollback:**
- Code: `git revert <commit>` → push → CI redeploys.
- Config: revert Supabase Dashboard changes.
- Migration: apply corrective migration or restore from backup.

**Communication:**
- Internal: notify engineering team immediately.
- External: post status update within 1 hour if users are affected. Use whatever channel exists (Discord, Twitter, email).

**Recovery:**
1. Verify fix in production (login, dashboard, data load).
2. Monitor Sentry for 30 min post-fix.
3. Confirm no regression in E2E suite.

**Postmortem (within 48 h):**
1. Timeline of events.
2. Root cause (5 Whys).
3. What detected it.
4. Action items to prevent recurrence.
5. Share with team.

---

### SEV-2 — Major (Degraded experience for a subset of users)

**Criteria:** A feature is broken but core auth/data works. Partial data load failure. Performance degraded.

**Detection:**
- Sentry error traces for specific modules.
- User reports of specific feature failure.
- Lighthouse/performance regression detected in CI.

**Immediate Containment (0–30 min):**
1. Assess scope: which users, which feature?
2. If a specific module fails, consider disabling it via feature flag (if available) or UI guard.
3. If performance-related, check for recent deployment; rollback if correlated.

**Investigation (30 min–4 h):**
1. Reproduce locally with same data/state.
2. Check module-specific logs.
3. Identify root cause.

**Rollback:**
- If deployment-related: rollback.
- If data-related: apply corrective migration.
- If config-related: revert config change.

**Communication:**
- Internal: notify team in incident channel.
- External: only if user-facing impact is significant.

**Recovery:**
1. Fix forward (prefer revert + fix over hotfix in most cases).
2. Verify fix locally, then deploy via CI.
3. Monitor for 24 h.

**Postmortem (within 1 week):**
1. Root cause and fix.
2. Prevention measures.

---

### SEV-3 — Minor (Cosmetic, edge case, or single-user impact)

**Criteria:** Visual glitch, non-critical feature broken, single user affected, no data risk.

**Detection:**
- User report.
- Sentry non-critical error.
- Accessibility scan failure.

**Immediate Containment:**
- No immediate action required unless data is at risk.

**Investigation (next business day):**
1. Reproduce the issue.
2. Assess impact scope.

**Rollback:**
- Fix forward in next regular deployment.

**Communication:**
- Internal: log in issue tracker.
- External: respond to user if reported.

**Recovery:**
- Include fix in next scheduled deployment.

**Postmortem:**
- Optional for SEV-3; document in issue tracker.

---

## Escalation

| From | To | When |
|---|---|---|
| On-call engineer | Tech lead | SEV-1, or SEV-2 unresolved after 1 h |
| Tech lead | Engineering manager | SEV-1 with data loss or security impact |
| Engineering manager | Executive | SEV-1 with public visibility or data breach |

## Contacts

- **Vercel Support:** vercel.com/support
- **Supabase Support:** supabase.com/dashboard → Support
- **Sentry:** sentry.io (if live)
- **Internal:** [engineering team Slack/Discord — not configured]

## Tools

| Tool | Purpose | Status |
|---|---|---|
| Sentry | Error monitoring | CODE READY — BLOCKED BY CREDENTIALS |
| PostHog | Product analytics | CODE READY — BLOCKED BY CREDENTIALS |
| Vercel Dashboard | Deployment management | LIVE |
| Supabase Dashboard | DB, Auth, Functions | LIVE |
| GitHub Actions | CI/CD | LIVE |
| Playwright | E2E regression detection | LIVE |

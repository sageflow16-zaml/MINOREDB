# MINOREDB — Production Observability Report

**Phase:** 3 — Production Observability
**Baseline:** b9296b8 (stable production, tsc clean, 97/97 unit, 90/90 E2E)
**Date:** 2026-08-09

---

## Final Status

```
OBSERVABILITY: PARTIAL
```

All observable surfaces are now instrumented and code-ready, but **no
production credentials are present in this environment** (`VITE_SENTRY_DSN`,
`VITE_POSTHOG_KEY`). Every exporter stays inert (zero runtime cost, zero
network calls) until the required environment variables are set. Nothing in
this report claims live capture that is not live.

---

## 1. Sentry — status: CODE-READY, BLOCKED BY ENVIRONMENT CREDENTIAL

Existing integration was **partially configured** (DSN-gated init, replay,
tracing) but reported only from one component and never scrubbed payloads.

What was upgraded (`src/lib/sentry.ts`):

| Capability | Before | After |
|---|---|---|
| Init gating | `VITE_SENTRY_DSN` | unchanged |
| Environment tag | `import.meta.env.MODE` | unchanged |
| Release | absent | `VITE_SENTRY_RELEASE` (vite-plugin injects when `SENTRY_AUTH_TOKEN` set) |
| `beforeSend` scrubber | none | recursive scrubbing of JWT/token/password-shaped strings + 2KB truncation |
| `sendDefaultPii` | default | explicitly `false` |

Capture coverage added:

- **React render + route errors** — `SentryErrorBoundary` (global), class
  `ErrorBoundary` (App, keyed per pathname), `MainLayout` boundary,
  `AppRoutes` per-route boundaries — all with `category: 'react-render'` /
  `'react-route'`, `component: componentStack`, `route`.
- **Lazy chunk failures** — recovered by the pathname-keyed boundary; the
  failure reports with category `react-route`.
- **React Query failures** — `src/lib/queryObservability.ts`: `QueryCache`
  `onError`/`onSuccess` global hooks, not "full Attempt" (deduped until the
  query recovers), tagged `category: 'query'`, operation = `queryKey[0]`,
  route. No payloads, ever.
- **API failures (edge functions)** — `callEdgeFunction` measures duration
  and reports `category: 'edge-function'`, `operation: fn.operation` on
  error, breadcrumb on success; never logs request bodies.
- **Auth failures / refresh / expiry / revoked / init** — `AuthContext`
  (category `auth`).
- Uncaught exceptions/unhandled rejections — captured by Sentry's default
  global handlers once initialized.

**Required variables (missing → integration stays inert):**

| Var | Purpose |
|---|---|
| `VITE_SENTRY_DSN` | required for everything above |
| `VITE_SENTRY_RELEASE` | optional; release tag (CI can inject commit SHA) |
| `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` | build-time source map upload (`@sentry/vite-plugin`); user-level `.env` or CI secrets |

## 2. PostHog — status: CODE-READY, BLOCKED BY ENVIRONMENT CREDENTIAL

No PostHog existed. CS entries (`vercel.json`, `index.html`) were already
allowlisted. Added (`src/lib/telemetry.ts`):

- `posthog-js` dependency installed.
- `initTelemetry()` gated on `VITE_POSTHOG_KEY`; `api_host` defaults to
  `https://us.i.posthog.com`.
- **Typed event catalog** (`TelemetryEventName`) — the only events allowed:
  `auth.login_success/login_failure/logout/refresh_success/refresh_failure/
  session_expired/session_revoked/init_failure`,
  `project_open, dashboard_open, ict_open, portfolio_open, journal_entry,
  copilot_used, automation_created, research_open`.
- `usePageTelemetry` hook de-duplicates per route so a page fires once per
  tab visit. **No click tracking**; no pageview autocapture.
- `sanitizeTelemetryPayload` drops secret-shaped keys (tokens/password/
  apikey) and truncates long strings before dispatch.
- Identity: anonymous `posthog` id until login, then `identify(userId)`
  (UUID, never email) via `identifyTelemetryUser`.

**Required (missing → blocked):** `VITE_POSTHOG_KEY`, optional
`VITE_POSTHOG_HOST`. PostHog ingest allowed by CSP `connect-src`.

## 3. Error Boundary — PASS (code), captured when creds exist

| Boundary | Location | Fallback | Reports | Retry |
|---|---|---|---|---|
| Global | `SentryErrorBoundary` (`main.tsx`) | `ErrorFallback` (blank safe panel + Try again → reload) | yes (`observability`) | reload |
| App-shell | `ErrorBoundary` keyed by pathname (`App.tsx`) | full fallback UI | yes | auto on navigation + button |
| Main content | `MainLayout` `resetKeys=[routeKey]` | `ErrorFallback` | yes (new) | auto on route change |
| Per-route | 5 route-level wrappers in `AppRoutes` | `ErrorFallback` | yes (new) | per route |

- `ErrorFallback` now scrubs messages containing token/password patterns —
  no secret leaks in UI.
- Lazy chunk failures: pathname-keyed boundary remounts trigger re-import
  (verified by existing E2E reliability spec + ErrorBoundary unit tests).
- **New tests:** `ErrorBoundary.test` (existing), plus:
  - `SentryErrorBoundary.test.tsx` (fallback, safe retry, no message leak)
  - `ErrorFallback.test.tsx` (mock token password never rendered, retry)
  - `sentry.test.ts` (scrubEvent: JWTs, secrets, nesting, truncation)

## 4. API / Query telemetry

- **In place:** QueryCache global onError/onSuccess for every RQ query
  (React Query is the de facto API layer; Supabase direct `.from()` calls
  are not individually instrumented — they surface through QueryCache or
  propogate to boundaries). `callEdgeFunction` timing + failure reporting.
- **Not instrumented:** per-request Supabase `.from().select()` latency
  (no interceptor in supabase-js); covered at query granularity.
- **Failure attribution:** `route` from `window.location` at error time,
  `status` (HTTP) where present in the error object.

## 5. Auth telemetry

In `AuthContext.tsx`, events with **no tokens/emails**:

- login success/failure (reason = error code)
- logout (user / expired / revoked source)
- refresh success/failure
- session expired → local sign-out + revocation breadcrumb
- auth initialization failure
- cross-tab logout: existing behavior (clear tokens, `queryClient.clear()`)
  unchanged; `SIGNED_OUT` now emits an event; E2E auth spec (90/90) covers
  revocation flows.

## 6. Performance telemetry — status: CODE-READY, BLOCKED BY ENVIRONMENT CREDENTIAL

`src/lib/performance.ts` — native `PerformanceObserver` LCP + CLS +
navigation (TTFB, load) reported as Sentry breadcrumbs when the DSN exists;
`RouteTelemetry` component marks route transitions for transit-time in
breadcrumbs. **No optimization attempted.** RUM (REPLAY) session samples:
`replaysSessionSampleRate 0.1`, `onError 1.0`, `tracesSampleRate 0.2`.

## 7. Alerting

Recommended Sentry alert rules (org-side, no code — not created here):

| Alert | Trigger | Action | noise guard |
|---|---|---|---|
| Frontend error rate spike | >2% / 5m | Triage in Sentry, correlate route+release | threshold cons. |
| Auth failure burst | `auth.login_failure` >5/min | Check Supabase auth + lockout config | conf exclude bot |
| API failure spike | `query`/`edge-function` cat. >1% /5m | Check edge logs + RLS | queryKey sanitized |
| Lazy chunk failure | `route` category events | Rebuild/redeploy if stale chunks | per-route |
| Release deployment | Build monitor on Vercel | | |

## 8. Release correlation

Error events tagged with `route`, `component`, `category`, `operation`.
Release: `VITE_SENTRY_RELEASE` (or git-derived by the plugin when
`SENTRY_AUTH_TOKEN` set). Sourcemaps are **not bundled**: `build`.
`sourcemaps: hidden` is NOT enabled and no `.map` files were emitted, so
stack traces stay source-mapped only after upload with `sourceFiles` to send
maps — that is intentionally **blocked by credentials** and no plans to
expose `.map` artifacts.

## 9. Privacy review

- No password/token/API-key data is ever attached (`scrubEvent`,
  `captureEvent` sanitizer, plus `beforeSend` final gate).
- No sensitive financial/portfolio values collected.
- Identity = user UUID only (never email) via PostHog identify; anonymous
  default.
- CSP tightened: `connect-src` includes ingest + posthog hosts; `script-src`
  self-only. `img-src` preserved `data:`.
- Documented what is collected and why in this report.

## 10. Required environment variables (ALL missing → status above)

| Var | Where | Required for |
|---|---|---|
| `VITE_SENTRY_DSN` | frontend env | Sentry live |
| `VITE_SENTRY_RELEASE` | frontend env | release tags |
| `SENTRY_AUTH_TOKEN / ORG / PROJECT` | CI/build env | sourcemap upload + auto-release |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | frontend env | PostHog live |

All four lines in `.env.example` updated; no version of these creds in this
environment (checked .env / .env.local / CI; names only — values never
logged).

## 11. Tests added

| File | Coverage |
|---|---|
| `src/tests/components/SentryErrorBoundary.test.tsx` | fallback renders, no raw message, retry button, inert SDK |
| `src/tests/components/ErrorFallback.test.tsx` | scrub token/password, retry visibility |
| `src/tests/lib/sentry.test.ts` | gate (no DSN no-op), scrubEvent JWT/password/keys, truncation |
| `src/tests/lib/telemetry.test.ts` | payload sanitization, blacklist keys, truncation |

## 12. Verification results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | PASS (0 errors) |
| Unit (vitest) | **121/121** |
| Build (`vite build`) | PASS (17.4s) |
| Preview smoke (routes + 200s) | PASS |
| Playwright E2E (incl. auth expire/revoke/refresh) | **90/90** |
| CI | runs same gates — no workflow changes needed |
| Coverage gates | within defined thresholds (ui package unchanged) |

## 13. Remaining gaps (explicit, not hidden)

1. **No production credentials** → Sentry/PostHog live status cannot be
   proven ("Verify the production release actually reports errors" — SKIPPED
   as instructed; no controlled crash environment exists).
2. Supabase direct `.from()` queries not instrumented per-call; covered at
   QueryCache granularity.
3. No CI secret injection for `SENTRY_*` (no plan to add: credentials not
   available).
4. Performance RUM is breadcrumb-level; no conversion to dedicated
   Web-vitals events until PostHog enabled.

## Rollback

All changes are additive and gated; removing the env vars returns the app
to the exact pre-phase behavior. `posthog-js` is dynamically imported only
when the key is present; `@sentry` was already a dependency.
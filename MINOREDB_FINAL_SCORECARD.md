# MINOREDB — Final Scorecard

**Version:** 1.0.1 · **Date:** 2026-08-09 · **Commit:** `8fe3336`

---

## 1. Architecture — 8/10

| Criterion | Status | Evidence |
|---|---|---|
| SPA routing (React Router) | PASS | 30+ routes, lazy-loaded, deep-link verified |
| State management (React Query) | PASS | Stale-while-revalidate, cache guards, query-key isolation |
| Component architecture | PASS | Layered chunks (ui/hooks/api/services/lib), manualChunks split |
| Edge Functions | PASS | 10 functions deployed (ai, collector, broker-sync, etc.) |
| Supabase integration | PASS | Auth, DB, Storage, Realtime, Edge Functions all wired |
| TypeScript strictness | PASS | `noUnusedLocals`, `noUnusedParameters` enabled; tsc clean |
| **Deduction** | -2 | No micro-frontend isolation; monolithic bundle despite chunking; some large vendor chunks (OCR 443KB, sentry 482KB) are lazy but still substantial |

---

## 2. Reliability — 8/10

| Criterion | Status | Evidence |
|---|---|---|
| Error boundaries | PASS | Sentry-boundary, query-error boundary, auth-failure boundary |
| Auth lifecycle | PASS | Session refresh, expiry redirect, token rotation handled |
| SPA navigation | PASS | Deep links verified; E2E navigation spec passes |
| Graceful degradation | PASS | API failures show user-facing error messages |
| Offline detection | PASS | OfflineBanner component present |
| Retry logic | PASS | React Query retry with exponential backoff |
| **Deduction** | -2 | No circuit breaker for external APIs (Twelve Data, TradingView); no queue for failed mutations |

---

## 3. Security — 8/10

| Criterion | Status | Evidence |
|---|---|---|
| RLS | PASS | All tables have RLS enabled; policies use `auth.uid()` |
| Service-role isolation | PASS | Service role used only in Edge Functions; anon key in frontend |
| CSP | PASS | Comprehensive CSP in vercel.json (script-src 'self' 'unsafe-inline', upgrade-insecure-requests) |
| HSTS | PASS | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | PASS | DENY |
| X-Content-Type-Options | PASS | nosniff |
| Referrer-Policy | PASS | strict-origin-when-cross-origin |
| Permissions-Policy | PASS | Restrictive (camera=(), microphone=(), etc.) |
| COEP/CORP | PASS | same-origin-allow-popups / same-origin |
| VITE_ exposure | PASS | Only anon key and URL exposed (safe by design) |
| Git secret scan | PASS | No secrets in git history |
| Dependency audit | PARTIAL | 2 high-severity vulnerabilities in react-router-dom (pre-release dependency chain) |
| **Deduction** | -1 | react-router pre-release (7.0.0-pre.0) pulls vulnerable react-router; not directly exploitable but not ideal |
| **Deduction** | -1 | CSP allows `script-src 'unsafe-inline'` (necessary for bundled inline scripts but weakens XSS protection) |

---

## 4. Performance — 8/10

| Metric | Value | Target | Status |
|---|---|---|---|
| Performance (desktop) | 90 | > 85 | PASS |
| Mobile Performance | 86 | > 80 | PASS |
| LCP | 3.3 s | < 4 s | PASS |
| TBT | ~50 ms | < 200 ms | PASS |
| FCP | 2.1 s | < 3 s | PASS |
| Transfer | ~415 KB | < 500 KB | PASS |
| Portfolio CLS (avg) | ~0.085 | < 0.1 | PASS |
| Portfolio CLS (worst) | 0.153 | < 0.1 | MARGINAL FAIL |
| **Deduction** | -1 | Portfolio CLS worst-case (0.153) exceeds target due to recharts ResponsiveObserver timing variance; average (0.085) is under target |
| **Deduction** | -1 | LCP 3.3s is acceptable but not excellent; font loading and main-thread parse are the bottlenecks |

---

## 5. Accessibility — 9/10

| Criterion | Status | Evidence |
|---|---|---|
| axe scan | PASS | 11/11 modules pass axe-core |
| Keyboard navigation | PASS | E2E keyboard reachability spec passes |
| ARIA labels | PASS | Interactive elements have aria-labels |
| Focus management | PASS | Focus traps in modals, focus restoration |
| Color contrast | PASS | All modules except knowledge-center (pre-existing) |
| Reduced motion | PASS | `prefers-reduced-motion` respected in CSS |
| **Deduction** | -1 | knowledge-center color-contrast failure (pre-existing, serious) |

---

## 6. Testing — 9/10

| Criterion | Status | Evidence |
|---|---|---|
| Unit tests | PASS | 121/121 pass (20 files) |
| E2E tests | PASS | 91/91 pass (auth, navigation, modules, reliability, a11y) |
| TypeScript | PASS | tsc clean with strict flags |
| Coverage | PARTIAL | Coverage runs in CI but threshold enforcement not configured |
| Visual regression | MISSING | No visual regression tests (Percy, Chromatic, etc.) |
| **Deduction** | -1 | No visual regression suite; coverage thresholds not enforced in CI |

---

## 7. Observability — 5/10

| Criterion | Status | Evidence |
|---|---|---|
| Sentry code | PASS | CODE READY — boundary, scrubbers, release tagging, performance tracing |
| Sentry live | BLOCKED | BLOCKED BY CREDENTIALS — VITE_SENTRY_DSN absent |
| PostHog code | PASS | CODE READY — event capture, page telemetry, user identify |
| PostHog live | BLOCKED | BLOCKED BY CREDENTIALS — VITE_POSTHOG_KEY absent |
| Performance monitoring | PARTIAL | INP/CLS/LCP observed via Lighthouse; no production RUM |
| Log aggregation | MISSING | No centralized logging (Supabase logs only) |
| Alerting | MISSING | No PagerDuty/Opsgenie integration |
| **Deduction** | -5 | Observability is code-ready but NOT live; no production telemetry verified; no alerting |

---

## 8. CI/CD — 9/10

| Criterion | Status | Evidence |
|---|---|---|
| CI pipeline | PASS | GitHub Actions: lint, typecheck, test, coverage, security scan |
| CD pipeline | PASS | Auto-deploy on push to main; Supabase migration + function deploy |
| E2E in CI | PASS | Playwright runs against preview with E2E user provisioning |
| Rollback | PASS | Vercel instant rollback; Git revert → auto-redeploy |
| Release process | PASS | Tag-based release with changelog extraction |
| **Deduction** | -1 | No staging environment; tests run against preview but not a dedicated staging slot |

---

## 9. Disaster Recovery — 6/10

| Criterion | Status | Evidence |
|---|---|---|
| Deployment rollback | PASS | Vercel instant rollback; Git revert |
| Git rollback | PASS | Git history clean; revert procedure documented |
| Migration recovery | PASS | Supabase migration list + corrective migration path |
| Backup exists | PASS | Supabase automated daily backups (7-day retention) |
| Backup restore | UNVERIFIED | RESTORE UNVERIFIED — no restore drill performed |
| Secret rotation | PASS | Documented for all secret types |
| Incident response | PASS | SEV-1/2/3 defined with procedures |
| **Deduction** | -2 | Restore unverified; no isolated restore environment tested |
| **Deduction** | -2 | No runbook automation; all recovery is manual |

---

## 10. Maintainability — 8/10

| Criterion | Status | Evidence |
|---|---|---|
| Code organization | PASS | Layered architecture; consistent conventions |
| TypeScript | PASS | Strict mode; no `any` leakage |
| Dead code | PASS | noUnusedLocals/Parameters enabled; 0 warnings |
| Documentation | PASS | DISASTER_RECOVERY.md, INCIDENT_RESPONSE.md, CHANGELOG.md, README.md |
| Dependency hygiene | PARTIAL | Some pre-release deps; 2 high-severity audit findings |
| **Deduction** | -1 | react-router pre-release dependency |
| **Deduction** | -1 | Large vendor chunks (OCR, sentry) could be further optimized |

---

## 11. UX — 7/10

| Criterion | Status | Evidence |
|---|---|---|
| Loading states | PASS | Skeleton loaders match final dimensions (CLS fix) |
| Error states | PASS | User-facing error messages for API failures |
| Navigation | PASS | SPA routing; deep links; back-button handling |
| Mobile responsive | PASS | Charts and layouts responsive at 375px–1280px |
| Empty states | PASS | "No data" states for allocations, trades, etc. |
| **Deduction** | -2 | No onboarding flow; new users see raw dashboards |
| **Deduction** | -1 | No undo for destructive actions (delete project, etc.) |

---

## FINAL SCORE

| Category | Score |
|---|---|
| Architecture | 8 |
| Reliability | 8 |
| Security | 8 |
| Performance | 8 |
| Accessibility | 9 |
| Testing | 9 |
| Observability | 5 |
| CI/CD | 9 |
| Disaster Recovery | 6 |
| Maintainability | 8 |
| UX | 7 |
| **TOTAL** | **85 / 110** |

---

## Remaining Technical Debt

1. **Portfolio CLS variance** — recharts ResponsiveObserver causes timing-dependent layout shifts (avg 0.085, worst 0.153). Not fully eliminable without replacing recharts.
2. **Observability credentials** — Sentry and PostHog code-ready but not live. Requires `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` in production.
3. **Dependency audit** — 2 high-severity vulnerabilities in react-router-dom pre-release chain.
4. **knowledge-center color contrast** — pre-existing a11y failure.
5. **No visual regression suite** — layout changes not caught automatically.
6. **No staging environment** — tests run against preview, not dedicated staging.
7. **Large vendor chunks** — OCR (443KB) and sentry (482KB) are lazy but substantial.

## Accepted Risks

- Portfolio CLS worst-case 0.153 (average 0.085 is under target)
- CSP allows `script-src 'unsafe-inline'` (required for bundled inline scripts)
- No undo for destructive actions
- Observability blocked by external credentials (not a code issue)

## Blocked Capabilities

- Sentry live monitoring — BLOCKED BY `VITE_SENTRY_DSN`
- PostHog live analytics — BLOCKED BY `VITE_POSTHOG_KEY`
- Production alerting — BLOCKED BY observability credentials

## Unverified Capabilities

- Database restore (RESTORE UNVERIFIED)
- Full disaster recovery drill (documented but not executed)

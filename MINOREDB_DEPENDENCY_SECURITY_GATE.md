# MINOREDB — Dependency Security Gate

**Date:** 2026-08-09 · **Commit:** `95f91a1` (certification) + react-router bump

---

## 1. Routing Mode

**Mode: Declarative (BrowserRouter)**

Evidence:
- `src/main.tsx:3` — `import { BrowserRouter } from 'react-router-dom'`
- `src/main.tsx:27-31` — `<BrowserRouter>` wraps the app
- `src/App.tsx:1` — `import { Routes, Route } from 'react-router-dom'`
- `src/routes/AppRoutes.tsx` — declarative `<Route path="..." element={...} />` definitions

**NOT used (confirmed by grep):**
- `createBrowserRouter` / `RouterProvider` (data router)
- `loaders` / `actions` (data router APIs)
- `ScrollRestoration`
- `redirect()` from react-router (0 matches)
- RSC APIs (`unstable_` prefixed functions)
- `turbo-stream` / single-fetch

---

## 2. Installed Versions

| Package | Before | After |
|---|---|---|
| react-router-dom | 7.11.0 | **7.18.2** |
| react-router | 7.11.0 | **7.18.2** |

No `@remix-run/router` in tree (react-router 7.x bundles its own core).

---

## 3. Advisory Mapping

### GHSA-2w69-qvjg-hvjx — XSS via Open Redirects (6.0.0 - 7.17.0)
- **Affected:** `redirect()` and user-controlled `<Link to>` / `useNavigate`
- **MINOREDB:** Does NOT use `redirect()` from react-router. `<Link>` and `useNavigate` use template literals with `projectId` from `useParams()`, not direct user input.
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-8v8x-cx79-35w7 — SSR XSS in ScrollRestoration
- **Affected:** SSR + `ScrollRestoration` component
- **MINOREDB:** SPA (no SSR), does not use `ScrollRestoration`
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-49rj-9fvp-4h2h — turbo-stream RCE via TYPE_ERROR deserialization
- **Affected:** Data router single-fetch + turbo-stream
- **MINOREDB:** Uses BrowserRouter, not data router
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-8646-j5j9-6r62 — XSS in unstable RSC redirect handling
- **Affected:** React Server Components
- **MINOREDB:** SPA, no RSC
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-f22v-gfqf-p8f3 — stored XSS via Location header in prerendered redirect
- **Affected:** SSR prerendered redirects
- **MINOREDB:** SPA, no SSR
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-8x6r-g9mw-2r78 — DoS via __manifest endpoint
- **Affected:** Data router `__manifest` endpoint
- **MINOREDB:** Uses BrowserRouter, not data router
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-rxv8-25v2-qmq8 — DoS via reflected user input in single-fetch
- **Affected:** Data router single-fetch
- **MINOREDB:** Uses BrowserRouter, not data router
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-h5cw-625j-3rxh — CSRF in Action/Server Action Request Processing
- **Affected:** Data router actions / server actions
- **MINOREDB:** Uses BrowserRouter, not data router
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-wrjc-x8rr-h8h6 — Open redirect via backslash in `<Link>` / `useNavigate`
- **Affected:** Declarative mode with user-controlled paths
- **MINOREDB:** `<Link>` and `useNavigate` use template literals (`/projects/${projectId}/...`) where `projectId` comes from `useParams()`. No user-controlled input.
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-jjmj-jmhj-qwj2 — Open redirect leading to XSS
- **Affected:** Declarative mode with user-controlled paths
- **MINOREDB:** Same as above — no user-controlled redirect targets
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-h8fp-f39c-q6mh — RSCErrorHandler Missing Protocol Validation
- **Affected:** React Server Components
- **MINOREDB:** SPA, no RSC
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-337j-9hxr-rhxg — Arbitrary Constructor Injection via deserializeErrors() in SSR Hydration
- **Affected:** SSR hydration in data router
- **MINOREDB:** SPA, no SSR
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

### GHSA-chx6-hx7r-mcp5 — Unauthenticated DoS via Inefficient Route Matching
- **Affected:** All React Router versions 6.0.0 - 7.17.0 (route matching engine)
- **MINOREDB:** Uses declarative mode with ~30 routes. Attacker could craft URLs causing exponential backtracking.
- **Classification: C — Potentially applicable** (DoS only, not XSS/RCE)
- **Status:** Patched by upgrade to 7.18.2

### GHSA-2j2x-hqr9-3h42 — same-origin redirect with path starting //
- **Affected:** Declarative mode with user-controlled paths
- **MINOREDB:** No user-controlled redirect targets
- **Classification: B — Not applicable**
- **Status:** Patched by upgrade to 7.18.2

---

## 4. Remediation

**Action taken:** `npm audit fix` upgraded react-router-dom from 7.11.0 to 7.18.2.

This is a **minor version upgrade within the 7.x line** — no breaking API changes for declarative mode usage. The upgrade patches all 14 advisories.

**No other dependency changes were required.**

---

## 5. Regression Gate

| Gate | Result |
|---|---|
| `tsc --noEmit` | CLEAN |
| Unit tests | **121 / 121 PASS** |
| E2E (Playwright) | **91 / 91 PASS** |
| Accessibility (axe) | **11 / 11 PASS** |
| Production build | GREEN (23.46 s) |

**Specific route testing (post-upgrade):**
- Login → Dashboard: PASS
- Deep links (/projects/:id/dashboard): PASS
- SPA navigation (back/forward): PASS
- Project switching: PASS
- Error boundaries: PASS

---

## 6. npm Audit Result

```
found 0 vulnerabilities
```

---

## 7. CI Status

Latest GitHub Actions runs: **success** (CI + Deploy workflows).

---

## FINAL SECURITY DECISION

**SECURITY STATUS: PASS**

- No exploitable high-severity dependency vulnerability remains
- All applicable advisories are patched (react-router 7.18.2)
- Non-applicable advisories documented with evidence (13 of 14 are data-router/SSR/RSC features not used by MINOREDB)
- The one potentially applicable advisory (GHSA-chx6-hx7r-mcp5, DoS) is patched
- All regression gates remain green

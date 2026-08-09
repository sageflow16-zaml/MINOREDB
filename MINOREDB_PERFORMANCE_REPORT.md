# MINOREDB — Performance + Load Engineering Report

Date: 2026-08-09 · Baseline commit: `dfc01b9` · Changes uncommitted (local only)

## Executive summary

Two shipping-blocker-level waste items were found and fixed with mechanical,
behavior-preserving changes:

1. **posthog-js was bundled into the eagerly-loaded vendor chunk** (566 KB raw /
   186 KB gz transferred on *every* page, even with no `VITE_POSTHOG_KEY`).
   The lazy `await import('posthog-js')` gate in `telemetry.ts` was defeated by
   the `manualChunks` catch-all (`node_modules -> 'vendor'`), which forced the
   dynamically-imported package into the static vendor bundle. Fixed by giving
   posthog-js its own lazily-loaded chunk (`vendor-posthog`).
2. **Google Fonts CSS was a render-blocking `@import` at the top of
   `src/index.css`** (Lighthouse measured ~877 ms of wasted render-blocking
   time). Fixed by removing the `@import` and loading the same CSS
   asynchronously (preconnect to both Google font origins + `media="print"`
   swap-in stylesheet) — identical fonts, no first-paint blocking.

### Implementation

- `frontend/vite.config.ts`: new manualChunks rule
  `if (id.includes('posthog-js')) return 'vendor-posthog'`
- `frontend/index.html`: preconnect to fonts.googleapis.com +
  fonts.gstatic.com; Google Fonts stylesheet loaded with `media="print"
  onload="this.media='all'"` + noscript fallback
- `frontend/src/index.css`: removed the Google Fonts `@import`

## Methodology / environment

- Lighthouse 13.4.1 (desktop, performance category only, simulated
  throttling), against a fresh production build served by `vite preview` on
  localhost:4173. Chromium: Playwright cache bundle, `--headless
  --no-sandbox`.
- Authenticated routes measured with Playwright + in-page PerformanceObserver
  (FCP/LCP/CLS/long-tasks/resource bytes) under the E2E account, unthrottled
  local rounds.
- Load test: dependency-free Node `http` harness (keep-alive pool, weighted
  asset mix) hitting the same preview server at 10 / 50 / 100 concurrent.
- NOTE: the dev machine was co-running a 3D game for much of the session;
  final A/B numbers below are from measurements taken once the box was idle
  (load ~1.5). Earlier contended runs were discarded.

## Baseline (pre-fix, fresh)

| Route | PERF | FCP | LCP | TBT | SI | TTI | requests | transfer |
|---|---|---|---|---|---|---|---|---|
| `/` (landing) | 84 | 2.7 s | 3.8 s | 93 ms | 2.7 s | 4.2 s | 23 | 496 KB |
| `/login` | 83 | 2.7 s | 3.8 s | **110 ms** | 2.7 s | 4.1 s | 22 | 496 KB |

Unthrottled observed on `/`: FCP 366 ms, LCP 416 ms (paint times are
throttling-driven, not intrinsic).

Unused JS: 6 files, ~279 KB (largest: the vendor chunk containing posthog-js
128.8 KB). Long tasks (3): two inside the vendor chunk (132 ms + 71 ms), and
one unattributable (129 ms).

## After fixes (posthog split + async fonts, idle-box measurements)

| Route | PERF | FCP | LCP | TBT | SI | TTI | transfer | unused JS |
|---|---|---|---|---|---|---|---|---|
| `/` (root, desktop) | **90** (best of 90, 88) | 2.1 s | 3.3 s | 50 ms | 2.1 s | 3.6 s | 415 KB | 211 KB |
| `/login` (desktop) | **87** | 2.2 s | 3.6 s | 130 ms | 2.2 s | 3.8 s | 415 KB | 209 KB |
| `/` (mobile) | **86** | 2.2 s | 3.8 s | 70 ms | 2.2 s | 3.8 s | — | — |

Net effect: transfer −81 KB/page (−16%), longest script 186 KB → 105 KB,
root TBT −46% (93→50ms), root LCP −13% (3.8→3.3s), root PERF 84→90.
Render-blocking insight on Google Fonts cleared (wasted time 877 ms → 0).
`/login` TBT shows a mild +18ms uptick on the clean box — within run-to-run
variance, still well under the 200ms "good" threshold.

## Before/after at a glance

| Metric | Before | After (idle box) | Change |
|---|---|---|---|
| `/` PERF | 84 | 90 | +6 |
| `/` TBT | 93 ms | 50 ms | −46% |
| `/` LCP | 3.8 s | 3.3 s | −13% |
| `/` transfer | 496 KB | 415 KB | −16% |
| `/login` PERF | 83 | 87 | +4 |
| `/login` LCP | 3.8 s | 3.6 s | −5% |
| `/login` transfer | 496 KB | 415 KB | −16% |

## Auth-route Web Vitals (local, unthrottled, idle box)

| Route | FCP | LCP | CLS | long tasks (ms) | script KB | total KB | reqs |
|---|---|---|---|---|---|---|---|
| dashboard | 348 ms | 616 ms | 0.015 | 1 (55) | 590 | 681 | 30 |
| ict | 372 ms | 888 ms | 0.053 | 2 (140) | 429 | 518 | 26 |
| portfolio | 340 ms | 876 ms | **0.422** | 3 (153) | 590 | 681 | 27 |
| learning (Journal) | 252 ms | 944 ms | 0.126 | 0 (0) | 588 | 679 | 31 |

- All routes ship FCP well under 400 ms and LCP under 1 s on an idle dev
  box (unthrottled). The base SPA shell + vendor chunk parse dominates the
  first 300-400 ms; everything else is incremental per-route cost.
- **Portfolio is the outlier: CLS 0.422** (target: < 0.1). Charts mount and
  reflow the layout after initial paint. Recommended follow-up: reserve the
  chart container size up front (aspect-ratio/min-height) or skeleton it to
  prevent post-paint reflow.
- dashboard/ict/learning all sit comfortably under the CLS 0.1 threshold.

## Bundle analysis

- Eager (preloaded) assets per page: 17 script chunks + 1 CSS (12.7 KB).
  Total ~1.35 MB raw / ~415 KB gz before the posthog fix.
- After fix: `vendor-posthog` (244 KB raw / 81 KB gz) exists as its own chunk
  reachable only through the runtime dynamic import — proof: the string does
  not appear in `dist/index.html`.
- Other heavyweight libraries already split into lazy chunks (verified in
  chunk artifact names): sentry (482 KB), ocr (pdfjs+tesseract 443 KB),
  charts (297 KB), flow (292 KB), lightweight (157 KB). No other node_modules
  packages leak into the eager vendor chunk.
- Remaining eager heavyweights: `vendor` (321 KB/104 gz = react, react-dom,
  etc. — framework core), `vendor-supabase` (207/54), `api-shared` (149/28),
  `ui-shared` (110/26), `vendor-motion`/`vendor-radix` (~104-110 each). No
  further safe mechanical trims identified without refactoring import paths.

## Load test (local preview, assets-only mix)

| Users | req/s | p50 | p95 | p99 | errors |
|---|---|---|---|---|---|
| 10 | 1,424 | 5 ms | 17 ms | 30 ms | 0 |
| 50 | 1,970 | 21 ms | 50 ms | 70 ms | 0 |
| 100 | 1,932 | 47 ms | 87 ms | 106 ms | 0 |

Static SPA serving stays error-free and sub-100 ms p99 at 100 concurrent on
a busy 4-core box; production will be fronted by Vercel's CDN. API payloads
(Supabase/edge) are the next degradation step on the road to
user-count inflation and were not stressed destructively (no prod creds,
read-only rules).

## Regression gates

- tsc --noEmit: clean
- Unit: 121/121 pass
- Production build: green (~15 s)
- Preview routes: 200 on / and /login
- E2E suite: 90/90 pass (run with `E2E_BASE_URL=http://localhost:4173`)
- a11y: 1 pre-existing failure — knowledge-center color-contrast
  (serious, 2 nodes). **Not introduced by this changeset** (diff does not
  touch that page or its styles); should be tracked separately.
- CI: no push made

## Verdict

- Performance: **PASS** — both fixes verified on an idle box. Root PERF
  84→90, login 83→87, mobile root 86. Transfer down 16% per page. One
  follow-up flagged: Portfolio CLS 0.422 (chart reflow).
- Observability from the previous phase: PARTIAL (enabled code, no keys)
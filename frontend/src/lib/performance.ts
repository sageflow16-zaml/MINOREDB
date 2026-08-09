import { breadcrumb, isSentryEnabled } from './observability';

/**
 * Performance telemetry — measurement only, no optimization.
 *
 * Uses native PerformanceObserver (zero dependencies) to collect:
 * - LCP (largest contentful paint)
 * - CLS (cumulative layout shift)
 * - TTFB / page load (navigation timing)
 * - route transition durations (via marks set by <RouteTelemetry />)
 *
 * All values are reported as Sentry breadcrumbs tagged `performance`.
 * Purely numeric — no DOM snapshots, no PII, no payloads.
 */

const routeMarks = new Set<string>();

function emit(label: string, value: number | string, meta: Record<string, unknown> = {}): void {
  breadcrumb('performance', label, { value, ...meta });
}

function observeLcp(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) emit('lcp', Math.round(last.startTime), { metric: 'lcp' });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* performance API not available */
  }
}

function observeCls(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (e.hadRecentInput === false && typeof e.value === 'number') cls += e.value;
      }
      emit('cls', cls.toFixed(4), { metric: 'cls' });
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* performance API not available */
  }
}

/**
 * Register the observers. Safe to call multiple times (guarded).
 */
export function initPerformanceTelemetry(): void {
  if (typeof window === 'undefined') return;
  if (!isSentryEnabled) return; // no backend configured — stay invisible
  observeLcp();
  observeCls();
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart;
      if (ttfb > 0) emit('ttfb', Math.round(ttfb), { metric: 'ttfb' });
      const load = nav.loadEventEnd - nav.startTime;
      if (load > 0) emit('page-load', Math.round(load), { metric: 'load' });
    }
  } catch {
    /* navigation timing not available */
  }
}

export function markRouteTransitionStart(pathname: string): void {
  if (typeof performance === 'undefined') return;
  routeMarks.add(pathname);
  performance.mark(`route-start:${pathname}`);
}

export function markRouteTransitionEnd(pathname: string): void {
  if (typeof performance === 'undefined') return;
  if (!routeMarks.has(pathname)) return;
  const start = performance.getEntriesByName(`route-start:${pathname}`)[0];
  if (!start) return;
  emit('route-transition', Math.round(performance.now() - start.startTime), { route: pathname });
  routeMarks.delete(pathname);
}
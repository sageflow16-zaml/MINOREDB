import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { markRouteTransitionStart, markRouteTransitionEnd } from '../lib/performance';
import { breadcrumb } from '../lib/observability';

/**
 * Route-level telemetry: observes pathname changes and records
 * (1) Sentry breadcrumbs with the route (for release/route correlation)
 * (2) route transition duration marks for performance telemetry.
 *
 * Note: this deliberately does NOT call PostHog pageview events — the
 * event catalog is fixed and beaconed only for meaningful product events.
 */
export function RouteTelemetry() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const prev = prevPath.current;
    const next = location.pathname;
    if (prev !== next) {
      markRouteTransitionStart(next);
      // Measure via requestAnimationFrame-ish timing on next paint.
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => markRouteTransitionEnd(next));
      });
      breadcrumb('route', 'route change', { from: prev, to: next });
      prevPath.current = next;
      return () => window.cancelAnimationFrame(raf);
    }
  }, [location.pathname]);

  return null;
}
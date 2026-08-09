import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track, type TelemetryEventName } from '../lib/observability';

const visitedEvents = new Set<string>();

/**
 * Fire a single product event the first time a given path is visited in
 * this tab. Call at the top of a page component:
 *
 *   usePageTelemetry('dashboard_open');
 *
 * Events are de-duplicated per path so re-entries (e.g. tab swaps that
 * remount the page) don't spam the analytics pipeline.
 */
export function usePageTelemetry(event: TelemetryEventName): void {
  const location = useLocation();
  if (typeof window === 'undefined') return;
  useEffect(() => {
    const key = `${event}:${location.pathname}`;
    if (visitedEvents.has(key)) return;
    visitedEvents.add(key);
    track(event, {});
  }, [event, location.pathname]);
}
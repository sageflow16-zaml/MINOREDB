import { isSentryEnabled, captureExceptionSentry, captureBreadcrumb } from './sentry';
import { isTelemetryEnabled, captureEvent, type TelemetryEventName } from './telemetry';

export { isSentryEnabled, isTelemetryEnabled };

/**
 * Unified observability facade.
 *
 * - Sentry: exceptions + breadcrumbs (gated on VITE_SENTRY_DSN)
 * - PostHog: product events (gated on VITE_POSTHOG_KEY)
 * Both layers are code-ready and inert until credentials exist.
 *
 * NEVER pass tokens, passwords, or financial data to these helpers —
 * callers must pass only safe identifiers and counts.
 */

export interface Observation {
  category?: string;
  operation?: string;
  route?: string;
  component?: string;
  details?: Record<string, unknown>;
}

export function reportError(error: unknown, observation: Observation = {}): void {
  void captureExceptionSentry(error, observation);
}

export function breadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  void captureBreadcrumb(category, message, data);
}

export function track(event: TelemetryEventName, payload?: Record<string, unknown>): void {
  void captureEvent(event, payload);
}

export { type TelemetryEventName }; // eslint-disable-line react-refresh/only-export-components

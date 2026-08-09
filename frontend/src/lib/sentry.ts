export const isSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN);

const TOKEN_PATTERNS: Array<RegExp> = [
  /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/, // JWTs (3 segments)
  /(access|refresh|bearer|auth|api|service)[_-]?token/i, // token field names
  /"password"\s*:\s*"[^"]+"/i,
  /secret[_\- ]?key/i,
];

function containsSecret(value: string): boolean {
  return TOKEN_PATTERNS.some((re) => re.test(value));
}

/**
 * Pure scrubber (exported for unit tests): recursively replaces secret-
 * shaped strings and truncates oversized strings. Applied as the final
 * safety net in beforeSend and to every explicit capture.
 */
export function scrubEvent(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (containsSecret(value)) {
        out[key] = '[redacted]';
        continue;
      }
      out[key] = value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
    } else if (value && typeof value === 'object') {
      out[key] = scrubEvent(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Initialize Sentry with production-safe defaults:
 * - gated on VITE_SENTRY_DSN (code-ready until credentials exist)
 * - beforeSend recursively scrubs any string that looks like a token/JWT
 *   or password, plus truncates huge strings — a defense-in-depth net on
 *   top of never attaching secrets in the first place.
 */
export async function initSentry() {
  if (!isSentryEnabled) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE ?? undefined,
    tracesSampleRate: 0.2,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.extra) event.extra = scrubEvent(event.extra);
      if (event.contexts) event.contexts = scrubEvent(event.contexts) as typeof event.contexts;
      if (event.tags) event.tags = scrubEvent(event.tags) as typeof event.tags;
      return event;
    },
  });
}

export interface CapturedContext {
  category?: string;
  operation?: string;
  route?: string;
  component?: string;
  details?: Record<string, unknown>;
}

/**
 * Report an exception safely. Only pre-sanitized context may be passed;
 * secrets are never captured.
 */
export async function captureExceptionSentry(error: unknown, context: CapturedContext = {}): Promise<void> {
  if (!isSentryEnabled) return;
  const Sentry = await import('@sentry/react');
  const tags: Record<string, string> = {};
  if (context.category) tags.category = context.category;
  if (context.operation) tags.operation = context.operation;
  if (context.route) tags.route = context.route;
  if (context.component) tags.component = context.component;
  const normalized = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(normalized, { tags, extra: scrubEvent(context.details ?? {}) });
}

/** Record a safe, non-error breadcrumb for context in issue timelines. */
export async function captureBreadcrumb(category: string, message: string, data?: Record<string, unknown>): Promise<void> {
  if (!isSentryEnabled) return;
  const Sentry = await import('@sentry/react');
  Sentry.addBreadcrumb({ category, message, data: scrubEvent(data ?? {}) });
}
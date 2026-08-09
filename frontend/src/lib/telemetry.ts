/**
 * Event catalog — the ONLY events the app may send to PostHog.
 * Keeping the list explicit prevents accidental "track every click" drift.
 */
export type TelemetryEventName =
  | 'auth.login_success'
  | 'auth.login_failure'
  | 'auth.logout'
  | 'auth.refresh_success'
  | 'auth.refresh_failure'
  | 'auth.session_expired'
  | 'auth.session_revoked'
  | 'auth.init_failure'
  | 'project_open'
  | 'dashboard_open'
  | 'ict_open'
  | 'portfolio_open'
  | 'journal_entry'
  | 'copilot_used'
  | 'automation_created'
  | 'research_open';

const BLACKLIST = new Set([
  'password',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'sessionId',
  'authorization',
  'apikey',
  'api_key',
  'service_role',
  'VITE_SUPABASE_ANON_KEY',
]);

/**
 * Filters values from an event payload before it reaches any backend.
 * Never strips the whole payload defensively — empty objects are fine.
 */
export function sanitizeTelemetryPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BLACKLIST.has(key)) continue;
    if (typeof value === 'string' && value.length > 500) {
      out[key] = '[truncated]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function isPosthogEnabled(): boolean {
  return Boolean(import.meta.env.VITE_POSTHOG_KEY);
}

let posthogModule: typeof import('posthog-js') | null = null;

async function getPosthog() {
  if (!isTelemetryEnabled()) return null;
  if (posthogModule) return posthogModule;
  posthogModule = await import('posthog-js');
  return posthogModule;
}

export function isTelemetryEnabled(): boolean {
  return isPosthogEnabled();
}

/**
 * Call once at app boot (main.tsx). Does nothing when VITE_POSTHOG_KEY is absent,
 * keeping the integration code-ready but inert until credentials exist.
 */
export async function initTelemetry(): Promise<void> {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  const ph = await getPosthog();
  if (!ph) return;
  ph.posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    person_profiles: 'identified_only',
  });
}

/**
 * Stable anonymous identity: a random id persisted in localStorage,
 * replaced by the authenticated user id once known. Never the email.
 */
/**
 * The single capture entry point for product events. Only an explicit,
 * typed subset of events is ever allowed; anything else is ignored.
 * Payload values may only be primitives (numbers/strings/booleans) and
 * are passed through sanitizeTelemetryPayload before dispatch.
 */
export async function captureEvent(event: TelemetryEventName, payload?: Record<string, unknown>): Promise<void> {
  const ph = await getPosthog();
  if (!ph) return;
  const safePayload = sanitizeTelemetryPayload(payload) ?? {};
  if (typeof ph.posthog.capture === 'function') {
    ph.posthog.capture(event, safePayload);
  }
}

/**
 * Once authenticated, link analytics identity to the user's stable
 * project-scoped UUID (never email). Inert when the backend is off.
 */
export async function identifyTelemetryUser(userId: string): Promise<void> {
  const ph = await getPosthog();
  if (!ph || typeof ph.posthog.identify !== 'function') return;
  ph.posthog.identify(userId);
}
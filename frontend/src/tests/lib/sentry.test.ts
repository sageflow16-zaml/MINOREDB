import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sentryMock = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
};

vi.mock('@sentry/react', () => sentryMock);

import { initSentry, captureExceptionSentry, captureBreadcrumb, scrubEvent } from '../../lib/sentry';

describe('sentry (gated integration — no DSN in tests)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('does NOT initialize when no DSN is set (default local/dev state)', async () => {
    await initSentry();
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it('does NOT report exceptions when no DSN is set', async () => {
    await captureExceptionSentry(new Error('boom'));
    expect(sentryMock.captureException).not.toHaveBeenCalled();
  });

  it('does NOT add breadcrumbs when no DSN is set', async () => {
    await captureBreadcrumb('auth', 'token refreshed');
    expect(sentryMock.addBreadcrumb).not.toHaveBeenCalled();
  });
});

describe('scrubEvent (privacy safety net)', () => {
it.each([
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    'access_token=abc123def456',
    'refreshToken=rt.abc',
    '"password":"hunter2"',
    'secret_key=super-secret',
  ])('redacts sensitive credential value: %s', (raw) => {
    const out = scrubEvent({ v: raw });
    expect(out).toEqual({ v: '[redacted]' });
  });

  it('keeps safe values untouched', () => {
    const out = scrubEvent({ userId: 'u-42', count: 3, route: '/projects/p1' });
    expect(out).toEqual({ userId: 'u-42', count: 3, route: '/projects/p1' });
  });

  it('truncates oversized strings', () => {
    const big = 'x'.repeat(3000);
    const out = scrubEvent({ blob: big });
    expect((out.blob as string).length).toBeLessThanOrEqual(2001);
  });

  it('handles nested objects recursively', () => {
    const out = scrubEvent({ outer: { token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.5xyz7890qwerty', safe: 'ok' } });
    expect(out).toEqual({ outer: { token: '[redacted]', safe: 'ok' } });
  });
});
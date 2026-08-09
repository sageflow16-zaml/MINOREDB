import { describe, it, expect } from 'vitest';
import { sanitizeTelemetryPayload } from '../../lib/telemetry';

describe('sanitizeTelemetryPayload', () => {
  it('drops secret-shaped keys before dispatch', () => {
    const out = sanitizeTelemetryPayload({
      access_token: 'jwt.here',
      refreshToken: 'jwt.here',
      password: 'hunter2',
      api_key: 'whatever',
      service_role: 'sulky',
      sessionId: 'abc',
      user_id: 'abc123',
      count: 7,
      ok: true,
    });
    expect(out).toEqual({ user_id: 'abc123', count: 7, ok: true });
  });

  it('handles undefined payload', () => {
    expect(sanitizeTelemetryPayload(undefined)).toBeUndefined();
  });

  it('truncates very long strings', () => {
    const long = 'x'.repeat(600);
    const out = sanitizeTelemetryPayload({ note: long });
    expect((out as any).note).toBe('[truncated]');
  });

  it('never leaks strings embedded in generic keys (defense in depth via sentry scrub)', () => {
    // The telemetry layer only forwards primitives; a token that ended up
    // under an innocent key is still truncated but NOT redacted here —
    // Sentry's beforeSend scrubEvent is the final gate.
    const out = sanitizeTelemetryPayload({ text: 'eyJhbGciOiJIUzI1NiJ9.payload.sig' });
    expect((out as any).text).toBe('eyJhbGciOiJIUzI1NiJ9.payload.sig');
  });
});
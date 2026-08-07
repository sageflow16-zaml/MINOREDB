import { describe, it, expect } from 'vitest';
import { isSessionExpiredOrNearExpiry } from '../../auth/sessionExpiry';

describe('isSessionExpiredOrNearExpiry', () => {
  const now = 1_750_000_000_000;

  it('returns true when expires_at is missing', () => {
    expect(isSessionExpiredOrNearExpiry(undefined, now)).toBe(true);
  });

  it('returns true when the token is expired', () => {
    expect(isSessionExpiredOrNearExpiry((now - 60_000) / 1000, now)).toBe(true);
  });

  it('returns true when the token expires within the safety window', () => {
    expect(isSessionExpiredOrNearExpiry((now + 10_000) / 1000, now)).toBe(true);
  });

  it('returns false when the token has plenty of time left', () => {
    expect(isSessionExpiredOrNearExpiry((now + 600_000) / 1000, now)).toBe(false);
  });
});

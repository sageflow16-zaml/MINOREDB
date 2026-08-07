const REFRESH_SAFETY_WINDOW_MS = 30_000;

export function isSessionExpiredOrNearExpiry(expiresAt?: number, now = Date.now()): boolean {
  if (!expiresAt) return true;
  return expiresAt * 1000 - now < REFRESH_SAFETY_WINDOW_MS;
}

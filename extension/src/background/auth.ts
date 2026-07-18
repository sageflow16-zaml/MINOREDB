import { getAuth, setAuth, clearAuth, getSettings } from '../shared/storage';
import { logger } from '../shared/logger';
import { API_TIMEOUT_MS } from '../shared/constants';
import type { AuthState } from '../shared/types';

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getSettings();
    const url = `${settings.backendUrl}/api/v1/auth/login`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Login failed (${response.status}): ${body}` };
    }

    const data = await response.json();
    const auth: AuthState = {
      token: data.access_token || data.token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_at
        ? new Date(data.expires_at).getTime()
        : Date.now() + 86400000,
    };

    if (!auth.token) {
      return { success: false, error: 'No token in response' };
    }

    await setAuth(auth);
    await logger.info('Authentication successful');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await logger.error('Login failed', err);
    return { success: false, error: msg };
  }
}

export async function logout(): Promise<void> {
  await clearAuth();
  await logger.info('Logged out');
}

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  email?: string;
}> {
  const auth = await getAuth();
  if (!auth?.token) return { authenticated: false };

  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    if (auth.refreshToken) {
      const refreshed = await tryRefresh(auth);
      if (!refreshed) {
        await clearAuth();
        return { authenticated: false };
      }
      return { authenticated: true };
    }
    await clearAuth();
    return { authenticated: false };
  }

  return { authenticated: true };
}

async function tryRefresh(auth: AuthState): Promise<boolean> {
  try {
    const settings = await getSettings();
    const url = `${settings.backendUrl}/api/v1/auth/refresh`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: auth.refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await setAuth({
      token: data.access_token || data.token,
      refreshToken: data.refresh_token || auth.refreshToken,
      expiresAt: data.expires_at
        ? new Date(data.expires_at).getTime()
        : Date.now() + 86400000,
    });

    return true;
  } catch {
    return false;
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = await getAuth();
  if (!auth?.token) return {};
  return { Authorization: `Bearer ${auth.token}` };
}

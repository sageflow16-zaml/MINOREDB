import { test, expect } from '@playwright/test';
import { login, E2E_EMAIL, collectConsoleIssues, forceSessionExpiry } from './helpers';

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    const console = collectConsoleIssues(page);
    await login(page);
    await expect(page.getByText('Projects').first()).toBeVisible();
    console.assertClean();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(E2E_EMAIL);
    await page.locator('input[type="password"]').fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid login|credentials|failed/i)).toBeVisible();
    expect(page.url()).toContain('/login');
  });

  test('returns to the originally requested deep link after login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
    await login(page);
    await expect(page.getByText('Projects').first()).toBeVisible();
    expect(page.url()).toContain('/projects');
  });

  test('logout returns to login and protects routes', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot password form submits', async ({ page }) => {
    const console = collectConsoleIssues(page);
    await page.goto('/forgot-password');
    // Supabase rejects the reserved .test TLD as an invalid email, so use a
    // well-formed address — the form only requires a deliverable-format
    // email to display the success state.
    await page.locator('input[type="email"]').fill('e2e.placeholder@proton.me');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(/we sent a password reset link/i)).toBeVisible({ timeout: 20_000 });
    console.assertClean();
  });

  test('reset password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1', { hasText: 'Reset password' })).toBeVisible();
  });

  test('expired session redirects to login', async ({ page }) => {
    // Seed a stored session whose tokens can no longer be decoded/revalidated —
    // supabase-js fails to refresh it, and the route guard must bounce to /login.
    const expired = {
      access_token: 'expired.jwt.token',
      refresh_token: '',
      expires_at: Math.floor(Date.now() / 1000) - 60,
      token_type: 'bearer',
      expires_in: 3600,
      user: null,
    };
    await page.goto('/login');
    await page.evaluate((p) => {
      const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (key) localStorage.setItem(key, JSON.stringify(p));
    }, expired);
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });

  test('session refresh failure signs the user out cleanly', async ({ page }) => {
    await login(page);
    // Force every refresh-token call to fail: the app must sign out, not hang.
    await page.route('**/auth/v1/token?grant_type=refresh_token*', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant' }) }),
    );
    await forceSessionExpiry(page, -5);
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
  });

  test('session refresh succeeds transparently near expiry', async ({ page }) => {
    await login(page);
    let refreshCalls = 0;
    await page.route('**/auth/v1/token?grant_type=refresh_token*', async (route) => {
      refreshCalls += 1;
      await route.continue();
    });
    // Push the session inside the 30s refresh safety window; the app should
    // refresh in the background without any user-visible interruption.
    await forceSessionExpiry(page, 20);
    await page.goto('/projects');
    await expect(page.getByText('Projects').first()).toBeVisible();
    await page.waitForTimeout(5_000);
    expect(refreshCalls).toBeGreaterThan(0);
    expect(page.url()).not.toContain('/login');
  });

  test('revoked session (401 on data + refresh) signs out to login', async ({ page }) => {
    await login(page);
    // Simulate server-side revocation: data calls 401 and the refresh token
    // is rejected. The app must sign the user out and land on /login — never
    // hang in an error loop.
    await forceSessionExpiry(page, -5);
    await page.route('**/rest/v1/**', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'JWT expired' }) }),
    );
    await page.route('**/auth/v1/token?grant_type=refresh_token*', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant' }) }),
    );
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/, { timeout: 25_000 });
  });
});

import { expect, type Page } from '@playwright/test';

export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'e2e@minoredb.test';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

export const PROJECT_NAME = `E2E ${Date.now()}`;

/** Walks to the login page and signs in with the E2E account. */
export async function login(page: Page, email = E2E_EMAIL, password = E2E_PASSWORD) {
  await page.goto('/login');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await expect(passwordInput).toHaveValue(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

/** Ensures the E2E user owns at least one project; returns its id. */
export async function ensureProject(page: Page): Promise<string> {
  await page.goto('/projects');
  await settled(page);
  const card = page.locator('main .cursor-pointer').first();
  if (await card.count()) {
    await card.click();
  } else {
    await page.getByRole('button', { name: /Create Project|New Project|Create a project/i }).first().click();
    await page.getByPlaceholder('Project name').fill(PROJECT_NAME);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('main').getByText(PROJECT_NAME).first()).toBeVisible({ timeout: 15_000 });
    await page.locator('main .cursor-pointer').first().click();
  }
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}\/dashboard/);
  return page.url().match(/\/projects\/([0-9a-f-]{36})/)?.[1] ?? '';
}

/** Navigates to a module under the project and waits for it to settle. */
export async function gotoModule(page: Page, projectId: string, path: string) {
  await page.goto(`/projects/${projectId}/${path}`);
  await settled(page);
}

/**
 * Waits for the page to settle: a visible heading, error state or empty state —
 * never an infinite spinner.
 */
export async function settled(page: Page) {
  await expect
    .poll(
      async () => {
        const spinnerVisible = await page
          .locator('[class*="animate-spin"]')
          .first()
          .isVisible()
          .catch(() => false);
        if (spinnerVisible) return false;
        const heading = await page.locator('h1, h2').first().isVisible().catch(() => false);
        if (heading) return true;
        const message = await page
          .locator('main')
          .getByText(/something went wrong|failed to load|unable to load|error/i)
          .first()
          .isVisible()
          .catch(() => false);
        if (message) return true;
        // Some pages (Workspace, ICT, Sources, Copilot, ...) render real
        // content without any h1/h2. Treat visible non-empty main content
        // as settled.
        const mainText = await page.locator('main').innerText().catch(() => '');
        return mainText.trim().length > 0;
      },
      { timeout: 30_000, intervals: [500] },
    )
    .toBe(true);
}

/** Counts full document navigations; assertNoFullReload checks no NEW ones occurred after a snapshot. */
export function trackNavigations(page: Page) {
  let documentRequests = 0;
  page.on('request', (req) => {
    if (req.isNavigationRequest() && req.resourceType() === 'document' && req.frame() === page.mainFrame()) {
      documentRequests += 1;
    }
  });
  return {
    snapshot() {
      const start = documentRequests;
      return {
        assertNoFullReload() {
          expect(documentRequests, `SPA performed ${documentRequests - start} full page reload(s) during SPA interactions`).toBe(start);
        },
      };
    },
  };
}

export function collectConsoleIssues(page: Page, opts: { allowFailedResponses?: RegExp[] } = {}) {
  const issues: string[] = [];
  const failedResponses = new Map<string, number>();
  page.on('response', (r) => {
    if (r.status() >= 400) failedResponses.set(r.url(), r.status());
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Browser logs "Failed to load resource" for any HTTP >= 400. Callers may
    // allowlist expected degraded endpoints (e.g. market data edge functions
    // when upstream API keys are absent) so those do not fail the test.
    const degraded = /Failed to load resource: the server responded with a status of (\d+)/.exec(text);
    if (degraded && [...failedResponses.entries()].some(([url, status]) =>
      status === Number(degraded[1]) && opts.allowFailedResponses?.some((re) => re.test(url)),
    )) {
      return;
    }
    issues.push(`console.error: ${text}`);
  });
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  return {
    issues,
    reset() {
      issues.length = 0;
    },
    assertClean() {
      expect(issues, 'Console/page errors detected:\n' + issues.join('\n')).toEqual([]);
    },
  };
}

/** SPA-navigates via the sidebar NavLink to a module (no full reload). */
export async function sidebarTo(page: Page, projectId: string, path: string) {
  await page.locator(`aside nav a[href="/projects/${projectId}/${path}"]`).first().click();
  await page.waitForURL(new RegExp(`/projects/${projectId}/${path}`), { timeout: 20_000 });
  await settled(page);
}

/** Makes the persisted Supabase session look expired/valid in `secondsFromNow`. */
export async function forceSessionExpiry(page: Page, secondsFromNow: number) {
  await page.evaluate((seconds) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return;
    const stored = JSON.parse(localStorage.getItem(key)!);
    stored.expires_at = Math.floor(Date.now() / 1000) + seconds;
    localStorage.setItem(key, JSON.stringify(stored));
  }, secondsFromNow);
}

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
  const card = page.locator('.cursor-pointer').first();
  if (await card.count()) {
    await card.click();
  } else {
    await page.getByRole('button', { name: /Create Project|New Project/ }).first().click();
    await page.getByPlaceholder('Project name').fill(PROJECT_NAME);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText(PROJECT_NAME).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText(PROJECT_NAME).first().click();
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
        return message;
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

export function collectConsoleIssues(page: Page) {
  const issues: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  return {
    issues,
    assertClean() {
      expect(issues, 'Console/page errors detected:\n' + issues.join('\n')).toEqual([]);
    },
  };
}

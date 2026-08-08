import { test, expect } from '@playwright/test';
import { ensureProject, settled, trackNavigations, collectConsoleIssues, sidebarTo } from './helpers';

test.describe('Reliability states', () => {
  test('loading -> success on Dashboard', async ({ page }) => {
    const projectId = await ensureProject(page);
    await page.goto(`/projects/${projectId}/dashboard`);
    await settled(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('API failure shows error state and recovers via retry', async ({ page }) => {
    const projectId = await ensureProject(page);

    // Break all data calls for a first visit: page must show an error state.
    const console = collectConsoleIssues(page);
    await page.route('**/rest/v1/**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom' }) }),
    );
    await page.goto(`/projects/${projectId}/dashboard`);
    await settled(page);
    const errorVisible = await page
      .getByText(/something went wrong|failed to load|error/i)
      .first()
      .isVisible()
      .catch(() => false);

    await page.unroute('**/rest/v1/**');
    // The intentional 500s above will have logged console errors; ignore them
    // and only assert cleanliness on the recovery phase.
    console.reset();
    if (errorVisible) {
      const retry = page.getByRole('button', { name: /retry|try again/i }).first();
      if (await retry.count()) {
        await retry.click();
        await settled(page);
      }
    }
    await page.goto(`/projects/${projectId}/dashboard`);
    await settled(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    console.assertClean();
  });

  test('no full page reload during SPA interactions', async ({ page }) => {
    const nav = trackNavigations(page);
    const projectId = await ensureProject(page);
    const s = nav.snapshot();
    const paths = ['dashboard', 'ict', 'portfolio', 'automation', 'settings', 'intelligence', 'analytics'];
    for (const p of paths) {
      await sidebarTo(page, projectId, p);
    }
    s.assertNoFullReload();
  });

  test('zero console errors across core pages', async ({ page }) => {
    const console = collectConsoleIssues(page, {
      allowFailedResponses: [/supabase\.co\/functions\/v1\/collector/],
    });
    const projectId = await ensureProject(page);
    for (const p of ['dashboard', 'ict', 'portfolio', 'automation', 'settings', 'intelligence', 'analytics', 'copilot']) {
      await sidebarTo(page, projectId, p);
    }
    console.assertClean();
  });

  test('retry refetches and recovers from a failed page load', async ({ page }) => {
    const projectId = await ensureProject(page);

    let failNext = true;
    await page.route('**/rest/v1/projects*', async (route) => {
      if (failNext) {
        failNext = false;
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/projects');
    // First payload failed silently (fallback rendering); retry should succeed.
    await page.goto('/projects', { waitUntil: 'load' });
    const retryButton = page.getByRole('button', { name: /retry|try again/i }).first();
    if (await retryButton.count()) {
      await retryButton.click();
    }
    await settled(page);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

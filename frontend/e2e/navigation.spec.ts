import { test, expect, type Page } from '@playwright/test';
import { ensureProject, settled, trackNavigations, collectConsoleIssues, sidebarTo } from './helpers';

async function openContext(page: Page) {
  const nav = trackNavigations(page);
  const console = collectConsoleIssues(page);
  const projectId = await ensureProject(page);
  return { projectId, nav, console };
}

test.describe('Navigation', () => {
  test('sidebar reaches every major module without reloads', async ({ page }) => {
    const { projectId, nav, console } = await openContext(page);

    const modules: Array<{ name: string; path: string; marker: RegExp }> = [
      { name: 'Dashboard', path: 'dashboard', marker: /total p&l|equity curve/i },
      { name: 'ICT Engine', path: 'ict', marker: /no analysis available|current session/i },
      { name: 'Journal', path: 'learning', marker: /continuous learning/i },
      { name: 'Portfolio', path: 'portfolio', marker: /account breakdown|balance/i },
      { name: 'Risk', path: 'risk', marker: /risk management/i },
      { name: 'Analytics', path: 'analytics', marker: /analytics/i },
      { name: 'Copilot', path: 'copilot', marker: /new chat|ai research copilot/i },
      { name: 'Automation', path: 'automation', marker: /automation & workflow/i },
      { name: 'Settings', path: 'settings', marker: /configure your workspace|your trading identity/i },
      { name: 'Agent Fleet', path: 'intelligence', marker: /intelligence os|all agents/i },
    ];

    const s = nav.snapshot();
    for (const m of modules) {
      await sidebarTo(page, projectId, m.path);
      await expect(page.getByText(m.marker).first(), `${m.name} did not render expected content`).toBeVisible();
      s.assertNoFullReload();
    }

    console.assertClean();
  });

  test('browser back and forward navigate within the SPA', async ({ page }) => {
    const { projectId, nav } = await openContext(page);
    await sidebarTo(page, projectId, 'dashboard');
    await sidebarTo(page, projectId, 'analytics');
    const s = nav.snapshot();
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
    await settled(page);
    await page.goForward();
    await expect(page).toHaveURL(/\/analytics/);
    await settled(page);
    s.assertNoFullReload();
  });

  test('deep links resolve directly', async ({ page }) => {
    const { projectId } = await openContext(page);
    for (const path of ['dashboard', 'ict', 'portfolio', 'automation', 'intelligence']) {
      await page.goto(`/projects/${projectId}/${path}`);
      await settled(page);
      expect(page.url()).toContain(`/projects/${projectId}/${path}`);
    }
  });

  test('refresh keeps the session and page functional', async ({ page }) => {
    const { projectId } = await openContext(page);
    await page.goto(`/projects/${projectId}/dashboard`);
    await settled(page);
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
    await settled(page);
    expect(page.url()).toContain(`/projects/${projectId}/dashboard`);
  });

  test('second tab shares the session', async ({ page, context }) => {
    const { projectId } = await openContext(page);
    const tab2 = await context.newPage();
    await tab2.goto(`/projects/${projectId}/dashboard`);
    await settled(tab2);
    await expect(tab2).not.toHaveURL(/\/login/);
    await tab2.close();
  });

  test('project switching works from the project selector', async ({ page }) => {
    const { projectId } = await openContext(page);
    // Create a second project so switching is meaningful.
    await page.goto('/projects');
    await page.getByRole('button', { name: /New Project/ }).click();
    const name = `E2E switch ${Date.now()}`;
    await page.getByPlaceholder('Project name').fill(name);
    await page.getByRole('button', { name: 'Create' }).click();
    const card = page.locator('main').getByText(name).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await page.waitForURL(/\/projects\/[0-9a-f-]{36}\/dashboard/);
    const secondId = page.url().match(/\/projects\/([0-9a-f-]{36})/)?.[1];
    expect(secondId).not.toBe(projectId);

    await page.goto('/projects');
    await page.getByText('Dashboard').first().isVisible();
    // Back to the first project card.
    const first = await page.locator('.cursor-pointer', { hasText: 'E2E' }).count();
    expect(first).toBeGreaterThanOrEqual(1);
  });
});

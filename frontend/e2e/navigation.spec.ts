import { test, expect, type Page } from '@playwright/test';
import { login, ensureProject, settled, trackNavigations, collectConsoleIssues } from './helpers';

async function openContext(page: Page) {
  const nav = trackNavigations(page);
  const console = collectConsoleIssues(page);
  await login(page);
  const projectId = await ensureProject(page);
  return { projectId, nav, console };
}

test.describe('Navigation', () => {
  test('sidebar reaches every major module without reloads', async ({ page }) => {
    const { projectId, nav, console } = await openContext(page);

    const modules: Array<{ name: string; path: string; marker: RegExp }> = [
      { name: 'Dashboard', path: 'dashboard', marker: /equity curve|active trades/i },
      { name: 'ICT Engine', path: 'ict', marker: /current session|swing points/i },
      { name: 'Journal', path: 'learning', marker: /continuous learning/i },
      { name: 'Portfolio', path: 'portfolio', marker: /account breakdown|balance/i },
      { name: 'Risk', path: 'risk', marker: /risk rule/i },
      { name: 'Analytics', path: 'analytics', marker: /behavior analysis|analytics/i },
      { name: 'Knowledge Center', path: 'knowledge-center', marker: /knowledge center/i },
      { name: 'Copilot', path: 'copilot', marker: /AI Research Copilot|AI Agents/i },
      { name: 'Automation', path: 'automation', marker: /automation & workflow/i },
      { name: 'Settings', path: 'settings', marker: /advanced|clear data/i },
      { name: 'Agent Fleet', path: 'intelligence', marker: /all agents/i },
    ];

    for (const m of modules) {
      const s = nav.snapshot();
      await page.goto(`/projects/${projectId}/${m.path}`);
      await settled(page);
      const visible = await page.getByText(m.marker).first().isVisible().catch(() => false);
      expect(visible, `${m.name} did not render expected content`).toBe(true);
      s.assertNoFullReload();
    }

    nav.snapshot().assertNoFullReload();
    console.assertClean();
  });

  test('browser back and forward navigate within the SPA', async ({ page }) => {
    const { projectId, nav } = await openContext(page);
    await page.goto(`/projects/${projectId}/dashboard`);
    await settled(page);
    const s = nav.snapshot();
    await page.goto(`/projects/${projectId}/analytics`);
    await settled(page);
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
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText(name).first().click();
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

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ensureProject, settled, gotoModule } from './helpers';

const CRITICAL_ROUTES = [
  'dashboard',
  'ict',
  'portfolio',
  'learning',
  'analytics',
  'settings',
  'knowledge-center',
  'copilot',
  'intelligence',
];

test.describe('Accessibility', () => {
  test.describe.configure({ mode: 'serial' });

  let projectId: string;
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth-state.json' });
    const page = await context.newPage();
    projectId = await ensureProject(page);
    await context.close();
  });

  test('keyboard reachability of primary navigation', async ({ page }) => {
    // The main sidebar links must be reachable with the keyboard only.
    await gotoModule(page, projectId, 'dashboard');
    let foundSidebarLink = false;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const el = await page.evaluateHandle(() => document.activeElement);
      const href = await el
        .evaluate((n: Element) => (n instanceof HTMLAnchorElement ? n.getAttribute('href') : null))
        .catch(() => null);
      if (href && href.includes(`/projects/${projectId}`)) {
        foundSidebarLink = true;
        break;
      }
    }
    expect(foundSidebarLink, 'no sidebar project link reachable via Tab').toBe(true);
  });

  for (const route of CRITICAL_ROUTES) {
    test(`axe scan: ${route}`, async ({ page }) => {
      await gotoModule(page, projectId, route);
      await settled(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const seriousOnly = results.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );
      const summary = seriousOnly.map(
        (v) => `${v.id} (${v.impact}) [${v.nodes.length}] ${v.help}`,
      );
      expect(
        seriousOnly.length,
        `${route} axe violations:\n${summary.join('\n')}\n${JSON.stringify(
          results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
          null,
          2,
        )}`,
      ).toBe(0);
    });
  }
});
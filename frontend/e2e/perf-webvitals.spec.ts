import { test } from '@playwright/test';
import { chromium, type Browser, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES = ['dashboard', 'ict', 'portfolio', 'learning'] as const;

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (k: string) => (env.match(new RegExp(`^${k}=(.+)$`, 'm')) || [])[1] || '';
const E2E_EMAIL = getEnv('E2E_EMAIL') || 'e2e@minoredb.test';
const E2E_PASSWORD = getEnv('E2E_PASSWORD') || '';

const INSTRUMENT = `
  window.__lcp__ = 0;
  window.__cls__ = 0;
  window.__lt__ = 0;
  window.__ltMs__ = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === 'largest-contentful-paint') window.__lcp__ = e.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__cls__ += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__lt__ += 1;
        window.__ltMs__ += e.duration;
      }
    }).observe({ type: 'longtask' });
  } catch (err) {}
  window.__readPerf__ = () => {
    const paints = performance.getEntriesByType('paint');
    const res = performance.getEntriesByType('resource');
    const nav = performance.getEntriesByType('navigation')[0];
    const bytes = (r) => (r.transferSize || r.encodedBodySize || 0);
    return {
      fcp: Math.round(paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? 0),
      lcp: Math.round(window.__lcp__),
      cls: Math.round(window.__cls__ * 1000) / 1000,
      longTasks: window.__lt__,
      longTaskMs: Math.round(window.__ltMs__),
      requests: res.length,
      scriptKB: Math.round(res.filter((r) => r.initiatorType === 'script').reduce((a, r) => a + bytes(r), 0) / 1024),
      totalKB: Math.round(res.reduce((a, r) => a + bytes(r), 0) / 1024),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      url: window.location.pathname,
    };
  };
`;

test.describe.configure({ mode: 'serial' });

test('web vitals on authenticated routes (local, unthrottled)', async () => {
  test.setTimeout(600_000);
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage();
  const results: Record<string, unknown> = { login: null };
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[type=email]').fill(E2E_EMAIL);
    await page.locator('input[type=password]').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 120_000 });
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    const id = await page.evaluate(async () => {
      const items = document.querySelectorAll('main [data-project-card], main .cursor-pointer');
      const card: HTMLElement | null = (items[0] as HTMLElement) ?? null;
      let projectId = '';
      if (card) {
        card.click();
        await new Promise((r) => setTimeout(r, 4000));
      }
      const m = window.location.pathname.match(/\/projects\/([0-9a-f-]{36})/);
      projectId = m ? m[1] : '';
      return projectId;
    });
    if (!id) throw new Error('no project id found');
    for (const route of ROUTES) {
      await page.addInitScript(INSTRUMENT);
      const t0 = Date.now();
      await page.goto(`/projects/${id}/${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(6000);
      const m: Record<string, unknown> = await page.evaluate(() => (window as any).__readPerf__());
      results[route] = { ...m, elapsedMs: Date.now() - t0 };
    }
    const loginPerf = await page.evaluate(() => (window as any).__readPerf__?.());
    results.login = loginPerf ?? null;
  } finally {
    await browser.close();
  }
  fs.writeFileSync('e2e/perf-results.json', JSON.stringify(results, null, 2));
  console.log('PERF-RESULTS', JSON.stringify(results));
});
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'https://minoredb.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\.spec\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth-state.json' },
      dependencies: ['setup'],
      // A single serial worker avoids racing the shared persisted session
      // (refresh-token rotation / Supabase auth rate limits) across parallel
      // browser contexts during the module sweep.
      workers: 1,
    },
    {
      name: 'chromium-auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      // auth.spec mutates/revokes the shared E2E user's session (refresh-token
      // rotation, forced expiry). Running it last keeps parallel workers from
      // racing the persisted storageState session used by every other spec.
      dependencies: ['chromium'],
    },
  ],
});

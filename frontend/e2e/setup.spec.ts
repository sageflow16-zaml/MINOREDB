import { test as setup } from '@playwright/test';
import { login } from './helpers';

setup('authenticate and persist session', async ({ page }) => {
  await login(page);
  await page.context().storageState({ path: 'e2e/.auth-state.json' });
});

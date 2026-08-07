import { test } from '@playwright/test';
import { login, ensureProject, gotoModule, settled, trackNavigations, collectConsoleIssues } from './helpers';

const MODULES: Array<{ name: string; path: string; marker: RegExp }> = [
  { name: 'Dashboard', path: 'dashboard', marker: /equity curve|active trades/i },
  { name: 'Timeline', path: 'timeline', marker: /timeline/i },
  { name: 'Trades', path: 'trades', marker: /trades|no trades/i },
  { name: 'Workspace', path: 'workspace', marker: /workspace/i },
  { name: 'Journal', path: 'learning', marker: /continuous learning/i },
  { name: 'Strategies', path: 'strategies', marker: /strateg/i },
  { name: 'Playbooks', path: 'playbooks', marker: /playbook/i },
  { name: 'Replay', path: 'replay', marker: /replay/i },
  { name: 'Planning', path: 'planning', marker: /planning/i },
  { name: 'Market Structure', path: 'market-structure', marker: /market/i },
  { name: 'AI Analyst', path: 'analyst', marker: /analyst/i },
  { name: 'ICT Engine', path: 'ict', marker: /current session|swing points/i },
  { name: 'Research Engine', path: 'research', marker: /research/i },
  { name: 'Similarity', path: 'similarity', marker: /similarity/i },
  { name: 'Decision Support', path: 'decision', marker: /decision/i },
  { name: 'Knowledge Graph', path: 'knowledge-graph', marker: /knowledge/i },
  { name: 'Knowledge Engine', path: 'knowledge-engine', marker: /knowledge/i },
  { name: 'Library', path: 'sources', marker: /library|sources/i },
  { name: 'Statistics', path: 'statistics', marker: /statistic/i },
  { name: 'Performance', path: 'performance', marker: /performance/i },
  { name: 'Risk', path: 'risk', marker: /risk rule/i },
  { name: 'Analytics', path: 'analytics', marker: /behavior analysis|analytics/i },
  { name: 'Macro', path: 'macro', marker: /macro/i },
  { name: 'Knowledge Center', path: 'knowledge-center', marker: /knowledge center/i },
  { name: 'Copilot', path: 'copilot', marker: /AI Research Copilot|AI Agents/i },
  { name: 'Automation', path: 'automation', marker: /automation & workflow/i },
  { name: 'Automation Workflows', path: 'automation/workflows', marker: /workflow/i },
  { name: 'Automation Rules', path: 'automation/rules', marker: /rule/i },
  { name: 'Automation Jobs', path: 'automation/jobs', marker: /job/i },
  { name: 'Portfolio', path: 'portfolio', marker: /account breakdown|balance/i },
  { name: 'Portfolio Accounts', path: 'portfolio/accounts', marker: /account/i },
  { name: 'Portfolio Brokers', path: 'portfolio/brokers', marker: /broker/i },
  { name: 'Portfolio Analytics', path: 'portfolio/analytics', marker: /analytics/i },
  { name: 'Portfolio Risk', path: 'portfolio/risk', marker: /risk/i },
  { name: 'Portfolio Allocations', path: 'portfolio/allocations', marker: /allocat/i },
  { name: 'Broker Hub', path: 'broker', marker: /broker/i },
  { name: 'Broker Setup', path: 'broker/setup', marker: /broker|connect/i },
  { name: 'Market Dashboard', path: 'market-intel', marker: /market/i },
  { name: 'Economic Calendar', path: 'market-intel/calendar', marker: /calendar/i },
  { name: 'Correlation Center', path: 'market-intel/correlations', marker: /correlation/i },
  { name: 'Watchlist', path: 'market-intel/watchlist', marker: /watchlist/i },
  { name: 'Quant Research', path: 'quant-research', marker: /quant/i },
  { name: 'Quant Backtests', path: 'quant-research/backtests', marker: /backtest/i },
  { name: 'Quant Simulations', path: 'quant-research/simulations', marker: /simulation/i },
  { name: 'Quant Walkforward', path: 'quant-research/walkforward', marker: /walkforward|walk-forward/i },
  { name: 'Quant Optimization', path: 'quant-research/optimization', marker: /optimization/i },
  { name: 'Quant Edge Health', path: 'quant-research/edge-health', marker: /edge health/i },
  { name: 'Quant Notebooks', path: 'quant-research/notebooks', marker: /notebook/i },
  { name: 'Trader Intelligence', path: 'trader-intelligence', marker: /intelligence/i },
  { name: 'Brain Dashboard', path: 'brain', marker: /brain/i },
  { name: 'Agent Fleet', path: 'intelligence', marker: /all agents/i },
  { name: 'Settings', path: 'settings', marker: /advanced|clear data/i },
  { name: 'Obsidian Vaults', path: 'obsidian/vaults', marker: /vault/i },
  { name: 'Obsidian Sync', path: 'obsidian/sync', marker: /sync/i },
  { name: 'Obsidian Notes', path: 'obsidian/notes', marker: /note/i },
  { name: 'Obsidian Templates', path: 'obsidian/templates', marker: /template/i },
  { name: 'Obsidian Search', path: 'obsidian/search', marker: /search/i },
];

test.describe('Module sweep', () => {
  for (const m of MODULES) {
    test(`${m.name} loads without infinite loading or errors`, async ({ page }) => {
      const nav = trackNavigations(page);
      const console = collectConsoleIssues(page);
      await login(page);
      const projectId = await ensureProject(page);
      const s = nav.snapshot();
      await gotoModule(page, projectId, m.path);
      const rendered = await page
        .getByText(m.marker)
        .first()
        .isVisible()
        .catch(() => false);
      if (!rendered) {
        // Allow graceful error/empty states, but the page must have settled.
        await page.waitForTimeout(2_000);
      }
      expect(rendered, `${m.name} did not render (marker ${m.marker})`).toBe(true);
      s.assertNoFullReload();
      console.assertClean();
    });
  }
});

import { test, expect } from '@playwright/test';
import { ensureProject, gotoModule, settled, trackNavigations, collectConsoleIssues } from './helpers';

const MODULES: Array<{ name: string; path: string; marker: RegExp }> = [
  { name: 'Dashboard', path: 'dashboard', marker: /total p&l|equity curve|good (afternoon|morning|evening)/i },
  { name: 'Timeline', path: 'timeline', marker: /project timeline/i },
  { name: 'Trades', path: 'trades', marker: /trading journal/i },
  { name: 'Workspace', path: 'workspace', marker: /research workspace|no project selected/i },
  { name: 'Journal', path: 'learning', marker: /continuous learning/i },
  { name: 'Strategies', path: 'strategies', marker: /strategy library/i },
  { name: 'Playbooks', path: 'playbooks', marker: /playbook/i },
  { name: 'Replay', path: 'replay', marker: /replay/i },
  { name: 'Planning', path: 'planning', marker: /planning/i },
  { name: 'Market Structure', path: 'market-structure', marker: /market structure/i },
  { name: 'AI Analyst', path: 'analyst', marker: /ai research analyst/i },
  { name: 'ICT Engine', path: 'ict', marker: /no analysis available|upload trading data|current session/i },
  { name: 'Research Engine', path: 'research', marker: /research/i },
  { name: 'Similarity', path: 'similarity', marker: /similarity engine/i },
  { name: 'Decision Support', path: 'decision', marker: /decision support/i },
  { name: 'Knowledge Graph', path: 'knowledge-graph', marker: /knowledge graph|no graph data/i },
  { name: 'Knowledge Engine', path: 'knowledge-engine', marker: /knowledge engine/i },
  { name: 'Library', path: 'sources', marker: /no sources yet|library/i },
  { name: 'Statistics', path: 'statistics', marker: /statistics/i },
  { name: 'Performance', path: 'performance', marker: /performance/i },
  { name: 'Risk', path: 'risk', marker: /risk management/i },
  { name: 'Analytics', path: 'analytics', marker: /analytics/i },
  { name: 'Macro', path: 'macro', marker: /macro terminal/i },
  { name: 'Knowledge Center', path: 'knowledge-center', marker: /knowledge center/i },
  { name: 'Copilot', path: 'copilot', marker: /new chat|ai research copilot/i },
  { name: 'Automation', path: 'automation', marker: /automation & workflow/i },
  { name: 'Automation Workflows', path: 'automation/workflows', marker: /workflows/i },
  { name: 'Automation Rules', path: 'automation/rules', marker: /rule engine/i },
  { name: 'Automation Jobs', path: 'automation/jobs', marker: /task scheduler/i },
  { name: 'Portfolio', path: 'portfolio', marker: /account breakdown|balance|portfolio/i },
  { name: 'Portfolio Accounts', path: 'portfolio/accounts', marker: /accounts/i },
  { name: 'Portfolio Brokers', path: 'portfolio/brokers', marker: /broker profiles/i },
  { name: 'Portfolio Analytics', path: 'portfolio/analytics', marker: /portfolio analytics/i },
  { name: 'Portfolio Risk', path: 'portfolio/risk', marker: /portfolio risk/i },
  { name: 'Portfolio Allocations', path: 'portfolio/allocations', marker: /allocation manager/i },
  { name: 'Broker Hub', path: 'broker', marker: /broker integration hub/i },
  { name: 'Broker Setup', path: 'broker/setup', marker: /new broker connection/i },
  { name: 'Market Dashboard', path: 'market-intel', marker: /market intelligence/i },
  { name: 'Economic Calendar', path: 'market-intel/calendar', marker: /economic calendar/i },
  { name: 'Correlation Center', path: 'market-intel/correlations', marker: /correlation center/i },
  { name: 'Watchlist', path: 'market-intel/watchlist', marker: /watchlist/i },
  { name: 'Quant Research', path: 'quant-research', marker: /quantitative research lab/i },
  { name: 'Quant Backtests', path: 'quant-research/backtests', marker: /backtest lab/i },
  { name: 'Quant Simulations', path: 'quant-research/simulations', marker: /simulation lab/i },
  { name: 'Quant Walkforward', path: 'quant-research/walkforward', marker: /walk-forward analysis/i },
  { name: 'Quant Optimization', path: 'quant-research/optimization', marker: /parameter optimization/i },
  { name: 'Quant Edge Health', path: 'quant-research/edge-health', marker: /edge health monitor/i },
  { name: 'Quant Notebooks', path: 'quant-research/notebooks', marker: /research notebook/i },
  { name: 'Trader Intelligence', path: 'trader-intelligence', marker: /intelligence hub/i },
  { name: 'Brain Dashboard', path: 'brain', marker: /ai trading brain/i },
  { name: 'Agent Fleet', path: 'intelligence', marker: /intelligence os/i },
  { name: 'Settings', path: 'settings', marker: /configure your workspace|your trading identity/i },
  { name: 'Obsidian Vaults', path: 'obsidian/vaults', marker: /obsidian vaults/i },
  { name: 'Obsidian Sync', path: 'obsidian/sync', marker: /sync dashboard/i },
  { name: 'Obsidian Notes', path: 'obsidian/notes', marker: /note explorer/i },
  { name: 'Obsidian Templates', path: 'obsidian/templates', marker: /template library/i },
  { name: 'Obsidian Search', path: 'obsidian/search', marker: /unified search/i },
];

test.describe('Module sweep', () => {
  test.describe.configure({ mode: 'serial' });
  let projectId: string;

  test.beforeAll(async ({ browser }) => {
    // Login is handled once by the setup project (storageState). Here we only
    // ensure a project exists; it is reused across the whole sweep.
    const context = await browser.newContext({ storageState: 'e2e/.auth-state.json' });
    const page = await context.newPage();
    projectId = await ensureProject(page);
    await context.close();
  });

  for (const m of MODULES) {
    test(`${m.name} loads without infinite loading or errors`, async ({ page }) => {
      const nav = trackNavigations(page);
      const console = collectConsoleIssues(page, {
        // Degraded endpoints on the shared Supabase project: market data
        // edge function when upstream keys are absent, and research_session
        // (migration 00034 not applied there). Pages degrade gracefully.
        allowFailedResponses: [
          /supabase\.co\/functions\/v1\/collector/,
          /supabase\.co\/rest\/v1\/research_session/,
        ],
      });
      await gotoModule(page, projectId, m.path);
      // The goto itself is the one expected full navigation; any further
      // document load during settle/marker checks indicates a reload loop.
      const s = nav.snapshot();
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

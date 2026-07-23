"""Systematic API endpoint verification for all pages."""
import sys, os, json, time, http.client

def api(method, path, body=None):
    conn = http.client.HTTPConnection('127.0.0.1', 8000, timeout=10)
    conn.request(method, path, json.dumps(body) if body else None, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
    })
    resp = conn.getresponse()
    data = resp.read().decode()
    conn.close()
    return resp.status, data

# Login
conn = http.client.HTTPConnection('127.0.0.1', 8000, timeout=10)
conn.request('POST', '/api/v1/auth/login', json.dumps({'email': 'demo@minore.io', 'password': 'demo1234'}), {'Content-Type': 'application/json'})
resp = conn.getresponse()
TOKEN = json.loads(resp.read().decode())['access_token']
conn.close()

# Get project
s, d = api('GET', '/api/v1/projects/')
PID = json.loads(d)[0]['id']
BASE = '/api/v1/projects/' + PID

print('Testing API endpoints...\n')

results = []
def test(name, method, path, expect_200=True):
    try:
        s, d = api(method, path)
        status = 'PASS' if (expect_200 and s == 200) or (not expect_200 and s != 500) else 'FAIL'
        detail = '{}: {}'.format(s, d[:100] if s != 200 else 'OK')
        results.append((name, path, status, detail))
        icon = '[OK]' if status == 'PASS' else '[!!]'
        print('{} {:35s} {:40s} {:>4s}'.format(icon, name, path, str(s)))
    except Exception as e:
        results.append((name, path, 'FAIL', str(e)))
        print('[!!] {:35s} {:40s} ERROR'.format(name, path))

# ─── Dashboard ───
test('Dashboard', 'GET', BASE + '/dashboard/')

# ─── Projects ───
test('Projects List', 'GET', '/api/v1/projects/')
test('Project Detail', 'GET', BASE)

# ─── Strategies ───
test('Strategies List', 'GET', BASE + '/strategies/')

# ─── Trades (Journal) ───
test('Trades List', 'GET', BASE + '/trades/')
test('Portfolio Groups', 'GET', BASE + '/portfolio/groups')

# ─── Replay ───
test('Replay Sessions', 'GET', BASE + '/replay/sessions')
test('Replay Dashboard', 'GET', BASE + '/replay/dashboard')

# ─── Learning ───
test('Learning Events', 'GET', BASE + '/learning/events')
test('Learning Snapshots', 'GET', BASE + '/learning/snapshots')
test('Learning Status', 'GET', BASE + '/learning/status')

# ─── Research Notes (frontend calls /research GET) ───
test('Research History', 'GET', BASE + '/research/history/list')
test('Research (direct)', 'GET', BASE + '/research/')

# ─── Market Structure ───
test('Market Structures', 'GET', BASE + '/market-structures/')

# ─── Statistics ───
test('Stats Overview', 'GET', BASE + '/statistics/overview')
test('Stats Risk', 'GET', BASE + '/statistics/risk')
test('Stats By Pair', 'GET', BASE + '/statistics/by-pair')
test('Stats Equity Curve', 'GET', BASE + '/statistics/equity-curve')
test('Stats Monthly Returns', 'GET', BASE + '/statistics/monthly-returns')

# ─── Risk ───
test('Risk Dashboard', 'GET', BASE + '/risk/dashboard')
test('Risk Rules', 'GET', BASE + '/risk/rules')
test('Risk Alerts', 'GET', BASE + '/risk/alerts')
test('Risk Violations', 'GET', BASE + '/risk/violations')

# ─── Planning ───
test('Planning Dashboard', 'GET', BASE + '/planning/dashboard')
test('Planning Plans', 'GET', BASE + '/planning/plans')
test('Planning Goals', 'GET', BASE + '/planning/goals')
test('Planning Events', 'GET', BASE + '/planning/events')

# ─── Portfolio ───
test('Portfolio Dashboard', 'GET', BASE + '/portfolio/dashboard')
test('Portfolio Accounts', 'GET', BASE + '/portfolio/accounts')
test('Portfolio Risk', 'GET', BASE + '/portfolio/risk')
test('Portfolio Allocation', 'GET', BASE + '/portfolio/allocations')
test('Portfolio Brokers', 'GET', BASE + '/portfolio/brokers')
test('Portfolio Performance', 'GET', BASE + '/portfolio/performance')
test('Portfolio History', 'GET', BASE + '/portfolio/history')

# ─── Brokers ───
test('Broker Dashboard', 'GET', BASE + '/broker/dashboard')
test('Broker Providers', 'GET', BASE + '/broker/providers')

# ─── Market Intelligence ───
test('Market Intel Dashboard', 'GET', BASE + '/market-intel/dashboard')
test('Market Intel Events', 'GET', BASE + '/market-intel/events')
test('Market Intel Regimes', 'GET', BASE + '/market-intel/regimes')
test('Market Intel Correlations', 'GET', BASE + '/market-intel/correlations')
test('Market Intel Sessions', 'GET', BASE + '/market-intel/sessions')
test('Market Intel Watchlists', 'GET', BASE + '/market-intel/watchlists')
test('Market Intel Alerts', 'GET', BASE + '/market-intel/alerts')
test('Market Intel Timeline', 'GET', BASE + '/market-intel/timeline')
test('Market Intel Liquidity', 'GET', BASE + '/market-intel/liquidity/EURUSD')

# ─── AI ───
test('AI Dashboard', 'GET', BASE + '/ai/dashboard')
test('AI Profile', 'GET', BASE + '/ai/profile')
test('AI Insights', 'GET', BASE + '/ai/insights')
test('AI Recommendations', 'GET', BASE + '/ai/recommendations')
test('AI Coaching', 'GET', BASE + '/ai/coaching')
test('AI Evaluations', 'GET', BASE + '/ai/evaluations')
test('AI Patterns', 'GET', BASE + '/ai/patterns')
test('AI Knowledge Links', 'GET', BASE + '/ai/knowledge/links')
test('AI Knowledge Graph', 'GET', BASE + '/ai/knowledge/graph')

# ─── Trader Intelligence ───
test('Trader Intel Dashboard', 'GET', BASE + '/trader-intelligence/dashboard')
test('Trader Intel Debriefs', 'GET', BASE + '/trader-intelligence/debriefs')
test('Trader Intel Patterns', 'GET', BASE + '/trader-intelligence/patterns')
test('Trader Intel Rules', 'GET', BASE + '/trader-intelligence/rules')
test('Trader Intel Profile', 'GET', BASE + '/trader-intelligence/profile')
test('Trader Intel Snapshots', 'GET', BASE + '/trader-intelligence/profile/snapshots')

# ─── Knowledge Graph ───
test('Knowledge Graph Data', 'GET', BASE + '/graph/data')
test('Knowledge Rules', 'GET', BASE + '/knowledge/')

# ─── Brain ───
test('Brain Dashboard', 'GET', BASE + '/brain/dashboard')
test('Brain Insights', 'GET', BASE + '/brain/insights')

# ─── Agents ───
test('Agents Dashboard', 'GET', BASE + '/agents/dashboard')
test('Agents Tasks', 'GET', BASE + '/agents/tasks')

# ─── Obsidian ───
test('Obsidian Vaults', 'GET', BASE + '/obsidian/vaults')
test('Obsidian Dashboard', 'GET', BASE + '/obsidian/dashboard')

# ─── MT5 ───
test('MT5 Status', 'GET', '/api/v1/mt5/status')
test('MT5 Logs', 'GET', '/api/v1/mt5/logs')

# ─── TradingView ───
test('TV Stats', 'GET', '/api/v1/tradingview/stats')
test('TV Events', 'GET', '/api/v1/tradingview/events')
test('TV Logs', 'GET', '/api/v1/tradingview/logs')

# ─── Macro ───
test('Macro State', 'GET', '/api/v1/macro/state')
test('Macro Snapshot', 'GET', '/api/v1/macro/snapshot')

# ─── Copilot ───
test('Copilot Conversations', 'GET', BASE + '/copilot/conversations')
test('Copilot Prompts', 'GET', BASE + '/copilot/prompts')
test('Copilot Agents', 'GET', BASE + '/copilot/agents')

# ─── Quant Research ───
test('Quant Dashboard', 'GET', BASE + '/quant-research/dashboard')
test('Quant Experiments', 'GET', BASE + '/quant-research/experiments')
test('Quant Backtests', 'GET', BASE + '/quant-research/backtests')
test('Quant Edge Health', 'GET', BASE + '/quant-research/edge-health/current')
test('Quant Notebooks', 'GET', BASE + '/quant-research/notebooks')

# ─── Automation ───
test('Auto Dashboard', 'GET', BASE + '/automation/dashboard')
test('Auto Workflows', 'GET', BASE + '/automation/workflows')
test('Auto Rules', 'GET', BASE + '/automation/rules')
test('Auto Jobs', 'GET', BASE + '/automation/jobs')
test('Auto Notifications', 'GET', BASE + '/automation/notifications')

# ─── Trade Memories ───
test('Trade Memories', 'GET', BASE + '/memories/')

# ─── Similarity ───
test('Similarity History', 'GET', BASE + '/similarity/history')

# ─── Decision ───
test('Decision History', 'GET', BASE + '/decision/history')

# ─── Sources ───
test('Sources', 'GET', BASE + '/sources/')

# ─── Claims ───
test('Claims', 'GET', BASE + '/claims/')

# ─── Concepts ───
test('Concepts', 'GET', BASE + '/concepts/')

# ─── Associations ───
test('Associations', 'GET', BASE + '/associations/')

# ─── Conflicts ───
test('Conflicts', 'GET', BASE + '/conflicts/')

# ─── Interpretations ───
test('Interpretations', 'GET', BASE + '/interpretations/')

# ─── Search ───
test('Search', 'GET', BASE + '/search/?q=test')

# ─── Collectors ───
test('Collectors', 'GET', BASE + '/collectors/')
test('Collector Logs', 'GET', BASE + '/collectors/logs')

# ─── Research Questions ───
test('Research Questions', 'GET', BASE + '/questions/')

# ─── Hypotheses ───
test('Hypotheses', 'GET', BASE + '/hypotheses/')

print('\n' + '='*80)
print('SUMMARY')
print('='*80)
pass_count = sum(1 for _, _, s, _ in results if s == 'PASS')
fail_count = sum(1 for _, _, s, _ in results if s == 'FAIL')
print('PASS: {}  FAIL: {}  TOTAL: {}'.format(pass_count, fail_count, len(results)))
print()
for name, path, status, detail in results:
    if status == 'FAIL':
        print('  FAIL {}  {}  {}'.format(path, detail[:80], name))

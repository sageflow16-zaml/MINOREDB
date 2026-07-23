# Phase 3.6 — Automation & Workflow Engine

## Objective
Build a professional automation platform (inspired by n8n, Zapier, Make, GitHub Actions, Temporal, Airflow) adapted specifically for trading workflows — enabling users to automate repetitive trading, research, planning, reporting, and AI tasks.

---

## Architecture

```
frontend/src/pages/Automation*.tsx       ← React Query →  backend/src/api/routes/automation.py
                                                                      ↕
                                                              backend/src/services/automation.py
                                                                      ↕
                                                              backend/src/models/automation.py
```

### Backend Layer (3 files)

| File | Purpose |
|---|---|
| `models/automation.py` | 11 SQLAlchemy models: Workflow, WorkflowExecution, Rule, ScheduledJob, JobExecution, Notification, NotificationChannel, AuditLog, Connector, AutomationReport, WorkflowTemplate |
| `services/automation.py` | `AutomationEngine` orchestrator + 9 sub-services: **WorkflowEngine** (node traversal, conditions, branching, loops), **RuleEngine** (if-then logic, expression evaluation, cooldown), **SchedulerService** (cron, timezone, retry), **NotificationService** (multi-channel delivery), **AIAutomationService** (summaries, psychology, coaching, reports), **ReportingService** (scheduled reports), **ConnectorService** (external integrations), **AuditService** (event logging), **TemplateService** (built-in/ custom templates) |
| `routes/automation.py` | ~60 endpoints across 12 resource groups with inline Pydantic schemas, registered at `/projects/{project_id}/automation` |

### Frontend Layer (10 pages + API client + hooks)

| Page | Path | Functionality |
|---|---|---|
| AutomationDashboard | `automation/` | Executive dashboard: 6 KPI row, recent executions table, recent audit logs, 8 quick-navigate cards |
| WorkflowList | `automation/workflows` | Full CRUD with DataTable, search, execute/toggle/duplicate/delete actions |
| WorkflowBuilder | `automation/workflows/:id` | Visual node editor: add trigger/action/condition/loop/branch nodes, configure per-node (trigger types, action types, condition operators), save/execute |
| RuleEngine | `automation/rules` | If-then rule CRUD with DataTable, inline test evaluator with context JSON input, toggle enable/disable |
| Scheduler | `automation/jobs` | One-time/recurring job CRUD, cron expressions, timezone, execute-now, execution history sub-table |
| NotificationCenter | `automation/notifications` | Dual-tab: notifications list with mark-read, channels management with verify/test |
| AutomationTemplates | `automation/templates` | Template gallery with category filters (trading/reporting/risk/psychology/research), use-template → create workflow |
| Connectors | `automation/connectors` | Card-grid CRUD for 12 connector types (Discord/Telegram/Slack/Notion/etc.), test/sync actions |
| AuditLog | `automation/audit` | Full audit trail with event-type summary cards, filter by event type, severity badges |
| AutomationReports | `automation/reports` | Scheduled report configs, generate-now buttons (daily/weekly/monthly/performance/risk) |

---

## Key Design Decisions

### 1. Workflow as JSONB Document
Rather than relational node/connection tables, workflows store `nodes`, `connections`, `triggers`, `actions`, and `conditions` as JSONB columns. This enables flexible node structures without schema migrations and matches how visual workflow editors represent data.

### 2. Sub-Service Architecture
The `AutomationEngine` orchestrator delegates to 9 focused sub-services, each with a single responsibility. This keeps each service small (~50-200 lines) and testable.

### 3. 10 Built-in Workflow Templates
Pre-configured templates with realistic trigger/action/condition configs:
- **Morning Routine** (cron 8AM weekdays: analytics + daily brief)
- **Pre-Market Checklist** (cron 7:30AM: premarket scan + task)
- **Post-Market Review** (cron 10PM: AI summary + journal entry)
- **Weekly Review** (cron Saturday noon: review + analytics + coaching)
- **Monthly Review** (cron 1st: PDF report + email)
- **Risk Audit** (cron 9AM weekdays: drawdown/exposure check)
- **Drawdown Alert** (event: drawdown > 5%: notify + pause strategy)
- **Consecutive Loss Alert** (event: 3 losses: notify + coaching + task)
- **Research Pipeline** (cron Monday 6AM: pattern scan + backtest)
- **Psychology Review** (cron Sunday: AI coach weekly check-in)

### 4. Rule Engine with Live Testing
Rules can be evaluated instantly via a JSON context input in the Rule Engine page. This lets users test `{"drawdown": 5, "win_rate": 0.6}` against all enabled rules without waiting for real triggers.

### 5. Scheduler with Retry Logic
Jobs support: cron expressions, timezone, start/end dates, configurable retries (max retries + delay), priority levels, and per-job execution history.

### 6. Multi-Channel Notifications
Notifications support 6 channel types: in-app, email, Discord, Telegram, Slack, webhook. Channels are stored with config (webhook URLs) and verification status.

---

## Statistics

**Backend:**
- 11 database models (SQLAlchemy)
- ~500 lines (models) + ~900 lines (services) + ~400 lines (routes) = **~1,800 lines new**

**Frontend:**
- 20+ new TypeScript interfaces
- 60+ API client methods
- 40+ React Query hooks
- 10 pages + 1 hooks file + 1 API client file: **~3,200 lines new**

**Total new code: ~5,000 lines**

---

## Verification

- `npx tsc --noEmit`: ✅ 0 errors
- `npx vite build`: ✅ 3377 modules, 3m 33s
- All chunk sizes reasonable (largest automation page: AutomationDashboard 8.53kB, hooks bundle: 10.90kB)

---

## Trigger Types (16)
scheduled, market_open, london_open, new_york_open, economic_event, news_release, trade_created, trade_closed, journal_added, replay_finished, risk_rule_triggered, drawdown_threshold, performance_threshold, strategy_updated, webhook, manual

## Action Types (15)
create_journal_entry, generate_ai_summary, generate_daily_brief, generate_weekly_review, run_analytics, run_backtest, export_report, create_task, update_strategy, send_notification, open_trade_review, generate_research_note, sync_obsidian, update_dashboard, run_ai_coach

## Condition Types (12)
win_rate, drawdown, risk_pct, session, market, pair, strategy, performance, psychology_score, execution_score, ai_score, custom_variable

## Connector Types (12)
google_calendar, notion, obsidian, tradingview, discord, telegram, slack, google_drive, dropbox, github, email_smtp, rest_api

## Report Types (8)
daily, weekly, monthly, quarterly, performance, risk, research, strategy

---

## Next Steps

1. **Database migration**: Run `alembic revision --autogenerate` for the 11 new automation tables
2. **Webhook endpoint**: Add dedicated `/webhook/{workflow_id}` endpoint to receive external triggers
3. **Real delivery**: Implement actual Discord/Telegram/Slack webhook payloads in `_deliver_webhook`
4. **Drag-and-drop canvas**: Replace the node list UI in WorkflowBuilder with a proper canvas (e.g., React Flow)
5. **AI integration**: Wire AI automation to real LLM endpoints instead of mock responses
6. **Market session detection**: Implement market_open/london_open/new_york_open trigger evaluation against real-time clocks
7. **Export report content**: Generate actual report content with real data from statistics/performance services

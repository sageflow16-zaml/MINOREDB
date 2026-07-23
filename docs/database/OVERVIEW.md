# Database Architecture — Project Minore

## Database

- **Engine:** PostgreSQL 16
- **ORM:** SQLAlchemy 2.0 (ORM + Core)
- **Migrations:** Alembic 1.13+
- **Driver:** psycopg (v3) via `postgresql+psycopg://`

## Entity Relationship Overview

```
User (1) ──→ (N) Project (1) ──→ (N) Trade, Strategy, Knowledge*, ...
                                      ICT*, Agent*, Brain*, ...
                                      BrokerConnection, TradeMemory, ...
```

## Table Groups

### Core Domain (users, projects)

| Table | Purpose |
|-------|---------|
| `user` | User accounts, bcrypt password hash |
| `project` | User-scoped project containers |

### Trading Domain

| Table | Description |
|-------|-------------|
| `trade` | Trade journal entries |
| `trade_memory` | AI-enriched trade analysis |
| `strategy` | Trading strategies |
| `pattern` | Detected trading patterns |
| `replay_workspace` | Historical replay sessions |

### Knowledge Domain

| Table | Description |
|-------|-------------|
| `source` | Information sources |
| `claim` | Knowledge claims |
| `concept` | Knowledge concepts |
| `association` | Claim-concept associations |
| `conflict` | Claim conflicts |
| `interpretation` | Claim interpretations |
| `hypothesis` | Research hypotheses |
| `research_question` | Research questions |
| `knowledge_node` | Graph nodes |
| `knowledge_edge` | Graph edges |
| `knowledge_graph_snapshot` | Graph snapshots |
| `knowledge_rule` | Extraction rules |
| `knowledge_library` | Knowledge library |
| `claim_conflict` | Conflict records |

### Market Analysis Domain

| Table | Description |
|-------|-------------|
| `market_structure` | Market structure data |
| `ict_structure` | ICT swing points, BOS, MSS, CHOCH |
| `ict_event` | ICT market events |
| `fvg` | Fair Value Gaps |
| `order_block` | Order blocks |
| `liquidity_zone` | Liquidity zones |
| `ict_setup` | Trade setups |
| `ict_session` | Trading sessions |
| `ict_market_bias` | Market bias |
| `ict_execution_signal` | Execution signals |

### Broker Domain

| Table | Description |
|-------|-------------|
| `broker_connection_new` | Broker connections (encrypted credentials) |
| `broker_account` | Broker accounts |
| `sync_history_new` | Sync history |
| `broker_log` | Broker logs |
| `broker_health` | Broker health checks |
| `imported_trade` | Imported trade records |
| `broker_position` | Open positions |
| `broker_order` | Pending orders |
| `broker_analytics` | Broker analytics |

### AI / Brain Domain

| Table | Description |
|-------|-------------|
| `brain_memory` | Brain memory store |
| `trader_dna` | Trader DNA profile |
| `decision_record` | Decision records |
| `learning_observation` | Learning observations |
| `personal_insight` | Personal insights |
| `brain_coaching` | Coaching sessions |
| `agent_task` | AI agent tasks |
| `agent_execution` | Task executions |
| `agent_workflow` | Workflow definitions |

### Additional Domains

| Table | Description |
|-------|-------------|
| `collector` | Data collectors |
| `macro` | Macroeconomic data |
| `mt5_account` | MT5 integration |
| `automation` | Automation rules |
| `portfolio` | Portfolio management |
| `tracking_goal` | Tracking goals |
| `tradingview_event` | TradingView webhook events |
| `tradingview_webhook_log` | Webhook logs |
| `planning` | Planning data |
| `risk` | Risk management |
| `learning` | Continuous learning |
| `replay` | Replay data |
| `researcher` | Research engine |

## Naming Standards

- **Tables:** `snake_case`, singular preferred
- **Primary keys:** `id` UUID, default `uuid4()`
- **Foreign keys:** `{table}_id` UUID
- **Timestamps:** `created_at`, `updated_at` with timezone
- **Soft delete:** `is_active` boolean (preferred over hard delete)
- **Indexes:** On `project_id`, foreign keys, and frequently queried columns

## Migration Strategy

- Alembic for all schema changes
- 26 migration files in `backend/alembic/versions/`
- Each migration is a single logical change
- Migrations run automatically at startup via `entrypoint.py`
- Rollback: `alembic downgrade -1`

See [Migration Guide](./MIGRATIONS.md) for details.

## Connection Security

- All SQLAlchemy queries use parameterized ORM methods (no raw SQL)
- `credentials_encrypted` column stores Fernet-encrypted JSONB
- Connection pooling via SQLAlchemy engine defaults
- `DATABASE_URL` password masked in logs

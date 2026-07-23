# Project Minore Documentation

## Architecture

| Doc | Description |
|-----|-------------|
| [System Overview](architecture/OVERVIEW.md) | 3-tier architecture, module relationships, data flow |
| [ADR-001: FastAPI](decisions/ADR-001-fastapi.md) | Why FastAPI for backend |
| [ADR-002: React](decisions/ADR-002-react.md) | Why React + TypeScript for frontend |
| [ADR-003: PostgreSQL](decisions/ADR-003-postgresql.md) | Why PostgreSQL as database |
| [ADR-004: Multi-Agent](decisions/ADR-004-multi-agent.md) | Why multi-agent architecture |
| [ADR-005: Knowledge Graph](decisions/ADR-005-knowledge-graph.md) | Why PostgreSQL-based knowledge graph |
| [ADR-006: ICT Engines](decisions/ADR-006-ict-engines.md) | Why independent detection engines |

## Backend

| Doc | Description |
|-----|-------------|
| [Backend Overview](backend/OVERVIEW.md) | Structure, modules, middleware stack |
| [Authentication](backend/AUTH.md) | JWT, bcrypt, password validation, rate limiting |

## Frontend

| Doc | Description |
|-----|-------------|
| [Frontend Overview](frontend/OVERVIEW.md) | Structure, state management, pages, routing |

## Database

| Doc | Description |
|-----|-------------|
| [Database Overview](database/OVERVIEW.md) | Tables, relationships, naming, migrations |

## API

| Doc | Description |
|-----|-------------|
| [API Overview](api/OVERVIEW.md) | Endpoints, auth, response format, pagination |

## AI System

| Doc | Description |
|-----|-------------|
| [AI Overview](ai/OVERVIEW.md) | Agents, brain engines, knowledge system |

## ICT Engine

| Doc | Description |
|-----|-------------|
| [ICT Overview](ict/OVERVIEW.md) | All 8 detection engines, scoring, data flow |

## Deployment

| Doc | Description |
|-----|-------------|
| [Local Development](deployment/LOCAL.md) | Setup guide, env vars, running tests |
| [Production Config](../docs/security/PRODUCTION_CONFIG.md) | Production checklist, env vars, monitoring |

## Testing

| Doc | Description |
|-----|-------------|
| [Testing Overview](testing/OVERVIEW.md) | Test types, coverage goals, running tests, CI |

## Security

| Doc | Description |
|-----|-------------|
| [Security Audit](security/SECURITY_AUDIT_REPORT.md) | Full security audit report |
| [Risk Assessment](security/RISK_ASSESSMENT.md) | Risk register, heatmap, mitigation plan |
| [Dependency Audit](security/DEPENDENCY_AUDIT.md) | Python/Node/Docker CVE review |
| [Backup & Recovery](security/BACKUP_RECOVERY.md) | Backup strategy, restore procedures |
| [Production Config](security/PRODUCTION_CONFIG.md) | Production deployment guide |

## Development

| Doc | Description |
|-----|-------------|
| [Contributing](development/CONTRIBUTING.md) | Workflow, conventions, PR checklist |

## Plugins

| Doc | Description |
|-----|-------------|
| [Plugin SDK](plugins/SDK.md) | Plugin lifecycle, permissions, API surface |

## AI Knowledge Pack

| Doc | Description |
|-----|-------------|
| [Project Summary](ai-knowledge-pack/SUMMARY.md) | Quick facts, domain map, codebase size |
| [Folder Map](ai-knowledge-pack/FOLDER_MAP.md) | Full directory tree + coding patterns |
| [Common Workflows](ai-knowledge-pack/WORKFLOWS.md) | 8 common development workflows |

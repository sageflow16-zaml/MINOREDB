# Plugin SDK — Project Minore

## Overview

The plugin system is designed for future extensibility. This document defines the contract for developing plugins.

## Plugin Lifecycle

```
REGISTERED → ENABLED → RUNNING → DISABLED → UNINSTALLED
                  ↕
               ERROR
```

| Phase | Description |
|-------|-------------|
| REGISTERED | Plugin code loaded and metadata verified |
| ENABLED | Plugin activated and event subscriptions registered |
| RUNNING | Plugin actively processing |
| DISABLED | Plugin paused, no processing |
| ERROR | Plugin encountered unrecoverable error |

## Plugin Structure

```
my-plugin/
├── plugin.json           # Manifest
├── __init__.py           # Plugin entry point
├── routes.py             # Optional: extra API routes
├── services.py           # Optional: business logic
├── models.py             # Optional: database models
├── schemas.py            # Optional: pydantic schemas
└── static/               # Optional: frontend assets
```

## Manifest (`plugin.json`)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Author Name",
  "permissions": ["trades:read", "knowledge:write"],
  "capabilities": ["webhook", "schedule"],
  "api_version": "1",
  "entry": "__init__.py",
  "dependencies": {}
}
```

## Permission Model

| Permission | Description |
|-----------|-------------|
| `trades:read` | Read trade journal data |
| `trades:write` | Create/update trades |
| `knowledge:read` | Read knowledge base |
| `knowledge:write` | Create/update knowledge |
| `market:read` | Read market data |
| `analyze:run` | Run analysis |
| `webhook:listen` | Listen for webhooks |
| `schedule:manage` | Manage scheduled tasks |
| `config:read` | Read plugin configuration |
| `config:write` | Write plugin configuration |

## Capabilities

| Capability | Description |
|-----------|-------------|
| `webhook` | Can register webhook handlers |
| `schedule` | Can schedule periodic tasks |
| `api_route` | Can add API endpoints |
| `event_handler` | Can subscribe to system events |
| `ui_extension` | Can extend the frontend UI |

## Event System

Plugins can subscribe to these events:

| Event | Payload | Description |
|-------|---------|-------------|
| `trade.created` | Trade object | New trade journaled |
| `trade.updated` | Trade object | Trade modified |
| `trade.deleted` | Trade ID | Trade removed |
| `market.updated` | Market data | Market data refresh |
| `analysis.completed` | Analysis result | Engine finished analysis |
| `sync.completed` | Sync result | Broker sync finished |
| `user.login` | User ID | User logged in |
| `config.changed` | Config diff | Plugin config changed |

## API Surface

### Available Endpoints

Plugins can access the main API via HTTP or directly via service imports:

```python
# Via internal service
from src.services.knowledge_engine import search_knowledge
results = search_knowledge(project_id, query)

# Via HTTP to self
import httpx
resp = httpx.get("http://localhost:8000/api/v1/trades", headers={"Authorization": "Bearer PLUGIN_TOKEN"})
```

### Extension Points

| Extension | Type | Description |
|-----------|------|-------------|
| `api_routes` | APIRouter | Register FastAPI routes under `/api/v1/plugins/{name}/` |
| `event_handlers` | dict[Event, Callable] | Handle system events |
| `scheduled_tasks` | list[ScheduleDef] | Register periodic tasks |
| `ui_components` | dict[str, str] | Register frontend React components |
| `menu_items` | list[MenuItem] | Register navigation menu items |

## Sandbox Boundaries

- Plugins run in-process (future: subprocess isolation)
- No direct filesystem access outside plugin directory
- Database access scoped to permitted tables
- Network access restricted to permitted hosts
- Rate-limited API calls (100 req/min per plugin)

## Verification

- Plugin manifest validated on registration
- Permission set verified against plugin declaration
- Entry point imported and validated
- All capabilities checked before activation
- Version compatibility verified against API version

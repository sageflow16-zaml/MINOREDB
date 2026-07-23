# API Overview — Project Minore

## Base URL

All API routes are mounted under `/api/v1/` with Bearer JWT authentication.

**Auth routes** are at `/api/v1/auth/` (no JWT required).

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | None | Create account |
| POST | `/api/v1/auth/login` | None | Login |
| POST | `/api/v1/auth/refresh` | None | Rotate tokens |
| POST | `/api/v1/auth/logout` | JWT | Logout |
| GET | `/api/v1/auth/me` | JWT | Current user |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/readiness` | DB connectivity check |
| GET | `/liveness` | Process liveness |
| GET | `/version` | App version + environment |

## Response Format

All endpoints return JSON. Standard responses:

- **200/201:** Success with data body
- **204:** Success, no content
- **400:** Validation error (Pydantic)
- **401:** Unauthenticated (missing/invalid token)
- **403:** Forbidden (disabled account)
- **404:** Resource not found
- **409:** Conflict (duplicate resource)
- **413:** Payload too large
- **422:** Validation error (request body)
- **429:** Rate limited
- **500:** Internal server error (no details leaked)

## Standard Headers

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Unique request identifier |
| `X-Response-Time` | Server processing time (ms) |
| `Retry-After` | Rate limit retry seconds (429 only) |

## Error Responses

```json
{"detail": "Error message"}
```

Validation errors (422) include field-level details:
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters",
      "type": "value_error"
    }
  ]
}
```

## Route Groups

All routes except auth are grouped under `/api/v1/` with project-scoping:

| Prefix | Description |
|--------|-------------|
| `/projects` | Project CRUD |
| `/projects/{id}/strategies` | Trading strategies |
| `/projects/{id}/dashboard` | Dashboard data |
| `/projects/{id}/trades` | Trade journal |
| `/projects/{id}/market-structures` | Market structure |
| `/projects/{id}/ict` | ICT smart engine |
| `/projects/{id}/brain` | AI trading brain |
| `/projects/{id}/broker` | Broker integration |
| `/projects/{id}/knowledge` | Knowledge rules |
| `/projects/{id}/graph` | Knowledge graph |
| `/projects/{id}/agents` | AI agents |
| `/projects/{id}/analyst` | AI analyst |
| `/projects/{id}/research` | Research engine |
| `/projects/{id}/replay` | Historical replay |
| `/projects/{id}/trader-intelligence` | Trader intelligence |
| `/projects/{id}/automation` | Automation |
| `/projects/{id}/portfolio` | Portfolio management |
| `/projects/{id}/risk` | Risk management |
| `/projects/{id}/planning` | Planning |
| `/projects/{id}/obsidian` | Obsidian sync |
| `/projects/{id}/copilot` | AI research copilot |
| `/projects/{id}/quant-research` | Quant research |
| `/projects/{id}/ai` | AI foundation |
| `/projects/{id}/market-intel` | Market intelligence |
| `/knowledge` | Knowledge library (global) |
| `/macro` | Macroeconomic data |
| `/mt5` | MT5 integration |
| `/tradingview` | TradingView webhooks |

## Pagination

List endpoints support `limit` and `offset` query parameters:
- `limit`: Results per page (capped at `MAX_PAGE_SIZE=1000`)
- `offset`: Result offset (default 0)
- If limit is 0 or negative, defaults to 100

## Versioning

- Current version: 1.1.0
- Routes are versioned via URL prefix (`/api/v1/`)
- Backward compatibility maintained within major versions
- Breaking changes trigger new major version

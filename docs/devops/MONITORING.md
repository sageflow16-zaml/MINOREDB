# Monitoring & Observability

## Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Metrics | Prometheus (`prometheus-client`) | Request count, latency, in-flight requests |
| Health | FastAPI endpoints | Liveness, readiness, health |
| Logging | Structured JSON logging | Centralized log aggregation |
| Alerts | Prometheus AlertManager (planned) | Incident notification |
| Dashboards | Grafana (suggested) | Visualization |

## Prometheus Metrics

Exposed at `GET /metrics` on the backend API.

### Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `path`, `status` | Total request count |
| `http_request_duration_seconds` | Histogram | `method`, `path` | Request latency distribution |
| `http_requests_in_flight` | Gauge | `method` | Currently processing requests |
| `db_connection_pool_size` | Gauge | — | DB connection pool total |
| `db_connection_pool_active` | Gauge | — | Active DB connections |
| `agent_registry_count` | Gauge | — | Registered intelligence agents |

### Example Scrape Config (prometheus.yml)

```yaml
scrape_configs:
  - job_name: minore-api
    static_configs:
      - targets: ["api.minore.example.com:8000"]
    metrics_path: /metrics
    scrape_interval: 15s
```

## Health Endpoints

| Endpoint | Method | Purpose | Expected Status |
|----------|--------|---------|-----------------|
| `/health` | GET | General health | `{"status": "healthy"}` |
| `/readiness` | GET | DB connectivity | `{"status": "ready"}` or 503 |
| `/liveness` | GET | Process alive | `{"status": "alive"}` |

## Structured Logging

All log output is formatted as JSON in production:

```json
{
  "timestamp": "2026-07-20T12:00:00Z",
  "level": "INFO",
  "logger": "src.api.middleware",
  "message": "Request completed",
  "request_id": "abc-123",
  "method": "GET",
  "path": "/api/v1/brokers",
  "status_code": 200,
  "duration_ms": 45.2
}
```

### Log Levels

| Level | Use |
|-------|-----|
| ERROR | Runtime errors, database failures, unhandled exceptions |
| WARNING | Deprecated endpoints, rate limit approaching, degraded performance |
| INFO | Request lifecycle, user actions, agent operations |
| DEBUG | Detailed debugging (disabled in production) |

## Alerting Rules (Prometheus)

```yaml
groups:
  - name: minore-api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API error rate exceeds 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency exceeds 2 seconds"

      - alert: AgentCountChanged
        expr: changes(agent_registry_count[1h]) > 0
        labels:
          severity: info
        annotations:
          summary: "Agent registry count changed"
```

## Grafana Dashboard (suggested panels)

1. **Request Rate** — `rate(http_requests_total[5m])` by status
2. **Latency Heatmap** — histogram_quantile breakdown
3. **Error Rate** — `sum(rate(http_requests_total{status=~"5.."}[5m]))`
4. **In-Flight Requests** — `http_requests_in_flight`
5. **Agent Count** — `agent_registry_count`
6. **DB Connections** — `db_connection_pool_active`

## Production Runbook

### Investigating High Latency
1. Check `/readiness` for DB connectivity
2. Examine recent logs for slow queries
3. Review agent processing time in metrics
4. Check PostgreSQL `pg_stat_activity` for long-running queries

### Investigating Errors
1. Filter logs by `level=ERROR` and recent timeframe
2. Cross-reference with `request_id` in metric labels
3. Check `/metrics` for error rate spikes
4. Review recent deployments or config changes

### Capacity Planning
- Monitor `http_requests_in_flight` for concurrent load
- Set headroom alerts at 70% of known capacity
- Scale horizontally (add replicas) when sustained CPU > 80%

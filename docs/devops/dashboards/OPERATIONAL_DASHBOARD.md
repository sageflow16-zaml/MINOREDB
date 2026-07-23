# Operational Dashboard Design

## Overview

The operational dashboard provides real-time visibility into Project Minore's health, performance, and usage. Designed for Grafana but adaptable to any metrics platform.

## Dashboard: Minore — Service Overview

### Row 1: Health Summary

| Panel | Type | Query | Threshold |
|-------|------|-------|-----------|
| Uptime | Stat | `up{job="minore-api"}` | > 99.9% |
| Error Rate | Stat | `rate(http_requests_total{status=~"5.."}[5m]) * 100` | < 1% |
| Request Rate | Gauge | `sum(rate(http_requests_total[5m]))` | — |
| Active Users | Stat | Custom (from auth events) | — |

### Row 2: API Performance

| Panel | Type | Query | Threshold |
|-------|------|-------|-----------|
| Request Duration (p50) | Gauge | `histogram_quantile(0.5, ...)` | < 200ms |
| Request Duration (p95) | Gauge | `histogram_quantile(0.95, ...)` | < 1s |
| Request Duration (p99) | Gauge | `histogram_quantile(0.99, ...)` | < 3s |
| In-Flight Requests | Gauge | `http_requests_in_flight` | — |

### Row 3: Traffic Breakdown

| Panel | Type | Query |
|-------|------|-------|
| Requests by Method | Bar chart | `sum(rate(http_requests_total[5m])) by (method)` |
| Requests by Path | Bar chart | `topk(10, sum(rate(http_requests_total[5m])) by (path))` |
| Status Code Distribution | Pie chart | `sum(rate(http_requests_total[5m])) by (status)` |

### Row 4: Database & Dependencies

| Panel | Type | Query | Threshold |
|-------|------|-------|-----------|
| DB Connections (active) | Gauge | `db_connection_pool_active` | < 80% pool |
| DB Connections (total) | Gauge | `db_connection_pool_size` | — |
| Agent Registry | Gauge | `agent_registry_count` | — |

### Row 5: Recent Errors (log panel)

| Column | Source |
|--------|--------|
| Timestamp | Log `timestamp` |
| Level | Log `level` |
| Message | Log `message` |
| Request ID | Log `request_id` |
| Path | Log `path` |
| Duration | Log `duration_ms` |

## Dashboard: Minore — Business Metrics

### Auth Activity

| Panel | Query |
|-------|-------|
| Login rate | `rate(http_requests_total{path="/api/v1/auth/login"}[1h])` |
| Registration rate | `rate(http_requests_total{path="/api/v1/auth/register"}[1h])` |
| Auth failure rate | `rate(http_requests_total{path="/api/v1/auth/login",status=~"4.."}[1h])` |

### Broker Activity

| Panel | Query |
|-------|-------|
| API calls to broker | `rate(http_requests_total{path=~"/api/v1/brokers.*"}[1h])` |
| Agent invocations | `rate(http_requests_total{path=~"/api/v1/agents.*"}[1h])` |

## Deployment

1. Import JSON model to Grafana
2. Set `datasource` variable to Prometheus instance
3. Configure time range (default: last 6 hours)
4. Set refresh interval (default: 30s)

## Alerting Rules

See [MONITORING.md](../MONITORING.md) for Prometheus alerting rules.
Thresholds are configured per environment via config.

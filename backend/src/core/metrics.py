import time

from prometheus_client import Counter, Gauge, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.core.logging import get_logger

logger = get_logger(__name__)

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency (seconds)",
    ["method", "path"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

IN_FLIGHT_REQUESTS = Gauge(
    "http_requests_in_flight",
    "Currently in-flight HTTP requests",
    ["method"],
)

DB_CONNECTION_POOL_SIZE = Gauge(
    "db_connection_pool_size",
    "Database connection pool size",
)

DB_CONNECTION_POOL_ACTIVE = Gauge(
    "db_connection_pool_active",
    "Active database connections",
)

AGENT_REGISTRY_COUNT = Gauge(
    "agent_registry_count",
    "Number of registered intelligence agents",
)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method
        path = request.url.path

        IN_FLIGHT_REQUESTS.labels(method=method).inc()

        start = time.time()
        try:
            response = await call_next(request)
            status = str(response.status_code)
            return response
        except Exception as exc:
            status = "500"
            raise
        finally:
            duration = time.time() - start
            REQUEST_COUNT.labels(method=method, path=path, status=status).inc()
            REQUEST_LATENCY.labels(method=method, path=path).observe(duration)
            IN_FLIGHT_REQUESTS.labels(method=method).dec()


def metrics_endpoint(request: Request = None) -> Response:
    from src.agents.core.registry import AgentRegistry
    registry = AgentRegistry()
    AGENT_REGISTRY_COUNT.set(len(registry.list_agents()))
    return Response(
        content=generate_latest(),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )

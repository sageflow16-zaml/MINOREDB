import time
import uuid
from collections import defaultdict, deque
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Ensures every request has an X-Request-ID, generating one if absent."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        logger.info(
            "Request started",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
            },
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            process_time = time.time() - start_time
            # Never log the exception's args (may contain secrets); log type only.
            logger.error(
                "Request failed",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "duration": round(process_time, 4),
                    "error_type": type(exc).__name__,
                },
            )
            raise

        process_time = time.time() - start_time
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status": response.status_code,
                "duration": round(process_time, 4),
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds defensive HTTP response headers and enforces request size limits."""

    async def dispatch(self, request: Request, call_next):
        # --- Request size limit ---------------------------------------------
        max_size = settings.MAX_REQUEST_SIZE
        if max_size and request.headers.get("content-length"):
            try:
                if int(request.headers["content-length"]) > max_size:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Payload too large"},
                    )
            except ValueError:
                pass

        response = await call_next(request)

        response.headers.setdefault(
            "X-Content-Type-Options", "nosniff"
        )
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault(
            "Referrer-Policy", "no-referrer"
        )
        response.headers.setdefault(
            "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"
        )
        response.headers.setdefault(
            "Cache-Control", "no-store"
        )
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

        if settings.HSTS_ENABLED and request.url.scheme == "https":
            hsts = f"max-age={settings.HSTS_MAX_AGE}"
            if settings.HSTS_INCLUDE_SUBDOMAINS:
                hsts += "; includeSubDomains"
            if settings.HSTS_PRELOAD:
                hsts += "; preload"
            response.headers.setdefault("Strict-Transport-Security", hsts)

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter keyed by client IP.

    Note: in-memory limiting is per-process and resets on restart. It is a
    first line of defence; for multi-instance deployments use a shared store
    (e.g. Redis) or a gateway-level limiter.
    """

    def __init__(self, app, times: int = 60, limit: int = 0):
        super().__init__(app)
        self.limit = limit
        self.times = times
        self.hits: defaultdict[str, deque] = defaultdict(deque)

    def _client_ip(self, request: Request) -> str:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        if self.limit <= 0:
            return await call_next(request)

        now = time.time()
        ip = self._client_ip(request)
        window = self.hits[ip]
        # Drop timestamps outside the sliding window.
        while window and window[0] <= now - self.times:
            window.popleft()

        if len(window) >= self.limit:
            retry_after = int(self.times - (now - window[0])) + 1
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": str(retry_after)},
                content={"detail": "Too many requests"},
            )

        window.append(now)
        return await call_next(request)
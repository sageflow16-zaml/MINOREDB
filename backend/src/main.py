from contextlib import asynccontextmanager
import time

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import text

from src.api.router import api_router
from src.api.routes.auth import router as auth_router
from src.core.config import settings
from src.core.security import setup_security, setup_cors
from src.api.middleware import (
    LoggingMiddleware,
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    RequestIdMiddleware,
)
from src.api import handlers
from src.api.deps import get_current_user, get_db
from src.core.logging import get_logger

logger = get_logger(__name__)

APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Application starting up",
        extra={"environment": settings.ENVIRONMENT, "docs_enabled": settings.DOCS_ENABLED, "version": APP_VERSION},
    )
    # Log all registered routes for debugging
    routes = sorted(
        f"{m} {r.path}" for r in app.routes if hasattr(r, "methods") and hasattr(r, "path")
        for m in r.methods if m not in ("HEAD", "OPTIONS")
    )
    logger.info("Registered routes", extra={"count": len(routes), "routes": routes})
    yield
    from src.db.session import engine

    logger.info("Application shutting down; disposing DB engine")
    engine.dispose()


app = FastAPI(
    title="Project Minore API",
    version=APP_VERSION,
    docs_url="/docs" if settings.DOCS_ENABLED else None,
    redoc_url="/redoc" if settings.DOCS_ENABLED else None,
    openapi_url="/openapi.json" if settings.DOCS_ENABLED else None,
    lifespan=lifespan,
)

# Non-CORS middlewares first (inner layers)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitMiddleware, limit=settings.RATE_LIMIT_PER_MINUTE, times=60
)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIdMiddleware)

setup_security(app)

# CORSMiddleware must be the outermost (last to wrap) so it intercepts
# OPTIONS preflight requests before any other middleware can interfere.
setup_cors(app)

app.add_exception_handler(Exception, handlers.unhandled_exception_handler)
app.add_exception_handler(SQLAlchemyError, handlers.sqlalchemy_exception_handler)
app.add_exception_handler(IntegrityError, handlers.integrity_error_handler)
app.add_exception_handler(RequestValidationError, handlers.validation_exception_handler)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(api_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])

# ── Health / Readiness / Liveness ──────────────────────────────────────


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": APP_VERSION, "environment": settings.ENVIRONMENT}


@app.get("/readiness", tags=["Health"])
async def readiness():
    """Returns 200 only when the database is reachable."""
    try:
        from src.db.session import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "disconnected", "error": str(exc)},
        )


@app.get("/liveness", tags=["Health"])
async def liveness():
    return {"status": "alive", "timestamp": time.time()}


@app.get("/version", tags=["Health"])
async def version():
    return {
        "version": APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "python": "3.12",
    }


@app.get("/")
async def root():
    return {
        "project": "Project Minore",
        "status": "running",
        "version": APP_VERSION,
    }
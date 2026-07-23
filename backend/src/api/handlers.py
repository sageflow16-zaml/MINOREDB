from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from src.core.logging import get_logger

logger = get_logger(__name__)


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error processing %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error"},
    )


async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.error("Integrity error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Resource conflict or constraint violation"},
    )


def _sanitize_errors(errors: list) -> list:
    """Convert non-serializable objects (e.g. Exception) in error ctx to strings."""
    sanitized = []
    for err in errors:
        item = dict(err)
        ctx = item.get("ctx")
        if ctx and isinstance(ctx, dict):
            item["ctx"] = {k: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
                          for k, v in ctx.items()}
        sanitized.append(item)
    return sanitized


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": _sanitize_errors(exc.errors())},
    )
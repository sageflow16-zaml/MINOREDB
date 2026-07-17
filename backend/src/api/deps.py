from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from src.db.session import SessionLocal
from src.crud import project as crud
from src.core.config import settings
from uuid import UUID

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def verify_api_key(api_key: str | None = Depends(api_key_header)):
    """Enforce the configured API key when one is set.

    When settings.API_KEY is unset the API remains open (backward compatible
    with existing deployments and the test suite).
    """
    if settings.API_KEY is None:
        return
    if not api_key or not _constant_time_compare(api_key, settings.API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )


def _constant_time_compare(a: str, b: str) -> bool:
    """Constant-time string comparison to avoid timing attacks."""
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= ord(x) ^ ord(y)
    return result == 0


def get_project_or_404(project_id: UUID, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import create_engine, DateTime
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool
from src.core.config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
    )
    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )
else:
    engine = None
    SessionLocal = None


class Base(DeclarativeBase):
    pass


class SoftDeleteMixin:
    """Adds deleted_at column for soft-delete support.

    Usage: class MyModel(Base, SoftDeleteMixin): __tablename__ = "..."
    Queries should filter: .filter(MyModel.deleted_at.is_(None))
    """
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None, nullable=True, index=True)


def get_engine():
    if engine is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set DATABASE_URL environment variable in Render dashboard "
            "(or configure Neon connection string)."
        )
    return engine


def get_session_local():
    if SessionLocal is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set DATABASE_URL environment variable in Render dashboard "
            "(or configure Neon connection string)."
        )
    return SessionLocal

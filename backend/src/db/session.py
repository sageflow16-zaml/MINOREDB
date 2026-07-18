from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
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


def get_engine():
    if engine is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set DATABASE_URL environment variable in Railway dashboard "
            "(or link PostgreSQL plugin to this service)."
        )
    return engine


def get_session_local():
    if SessionLocal is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set DATABASE_URL environment variable in Railway dashboard "
            "(or link PostgreSQL plugin to this service)."
        )
    return SessionLocal

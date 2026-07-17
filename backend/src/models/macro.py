from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, DateTime, Float, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base


class MacroEvent(Base):
    __tablename__ = "macro_event"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    provider: Mapped[str] = mapped_column(String, nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    country: Mapped[str] = mapped_column(String, nullable=False, default="US")
    currency: Mapped[str] = mapped_column(String, nullable=False, default="USD")
    category: Mapped[str] = mapped_column(String, nullable=False, default="general")
    importance: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    forecast: Mapped[float | None] = mapped_column(Float, nullable=True)
    previous: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="")
    release_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )


class MarketSnapshot(Base):
    __tablename__ = "market_snapshot"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    dxy: Mapped[float | None] = mapped_column(Float, nullable=True)
    us02y: Mapped[float | None] = mapped_column(Float, nullable=True)
    us10y: Mapped[float | None] = mapped_column(Float, nullable=True)
    yield_curve: Mapped[float | None] = mapped_column(Float, nullable=True)
    sp500: Mapped[float | None] = mapped_column(Float, nullable=True)
    nasdaq: Mapped[float | None] = mapped_column(Float, nullable=True)
    gold: Mapped[float | None] = mapped_column(Float, nullable=True)
    oil: Mapped[float | None] = mapped_column(Float, nullable=True)
    vix: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )

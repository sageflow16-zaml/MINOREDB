from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, Float, DateTime, Text, JSON, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base


class Pattern(Base):
    __tablename__ = "pattern"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    signature: Mapped[dict] = mapped_column(JSON, nullable=False, default={})

    # Metrics
    total_occurrences: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    losses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    breakevens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    win_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_rr: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    expectancy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    profit_factor: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_win: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Confidence & timestamps
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PatternTrade(Base):
    __tablename__ = "pattern_trade"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pattern_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("pattern.id", ondelete="CASCADE"), nullable=False
    )
    trade_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("trade.id", ondelete="CASCADE"), nullable=False
    )
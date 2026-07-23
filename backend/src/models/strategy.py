from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base, SoftDeleteMixin


class Strategy(Base, SoftDeleteMixin):
    __tablename__ = "strategy"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    name: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    market: Mapped[str | None] = mapped_column(String, nullable=True)
    instrument_types: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    timeframes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    version: Mapped[str | None] = mapped_column(String, nullable=True, default="1.0.0")
    status: Mapped[str | None] = mapped_column(String, nullable=True, default="Draft")

    market_bias: Mapped[str | None] = mapped_column(Text, nullable=True)
    entry_conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    confirmation_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    invalidation_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    exit_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    risk_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    entry_model: Mapped[str | None] = mapped_column(String, nullable=True)
    stop_loss_model: Mapped[str | None] = mapped_column(String, nullable=True)
    take_profit_model: Mapped[str | None] = mapped_column(String, nullable=True)
    partial_close_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    trade_management_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    preferred_sessions: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    preferred_market_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    volatility_requirements: Mapped[str | None] = mapped_column(String, nullable=True)
    news_restrictions: Mapped[str | None] = mapped_column(Text, nullable=True)

    required_mindset: Mapped[str | None] = mapped_column(Text, nullable=True)
    discipline_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    common_mistakes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    things_to_avoid: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    checklist_items: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    documentation: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    change_log: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    versions: Mapped[list["StrategyVersion"]] = relationship(
        "StrategyVersion", back_populates="strategy", cascade="all, delete-orphan",
        foreign_keys="StrategyVersion.strategy_id",
    )
    trades: Mapped[list["Trade"]] = relationship(
        "Trade", back_populates="strategy", foreign_keys="Trade.strategy_id",
    )


class StrategyVersion(Base):
    __tablename__ = "strategy_version"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    strategy_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("strategy.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    strategy: Mapped["Strategy"] = relationship("Strategy", back_populates="versions", foreign_keys=[strategy_id])
    project: Mapped["Project"] = relationship("Project")

    version: Mapped[str | None] = mapped_column(String, nullable=True)
    change_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    author: Mapped[str | None] = mapped_column(String, nullable=True)

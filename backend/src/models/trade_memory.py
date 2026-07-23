from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class TradeMemory(Base):
    __tablename__ = "trade_memory"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project: Mapped["Project"] = relationship("Project")
    trade_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("trade.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    trade: Mapped["Trade"] = relationship("Trade")

    knowledge_rule_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("knowledge_rule.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    knowledge_rule: Mapped["KnowledgeRule | None"] = relationship(
        "KnowledgeRule", back_populates="memories"
    )

    pair: Mapped[str | None] = mapped_column(String, nullable=True)
    direction: Mapped[str | None] = mapped_column(String, nullable=True)
    session: Mapped[str | None] = mapped_column(String, nullable=True)
    weekly_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    daily_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    h4_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    market_phase: Mapped[str | None] = mapped_column(String, nullable=True)
    market_trend: Mapped[str | None] = mapped_column(String, nullable=True)
    entry_model: Mapped[str | None] = mapped_column(String, nullable=True)
    liquidity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    execution_model: Mapped[str | None] = mapped_column(String, nullable=True)

    risk_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    result: Mapped[str | None] = mapped_column(String, nullable=True)

    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    mistakes: Mapped[list | None] = mapped_column(JSON, nullable=True)
    lessons: Mapped[list | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)

    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    pattern_match: Mapped[float | None] = mapped_column(Float, nullable=True)
    similarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

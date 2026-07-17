from datetime import datetime, date
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Date, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class MarketStructure(Base):
    __tablename__ = "market_structure"

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
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    project: Mapped["Project"] = relationship("Project")
    trade_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("trade.id", ondelete="SET NULL"),
        nullable=True,
    )

    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pair: Mapped[str | None] = mapped_column(String, nullable=True)
    timeframe: Mapped[str | None] = mapped_column(String, nullable=True)

    weekly_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    daily_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    h4_bias: Mapped[str | None] = mapped_column(String, nullable=True)

    market_phase: Mapped[str | None] = mapped_column(String, nullable=True)
    trend: Mapped[str | None] = mapped_column(String, nullable=True)
    premium_discount: Mapped[str | None] = mapped_column(String, nullable=True)

    external_liquidity: Mapped[str | None] = mapped_column(String, nullable=True)
    internal_liquidity: Mapped[str | None] = mapped_column(String, nullable=True)
    equal_highs: Mapped[str | None] = mapped_column(String, nullable=True)
    equal_lows: Mapped[str | None] = mapped_column(String, nullable=True)
    buy_side_liquidity: Mapped[str | None] = mapped_column(String, nullable=True)
    sell_side_liquidity: Mapped[str | None] = mapped_column(String, nullable=True)

    bos: Mapped[str | None] = mapped_column(String, nullable=True)
    mss: Mapped[str | None] = mapped_column(String, nullable=True)
    choch: Mapped[str | None] = mapped_column(String, nullable=True)
    order_block: Mapped[str | None] = mapped_column(String, nullable=True)
    breaker: Mapped[str | None] = mapped_column(String, nullable=True)
    mitigation: Mapped[str | None] = mapped_column(String, nullable=True)
    fvg: Mapped[str | None] = mapped_column(String, nullable=True)
    ifvg: Mapped[str | None] = mapped_column(String, nullable=True)

    asian_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    asian_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    london_open: Mapped[float | None] = mapped_column(Float, nullable=True)
    newyork_open: Mapped[float | None] = mapped_column(Float, nullable=True)

    london_killzone: Mapped[str | None] = mapped_column(String, nullable=True)
    newyork_killzone: Mapped[str | None] = mapped_column(String, nullable=True)

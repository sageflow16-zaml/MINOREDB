from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class Trade(Base):
    __tablename__ = "trade"

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
    market_structure_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("market_structure.id", ondelete="SET NULL"),
        nullable=True,
    )

    pair: Mapped[str | None] = mapped_column(String, nullable=True)
    direction: Mapped[str | None] = mapped_column(String, nullable=True)
    entry_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    take_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    exit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_size: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    result: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)

    weekly_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    daily_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    h4_bias: Mapped[str | None] = mapped_column(String, nullable=True)

    liquidity_sweep: Mapped[str | None] = mapped_column(String, nullable=True)
    bos: Mapped[str | None] = mapped_column(String, nullable=True)
    mss: Mapped[str | None] = mapped_column(String, nullable=True)
    order_block: Mapped[str | None] = mapped_column(String, nullable=True)
    fvg: Mapped[str | None] = mapped_column(String, nullable=True)

    asian_session: Mapped[str | None] = mapped_column(String, nullable=True)
    london_session: Mapped[str | None] = mapped_column(String, nullable=True)
    newyork_session: Mapped[str | None] = mapped_column(String, nullable=True)

    dxy: Mapped[str | None] = mapped_column(String, nullable=True)
    us10y: Mapped[str | None] = mapped_column(String, nullable=True)
    us02y: Mapped[str | None] = mapped_column(String, nullable=True)
    news_event: Mapped[str | None] = mapped_column(String, nullable=True)

    emotion: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    before_image: Mapped[str | None] = mapped_column(String, nullable=True)
    after_image: Mapped[str | None] = mapped_column(String, nullable=True)

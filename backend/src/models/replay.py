from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class MarketCandle(Base):
    __tablename__ = "market_candle"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    pair: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("pair", "timeframe", "timestamp", name="uq_candle_pair_tf_ts"),
    )


class ReplaySession(Base):
    __tablename__ = "replay_session"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project: Mapped["Project"] = relationship("Project")

    pair: Mapped[str] = mapped_column(String, nullable=False)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_candle: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_candles: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    trades: Mapped[list["ReplayTrade"]] = relationship(
        "ReplayTrade", back_populates="session", cascade="all, delete-orphan"
    )
    bookmarks: Mapped[list["ReplayBookmark"]] = relationship(
        "ReplayBookmark", back_populates="session", cascade="all, delete-orphan"
    )
    annotations: Mapped[list["ReplayAnnotation"]] = relationship(
        "ReplayAnnotation", back_populates="session", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["ReplayTimelineEvent"]] = relationship(
        "ReplayTimelineEvent", back_populates="session", cascade="all, delete-orphan"
    )
    review: Mapped["ReplayReview | None"] = relationship(
        "ReplayReview", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    mistakes: Mapped[list["ReplayMistake"]] = relationship(
        "ReplayMistake", back_populates="session", cascade="all, delete-orphan"
    )
    screenshots: Mapped[list["ReplayScreenshot"]] = relationship(
        "ReplayScreenshot", back_populates="session", cascade="all, delete-orphan"
    )


class ReplayTrade(Base):
    __tablename__ = "replay_trade"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False
    )
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="trades")
    trade_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("trade.id", ondelete="SET NULL"), nullable=True
    )
    trade: Mapped["Trade | None"] = relationship("Trade")
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    direction: Mapped[str | None] = mapped_column(String, nullable=True)
    entry_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    take_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_size: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)


class ReplayBookmark(Base):
    __tablename__ = "replay_bookmark"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False
    )
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="bookmarks")
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReplayAnnotation(Base):
    __tablename__ = "replay_annotation"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False)
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="annotations")
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False)
    annotation_type: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    label: Mapped[str | None] = mapped_column(String, nullable=True)


class ReplayTimelineEvent(Base):
    __tablename__ = "replay_timeline_event"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False)
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="timeline_events")
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String, nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class ReplayReview(Base):
    __tablename__ = "replay_review"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False, unique=True)
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="review")

    went_well: Mapped[str | None] = mapped_column(Text, nullable=True)
    went_wrong: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_violations: Mapped[str | None] = mapped_column(Text, nullable=True)
    execution_quality: Mapped[str | None] = mapped_column(String, nullable=True)
    risk_management: Mapped[str | None] = mapped_column(String, nullable=True)
    psychology: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    trade_grade: Mapped[str | None] = mapped_column(String, nullable=True)
    discipline_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed_checklist: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    missed_checklist: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    rule_compliance: Mapped[float | None] = mapped_column(Float, nullable=True)


class ReplayMistake(Base):
    __tablename__ = "replay_mistake"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False)
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="mistakes")
    mistake_type: Mapped[str | None] = mapped_column(String, nullable=True)
    severity: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    candle_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    preventable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReplayScreenshot(Base):
    __tablename__ = "replay_screenshot"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("replay_session.id", ondelete="CASCADE"), nullable=False)
    session: Mapped["ReplaySession"] = relationship("ReplaySession", back_populates="screenshots")
    candle_index: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)

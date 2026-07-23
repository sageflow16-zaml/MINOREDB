import enum
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SAEnum, text, JSON, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base


class StructureType(str, enum.Enum):
    SWING_HIGH = "swing_high"
    SWING_LOW = "swing_low"
    HIGHER_HIGH = "higher_high"
    HIGHER_LOW = "higher_low"
    LOWER_HIGH = "lower_high"
    LOWER_LOW = "lower_low"
    INTERNAL_STRUCTURE = "internal_structure"
    EXTERNAL_STRUCTURE = "external_structure"
    PROTECTED_HIGH = "protected_high"
    PROTECTED_LOW = "protected_low"


class EventType(str, enum.Enum):
    BOS = "bos"
    MSS = "mss"
    CHOCH = "choch"
    CONTINUATION = "continuation"
    REVERSAL = "reversal"
    DISPLACEMENT = "displacement"
    IMPULSE = "impulse"
    CORRECTION = "correction"


class FVGType(str, enum.Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    INVERSE_BULLISH = "inverse_bullish"
    INVERSE_BEARISH = "inverse_bearish"


class FVGStatus(str, enum.Enum):
    UNTOUCHED = "untouched"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"


class OrderBlockType(str, enum.Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    BREAKER_BULLISH = "breaker_bullish"
    BREAKER_BEARISH = "breaker_bearish"
    MITIGATION = "mitigation"
    REJECTION = "rejection"
    BPR = "bpr"


class LiquidityType(str, enum.Enum):
    EQUAL_HIGH = "equal_high"
    EQUAL_LOW = "equal_low"
    BUY_SIDE = "buy_side"
    SELL_SIDE = "sell_side"
    INTERNAL = "internal"
    EXTERNAL = "external"
    POOL = "pool"
    VOID = "void"
    SWEEP = "sweep"
    FAILED_SWEEP = "failed_sweep"


class SessionType(str, enum.Enum):
    ASIA = "asia"
    LONDON = "london"
    NEW_YORK = "new_york"
    LONDON_CLOSE = "london_close"
    KILL_ZONE_ASIA = "kill_zone_asia"
    KILL_ZONE_LONDON = "kill_zone_london"
    KILL_ZONE_NEW_YORK = "kill_zone_new_york"
    SILVER_BULLET_AM = "silver_bullet_am"
    SILVER_BULLET_PM = "silver_bullet_pm"
    POWER_OF_THREE = "power_of_three"
    OPENING_RANGE = "opening_range"


class ICTModelType(str, enum.Enum):
    SILVER_BULLET = "silver_bullet"
    JUDAS_SWING = "judas_swing"
    AMD = "amd"
    POWER_OF_THREE = "power_of_three"
    TURTLE_SOUP = "turtle_soup"
    LIQUIDITY_SWEEP_REVERSAL = "liquidity_sweep_reversal"
    CONTINUATION_MODEL = "continuation_model"
    DISPLACEMENT_ENTRY = "displacement_entry"
    OTE = "ote"


class TimeframeUnit(str, enum.Enum):
    M1 = "1m"
    M5 = "5m"
    M15 = "15m"
    H1 = "1h"
    H4 = "4h"
    D1 = "1d"
    W1 = "1w"


class BiasType(str, enum.Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class ExecutionStatus(str, enum.Enum):
    READY = "ready"
    WAIT = "wait"
    INVALID = "invalid"
    HIGH_RISK = "high_risk"
    LOW_PROBABILITY = "low_probability"


class ICTStructure(Base):
    __tablename__ = "ict_structure"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    structure_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    strength_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("project_id", "symbol", "timeframe", "bar_index", "structure_type",
                         name="uq_ict_structure"),
    )


class ICTEvent(Base):
    __tablename__ = "ict_event"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    direction: Mapped[str] = mapped_column(String, nullable=True)
    strength_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    structure_id_from: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    structure_id_to: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class FVG(Base):
    __tablename__ = "ict_fvg"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    fvg_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="untouched")
    top_price: Mapped[float] = mapped_column(Float, nullable=False)
    bottom_price: Mapped[float] = mapped_column(Float, nullable=False)
    gap_size: Mapped[float] = mapped_column(Float, nullable=False)
    midpoint: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    filled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    filled_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    freshness_score: Mapped[float] = mapped_column(Float, default=0.0)
    reaction_strength: Mapped[float] = mapped_column(Float, default=0.0)
    probability_score: Mapped[float] = mapped_column(Float, default=0.0)
    parent_fvg_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class OrderBlock(Base):
    __tablename__ = "ict_order_block"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    block_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    top_price: Mapped[float] = mapped_column(Float, nullable=False)
    bottom_price: Mapped[float] = mapped_column(Float, nullable=False)
    midpoint: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_mitigated: Mapped[bool] = mapped_column(Boolean, default=False)
    touch_count: Mapped[int] = mapped_column(Integer, default=0)
    reaction_strength: Mapped[float] = mapped_column(Float, default=0.0)
    validity_score: Mapped[float] = mapped_column(Float, default=0.0)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    parent_block_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class LiquidityZone(Base):
    __tablename__ = "ict_liquidity_zone"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    liquidity_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    top_price: Mapped[float] = mapped_column(Float, nullable=False)
    bottom_price: Mapped[float] = mapped_column(Float, nullable=False)
    peak_price: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_swept: Mapped[bool] = mapped_column(Boolean, default=False)
    sweep_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sweep_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strength_score: Mapped[float] = mapped_column(Float, default=0.0)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class ICTSetup(Base):
    __tablename__ = "ict_setup"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False)
    model_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    direction: Mapped[str] = mapped_column(String, nullable=False)
    entry_price_min: Mapped[float] = mapped_column(Float, nullable=True)
    entry_price_max: Mapped[float] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    take_profit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_reward_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    bar_index: Mapped[int] = mapped_column(Integer, nullable=False)
    structure_score: Mapped[float] = mapped_column(Float, default=0.0)
    liquidity_score: Mapped[float] = mapped_column(Float, default=0.0)
    fvg_score: Mapped[float] = mapped_column(Float, default=0.0)
    order_block_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    session_score: Mapped[float] = mapped_column(Float, default=0.0)
    confluence_score: Mapped[float] = mapped_column(Float, default=0.0)
    overall_quality: Mapped[float] = mapped_column(Float, default=0.0)
    execution_status: Mapped[str] = mapped_column(String, nullable=False, default="wait")
    execution_reasoning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fvg_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    order_block_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    liquidity_zone_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    structure_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class ICTSession(Base):
    __tablename__ = "ict_session"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    date: Mapped[str] = mapped_column(String, nullable=False)
    session_type: Mapped[str] = mapped_column(String, nullable=False)
    open_price: Mapped[float] = mapped_column(Float, nullable=False)
    high_price: Mapped[float] = mapped_column(Float, nullable=False)
    low_price: Mapped[float] = mapped_column(Float, nullable=False)
    close_price: Mapped[float] = mapped_column(Float, nullable=False)
    range: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        UniqueConstraint("project_id", "symbol", "date", "session_type",
                         name="uq_ict_session"),
    )


class ICTMarketBias(Base):
    __tablename__ = "ict_market_bias"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    weekly_bias: Mapped[str] = mapped_column(String, nullable=True)
    daily_bias: Mapped[str] = mapped_column(String, nullable=True)
    h4_bias: Mapped[str] = mapped_column(String, nullable=True)
    h1_bias: Mapped[str] = mapped_column(String, nullable=True)
    m15_bias: Mapped[str] = mapped_column(String, nullable=True)
    htf_bias: Mapped[str] = mapped_column(String, nullable=True)
    ltf_confirmation: Mapped[str] = mapped_column(String, nullable=True)
    confluence_score: Mapped[float] = mapped_column(Float, default=0.0)
    current_price: Mapped[float] = mapped_column(Float, nullable=True)
    premium_discount_status: Mapped[str] = mapped_column(String, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class ICTExecutionSignal(Base):
    __tablename__ = "ict_execution_signal"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False, index=True)
    setup_id: Mapped[str] = mapped_column(String, ForeignKey("ict_setup.id", ondelete="CASCADE"), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="wait")
    direction: Mapped[str] = mapped_column(String, nullable=False)
    entry_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    take_profit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reasoning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    structure_context: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    executed: Mapped[bool] = mapped_column(Boolean, default=False)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

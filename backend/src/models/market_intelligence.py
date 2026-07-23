from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class EconomicEvent(Base):
    """Economic calendar events with full metadata."""
    __tablename__ = "economic_calendar_event"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    event_date: Mapped[str] = mapped_column(String, nullable=False)
    event_time: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False)
    impact: Mapped[str] = mapped_column(String, nullable=False, default="low")      # low, medium, high, holiday
    category: Mapped[str | None] = mapped_column(String, nullable=True)             # interest_rate, inflation, employment, gdp, pmi, trade_balance, etc.
    event_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_value: Mapped[str | None] = mapped_column(String, nullable=True)
    forecast_value: Mapped[str | None] = mapped_column(String, nullable=True)
    previous_value: Mapped[str | None] = mapped_column(String, nullable=True)
    revised_value: Mapped[str | None] = mapped_column(String, nullable=True)
    consensus: Mapped[str | None] = mapped_column(String, nullable=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)                 # %, K, M, B, etc.
    historical_values: Mapped[list | None] = mapped_column(JSONB, nullable=True)    # [{date, value}]
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    is_final: Mapped[bool] = mapped_column(Boolean, default=True)
    is_tentative: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)


class MarketRegime(Base):
    """Market regime classification history."""
    __tablename__ = "market_regime"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    regime_type: Mapped[str] = mapped_column(String, nullable=False)    # trending, ranging, high_vol, low_vol, risk_on, risk_off, news_driven, holiday, low_liquidity
    regime_value: Mapped[str | None] = mapped_column(String, nullable=True)  # bullish, bearish, neutral, extreme
    symbol: Mapped[str | None] = mapped_column(String, nullable=True)   # specific symbol or "MARKET" for global
    timeframe: Mapped[str | None] = mapped_column(String, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {atr, adx, vix, trend_strength}
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)


class CorrelationData(Base):
    """Cross-market correlation data."""
    __tablename__ = "correlation_data"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    symbol_a: Mapped[str] = mapped_column(String, nullable=False)
    symbol_b: Mapped[str] = mapped_column(String, nullable=False)
    correlation: Mapped[float] = mapped_column(Float, nullable=False)   # -1.0 to 1.0
    period: Mapped[str] = mapped_column(String, nullable=False)         # 1d, 5d, 20d, 60d, 252d
    timeframe: Mapped[str | None] = mapped_column(String, nullable=True)
    data_points: Mapped[int] = mapped_column(Integer, default=0)
    calculated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class LiquidityLevel(Base):
    """Key liquidity levels for instruments."""
    __tablename__ = "liquidity_level"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    symbol: Mapped[str] = mapped_column(String, nullable=False)
    level_type: Mapped[str] = mapped_column(String, nullable=False)     # pdh, pdl, pwh, pwl, pmh, pml, session_high, session_low, equal_high, equal_low, pool, sweep
    level_value: Mapped[float] = mapped_column(Float, nullable=False)
    timeframe: Mapped[str | None] = mapped_column(String, nullable=True)
    session: Mapped[str | None] = mapped_column(String, nullable=True)  # asia, london, newyork
    date: Mapped[str] = mapped_column(String, nullable=False)
    is_swept: Mapped[bool] = mapped_column(Boolean, default=False)
    swept_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    strength: Mapped[float] = mapped_column(Float, default=1.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class MarketStructurePoint(Base):
    """Market structure analysis points (BOS, MSS, CHOCH, OB, FVG, etc.)."""
    __tablename__ = "market_structure_point"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    symbol: Mapped[str] = mapped_column(String, nullable=False)
    point_type: Mapped[str] = mapped_column(String, nullable=False)     # bos, mss, choch, ob, fvg, breaker, mitigation, bpr, eqh, eql
    direction: Mapped[str | None] = mapped_column(String, nullable=True)  # bullish, bearish
    price: Mapped[float] = mapped_column(Float, nullable=False)
    price_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    timeframe: Mapped[str] = mapped_column(String, nullable=False, default="H1")
    date: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_mitigated: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class SessionAnalysis(Base):
    """Per-session trading analysis."""
    __tablename__ = "session_analysis"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    session_name: Mapped[str] = mapped_column(String, nullable=False)   # asia, london, newyork, overlap
    date: Mapped[str] = mapped_column(String, nullable=False)
    symbol: Mapped[str | None] = mapped_column(String, nullable=True)
    open_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    close_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    high: Mapped[float | None] = mapped_column(Float, nullable=True)
    low: Mapped[float | None] = mapped_column(Float, nullable=True)
    range_pips: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_range_pips: Mapped[float | None] = mapped_column(Float, nullable=True)
    volatility: Mapped[str | None] = mapped_column(String, nullable=True)  # low, normal, high
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    liquidity_events: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{type, price, time}]
    key_levels: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Watchlist(Base):
    """User watchlists."""
    __tablename__ = "watchlist"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class WatchlistItem(Base):
    """Individual watchlist items."""
    __tablename__ = "watchlist_item"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    watchlist_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("watchlist.id", ondelete="CASCADE"), nullable=False)
    watchlist: Mapped["Watchlist"] = relationship("Watchlist")

    symbol: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    asset_class: Mapped[str | None] = mapped_column(String, nullable=True)  # forex, crypto, stock, commodity, index, bond
    bias: Mapped[str | None] = mapped_column(String, nullable=True)         # bullish, bearish, neutral
    alert_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class MarketAlert(Base):
    """Market alerts and notifications."""
    __tablename__ = "market_alert"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    alert_type: Mapped[str] = mapped_column(String, nullable=False)      # news, liquidity, session, price, regime, volatility, risk
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    symbol: Mapped[str | None] = mapped_column(String, nullable=True)
    severity: Mapped[str] = mapped_column(String, default="info")        # info, warning, critical
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[str | None] = mapped_column(String, nullable=True)
    trigger_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MarketTimeline(Base):
    """Historical market event timeline."""
    __tablename__ = "market_timeline"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    event_type: Mapped[str] = mapped_column(String, nullable=False)      # economic, news, trade, journal, replay, regime, volatility
    event_date: Mapped[str] = mapped_column(String, nullable=False)
    event_time: Mapped[str | None] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    symbol: Mapped[str | None] = mapped_column(String, nullable=True)
    impact: Mapped[str | None] = mapped_column(String, nullable=True)
    related_entity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    related_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class DataProviderConfig(Base):
    """Market data provider configuration."""
    __tablename__ = "market_data_provider"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    provider_name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    api_endpoint: Mapped[str | None] = mapped_column(String, nullable=True)
    config_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    capabilities: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [calendar, quotes, news, fundamentals]
    rate_limit_per_min: Mapped[int] = mapped_column(Integer, default=60)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MarketDataCache(Base):
    """Cached market data for performance."""
    __tablename__ = "market_data_cache"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    cache_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    cache_type: Mapped[str] = mapped_column(String, nullable=False)      # quote, calendar, news, correlation, regime
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    provider: Mapped[str | None] = mapped_column(String, nullable=True)

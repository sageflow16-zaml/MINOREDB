from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base
import enum


class BrokerProvider(str, enum.Enum):
    METATRADER4 = "metatrader4"
    METATRADER5 = "metatrader5"
    CTRADER = "ctrader"
    DXTRADE = "dxtrade"
    INTERACTIVE_BROKERS = "interactive_brokers"
    OANDA = "oanda"
    TRADELOCKER = "tradelocker"
    BINANCE = "binance"
    BYBIT = "bybit"
    KRAKEN = "kraken"
    CUSTOM_REST = "custom_rest"


class ConnectionStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"
    EXPIRED = "expired"


class SyncType(str, enum.Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    MANUAL = "manual"


class SyncStatusType(str, enum.Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class LogLevel(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    DEBUG = "debug"


class ConnectionStatusType(str, enum.Enum):
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    RECONNECTING = "reconnecting"


# ── Broker Connection ──

class BrokerConnection(Base):
    __tablename__ = "broker_connection_new"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    provider: Mapped[BrokerProvider] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default=ConnectionStatus.PENDING.value)

    credentials_encrypted: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    permissions: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_connected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)


# ── Broker Account ──

class BrokerAccount(Base):
    __tablename__ = "broker_account"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    external_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    account_type: Mapped[str] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="USD")
    leverage: Mapped[int | None] = mapped_column(Integer, nullable=True)

    balance: Mapped[float] = mapped_column(Float, default=0.0)
    equity: Mapped[float] = mapped_column(Float, default=0.0)
    open_pl: Mapped[float] = mapped_column(Float, default=0.0)
    used_margin: Mapped[float] = mapped_column(Float, default=0.0)
    free_margin: Mapped[float] = mapped_column(Float, default=0.0)
    margin_level: Mapped[float | None] = mapped_column(Float, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


# ── Sync History ──

class SyncHistory(Base):
    __tablename__ = "sync_history_new"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_account.id", ondelete="SET NULL"), nullable=True)

    sync_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    items_synced: Mapped[int] = mapped_column(Integer, default=0)
    items_failed: Mapped[int] = mapped_column(Integer, default=0)
    items_created: Mapped[int] = mapped_column(Integer, default=0)
    items_updated: Mapped[int] = mapped_column(Integer, default=0)
    items_duplicates: Mapped[int] = mapped_column(Integer, default=0)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Broker Log ──

class BrokerLog(Base):
    __tablename__ = "broker_log"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)

    level: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Broker Health ──

class BrokerHealth(Base):
    __tablename__ = "broker_health"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)

    is_reachable: Mapped[bool] = mapped_column(Boolean, default=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_check_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    uptime_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Imported Trade ──

class ImportedTrade(Base):
    __tablename__ = "imported_trade"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False)
    strategy_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("strategy.id", ondelete="SET NULL"), nullable=True)

    external_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    trade_type: Mapped[str] = mapped_column(String, nullable=False)
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    open_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    close_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    open_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    close_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    profit: Mapped[float] = mapped_column(Float, default=0.0)
    commission: Mapped[float] = mapped_column(Float, default=0.0)
    swap: Mapped[float] = mapped_column(Float, default=0.0)
    magic_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    take_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    import_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Open Position ──

class BrokerPosition(Base):
    __tablename__ = "broker_position"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False)

    external_id: Mapped[str] = mapped_column(String, nullable=False)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    position_type: Mapped[str] = mapped_column(String, nullable=False)
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    open_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    open_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    profit: Mapped[float] = mapped_column(Float, default=0.0)
    commission: Mapped[float] = mapped_column(Float, default=0.0)
    swap: Mapped[float] = mapped_column(Float, default=0.0)
    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    take_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    magic_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Pending Order ──

class BrokerOrder(Base):
    __tablename__ = "broker_order"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False)

    external_id: Mapped[str] = mapped_column(String, nullable=False)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    order_type: Mapped[str] = mapped_column(String, nullable=False)
    order_status: Mapped[str] = mapped_column(String, default="pending")
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    stop_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expiration: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


# ── Broker Analytics ──

class BrokerAnalytics(Base):
    __tablename__ = "broker_analytics"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False)

    total_trades: Mapped[int] = mapped_column(Integer, default=0)
    total_profit: Mapped[float] = mapped_column(Float, default=0.0)
    total_commission: Mapped[float] = mapped_column(Float, default=0.0)
    total_swap: Mapped[float] = mapped_column(Float, default=0.0)
    avg_spread: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_execution_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_slippage: Mapped[float | None] = mapped_column(Float, nullable=True)
    rejected_orders: Mapped[int] = mapped_column(Integer, default=0)
    latency_avg_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    uptime_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)

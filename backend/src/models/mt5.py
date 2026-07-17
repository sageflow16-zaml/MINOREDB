from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, DateTime, Text, Float, Boolean, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base


class BrokerConnection(Base):
    __tablename__ = "broker_connection"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    broker: Mapped[str] = mapped_column(String, nullable=False, default="MetaTrader5")
    account: Mapped[str] = mapped_column(String, nullable=False)
    server: Mapped[str] = mapped_column(String, nullable=False)
    terminal_path: Mapped[str] = mapped_column(String, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="disconnected")
    connected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )


class TradeSyncLog(Base):
    __tablename__ = "trade_sync_log"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    broker: Mapped[str] = mapped_column(String, nullable=False)
    trade_ticket: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    sync_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )

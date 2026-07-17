from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.tradingview import MarketEvent, WebhookLog


# Supported TradingView event types
SUPPORTED_EVENTS = {
    "break_of_structure",
    "market_structure_shift",
    "liquidity_sweep",
    "equal_high",
    "equal_low",
    "order_block",
    "breaker_block",
    "fair_value_gap",
    "mitigation_block",
    "asian_range",
    "london_open",
    "new_york_open",
    "weekly_open",
    "daily_open",
}


class TradingViewService:
    """Business logic for TradingView webhook processing.

    Handles validation, parsing, normalization, storage, and querying
    of market events received via webhooks.
    """

    def __init__(self, db: Session):
        self._db = db

    def validate(self, payload: dict, secret: str | None = None) -> tuple[bool, str]:
        """Validate webhook payload and secret token."""
        # Secret validation
        if settings.WEBHOOK_SECRET and secret != settings.WEBHOOK_SECRET:
            return False, "Invalid secret token"

        # Required fields
        symbol = payload.get("symbol")
        timeframe = payload.get("timeframe")
        event_type = payload.get("event_type")

        if not symbol:
            return False, "Missing required field: symbol"
        if not timeframe:
            return False, "Missing required field: timeframe"
        if not event_type:
            return False, "Missing required field: event_type"

        # Normalize event type
        event_type_lower = event_type.lower().strip().replace(" ", "_")
        if event_type_lower not in SUPPORTED_EVENTS:
            return False, f"Unsupported event type: {event_type}"

        return True, "valid"

    def parse(self, payload: dict) -> dict:
        """Parse and clean raw webhook payload."""
        event_type = payload.get("event_type", "").lower().strip().replace(" ", "_")

        timestamp_str = payload.get("timestamp")
        if timestamp_str:
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                timestamp = datetime.now(timezone.utc)
        else:
            timestamp = datetime.now(timezone.utc)

        return {
            "symbol": payload.get("symbol", "").upper().strip(),
            "timeframe": payload.get("timeframe", "").upper().strip(),
            "timestamp": timestamp,
            "event_type": event_type,
            "price": payload.get("price"),
            "event_metadata": payload.get("metadata") or {},
            "source": payload.get("source", "tradingview"),
        }

    def store(self, parsed: dict) -> MarketEvent:
        """Store a parsed market event, preventing duplicates."""
        # Duplicate check: same symbol + timeframe + event_type + timestamp within 5 seconds
        existing = self._db.execute(
            select(MarketEvent).where(
                MarketEvent.symbol == parsed["symbol"],
                MarketEvent.timeframe == parsed["timeframe"],
                MarketEvent.event_type == parsed["event_type"],
            )
        ).scalars().all()

        for evt in existing:
            time_diff = abs((evt.timestamp - parsed["timestamp"]).total_seconds())
            if time_diff < 5:
                return evt

        event = MarketEvent(
            symbol=parsed["symbol"],
            timeframe=parsed["timeframe"],
            timestamp=parsed["timestamp"],
            event_type=parsed["event_type"],
            price=parsed.get("price"),
            event_metadata=parsed.get("event_metadata"),
            source=parsed.get("source", "tradingview"),
        )
        self._db.add(event)
        self._db.commit()
        self._db.refresh(event)
        return event

    def log_webhook(
        self,
        payload: dict,
        status: str,
        message: str | None = None,
        processing_time_ms: int | None = None,
    ) -> WebhookLog:
        """Log a webhook request."""
        log = WebhookLog(
            status=status,
            payload=payload,
            processing_time_ms=processing_time_ms,
            message=message,
        )
        self._db.add(log)
        self._db.commit()
        self._db.refresh(log)
        return log

    def history(
        self,
        limit: int = 50,
        symbol: str | None = None,
        timeframe: str | None = None,
        event_type: str | None = None,
    ) -> list[MarketEvent]:
        """Query market events with optional filters."""
        stmt = select(MarketEvent)
        if symbol:
            stmt = stmt.where(MarketEvent.symbol == symbol.upper())
        if timeframe:
            stmt = stmt.where(MarketEvent.timeframe == timeframe.upper())
        if event_type:
            stmt = stmt.where(MarketEvent.event_type == event_type.lower())
        stmt = stmt.order_by(desc(MarketEvent.timestamp)).limit(limit)
        result = self._db.execute(stmt)
        return list(result.scalars().all())

    def get_event(self, event_id: UUID) -> Optional[MarketEvent]:
        result = self._db.execute(
            select(MarketEvent).where(MarketEvent.id == event_id)
        )
        return result.scalar_one_or_none()

    def logs(self, limit: int = 100) -> list[WebhookLog]:
        result = self._db.execute(
            select(WebhookLog)
            .order_by(desc(WebhookLog.received_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    def stats(self) -> dict:
        total_events = self._db.execute(select(func.count(MarketEvent.id))).scalar() or 0
        total_logs = self._db.execute(select(func.count(WebhookLog.id))).scalar() or 0

        # Events by type
        type_rows = self._db.execute(
            select(MarketEvent.event_type, func.count(MarketEvent.id))
            .group_by(MarketEvent.event_type)
        ).all()
        events_by_type = {row[0]: row[1] for row in type_rows}

        # Events by symbol
        symbol_rows = self._db.execute(
            select(MarketEvent.symbol, func.count(MarketEvent.id))
            .group_by(MarketEvent.symbol)
        ).all()
        events_by_symbol = {row[0]: row[1] for row in symbol_rows}

        # Events by timeframe
        tf_rows = self._db.execute(
            select(MarketEvent.timeframe, func.count(MarketEvent.id))
            .group_by(MarketEvent.timeframe)
        ).all()
        events_by_timeframe = {row[0]: row[1] for row in tf_rows}

        return {
            "total_events": total_events,
            "total_logs": total_logs,
            "events_by_type": events_by_type,
            "events_by_symbol": events_by_symbol,
            "events_by_timeframe": events_by_timeframe,
        }

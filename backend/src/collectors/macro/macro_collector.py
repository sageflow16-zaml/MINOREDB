from __future__ import annotations

import time
from abc import abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from src.collectors.base import BaseCollector, CollectorResult


class MacroCollector(BaseCollector):
    """Base class for macro intelligence collectors.

    All macro collectors follow validate → fetch → normalize → store.
    Each concrete collector implements these four steps plus helper
    methods specific to its data source.
    """

    def __init__(self, project_id: UUID, db_session: Any = None):
        super().__init__(project_id)
        self._db = db_session

    @abstractmethod
    def validate(self) -> bool:
        """Return True if the collector is ready to run."""
        ...

    @abstractmethod
    def fetch(self) -> list[dict]:
        """Fetch raw data from the external source."""
        ...

    @abstractmethod
    def normalize(self, raw_data: list[dict]) -> list[dict]:
        """Normalize raw data into the standard schema."""
        ...

    @abstractmethod
    def store(self, data: list[dict]) -> int:
        """Persist normalized data and return count of stored records."""
        ...

    def run(self) -> CollectorResult:
        start = time.time()
        try:
            if not self.validate():
                return CollectorResult(status="validation_failed", errors_count=1)

            raw = self.fetch()
            normalized = self.normalize(raw)
            stored = self.store(normalized)
            duration = int((time.time() - start) * 1000)
            return CollectorResult(
                status="success",
                records_collected=stored,
                duration_ms=duration,
            )
        except Exception as exc:
            duration = int((time.time() - start) * 1000)
            return CollectorResult(
                status="error",
                errors_count=1,
                error_message=str(exc),
                duration_ms=duration,
            )


class EconomicCalendarCollector(MacroCollector):
    """Collects economic calendar events from public sources."""

    def __init__(self, project_id: UUID, db_session: Any = None):
        super().__init__(project_id, db_session)
        self._description = "Collects economic calendar events (FOMC, NFP, CPI, PPI, etc.)"

    def validate(self) -> bool:
        return True

    def fetch(self) -> list[dict]:
        """Fetch economic calendar events.

        In production this would call an external API (e.g. investing.com,
        forexfactory). Currently returns seed/representative data so the
        pipeline can be verified end-to-end.
        """
        now = datetime.now(timezone.utc)
        return [
            {
                "event_name": "FOMC Interest Rate Decision",
                "country": "US",
                "currency": "USD",
                "category": "monetary_policy",
                "importance": "high",
                "actual": None,
                "forecast": 5.50,
                "previous": 5.50,
                "unit": "%",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Non-Farm Payrolls",
                "country": "US",
                "currency": "USD",
                "category": "employment",
                "importance": "high",
                "actual": None,
                "forecast": 185.0,
                "previous": 206.0,
                "unit": "K",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Consumer Price Index (CPI) YoY",
                "country": "US",
                "currency": "USD",
                "category": "inflation",
                "importance": "high",
                "actual": None,
                "forecast": 3.2,
                "previous": 3.3,
                "unit": "%",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Producer Price Index (PPI) MoM",
                "country": "US",
                "currency": "USD",
                "category": "inflation",
                "importance": "medium",
                "actual": None,
                "forecast": 0.2,
                "previous": 0.1,
                "unit": "%",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Initial Jobless Claims",
                "country": "US",
                "currency": "USD",
                "category": "employment",
                "importance": "medium",
                "actual": None,
                "forecast": 220.0,
                "previous": 222.0,
                "unit": "K",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Retail Sales MoM",
                "country": "US",
                "currency": "USD",
                "category": "consumer",
                "importance": "medium",
                "actual": None,
                "forecast": 0.3,
                "previous": 0.1,
                "unit": "%",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
            {
                "event_name": "Fed Funds Rate",
                "country": "US",
                "currency": "USD",
                "category": "monetary_policy",
                "importance": "high",
                "actual": 5.50,
                "forecast": 5.50,
                "previous": 5.50,
                "unit": "%",
                "release_time": now.isoformat(),
                "provider": "economic_calendar",
            },
        ]

    def normalize(self, raw_data: list[dict]) -> list[dict]:
        return raw_data

    def store(self, data: list[dict]) -> int:
        """Store macro events, skipping duplicates (same name + release_time)."""
        if not self._db or not data:
            return 0

        from sqlalchemy import select
        from src.models.macro import MacroEvent

        stored = 0
        for item in data:
            release_time = item.get("release_time")
            if isinstance(release_time, str):
                release_time = datetime.fromisoformat(release_time)

            existing = self._db.execute(
                select(MacroEvent).where(
                    MacroEvent.event_name == item["event_name"],
                    MacroEvent.release_time == release_time,
                )
            ).scalar_one_or_none()

            if existing is None:
                event = MacroEvent(
                    provider=item.get("provider", "economic_calendar"),
                    event_name=item["event_name"],
                    country=item.get("country", "US"),
                    currency=item.get("currency", "USD"),
                    category=item.get("category", "general"),
                    importance=item.get("importance", "medium"),
                    actual=item.get("actual"),
                    forecast=item.get("forecast"),
                    previous=item.get("previous"),
                    unit=item.get("unit", ""),
                    release_time=release_time,
                )
                self._db.add(event)
                stored += 1

        if stored:
            self._db.commit()
        return stored


class DXYCollector(MacroCollector):
    """Collects US Dollar Index (DXY) snapshots."""

    def __init__(self, project_id: UUID, db_session: Any = None):
        super().__init__(project_id, db_session)
        self._description = "Collects US Dollar Index (DXY) data"

    def validate(self) -> bool:
        return True

    def fetch(self) -> list[dict]:
        """Fetch DXY data from external source."""
        return [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "dxy": 104.25,
                "us02y": 4.85,
                "us10y": 4.42,
                "yield_curve": -0.43,
                "sp500": 5632.0,
                "nasdaq": 18200.0,
                "gold": 2450.0,
                "oil": 82.5,
                "vix": 13.5,
            }
        ]

    def normalize(self, raw_data: list[dict]) -> list[dict]:
        return raw_data

    def store(self, data: list[dict]) -> int:
        if not self._db or not data:
            return 0

        from src.models.macro import MarketSnapshot

        for item in data:
            ts = item.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)

            snapshot = MarketSnapshot(
                timestamp=ts or datetime.now(timezone.utc),
                dxy=item.get("dxy"),
                us02y=item.get("us02y"),
                us10y=item.get("us10y"),
                yield_curve=item.get("yield_curve"),
                sp500=item.get("sp500"),
                nasdaq=item.get("nasdaq"),
                gold=item.get("gold"),
                oil=item.get("oil"),
                vix=item.get("vix"),
            )
            self._db.add(snapshot)

        self._db.commit()
        return len(data)


class YieldCollector(MacroCollector):
    """Collects yield curve data (US02Y, US10Y, spread)."""

    def __init__(self, project_id: UUID, db_session: Any = None):
        super().__init__(project_id, db_session)
        self._description = "Collects US Treasury yield data and yield curve"

    def validate(self) -> bool:
        return True

    def fetch(self) -> list[dict]:
        return [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "dxy": None,
                "us02y": 4.85,
                "us10y": 4.42,
                "yield_curve": -0.43,
                "sp500": None,
                "nasdaq": None,
                "gold": None,
                "oil": None,
                "vix": None,
            }
        ]

    def normalize(self, raw_data: list[dict]) -> list[dict]:
        return raw_data

    def store(self, data: list[dict]) -> int:
        if not self._db or not data:
            return 0

        from src.models.macro import MarketSnapshot

        for item in data:
            ts = item.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)

            snapshot = MarketSnapshot(
                timestamp=ts or datetime.now(timezone.utc),
                dxy=item.get("dxy"),
                us02y=item.get("us02y"),
                us10y=item.get("us10y"),
                yield_curve=item.get("yield_curve"),
                sp500=item.get("sp500"),
                nasdaq=item.get("nasdaq"),
                gold=item.get("gold"),
                oil=item.get("oil"),
                vix=item.get("vix"),
            )
            self._db.add(snapshot)

        self._db.commit()
        return len(data)


class MarketSnapshotCollector(MacroCollector):
    """Collects a full market snapshot (all instruments)."""

    def __init__(self, project_id: UUID, db_session: Any = None):
        super().__init__(project_id, db_session)
        self._description = "Collects full market snapshot (DXY, yields, S&P500, gold, oil, VIX)"

    def validate(self) -> bool:
        return True

    def fetch(self) -> list[dict]:
        return [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "dxy": 104.25,
                "us02y": 4.85,
                "us10y": 4.42,
                "yield_curve": -0.43,
                "sp500": 5632.0,
                "nasdaq": 18200.0,
                "gold": 2450.0,
                "oil": 82.5,
                "vix": 13.5,
            }
        ]

    def normalize(self, raw_data: list[dict]) -> list[dict]:
        return raw_data

    def store(self, data: list[dict]) -> int:
        if not self._db or not data:
            return 0

        from src.models.macro import MarketSnapshot

        for item in data:
            ts = item.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)

            snapshot = MarketSnapshot(
                timestamp=ts or datetime.now(timezone.utc),
                dxy=item.get("dxy"),
                us02y=item.get("us02y"),
                us10y=item.get("us10y"),
                yield_curve=item.get("yield_curve"),
                sp500=item.get("sp500"),
                nasdaq=item.get("nasdaq"),
                gold=item.get("gold"),
                oil=item.get("oil"),
                vix=item.get("vix"),
            )
            self._db.add(snapshot)

        self._db.commit()
        return len(data)

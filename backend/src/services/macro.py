from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, desc, and_
from sqlalchemy.orm import Session

from src.models.macro import MacroEvent, MarketSnapshot


class MacroService:
    """Business logic layer for the Macro Intelligence Engine.

    All methods are pure query / computation helpers. They do not
    perform external I/O — that belongs to the collectors.
    """

    def __init__(self, db: Session):
        self._db = db

    # ── Snapshots ──────────────────────────────────────────────────────

    def latest_snapshot(self) -> Optional[MarketSnapshot]:
        result = self._db.execute(
            select(MarketSnapshot)
            .order_by(desc(MarketSnapshot.timestamp))
            .limit(1)
        )
        return result.scalar_one_or_none()

    def snapshot_history(self, limit: int = 100) -> list[MarketSnapshot]:
        result = self._db.execute(
            select(MarketSnapshot)
            .order_by(desc(MarketSnapshot.timestamp))
            .limit(limit)
        )
        return list(result.scalars().all())

    # ── Events ─────────────────────────────────────────────────────────

    def latest_events(self, limit: int = 50) -> list[MacroEvent]:
        result = self._db.execute(
            select(MacroEvent)
            .order_by(desc(MacroEvent.release_time))
            .limit(limit)
        )
        return list(result.scalars().all())

    def events_between(
        self,
        start: datetime,
        end: datetime,
        importance: Optional[str] = None,
    ) -> list[MacroEvent]:
        stmt = select(MacroEvent).where(
            and_(
                MacroEvent.release_time >= start,
                MacroEvent.release_time <= end,
            )
        )
        if importance:
            stmt = stmt.where(MacroEvent.importance == importance)
        stmt = stmt.order_by(MacroEvent.release_time)
        result = self._db.execute(stmt)
        return list(result.scalars().all())

    def today_events(self) -> list[MacroEvent]:
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
        return self.events_between(start, end)

    def high_impact_events(self, limit: int = 10) -> list[MacroEvent]:
        result = self._db.execute(
            select(MacroEvent)
            .where(MacroEvent.importance == "high")
            .order_by(desc(MacroEvent.release_time))
            .limit(limit)
        )
        return list(result.scalars().all())

    def upcoming_events(self, limit: int = 10) -> list[MacroEvent]:
        now = datetime.now(timezone.utc)
        result = self._db.execute(
            select(MacroEvent)
            .where(MacroEvent.release_time >= now)
            .order_by(MacroEvent.release_time)
            .limit(limit)
        )
        return list(result.scalars().all())

    def recent_releases(self, limit: int = 10) -> list[MacroEvent]:
        now = datetime.now(timezone.utc)
        result = self._db.execute(
            select(MacroEvent)
            .where(
                and_(
                    MacroEvent.release_time <= now,
                    MacroEvent.actual.isnot(None),
                )
            )
            .order_by(desc(MacroEvent.release_time))
            .limit(limit)
        )
        return list(result.scalars().all())

    # ── Composite state ────────────────────────────────────────────────

    def market_state(self) -> dict:
        snapshot = self.latest_snapshot()
        today = self.today_events()
        high_impact = self.high_impact_events()
        upcoming = self.upcoming_events()
        recent = self.recent_releases()
        return {
            "snapshot": snapshot,
            "events_today": today,
            "high_impact_events": high_impact,
            "upcoming_events": upcoming,
            "recent_releases": recent,
        }

    def calendar_today(self) -> list[MacroEvent]:
        return self.today_events()

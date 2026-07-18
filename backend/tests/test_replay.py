"""Tests for the Historical Replay Engine."""

from uuid import uuid4
from datetime import datetime, timezone, timedelta
import pytest
from src.services.replay import (
    seed_candles,
    create_session,
    get_session,
    list_sessions,
    next_candle,
    prev_candle,
    jump_to_candle,
    get_current_state,
    pause_session,
    resume_session,
    finish_session,
    create_bookmark,
    delete_bookmark,
    update_bookmark,
    get_dashboard_stats,
)
from src.models.replay import MarketCandle, ReplaySession
from src.models.project import Project
from src.schemas.replay import ReplaySessionCreate, ReplayBookmarkCreate
from tests.conftest import TestingSessionLocal


@pytest.fixture
def db():
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture
def project(db):
    p = Project(id=uuid4(), name="Replay Test")
    db.add(p)
    db.commit()
    return p


class TestCandleSeeding:
    def test_seeds_candles_for_pair(self, db):
        start = datetime(2024, 1, 1, tzinfo=timezone.utc)
        end = datetime(2024, 1, 2, tzinfo=timezone.utc)
        count = seed_candles(db, "EURUSD", "1h", start, end)
        assert count > 0
        candles = db.query(MarketCandle).filter(
            MarketCandle.pair == "EURUSD", MarketCandle.timeframe == "1h"
        ).all()
        assert len(candles) == count
        for c in candles:
            assert c.open > 0
            assert c.high >= c.open and c.high >= c.close
            assert c.low <= c.open and c.low <= c.close
            assert c.volume >= 0

    def test_seeds_different_pairs(self, db):
        start = datetime(2024, 1, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=6)
        c1 = seed_candles(db, "AUDUSD", "1h", start, end)
        c2 = seed_candles(db, "NZDUSD", "1h", start, end)
        assert c1 > 0 and c2 > 0 and c1 == c2

    def test_idempotent_seeding(self, db):
        start = datetime(2024, 1, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=3)
        c1 = seed_candles(db, "USDJPY", "1h", start, end)
        c2 = seed_candles(db, "USDJPY", "1h", start, end)
        assert c1 == c2


class TestSessionCreation:
    PAIR = "EURUSD"

    def test_creates_session_with_candles(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = datetime(2024, 6, 2, tzinfo=timezone.utc)
        data = ReplaySessionCreate(pair=self.PAIR, timeframe="1h", start_date=start, end_date=end, notes="Test")
        session = create_session(db, project.id, data)
        assert session.id and session.pair == self.PAIR and session.status == "active"
        assert session.current_candle == 0 and session.total_candles > 0

    def test_list_sessions(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = datetime(2024, 6, 2, tzinfo=timezone.utc)
        data = ReplaySessionCreate(pair=self.PAIR, timeframe="1h", start_date=start, end_date=end)
        create_session(db, project.id, data)
        create_session(db, project.id, data)
        assert len(list_sessions(db, project.id)) == 2

    def test_get_session(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = datetime(2024, 6, 2, tzinfo=timezone.utc)
        data = ReplaySessionCreate(pair=self.PAIR, timeframe="1h", start_date=start, end_date=end)
        created = create_session(db, project.id, data)
        fetched = get_session(db, created.id)
        assert fetched and fetched.id == created.id


class TestFutureCandleEnforcement:
    def _pair(self, name): return f"XAU{name}"

    def test_initial_state_only_first_candle(self, db, project):
        pair = self._pair("Init")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        data = ReplaySessionCreate(pair=pair, timeframe="1h", start_date=start, end_date=end)
        session = create_session(db, project.id, data)
        state = get_current_state(db, session.id)
        assert len(state["candles_visible"]) == 1
        assert state["candles_visible"][0]["candle_index"] == 0

    def test_next_candle_reveals_one_more(self, db, project):
        pair = self._pair("Next")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        state = next_candle(db, session.id)
        assert len(state["candles_visible"]) == 2
        assert state["session"]["current_candle"] == 1

    def test_no_future_candles_after_navigation(self, db, project):
        pair = self._pair("Future")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        for _ in range(3):
            next_candle(db, session.id)
        state = get_current_state(db, session.id)
        max_idx = max(c["candle_index"] for c in state["candles_visible"])
        assert max_idx == 3
        total = db.query(MarketCandle).filter(
            MarketCandle.pair == pair, MarketCandle.timeframe == "1h"
        ).count()
        assert total > len(state["candles_visible"])

    def test_prev_candle_goes_back(self, db, project):
        pair = self._pair("Prev")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        next_candle(db, session.id)
        next_candle(db, session.id)
        state = prev_candle(db, session.id)
        assert state["session"]["current_candle"] == 1
        assert len(state["candles_visible"]) == 2

    def test_prev_at_start_returns_none(self, db, project):
        pair = self._pair("PrevStart")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        assert prev_candle(db, session.id) is None

    def test_next_at_end_returns_none(self, db, project):
        pair = self._pair("End")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=1)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        # Only 1 candle in 1h window, so next_candle returns None
        assert next_candle(db, session.id) is None

    def test_jump_to_candle(self, db, project):
        pair = self._pair("Jump")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=10)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        state = jump_to_candle(db, session.id, 5)
        assert state["session"]["current_candle"] == 5
        assert len(state["candles_visible"]) == 6

    def test_jump_clamped(self, db, project):
        pair = self._pair("Clamp")
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=pair, timeframe="1h", start_date=start, end_date=end
        ))
        state = jump_to_candle(db, session.id, 999)
        assert state["session"]["current_candle"] <= state["session"]["total_candles"] - 1


class TestSessionLifecycle:
    PAIR = "GBPUSD"

    def test_pause_and_resume(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=self.PAIR, timeframe="1h", start_date=start, end_date=end
        ))
        paused = pause_session(db, session.id)
        assert paused.status == "paused"
        assert next_candle(db, session.id) is None
        resumed = resume_session(db, session.id)
        assert resumed.status == "active"

    def test_finish_session(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=self.PAIR, timeframe="1h", start_date=start, end_date=end
        ))
        finished = finish_session(db, session.id)
        assert finished.status == "completed"
        assert finished.completed_at is not None


class TestBookmarks:
    PAIR = "USDCAD"

    def test_create_and_list_bookmarks(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=self.PAIR, timeframe="1h", start_date=start, end_date=end
        ))
        bm = create_bookmark(db, session.id, ReplayBookmarkCreate(
            candle_index=2, date=datetime(2024, 6, 1, 2, 0, tzinfo=timezone.utc), note="Setup"
        ))
        assert bm and bm.candle_index == 2 and bm.note == "Setup"
        state = get_current_state(db, session.id)
        assert len(state["bookmarks"]) == 1

    def test_delete_bookmark(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=self.PAIR, timeframe="1h", start_date=start, end_date=end
        ))
        bm = create_bookmark(db, session.id, ReplayBookmarkCreate(
            candle_index=1, date=datetime(2024, 6, 1, 1, 0, tzinfo=timezone.utc)
        ))
        assert delete_bookmark(db, bm.id) is True
        assert len(get_current_state(db, session.id)["bookmarks"]) == 0

    def test_update_bookmark(self, db, project):
        start = datetime(2024, 6, 1, tzinfo=timezone.utc)
        end = start + timedelta(hours=5)
        session = create_session(db, project.id, ReplaySessionCreate(
            pair=self.PAIR, timeframe="1h", start_date=start, end_date=end
        ))
        bm = create_bookmark(db, session.id, ReplayBookmarkCreate(
            candle_index=0, date=datetime(2024, 6, 1, 0, 0, tzinfo=timezone.utc), note="Old"
        ))
        updated = update_bookmark(db, bm.id, "Updated")
        assert updated.note == "Updated"


class TestDashboard:
    def test_dashboard_returns_stats(self, db, project):
        stats = get_dashboard_stats(db, project.id)
        assert "total_sessions" in stats and "total_trades" in stats
        assert "avg_rr" in stats and "avg_win_rate" in stats
        assert "learning_progress" in stats and "knowledge_growth" in stats

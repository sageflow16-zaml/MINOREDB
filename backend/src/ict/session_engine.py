"""Session Engine - identification of trading sessions, kill zones, and ICT windows."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from .schemas import OHLCBar, SessionAnalysis, SessionResult


# Session time ranges in minutes from UTC midnight
SESSION_CONFIG = {
    "asia": {
        "start": 0,    # 00:00 UTC
        "end": 540,    # 09:00 UTC
        "kill_zone_start": 0,
        "kill_zone_end": 120,  # 00:00-02:00 UTC
    },
    "london": {
        "start": 420,   # 07:00 UTC (some use 08:00)
        "end": 1020,    # 17:00 UTC
        "kill_zone_start": 420,
        "kill_zone_end": 600,   # 07:00-10:00 UTC
    },
    "new_york": {
        "start": 780,   # 13:00 UTC
        "end": 1260,    # 21:00 UTC
        "kill_zone_start": 780,
        "kill_zone_end": 960,   # 13:00-16:00 UTC
    },
    "london_close": {
        "start": 900,   # 15:00 UTC
        "end": 1020,    # 17:00 UTC
    },
}

SILVER_BULLET_WINDOWS = [
    {"name": "silver_bullet_am", "start": 540, "end": 600},   # London Kill Zone: 09:00-10:00
    {"name": "silver_bullet_pm", "start": 780, "end": 840},   # NY Kill Zone: 13:00-14:00
]


def _get_minutes_from_midnight(dt: datetime) -> int:
    """Get minutes since midnight for a datetime (in UTC)."""
    utc_dt = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return utc_dt.hour * 60 + utc_dt.minute


def identify_session(dt: datetime) -> Optional[str]:
    """Identify which trading session a timestamp falls into."""
    mins = _get_minutes_from_midnight(dt)

    for session_name, config in SESSION_CONFIG.items():
        if config["start"] <= mins < config["end"]:
            return session_name
    return None


def identify_kill_zone(dt: datetime) -> Optional[str]:
    """Identify if timestamp is within a kill zone."""
    mins = _get_minutes_from_midnight(dt)

    for session_name, config in SESSION_CONFIG.items():
        if "kill_zone_start" in config and config["kill_zone_start"] <= mins < config["kill_zone_end"]:
            return f"kill_zone_{session_name}"
    return None


def is_silver_bullet_window(dt: datetime) -> Optional[str]:
    """Check if timestamp is within a Silver Bullet window."""
    mins = _get_minutes_from_midnight(dt)

    for window in SILVER_BULLET_WINDOWS:
        if window["start"] <= mins < window["end"]:
            return window["name"]
    return None


def compute_session(
    bars: list[OHLCBar],
    session_type: str,
    date_str: str,
    start_minutes: int,
    end_minutes: int,
) -> Optional[SessionResult]:
    """Compute OHLC for a given session period."""
    session_bars = []
    for bar in bars:
        bar_mins = _get_minutes_from_midnight(bar.timestamp)
        if start_minutes <= bar_mins < end_minutes:
            session_bars.append(bar)

    if not session_bars:
        return None

    open_price = session_bars[0].open
    high_price = max(b.high for b in session_bars)
    low_price = min(b.low for b in session_bars)
    close_price = session_bars[-1].close
    session_range = high_price - low_price
    direction = "bullish" if close_price > open_price else "bearish" if close_price < open_price else "neutral"

    start_time = session_bars[0].timestamp
    end_time = session_bars[-1].timestamp

    return SessionResult(
        session_type=session_type,
        date=date_str,
        open_price=open_price,
        high_price=high_price,
        low_price=low_price,
        close_price=close_price,
        range=session_range,
        direction=direction,
        start_time=start_time,
        end_time=end_time,
    )


def compute_opening_range(bars: list[OHLCBar], session_type: str = "new_york") -> Optional[tuple[float, float]]:
    """Compute opening range for a session (first 30-60 minutes)."""
    if not bars:
        return None

    # Use the first 30 minutes of the session
    opening_bars = bars[:3] if len(bars) >= 3 else bars[:1]  # Approx 30 min depending on timeframe
    if not opening_bars:
        return None

    or_high = max(b.high for b in opening_bars)
    or_low = min(b.low for b in opening_bars)

    return or_high, or_low


def analyze_sessions(
    bars: list[OHLCBar],
    date_str: Optional[str] = None,
) -> SessionAnalysis:
    """Run full session analysis on OHLC bars."""
    result = SessionAnalysis()

    if not bars:
        return result

    if not date_str:
        date_str = bars[0].timestamp.strftime("%Y-%m-%d") if bars else ""

    # Compute each session
    sessions: list[SessionResult] = []

    for session_name, config in SESSION_CONFIG.items():
        session = compute_session(bars, session_name, date_str, config["start"], config["end"])
        if session:
            sessions.append(session)

    result.sessions = sessions

    # Current session context
    current_time = datetime.now(timezone.utc)
    result.current_session = identify_session(current_time)
    result.current_kill_zone = identify_kill_zone(current_time)
    result.is_silver_bullet_window = is_silver_bullet_window(current_time) is not None

    # Opening range
    or_levels = compute_opening_range(bars)
    if or_levels:
        result.opening_range_high, result.opening_range_low = or_levels

    return result

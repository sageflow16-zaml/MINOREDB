"""
Market Intelligence Services — Dashboard, calendar, regime engine, correlations,
liquidity, sessions, alerts, watchlist, timeline, providers, cache.
"""
import json
import math
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.market_intelligence import (
    EconomicEvent, MarketRegime, CorrelationData, LiquidityLevel,
    MarketStructurePoint, SessionAnalysis, Watchlist, WatchlistItem,
    MarketAlert, MarketTimeline, DataProviderConfig, MarketDataCache,
)


# ═══════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════

def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}

def _now(): return datetime.utcnow()
def _today(): return _now().strftime("%Y-%m-%d")
def _this_week():
    n = _now()
    return (n - timedelta(days=n.weekday())).strftime("%Y-%m-%d")


# ═══════════════════════════════════════════════════════
# MARKET DASHBOARD
# ═══════════════════════════════════════════════════════

def get_market_dashboard(db: Session, project_id: UUID) -> dict:
    today = _today()

    # Active regime
    regime = db.query(MarketRegime).filter(
        MarketRegime.project_id == project_id, MarketRegime.is_active == True
    ).order_by(MarketRegime.created_at.desc()).first()

    recent_regimes = [_dict(r) for r in db.query(MarketRegime).filter(
        MarketRegime.project_id == project_id
    ).order_by(MarketRegime.created_at.desc()).limit(5).all()]

    # Upcoming events (next 7 days)
    week_start = today
    week_end = (_now() + timedelta(days=7)).strftime("%Y-%m-%d")
    events = [_dict(e) for e in db.query(EconomicEvent).filter(
        EconomicEvent.project_id == project_id,
        EconomicEvent.event_date >= week_start,
        EconomicEvent.event_date <= week_end,
        EconomicEvent.impact == "high",
    ).order_by(EconomicEvent.event_date, EconomicEvent.event_time).limit(10).all()]

    # Active alerts
    alerts = [_dict(a) for a in db.query(MarketAlert).filter(
        MarketAlert.project_id == project_id, MarketAlert.is_dismissed == False
    ).order_by(MarketAlert.created_at.desc()).limit(5).all()]

    # Watchlist summary
    wl = db.query(Watchlist).filter(Watchlist.project_id == project_id, Watchlist.is_default == True).first()
    watchlist_summary = None
    if wl:
        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == wl.id).all()
        watchlist_summary = {
            "count": len(items),
            "bullish": sum(1 for i in items if i.bias == "bullish"),
            "bearish": sum(1 for i in items if i.bias == "bearish"),
        }

    # Session status
    now = _now()
    hour = now.hour
    session_status = {
        "asia": "open" if 0 <= hour < 7 else "closed",
        "london": "open" if 7 <= hour < 16 else "closed",
        "newyork": "open" if 13 <= hour < 22 else "closed",
        "overlap": "open" if 13 <= hour < 16 else "closed",
        "current": "asia" if 0 <= hour < 7 else "london" if 7 <= hour < 13 else "overlap" if 13 <= hour < 16 else "newyork" if 16 <= hour < 22 else "closed",
    }

    # USD strength proxy
    usd_pairs = db.query(MarketStructurePoint).filter(
        MarketStructurePoint.project_id == project_id,
        MarketStructurePoint.symbol.like("%USD%"),
        MarketStructurePoint.is_active == True,
    ).limit(10).all()
    usd_strength = 50.0  # neutral default

    # Volatility summary
    recent_regime = regime
    vol_level = "normal"
    if recent_regime:
        if recent_regime.regime_type in ("high_vol",):
            vol_level = "high"
        elif recent_regime.regime_type in ("low_vol",):
            vol_level = "low"

    return {
        "regime": _dict(regime),
        "recent_regimes": recent_regimes,
        "upcoming_events": events,
        "alerts": alerts,
        "watchlist_summary": watchlist_summary,
        "session_status": session_status,
        "correlation_summary": None,
        "usd_strength": usd_strength,
        "volatility_summary": {"level": vol_level, "regime": recent_regime.regime_type if recent_regime else None},
        "equity_summary": None,
        "commodity_summary": None,
        "bond_summary": None,
    }


# ═══════════════════════════════════════════════════════
# ECONOMIC CALENDAR
# ═══════════════════════════════════════════════════════

def get_economic_events(db: Session, project_id: UUID, start_date: str = None, end_date: str = None,
                        country: str = None, impact: str = None, category: str = None) -> list[dict]:
    q = db.query(EconomicEvent).filter(EconomicEvent.project_id == project_id)
    if start_date: q = q.filter(EconomicEvent.event_date >= start_date)
    if end_date: q = q.filter(EconomicEvent.event_date <= end_date)
    if country: q = q.filter(EconomicEvent.country == country)
    if impact: q = q.filter(EconomicEvent.impact == impact)
    if category: q = q.filter(EconomicEvent.category == category)
    return [_dict(e) for e in q.order_by(EconomicEvent.event_date, EconomicEvent.event_time).limit(200).all()]


def create_economic_event(db: Session, project_id: UUID, data: dict) -> dict:
    e = EconomicEvent(project_id=project_id, **data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return _dict(e)


def update_economic_event(db: Session, event_id: UUID, data: dict) -> dict | None:
    e = db.query(EconomicEvent).filter(EconomicEvent.id == event_id).first()
    if not e: return None
    for k, v in data.items():
        if v is not None and hasattr(e, k): setattr(e, k, v)
    e.updated_at = _now()
    db.commit()
    db.refresh(e)
    return _dict(e)


def delete_economic_event(db: Session, event_id: UUID) -> bool:
    e = db.query(EconomicEvent).filter(EconomicEvent.id == event_id).first()
    if not e: return False
    db.delete(e)
    db.commit()
    return True


def toggle_favorite_event(db: Session, event_id: UUID) -> dict | None:
    e = db.query(EconomicEvent).filter(EconomicEvent.id == event_id).first()
    if not e: return None
    e.is_favorite = not e.is_favorite
    db.commit()
    db.refresh(e)
    return _dict(e)


def get_favorites(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(e) for e in db.query(EconomicEvent).filter(
        EconomicEvent.project_id == project_id, EconomicEvent.is_favorite == True
    ).order_by(EconomicEvent.event_date.desc()).all()]


# ═══════════════════════════════════════════════════════
# MARKET REGIME ENGINE
# ═══════════════════════════════════════════════════════

def detect_regime(db: Session, project_id: UUID, symbol: str = "MARKET", metrics: dict = None) -> dict:
    """Classify current market regime from available data."""
    m = metrics or {}
    atr = m.get("atr", 0)
    adx = m.get("adx", 25)
    vix = m.get("vix", 20)

    # Determine regime
    if vix > 30:
        regime_type = "high_vol"
        regime_value = "extreme"
    elif vix < 15:
        regime_type = "low_vol"
        regime_value = "calm"
    elif adx > 30:
        regime_type = "trending"
        regime_value = "strong"
    elif adx < 20:
        regime_type = "ranging"
        regime_value = "weak"
    else:
        regime_type = "trending"
        regime_value = "moderate"

    # Deactivate old regime
    db.query(MarketRegime).filter(
        MarketRegime.project_id == project_id,
        MarketRegime.symbol == symbol,
        MarketRegime.is_active == True,
    ).update({"is_active": False, "ended_at": _now()})

    regime = MarketRegime(
        project_id=project_id, regime_type=regime_type, regime_value=regime_value,
        symbol=symbol, confidence=0.7, metrics=m,
        started_at=_now(), source="rule_based",
    )
    db.add(regime)
    db.commit()
    db.refresh(regime)
    return _dict(regime)


def get_regimes(db: Session, project_id: UUID, symbol: str = None) -> list[dict]:
    q = db.query(MarketRegime).filter(MarketRegime.project_id == project_id)
    if symbol: q = q.filter(MarketRegime.symbol == symbol)
    return [_dict(r) for r in q.order_by(MarketRegime.created_at.desc()).limit(50).all()]


def get_active_regime(db: Session, project_id: UUID, symbol: str = "MARKET") -> dict | None:
    r = db.query(MarketRegime).filter(
        MarketRegime.project_id == project_id, MarketRegime.symbol == symbol, MarketRegime.is_active == True
    ).first()
    return _dict(r) if r else None


# ═══════════════════════════════════════════════════════
# CORRELATION CENTER
# ═══════════════════════════════════════════════════════

def calculate_correlation(db: Session, project_id: UUID, symbol_a: str, symbol_b: str,
                          prices_a: list[float], prices_b: list[float], period: str = "20d") -> dict:
    """Calculate Pearson correlation between two price series."""
    if len(prices_a) < 2 or len(prices_b) < 2:
        return None
    n = min(len(prices_a), len(prices_b))
    a = prices_a[-n:]
    b = prices_b[-n:]
    mean_a = sum(a) / n
    mean_b = sum(b) / n
    cov = sum((a[i] - mean_a) * (b[i] - mean_b) for i in range(n)) / n
    std_a = math.sqrt(sum((x - mean_a) ** 2 for x in a) / n)
    std_b = math.sqrt(sum((x - mean_b) ** 2 for x in b) / n)
    corr = cov / (std_a * std_b) if std_a > 0 and std_b > 0 else 0.0
    corr = max(-1.0, min(1.0, corr))

    # Upsert
    existing = db.query(CorrelationData).filter(
        CorrelationData.project_id == project_id,
        CorrelationData.symbol_a == symbol_a, CorrelationData.symbol_b == symbol_b,
        CorrelationData.period == period,
    ).first()
    if existing:
        existing.correlation = round(corr, 4)
        existing.data_points = n
        existing.calculated_at = _now()
        db.commit()
        db.refresh(existing)
        return _dict(existing)
    else:
        cd = CorrelationData(
            project_id=project_id, symbol_a=symbol_a, symbol_b=symbol_b,
            correlation=round(corr, 4), period=period, data_points=n, calculated_at=_now(),
        )
        db.add(cd)
        db.commit()
        db.refresh(cd)
        return _dict(cd)


def get_correlations(db: Session, project_id: UUID, symbol: str = None, period: str = None) -> list[dict]:
    q = db.query(CorrelationData).filter(CorrelationData.project_id == project_id)
    if symbol: q = q.filter(or_(CorrelationData.symbol_a == symbol, CorrelationData.symbol_b == symbol))
    if period: q = q.filter(CorrelationData.period == period)
    return [_dict(c) for c in q.order_by(CorrelationData.calculated_at.desc()).limit(200).all()]


def get_correlation_matrix(db: Session, project_id: UUID, period: str = "20d") -> dict:
    """Build correlation matrix for display."""
    corrs = db.query(CorrelationData).filter(
        CorrelationData.project_id == project_id, CorrelationData.period == period
    ).all()
    symbols = set()
    matrix = {}
    for c in corrs:
        symbols.add(c.symbol_a)
        symbols.add(c.symbol_b)
        matrix[f"{c.symbol_a}:{c.symbol_b}"] = c.correlation
    return {"symbols": sorted(symbols), "matrix": matrix}


# ═══════════════════════════════════════════════════════
# LIQUIDITY MONITOR
# ═══════════════════════════════════════════════════════

def get_liquidity_levels(db: Session, project_id: UUID, symbol: str, date: str = None) -> list[dict]:
    q = db.query(LiquidityLevel).filter(LiquidityLevel.project_id == project_id, LiquidityLevel.symbol == symbol)
    if date: q = q.filter(LiquidityLevel.date == date)
    return [_dict(l) for l in q.order_by(LiquidityLevel.level_value.desc()).all()]


def create_liquidity_level(db: Session, project_id: UUID, data: dict) -> dict:
    l = LiquidityLevel(project_id=project_id, **data)
    db.add(l)
    db.commit()
    db.refresh(l)
    return _dict(l)


def mark_swept(db: Session, level_id: UUID) -> dict | None:
    l = db.query(LiquidityLevel).filter(LiquidityLevel.id == level_id).first()
    if not l: return None
    l.is_swept = True
    l.swept_at = _now()
    db.commit()
    db.refresh(l)
    return _dict(l)


def delete_liquidity_level(db: Session, level_id: UUID) -> bool:
    l = db.query(LiquidityLevel).filter(LiquidityLevel.id == level_id).first()
    if not l: return False
    db.delete(l)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# MARKET STRUCTURE
# ═══════════════════════════════════════════════════════

def get_structure_points(db: Session, project_id: UUID, symbol: str, timeframe: str = None) -> list[dict]:
    q = db.query(MarketStructurePoint).filter(
        MarketStructurePoint.project_id == project_id, MarketStructurePoint.symbol == symbol
    )
    if timeframe: q = q.filter(MarketStructurePoint.timeframe == timeframe)
    return [_dict(p) for p in q.order_by(MarketStructurePoint.created_at.desc()).limit(100).all()]


def create_structure_point(db: Session, project_id: UUID, data: dict) -> dict:
    p = MarketStructurePoint(project_id=project_id, **data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict(p)


def mitigate_structure_point(db: Session, point_id: UUID) -> dict | None:
    p = db.query(MarketStructurePoint).filter(MarketStructurePoint.id == point_id).first()
    if not p: return None
    p.is_mitigated = True
    db.commit()
    db.refresh(p)
    return _dict(p)


# ═══════════════════════════════════════════════════════
# SESSION ANALYSIS
# ═══════════════════════════════════════════════════════

def get_session_analyses(db: Session, project_id: UUID, date: str = None, symbol: str = None) -> list[dict]:
    q = db.query(SessionAnalysis).filter(SessionAnalysis.project_id == project_id)
    if date: q = q.filter(SessionAnalysis.date == date)
    if symbol: q = q.filter(SessionAnalysis.symbol == symbol)
    return [_dict(s) for s in q.order_by(SessionAnalysis.date.desc(), SessionAnalysis.session_name).all()]


def create_session_analysis(db: Session, project_id: UUID, data: dict) -> dict:
    s = SessionAnalysis(project_id=project_id, **data)
    db.add(s)
    db.commit()
    db.refresh(s)
    return _dict(s)


def get_session_stats(db: Session, project_id: UUID, session_name: str, days: int = 30) -> dict:
    cutoff = (_now() - timedelta(days=days)).strftime("%Y-%m-%d")
    sessions = db.query(SessionAnalysis).filter(
        SessionAnalysis.project_id == project_id,
        SessionAnalysis.session_name == session_name,
        SessionAnalysis.date >= cutoff,
    ).all()
    if not sessions:
        return {"session": session_name, "sample_size": 0}
    ranges = [s.range_pips or 0 for s in sessions if s.range_pips]
    return {
        "session": session_name,
        "sample_size": len(sessions),
        "avg_range": round(sum(ranges) / len(ranges), 1) if ranges else 0,
        "max_range": round(max(ranges), 1) if ranges else 0,
        "min_range": round(min(ranges), 1) if ranges else 0,
        "high_vol_count": sum(1 for s in sessions if s.volatility == "high"),
        "low_vol_count": sum(1 for s in sessions if s.volatility == "low"),
    }


# ═══════════════════════════════════════════════════════
# WATCHLIST
# ═══════════════════════════════════════════════════════

def get_watchlists(db: Session, project_id: UUID) -> list[dict]:
    return [_dict(w) for w in db.query(Watchlist).filter(Watchlist.project_id == project_id).order_by(Watchlist.sort_order).all()]


def create_watchlist(db: Session, project_id: UUID, data: dict) -> dict:
    w = Watchlist(project_id=project_id, **data)
    db.add(w)
    db.commit()
    db.refresh(w)
    return _dict(w)


def delete_watchlist(db: Session, watchlist_id: UUID) -> bool:
    w = db.query(Watchlist).filter(Watchlist.id == watchlist_id).first()
    if not w: return False
    db.delete(w)
    db.commit()
    return True


def get_watchlist_items(db: Session, watchlist_id: UUID) -> list[dict]:
    return [_dict(i) for i in db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id == watchlist_id
    ).order_by(WatchlistItem.sort_order).all()]


def add_watchlist_item(db: Session, watchlist_id: UUID, data: dict) -> dict:
    i = WatchlistItem(watchlist_id=watchlist_id, **data)
    db.add(i)
    db.commit()
    db.refresh(i)
    return _dict(i)


def update_watchlist_item(db: Session, item_id: UUID, data: dict) -> dict | None:
    i = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not i: return None
    for k, v in data.items():
        if v is not None and hasattr(i, k): setattr(i, k, v)
    db.commit()
    db.refresh(i)
    return _dict(i)


def delete_watchlist_item(db: Session, item_id: UUID) -> bool:
    i = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not i: return False
    db.delete(i)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# ALERTS
# ═══════════════════════════════════════════════════════

def get_alerts(db: Session, project_id: UUID, alert_type: str = None) -> list[dict]:
    q = db.query(MarketAlert).filter(MarketAlert.project_id == project_id, MarketAlert.is_dismissed == False)
    if alert_type: q = q.filter(MarketAlert.alert_type == alert_type)
    return [_dict(a) for a in q.order_by(MarketAlert.created_at.desc()).limit(50).all()]


def create_alert(db: Session, project_id: UUID, data: dict) -> dict:
    a = MarketAlert(project_id=project_id, **data)
    db.add(a)
    db.commit()
    db.refresh(a)
    return _dict(a)


def read_alert(db: Session, alert_id: UUID) -> dict | None:
    a = db.query(MarketAlert).filter(MarketAlert.id == alert_id).first()
    if not a: return None
    a.is_read = True
    db.commit()
    return _dict(a)


def dismiss_alert(db: Session, alert_id: UUID) -> bool:
    a = db.query(MarketAlert).filter(MarketAlert.id == alert_id).first()
    if not a: return False
    a.is_dismissed = True
    db.commit()
    return True


def check_news_alerts(db: Session, project_id: UUID) -> list[dict]:
    """Generate alerts for upcoming high-impact events."""
    today = _today()
    week_end = (_now() + timedelta(days=2)).strftime("%Y-%m-%d")
    events = db.query(EconomicEvent).filter(
        EconomicEvent.project_id == project_id,
        EconomicEvent.event_date >= today,
        EconomicEvent.event_date <= week_end,
        EconomicEvent.impact == "high",
    ).all()
    alerts = []
    for e in events:
        exists = db.query(MarketAlert).filter(
            MarketAlert.project_id == project_id,
            MarketAlert.alert_type == "news",
            MarketAlert.title == f"Upcoming: {e.event_name}",
        ).first()
        if not exists:
            alert = MarketAlert(
                project_id=project_id, alert_type="news",
                title=f"Upcoming: {e.event_name}",
                message=f"{e.country} {e.currency} — {e.event_date} {e.event_time or ''}",
                severity="warning",
                trigger_data={"event_id": str(e.id), "date": e.event_date},
            )
            db.add(alert)
            alerts.append(_dict(alert))
    db.commit()
    return alerts


# ═══════════════════════════════════════════════════════
# TIMELINE
# ═══════════════════════════════════════════════════════

def get_timeline(db: Session, project_id: UUID, start_date: str = None, end_date: str = None,
                 event_type: str = None, limit: int = 100) -> list[dict]:
    q = db.query(MarketTimeline).filter(MarketTimeline.project_id == project_id)
    if start_date: q = q.filter(MarketTimeline.event_date >= start_date)
    if end_date: q = q.filter(MarketTimeline.event_date <= end_date)
    if event_type: q = q.filter(MarketTimeline.event_type == event_type)
    return [_dict(t) for t in q.order_by(MarketTimeline.event_date.desc(), MarketTimeline.event_time.desc()).limit(limit).all()]


def create_timeline_event(db: Session, project_id: UUID, data: dict) -> dict:
    t = MarketTimeline(project_id=project_id, **data)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _dict(t)


def auto_populate_timeline(db: Session, project_id: UUID) -> int:
    """Auto-populate timeline from economic events."""
    events = db.query(EconomicEvent).filter(EconomicEvent.project_id == project_id).limit(100).all()
    count = 0
    for e in events:
        exists = db.query(MarketTimeline).filter(
            MarketTimeline.project_id == project_id,
            MarketTimeline.event_type == "economic",
            MarketTimeline.title == e.event_name,
            MarketTimeline.event_date == e.event_date,
        ).first()
        if not exists:
            db.add(MarketTimeline(
                project_id=project_id, event_type="economic",
                event_date=e.event_date, event_time=e.event_time,
                title=e.event_name, symbol=e.currency,
                impact=e.impact,
            ))
            count += 1
    db.commit()
    return count


# ═══════════════════════════════════════════════════════
# DATA PROVIDERS
# ═══════════════════════════════════════════════════════

def get_providers(db: Session) -> list[dict]:
    return [_dict(p) for p in db.query(DataProviderConfig).order_by(DataProviderConfig.provider_name).all()]


def get_default_provider(db: Session) -> dict | None:
    p = db.query(DataProviderConfig).filter(DataProviderConfig.is_default == True, DataProviderConfig.is_enabled == True).first()
    return _dict(p) if p else None


def create_provider(db: Session, data: dict) -> dict:
    if data.get("is_default"):
        db.query(DataProviderConfig).update({"is_default": False})
    p = DataProviderConfig(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict(p)


def update_provider(db: Session, provider_id: UUID, data: dict) -> dict | None:
    p = db.query(DataProviderConfig).filter(DataProviderConfig.id == provider_id).first()
    if not p: return None
    if data.get("is_default"):
        db.query(DataProviderConfig).update({"is_default": False})
    for k, v in data.items():
        if v is not None: setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _dict(p)


def delete_provider(db: Session, provider_id: UUID) -> bool:
    p = db.query(DataProviderConfig).filter(DataProviderConfig.id == provider_id).first()
    if not p: return False
    db.delete(p)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════
# CACHE
# ═══════════════════════════════════════════════════════

def get_cached(db: Session, cache_key: str) -> dict | None:
    c = db.query(MarketDataCache).filter(MarketDataCache.cache_key == cache_key).first()
    if not c: return None
    if c.expires_at and c.expires_at < _now():
        db.delete(c)
        db.commit()
        return None
    return c.data


def set_cache(db: Session, cache_key: str, cache_type: str, data: dict, ttl_seconds: int = 300, provider: str = None):
    existing = db.query(MarketDataCache).filter(MarketDataCache.cache_key == cache_key).first()
    if existing:
        existing.data = data
        existing.expires_at = _now() + timedelta(seconds=ttl_seconds)
        existing.provider = provider
    else:
        db.add(MarketDataCache(
            cache_key=cache_key, cache_type=cache_type, data=data,
            expires_at=_now() + timedelta(seconds=ttl_seconds), provider=provider,
        ))
    db.commit()


def clear_expired_cache(db: Session) -> int:
    count = db.query(MarketDataCache).filter(MarketDataCache.expires_at < _now()).delete()
    db.commit()
    return count


# ═══════════════════════════════════════════════════════
# AI CONTEXT
# ═══════════════════════════════════════════════════════

def get_market_context_for_ai(db: Session, project_id: UUID) -> dict:
    """Prepare structured market context for AI consumption."""
    regime = get_active_regime(db, project_id)
    today = _today()
    week_end = (_now() + timedelta(days=3)).strftime("%Y-%m-%d")
    events = db.query(EconomicEvent).filter(
        EconomicEvent.project_id == project_id,
        EconomicEvent.event_date >= today,
        EconomicEvent.event_date <= week_end,
        EconomicEvent.impact == "high",
    ).all()
    alerts = db.query(MarketAlert).filter(
        MarketAlert.project_id == project_id, MarketAlert.is_dismissed == False
    ).limit(5).all()

    return {
        "current_regime": regime["regime_type"] if regime else None,
        "usd_direction": None,
        "risk_sentiment": "risk_on" if regime and regime["regime_type"] == "risk_on" else "risk_off" if regime and regime["regime_type"] == "risk_off" else "neutral",
        "volatility_level": regime["regime_value"] if regime else "normal",
        "upcoming_high_impact": [{"name": e.event_name, "date": e.event_date, "time": e.event_time, "country": e.country} for e in events],
        "active_alerts": [{"title": a.title, "severity": a.severity} for a in alerts],
        "correlation_highlights": [],
        "session_notes": None,
        "watchlist_biases": None,
    }

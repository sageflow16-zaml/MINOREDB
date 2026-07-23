from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import market_intelligence as mi
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error("Market intelligence query failed: %s", exc)
        return {}


# ── Dashboard ──
@router.get("/dashboard")
def get_dashboard(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_market_dashboard, db, project_id)


# ── Economic Calendar ──
@router.get("/events")
def get_events(
    project_id: UUID,
    start_date: str = None, end_date: str = None,
    country: str = None, impact: str = None, category: str = None,
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    return _safe(mi.get_economic_events, db, project_id, start_date, end_date, country, impact, category)


@router.post("/events")
def create_event(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_economic_event, db, project_id, data)


@router.put("/events/{event_id}")
def update_event(project_id: UUID, event_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.update_economic_event, db, event_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result


@router.delete("/events/{event_id}")
def delete_event(project_id: UUID, event_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.delete_economic_event, db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}


@router.put("/events/{event_id}/favorite")
def toggle_favorite(project_id: UUID, event_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.toggle_favorite_event, db, event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    return result


@router.get("/events/favorites")
def get_favorites(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_favorites, db, project_id)


# ── Regime Engine ──
@router.get("/regimes")
def get_regimes(project_id: UUID, symbol: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_regimes, db, project_id, symbol)


@router.get("/regimes/active")
def get_active_regime(project_id: UUID, symbol: str = "MARKET", project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_active_regime, db, project_id, symbol)


@router.post("/regimes/detect")
def detect_regime(project_id: UUID, data: dict = {}, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.detect_regime, db, project_id, data.get("symbol", "MARKET"), data.get("metrics"))


# ── Correlation Center ──
@router.get("/correlations")
def get_correlations(project_id: UUID, symbol: str = None, period: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_correlations, db, project_id, symbol, period)


@router.get("/correlations/matrix")
def get_correlation_matrix(project_id: UUID, period: str = "20d", project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_correlation_matrix, db, project_id, period)


@router.post("/correlations/calculate")
def calculate_correlation(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.calculate_correlation, db, project_id, data["symbol_a"], data["symbol_b"],
                 data["prices_a"], data["prices_b"], data.get("period", "20d"))


# ── Liquidity Monitor ──
@router.get("/liquidity/{symbol}")
def get_liquidity(project_id: UUID, symbol: str, date: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_liquidity_levels, db, project_id, symbol, date)


@router.post("/liquidity")
def create_liquidity(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_liquidity_level, db, project_id, data)


@router.put("/liquidity/{level_id}/swept")
def mark_swept(project_id: UUID, level_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.mark_swept, db, level_id)
    if not result:
        raise HTTPException(status_code=404, detail="Level not found")
    return result


@router.delete("/liquidity/{level_id}")
def delete_liquidity(project_id: UUID, level_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.delete_liquidity_level, db, level_id):
        raise HTTPException(status_code=404, detail="Level not found")
    return {"status": "deleted"}


# ── Structure Points ──
@router.get("/structure/{symbol}")
def get_structure(project_id: UUID, symbol: str, timeframe: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_structure_points, db, project_id, symbol, timeframe)


@router.post("/structure")
def create_structure(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_structure_point, db, project_id, data)


@router.put("/structure/{point_id}/mitigate")
def mitigate_structure(project_id: UUID, point_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.mitigate_structure_point, db, point_id)
    if not result:
        raise HTTPException(status_code=404, detail="Structure point not found")
    return result


# ── Session Analysis ──
@router.get("/sessions")
def get_sessions(project_id: UUID, date: str = None, symbol: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_session_analyses, db, project_id, date, symbol)


@router.post("/sessions")
def create_session(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_session_analysis, db, project_id, data)


@router.get("/sessions/{session_name}/stats")
def get_session_stats(project_id: UUID, session_name: str, days: int = 30, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_session_stats, db, project_id, session_name, days)


# ── Watchlist ──
@router.get("/watchlists")
def get_watchlists(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_watchlists, db, project_id)


@router.post("/watchlists")
def create_watchlist(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_watchlist, db, project_id, data)


@router.delete("/watchlists/{watchlist_id}")
def delete_watchlist(project_id: UUID, watchlist_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.delete_watchlist, db, watchlist_id):
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return {"status": "deleted"}


@router.get("/watchlists/{watchlist_id}/items")
def get_watchlist_items(project_id: UUID, watchlist_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_watchlist_items, db, watchlist_id)


@router.post("/watchlists/{watchlist_id}/items")
def add_watchlist_item(project_id: UUID, watchlist_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.add_watchlist_item, db, watchlist_id, data)


@router.put("/watchlists/items/{item_id}")
def update_watchlist_item(project_id: UUID, item_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.update_watchlist_item, db, item_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return result


@router.delete("/watchlists/items/{item_id}")
def delete_watchlist_item(project_id: UUID, item_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.delete_watchlist_item, db, item_id):
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    return {"status": "deleted"}


# ── Alerts ──
@router.get("/alerts")
def get_alerts(project_id: UUID, alert_type: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_alerts, db, project_id, alert_type)


@router.post("/alerts")
def create_alert(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_alert, db, project_id, data)


@router.put("/alerts/{alert_id}/read")
def read_alert(project_id: UUID, alert_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.read_alert, db, alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result


@router.put("/alerts/{alert_id}/dismiss")
def dismiss_alert(project_id: UUID, alert_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.dismiss_alert, db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "dismissed"}


@router.post("/alerts/check-news")
def check_news_alerts(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.check_news_alerts, db, project_id)


# ── Timeline ──
@router.get("/timeline")
def get_timeline(
    project_id: UUID,
    start_date: str = None, end_date: str = None,
    event_type: str = None, limit: int = 100,
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    return _safe(mi.get_timeline, db, project_id, start_date, end_date, event_type, limit)


@router.post("/timeline")
def create_timeline_event(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_timeline_event, db, project_id, data)


@router.post("/timeline/auto-populate")
def auto_populate_timeline(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return {"count": _safe(mi.auto_populate_timeline, db, project_id)}


# ── Data Providers ──
@router.get("/providers")
def get_providers(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_providers, db)


@router.get("/providers/default")
def get_default_provider(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_default_provider, db)


@router.post("/providers")
def create_provider(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.create_provider, db, data)


@router.put("/providers/{provider_id}")
def update_provider(project_id: UUID, provider_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(mi.update_provider, db, provider_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Provider not found")
    return result


@router.delete("/providers/{provider_id}")
def delete_provider(project_id: UUID, provider_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(mi.delete_provider, db, provider_id):
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"status": "deleted"}


# ── AI Context ──
@router.get("/ai-context")
def get_ai_context(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(mi.get_market_context_for_ai, db, project_id)

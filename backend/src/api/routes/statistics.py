from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import statistics
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


def _safe_overview(db: Session, project_id: UUID) -> dict:
    try:
        return statistics.get_statistics_overview(db, project_id=project_id)
    except Exception as exc:
        logger.error("Statistics overview failed for project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load statistics",
        )


def _safe_data(db: Session, project_id: UUID, func, default=None):
    try:
        return func(db, project_id=project_id)
    except Exception as exc:
        logger.error("Statistics query failed for project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load statistics",
        )


@router.get("")
def get_statistics_full(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe_overview(db, project_id=project_id)


@router.get("/overview")
def get_statistics_overview(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe_overview(db, project_id=project_id)


@router.get("/risk")
def get_statistics_risk(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("risk", {})


@router.get("/equity-curve")
def get_equity_curve(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe_data(db, project_id, statistics.get_equity_curve)


@router.get("/pnl-distribution")
def get_pnl_distribution(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe_data(db, project_id, statistics.get_pnl_distribution)


@router.get("/rr-distribution")
def get_rr_distribution(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe_data(db, project_id, statistics.get_rr_distribution)


@router.get("/by-pair")
def get_by_pair(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_pair", {})


@router.get("/by-direction")
def get_by_direction(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_direction", {})


@router.get("/by-bias")
def get_by_bias(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_bias", {})


@router.get("/by-session")
def get_by_session(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_session", {})


@router.get("/by-market-phase")
def get_by_market_phase(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_market_phase", {})


@router.get("/by-trend")
def get_by_trend(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_trend", {})


@router.get("/monthly-returns")
def get_monthly_returns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("monthly_returns", [])


@router.get("/rolling")
def get_rolling_stats(
    project_id: UUID,
    window: int = 10,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    if window == 10:
        return overview.get("rolling_10", {})
    elif window == 50:
        return overview.get("rolling_50", {})
    return {}


# ──────────────────────────────────────────────────────────────────────
# NEW: Phase 2.5 - Performance Intelligence Extensions
# ──────────────────────────────────────────────────────────────────────

@router.get("/by-strategy")
def get_by_strategy(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_strategy", {})


@router.get("/by-weekday")
def get_by_weekday(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_weekday", {})


@router.get("/by-timeframe")
def get_by_timeframe(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_timeframe", {})


@router.get("/by-market-condition")
def get_by_market_condition(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_market_condition", {})


@router.get("/by-volatility")
def get_by_volatility(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_volatility", {})


@router.get("/by-news")
def get_by_news(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_news", {})


@router.get("/by-setup")
def get_by_setup(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("by_setup", {})


@router.get("/weekly-returns")
def get_weekly_returns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("weekly_returns", [])


@router.get("/yearly-returns")
def get_yearly_returns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("yearly_returns", [])


@router.get("/risk-analytics")
def get_risk_analytics(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("risk_analytics", {})


@router.get("/psychology-analytics")
def get_psychology_analytics(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("psychology_analytics", {})


@router.get("/calendar-heatmap")
def get_calendar_heatmap(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("calendar_heatmap", {})


@router.get("/scatter-data")
def get_scatter_data(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = _safe_overview(db, project_id=project_id)
    return overview.get("scatter_data", {})


# ──────────────────────────────────────────────────────────────────────
# Filtered Statistics (with date range)
# ──────────────────────────────────────────────────────────────────────

@router.get("/filtered")
def get_filtered_statistics(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Get statistics with optional date filtering."""
    from datetime import datetime
    try:
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    return statistics.get_statistics_overview(db, project_id=project_id, start_date=start, end_date=end)
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import statistics

router = APIRouter()


@router.get("")
def get_statistics_full(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return statistics.get_statistics_overview(db, project_id=project_id)


@router.get("/overview")
def get_statistics_overview(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return statistics.get_statistics_overview(db, project_id=project_id)


@router.get("/risk")
def get_statistics_risk(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("risk", {})


@router.get("/equity-curve")
def get_equity_curve(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return statistics.get_equity_curve(db, project_id=project_id)


@router.get("/pnl-distribution")
def get_pnl_distribution(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return statistics.get_pnl_distribution(db, project_id=project_id)


@router.get("/rr-distribution")
def get_rr_distribution(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return statistics.get_rr_distribution(db, project_id=project_id)


@router.get("/by-pair")
def get_by_pair(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_pair", {})


@router.get("/by-direction")
def get_by_direction(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_direction", {})


@router.get("/by-bias")
def get_by_bias(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_bias", {})


@router.get("/by-session")
def get_by_session(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_session", {})


@router.get("/by-market-phase")
def get_by_market_phase(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_market_phase", {})


@router.get("/by-trend")
def get_by_trend(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("by_trend", {})


@router.get("/monthly-returns")
def get_monthly_returns(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    return overview.get("monthly_returns", [])


@router.get("/rolling")
def get_rolling_stats(
    project_id: UUID,
    window: int = 10,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    overview = statistics.get_statistics_overview(db, project_id=project_id)
    if window == 10:
        return overview.get("rolling_10", {})
    elif window == 50:
        return overview.get("rolling_50", {})
    return {}
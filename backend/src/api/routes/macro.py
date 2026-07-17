from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.schemas.macro import (
    MacroEventRead,
    MarketSnapshotRead,
    MacroRefreshResult,
    MarketState,
)
from src.services.macro import MacroService
from src.collectors.macro import (
    EconomicCalendarCollector,
    MarketSnapshotCollector,
)

router = APIRouter()


@router.get("/snapshot", response_model=MarketSnapshotRead | None)
def get_snapshot(db: Session = Depends(get_db)):
    svc = MacroService(db)
    return svc.latest_snapshot()


@router.get("/events", response_model=list[MacroEventRead])
def get_events(limit: int = 50, importance: str | None = None, db: Session = Depends(get_db)):
    svc = MacroService(db)
    if importance:
        from sqlalchemy import select, desc
        from src.models.macro import MacroEvent
        result = db.execute(
            select(MacroEvent)
            .where(MacroEvent.importance == importance)
            .order_by(desc(MacroEvent.release_time))
            .limit(limit)
        )
        return list(result.scalars().all())
    return svc.latest_events(limit=limit)


@router.get("/calendar", response_model=list[MacroEventRead])
def get_calendar(db: Session = Depends(get_db)):
    svc = MacroService(db)
    return svc.calendar_today()


@router.get("/state", response_model=MarketState)
def get_state(db: Session = Depends(get_db)):
    svc = MacroService(db)
    state = svc.market_state()
    return MarketState(
        snapshot=state["snapshot"],
        events_today=[MacroEventRead.model_validate(e) for e in state["events_today"]],
        high_impact_events=[MacroEventRead.model_validate(e) for e in state["high_impact_events"]],
        upcoming_events=[MacroEventRead.model_validate(e) for e in state["upcoming_events"]],
        recent_releases=[MacroEventRead.model_validate(e) for e in state["recent_releases"]],
    )


@router.post("/refresh", response_model=MacroRefreshResult)
def refresh_macro(db: Session = Depends(get_db)):
    import time
    start = time.time()

    from uuid import uuid4
    project_id = uuid4()

    cal_collector = EconomicCalendarCollector(project_id, db)
    snap_collector = MarketSnapshotCollector(project_id, db)

    cal_result = cal_collector.run()
    snap_result = snap_result = snap_collector.run()

    duration = int((time.time() - start) * 1000)

    return MacroRefreshResult(
        events_stored=cal_result.records_collected,
        snapshot_stored=snap_result.records_collected,
        duration_ms=duration,
    )

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.schemas.replay import (
    ReplaySessionCreate,
    ReplaySessionResponse,
    ReplayTradeCreate,
    ReplayTradeResponse,
    ReplayBookmarkCreate,
    ReplayBookmarkUpdate,
    ReplayBookmarkResponse,
    ReplayNavigateResponse,
    ReplayDashboardStats,
)
from src.services import replay as service

router = APIRouter()


# ---- Sessions ----


@router.post("/sessions", response_model=ReplaySessionResponse)
def create_replay_session(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    body: ReplaySessionCreate = ...,
    db: Session = Depends(get_db),
):
    return service.create_session(db, project_id, body)


@router.get("/sessions", response_model=list[ReplaySessionResponse])
def list_replay_sessions(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return service.list_sessions(db, project_id)


@router.get("/sessions/{session_id}", response_model=ReplayNavigateResponse)
def get_replay_session(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.get_current_state(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Replay session not found")
    return result


# ---- Navigation ----


@router.post("/sessions/{session_id}/next", response_model=ReplayNavigateResponse)
def next_candle(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.next_candle(db, session_id)
    if not result:
        raise HTTPException(status_code=400, detail="No more candles available")
    return result


@router.post("/sessions/{session_id}/prev", response_model=ReplayNavigateResponse)
def prev_candle(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.prev_candle(db, session_id)
    if not result:
        raise HTTPException(status_code=400, detail="Already at first candle")
    return result


@router.post("/sessions/{session_id}/jump", response_model=ReplayNavigateResponse)
def jump_to_candle(
    project_id: str,
    session_id: UUID,
    candle_index: int = Query(...),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.jump_to_candle(db, session_id, candle_index)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


# ---- Session lifecycle ----


@router.post("/sessions/{session_id}/pause", response_model=ReplaySessionResponse)
def pause_session(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.pause_session(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


@router.post("/sessions/{session_id}/resume", response_model=ReplaySessionResponse)
def resume_session(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.resume_session(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


@router.post("/sessions/{session_id}/finish", response_model=ReplaySessionResponse)
def finish_session(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.finish_session(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


# ---- Trades ----


@router.post("/sessions/{session_id}/trades", response_model=ReplayNavigateResponse)
def create_replay_trade(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayTradeCreate = ...,
    db: Session = Depends(get_db),
):
    result = service.create_trade_in_replay(db, session_id, project_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


# ---- Bookmarks ----


@router.post("/sessions/{session_id}/bookmarks", response_model=ReplayBookmarkResponse)
def create_bookmark(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayBookmarkCreate = ...,
    db: Session = Depends(get_db),
):
    result = service.create_bookmark(db, session_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


@router.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(
    project_id: str,
    bookmark_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not service.delete_bookmark(db, bookmark_id):
        raise HTTPException(status_code=404, detail="Bookmark not found")


@router.patch("/bookmarks/{bookmark_id}", response_model=ReplayBookmarkResponse)
def update_bookmark(
    project_id: str,
    bookmark_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayBookmarkUpdate = ...,
    db: Session = Depends(get_db),
):
    result = service.update_bookmark(db, bookmark_id, body.note or "")
    if not result:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return result


# ---- Dashboard ----


@router.get("/dashboard", response_model=ReplayDashboardStats)
def replay_dashboard(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return service.get_dashboard_stats(db, project_id)

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
    ReplayAnnotationCreate,
    ReplayAnnotationUpdate,
    ReplayAnnotationRead,
    ReplayTimelineEventCreate,
    ReplayTimelineEventRead,
    ReplayReviewCreate,
    ReplayReviewUpdate,
    ReplayReviewRead,
    ReplayMistakeCreate,
    ReplayMistakeUpdate,
    ReplayMistakeRead,
    ReplayScreenshotCreate,
    ReplayScreenshotUpdate,
    ReplayScreenshotRead,
    ReplayWorkspaceState,
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


@router.get("/sessions/{session_id}", response_model=ReplayWorkspaceState)
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


@router.post("/sessions/{session_id}/next", response_model=ReplayWorkspaceState)
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


@router.post("/sessions/{session_id}/prev", response_model=ReplayWorkspaceState)
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


@router.post("/sessions/{session_id}/jump", response_model=ReplayWorkspaceState)
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


@router.post("/sessions/{session_id}/trades", response_model=ReplayWorkspaceState)
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


# ---- Workspace State (includes all new data) ----


@router.get("/sessions/{session_id}/workspace", response_model=ReplayWorkspaceState)
def get_replay_workspace(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = service.get_current_state(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Replay session not found")
    return result


# ---- Annotations ----


@router.post("/sessions/{session_id}/annotations", response_model=ReplayAnnotationRead, status_code=201)
def create_annotation(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayAnnotationCreate = ...,
    db: Session = Depends(get_db),
):
    return service.create_annotation(db, session_id, body)


@router.patch("/annotations/{annotation_id}", response_model=ReplayAnnotationRead)
def update_annotation(
    project_id: str,
    annotation_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayAnnotationUpdate = ...,
    db: Session = Depends(get_db),
):
    result = service.update_annotation(db, annotation_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return result


@router.delete("/annotations/{annotation_id}", status_code=204)
def delete_annotation(
    project_id: str,
    annotation_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not service.delete_annotation(db, annotation_id):
        raise HTTPException(status_code=404, detail="Annotation not found")


# ---- Timeline Events ----


@router.post("/sessions/{session_id}/timeline-events", response_model=ReplayTimelineEventRead, status_code=201)
def create_timeline_event(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayTimelineEventCreate = ...,
    db: Session = Depends(get_db),
):
    return service.create_timeline_event(db, session_id, body)


@router.delete("/timeline-events/{event_id}", status_code=204)
def delete_timeline_event(
    project_id: str,
    event_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not service.delete_timeline_event(db, event_id):
        raise HTTPException(status_code=404, detail="Timeline event not found")


# ---- Review ----


@router.put("/sessions/{session_id}/review", response_model=ReplayReviewRead)
def upsert_review(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayReviewCreate = ...,
    db: Session = Depends(get_db),
):
    return service.upsert_review(db, session_id, body)


@router.get("/sessions/{session_id}/review", response_model=ReplayReviewRead | None)
def get_review(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    from src.services.replay import _get_session_review
    review = _get_session_review(db, session_id)
    return review


# ---- Mistakes ----


@router.post("/sessions/{session_id}/mistakes", response_model=ReplayMistakeRead, status_code=201)
def create_mistake(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayMistakeCreate = ...,
    db: Session = Depends(get_db),
):
    return service.create_mistake(db, session_id, body)


@router.patch("/mistakes/{mistake_id}", response_model=ReplayMistakeRead)
def update_mistake(
    project_id: str,
    mistake_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
    body: ReplayMistakeUpdate = ...,
):
    result = service.update_mistake(db, mistake_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Mistake not found")
    return result


@router.delete("/mistakes/{mistake_id}", status_code=204)
def delete_mistake(
    project_id: str,
    mistake_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not service.delete_mistake(db, mistake_id):
        raise HTTPException(status_code=404, detail="Mistake not found")


# ---- Screenshots ----


@router.post("/sessions/{session_id}/screenshots", response_model=ReplayScreenshotRead, status_code=201)
def create_screenshot(
    project_id: str,
    session_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayScreenshotCreate = ...,
    db: Session = Depends(get_db),
):
    return service.create_screenshot(db, session_id, body)


@router.patch("/screenshots/{screenshot_id}", response_model=ReplayScreenshotRead)
def update_screenshot(
    project_id: str,
    screenshot_id: UUID,
    project: Project = Depends(get_project_or_404),
    body: ReplayScreenshotUpdate = ...,
    db: Session = Depends(get_db),
):
    result = service.update_screenshot(db, screenshot_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    return result


@router.delete("/screenshots/{screenshot_id}", status_code=204)
def delete_screenshot(
    project_id: str,
    screenshot_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not service.delete_screenshot(db, screenshot_id):
        raise HTTPException(status_code=404, detail="Screenshot not found")


# ---- Dashboard ----


@router.get("/dashboard")
def replay_dashboard(
    project_id: str,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    try:
        return service.get_dashboard_stats(db, project_id)
    except Exception as e:
        return {"total_sessions": 0, "total_trades": 0, "avg_rr": 0.0, "avg_win_rate": 0.0, "learning_progress": 0, "knowledge_growth": 0, "error": str(e)}

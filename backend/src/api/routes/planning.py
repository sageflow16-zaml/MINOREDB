from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import planning
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.error("Planning query failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to load planning data")


# ── Dashboard ──
@router.get("/dashboard")
def get_dashboard(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_planning_dashboard, db, project_id)


# ── Day / Week View ──
@router.get("/day/{date}")
def get_day_view(project_id: UUID, date: str, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_day_view, db, project_id, date)


@router.get("/week/{week_start}")
def get_week_view(project_id: UUID, week_start: str, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_week_view, db, project_id, week_start)


# ── Trading Plans ──
@router.get("/plans")
def get_plans(project_id: UUID, start_date: str = None, end_date: str = None, plan_type: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_plans, db, project_id, start_date, end_date, plan_type)


@router.post("/plans")
def create_plan(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_plan, db, project_id, data)


@router.put("/plans/{plan_id}")
def update_plan(project_id: UUID, plan_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(planning.update_plan, db, plan_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Plan not found")
    return result


@router.delete("/plans/{plan_id}")
def delete_plan(project_id: UUID, plan_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_plan, db, plan_id):
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"status": "deleted"}


# ── Checklists ──
@router.get("/checklists/templates")
def get_checklist_templates(project_id: UUID, checklist_type: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_checklist_templates, db, project_id, checklist_type)


@router.post("/checklists/templates")
def create_checklist_template(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_checklist_template, db, project_id, data)


@router.delete("/checklists/templates/{template_id}")
def delete_checklist_template(project_id: UUID, template_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_checklist_template, db, template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "deleted"}


@router.get("/checklists/executions")
def get_checklist_executions(project_id: UUID, execution_date: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_checklist_executions, db, project_id, execution_date)


@router.post("/checklists/executions")
def create_checklist_execution(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_checklist_execution, db, project_id, data)


# ── Economic Events ──
@router.get("/economic-events")
def get_economic_events(project_id: UUID, start_date: str = None, end_date: str = None, currency: str = None, impact_level: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_economic_events, db, project_id, start_date, end_date, currency, impact_level)


@router.post("/economic-events")
def create_economic_event(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_economic_event, db, project_id, data)


@router.delete("/economic-events/{event_id}")
def delete_economic_event(project_id: UUID, event_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_economic_event, db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}


# ── Reviews ──
@router.get("/reviews")
def get_reviews(project_id: UUID, start_date: str = None, end_date: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_reviews, db, project_id, start_date, end_date)


@router.post("/reviews")
def create_review(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_review, db, project_id, data)


@router.put("/reviews/{review_id}")
def update_review(project_id: UUID, review_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(planning.update_review, db, review_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")
    return result


# ── Goals ──
@router.get("/goals")
def get_goals(project_id: UUID, goal_type: str = None, status: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_goals, db, project_id, goal_type, status)


@router.post("/goals")
def create_goal(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_goal, db, project_id, data)


@router.put("/goals/{goal_id}")
def update_goal(project_id: UUID, goal_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    result = _safe(planning.update_goal, db, goal_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Goal not found")
    return result


@router.delete("/goals/{goal_id}")
def delete_goal(project_id: UUID, goal_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_goal, db, goal_id):
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"status": "deleted"}


# ── Reminders ──
@router.get("/reminders")
def get_reminders(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_reminders, db, project_id)


@router.post("/reminders")
def create_reminder(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_reminder, db, project_id, data)


@router.post("/reminders/{reminder_id}/toggle")
def toggle_reminder(project_id: UUID, reminder_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.toggle_reminder, db, reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"status": "toggled"}


@router.delete("/reminders/{reminder_id}")
def delete_reminder(project_id: UUID, reminder_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_reminder, db, reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"status": "deleted"}


# ── Calendar Events ──
@router.get("/events")
def get_calendar_events(project_id: UUID, start_date: str = None, end_date: str = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.get_calendar_events, db, project_id, start_date, end_date)


@router.post("/events")
def create_calendar_event(project_id: UUID, data: dict, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    return _safe(planning.create_calendar_event, db, project_id, data)


@router.delete("/events/{event_id}")
def delete_calendar_event(project_id: UUID, event_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    if not _safe(planning.delete_calendar_event, db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}

from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models.planning import (
    TradingPlan, ChecklistTemplate, ChecklistExecution,
    EconomicEvent, DailyReview, Goal, Reminder, CalendarEvent,
)


def _q(db, model, project_id, **filters):
    q = db.query(model).filter(model.project_id == project_id)
    for k, v in filters.items():
        if v is not None:
            q = q.filter(getattr(model, k) == v)
    return q


# ── Trading Plans ──

def get_plans(db: Session, project_id: UUID, start_date: str = None, end_date: str = None, plan_type: str = None) -> list[dict]:
    q = _q(db, TradingPlan, project_id, plan_type=plan_type)
    if start_date:
        q = q.filter(TradingPlan.plan_date >= start_date)
    if end_date:
        q = q.filter(TradingPlan.plan_date <= end_date)
    plans = q.order_by(TradingPlan.plan_date.desc()).all()
    return [_plan_dict(p) for p in plans]


def get_plan_by_date(db: Session, project_id: UUID, date: str) -> dict | None:
    p = _q(db, TradingPlan, project_id, plan_date=date).first()
    return _plan_dict(p) if p else None


def create_plan(db: Session, project_id: UUID, data: dict) -> dict:
    p = TradingPlan(project_id=project_id, **data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _plan_dict(p)


def update_plan(db: Session, plan_id: UUID, data: dict) -> dict | None:
    p = db.query(TradingPlan).filter(TradingPlan.id == plan_id).first()
    if not p:
        return None
    for k, v in data.items():
        if v is not None and hasattr(p, k):
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _plan_dict(p)


def delete_plan(db: Session, plan_id: UUID) -> bool:
    p = db.query(TradingPlan).filter(TradingPlan.id == plan_id).first()
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


def _plan_dict(p):
    return {
        "id": str(p.id), "created_at": p.created_at.isoformat() if p.created_at else "",
        "updated_at": p.updated_at.isoformat() if p.updated_at else "",
        "project_id": str(p.project_id), "plan_date": p.plan_date, "plan_type": p.plan_type,
        "market_bias": p.market_bias, "watchlist": p.watchlist, "pairs_to_avoid": p.pairs_to_avoid,
        "key_levels": p.key_levels, "liquidity_areas": p.liquidity_areas,
        "expected_scenarios": p.expected_scenarios, "invalidation_levels": p.invalidation_levels,
        "session_goals": p.session_goals, "risk_allocation": p.risk_allocation,
        "notes": p.notes, "status": p.status, "is_completed": p.is_completed,
    }


# ── Checklist Templates ──

def get_checklist_templates(db: Session, project_id: UUID, checklist_type: str = None) -> list[dict]:
    templates = _q(db, ChecklistTemplate, project_id, checklist_type=checklist_type).all()
    return [_ct_dict(t) for t in templates]


def create_checklist_template(db: Session, project_id: UUID, data: dict) -> dict:
    t = ChecklistTemplate(project_id=project_id, **data)
    db.add(t)
    db.commit()
    db.refresh(t)
    return _ct_dict(t)


def delete_checklist_template(db: Session, template_id: UUID) -> bool:
    t = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not t:
        return False
    db.delete(t)
    db.commit()
    return True


def _ct_dict(t):
    return {"id": str(t.id), "created_at": t.created_at.isoformat() if t.created_at else "",
            "name": t.name, "checklist_type": t.checklist_type, "items": t.items, "is_active": t.is_active}


# ── Checklist Executions ──

def get_checklist_executions(db: Session, project_id: UUID, execution_date: str = None) -> list[dict]:
    execs = _q(db, ChecklistExecution, project_id, execution_date=execution_date).all()
    return [_ce_dict(e) for e in execs]


def create_checklist_execution(db: Session, project_id: UUID, data: dict) -> dict:
    e = ChecklistExecution(project_id=project_id, **data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return _ce_dict(e)


def _ce_dict(e):
    return {"id": str(e.id), "created_at": e.created_at.isoformat() if e.created_at else "",
            "template_id": str(e.template_id), "execution_date": e.execution_date,
            "completed_items": e.completed_items, "notes": e.notes, "is_completed": e.is_completed}


# ── Economic Events ──

def get_economic_events(db: Session, project_id: UUID, start_date: str = None, end_date: str = None, currency: str = None, impact_level: str = None) -> list[dict]:
    q = _q(db, EconomicEvent, project_id, currency=currency, impact_level=impact_level)
    if start_date:
        q = q.filter(EconomicEvent.event_date >= start_date)
    if end_date:
        q = q.filter(EconomicEvent.event_date <= end_date)
    events = q.order_by(EconomicEvent.event_date, EconomicEvent.event_time).all()
    return [_ee_dict(e) for e in events]


def create_economic_event(db: Session, project_id: UUID, data: dict) -> dict:
    e = EconomicEvent(project_id=project_id, **data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return _ee_dict(e)


def delete_economic_event(db: Session, event_id: UUID) -> bool:
    e = db.query(EconomicEvent).filter(EconomicEvent.id == event_id).first()
    if not e:
        return False
    db.delete(e)
    db.commit()
    return True


def _ee_dict(e):
    return {"id": str(e.id), "created_at": e.created_at.isoformat() if e.created_at else "",
            "event_date": e.event_date, "event_time": e.event_time, "country": e.country,
            "currency": e.currency, "impact_level": e.impact_level, "event_name": e.event_name,
            "event_category": e.event_category, "previous_value": e.previous_value,
            "forecast_value": e.forecast_value, "actual_value": e.actual_value, "notes": e.notes}


# ── Daily Reviews ──

def get_reviews(db: Session, project_id: UUID, start_date: str = None, end_date: str = None) -> list[dict]:
    q = _q(db, DailyReview, project_id)
    if start_date:
        q = q.filter(DailyReview.review_date >= start_date)
    if end_date:
        q = q.filter(DailyReview.review_date <= end_date)
    reviews = q.order_by(DailyReview.review_date.desc()).all()
    return [_rev_dict(r) for r in reviews]


def get_review_by_date(db: Session, project_id: UUID, date: str) -> dict | None:
    r = _q(db, DailyReview, project_id, review_date=date).first()
    return _rev_dict(r) if r else None


def create_review(db: Session, project_id: UUID, data: dict) -> dict:
    r = DailyReview(project_id=project_id, **data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return _rev_dict(r)


def update_review(db: Session, review_id: UUID, data: dict) -> dict | None:
    r = db.query(DailyReview).filter(DailyReview.id == review_id).first()
    if not r:
        return None
    for k, v in data.items():
        if v is not None and hasattr(r, k):
            setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return _rev_dict(r)


def _rev_dict(r):
    return {"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
            "project_id": str(r.project_id), "review_date": r.review_date,
            "daily_summary": r.daily_summary, "best_trade": r.best_trade, "worst_trade": r.worst_trade,
            "mistakes": r.mistakes, "lessons": r.lessons, "next_improvements": r.next_improvements,
            "discipline_score": r.discipline_score, "adherence_to_plan": r.adherence_to_plan,
            "psychology_rating": r.psychology_rating, "overall_rating": r.overall_rating}


# ── Goals ──

def get_goals(db: Session, project_id: UUID, goal_type: str = None, status: str = None) -> list[dict]:
    goals = _q(db, Goal, project_id, goal_type=goal_type, status=status).order_by(Goal.created_at.desc()).all()
    return [_goal_dict(g) for g in goals]


def create_goal(db: Session, project_id: UUID, data: dict) -> dict:
    g = Goal(project_id=project_id, **data)
    db.add(g)
    db.commit()
    db.refresh(g)
    return _goal_dict(g)


def update_goal(db: Session, goal_id: UUID, data: dict) -> dict | None:
    g = db.query(Goal).filter(Goal.id == goal_id).first()
    if not g:
        return None
    for k, v in data.items():
        if v is not None and hasattr(g, k):
            setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return _goal_dict(g)


def delete_goal(db: Session, goal_id: UUID) -> bool:
    g = db.query(Goal).filter(Goal.id == goal_id).first()
    if not g:
        return False
    db.delete(g)
    db.commit()
    return True


def _goal_dict(g):
    return {"id": str(g.id), "created_at": g.created_at.isoformat() if g.created_at else "",
            "updated_at": g.updated_at.isoformat() if g.updated_at else "",
            "project_id": str(g.project_id), "title": g.title, "description": g.description,
            "goal_type": g.goal_type, "target_value": g.target_value, "current_value": g.current_value,
            "unit": g.unit, "start_date": g.start_date, "end_date": g.end_date,
            "status": g.status, "priority": g.priority, "tags": g.tags,
            "progress_history": g.progress_history}


# ── Reminders ──

def get_reminders(db: Session, project_id: UUID) -> list[dict]:
    reminders = _q(db, Reminder, project_id).all()
    return [_rem_dict(r) for r in reminders]


def create_reminder(db: Session, project_id: UUID, data: dict) -> dict:
    r = Reminder(project_id=project_id, **data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return _rem_dict(r)


def toggle_reminder(db: Session, reminder_id: UUID) -> bool:
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        return False
    r.is_active = not r.is_active
    db.commit()
    return True


def delete_reminder(db: Session, reminder_id: UUID) -> bool:
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        return False
    db.delete(r)
    db.commit()
    return True


def _rem_dict(r):
    return {"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else "",
            "project_id": str(r.project_id), "title": r.title, "reminder_type": r.reminder_type,
            "reminder_time": r.reminder_time, "reminder_days": r.reminder_days,
            "is_active": r.is_active, "notes": r.notes}


# ── Calendar Events ──

def get_calendar_events(db: Session, project_id: UUID, start_date: str = None, end_date: str = None) -> list[dict]:
    q = _q(db, CalendarEvent, project_id)
    if start_date:
        q = q.filter(CalendarEvent.event_date >= start_date)
    if end_date:
        q = q.filter(CalendarEvent.event_date <= end_date)
    events = q.order_by(CalendarEvent.event_date, CalendarEvent.event_time).all()
    return [_cal_dict(e) for e in events]


def create_calendar_event(db: Session, project_id: UUID, data: dict) -> dict:
    e = CalendarEvent(project_id=project_id, **data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return _cal_dict(e)


def delete_calendar_event(db: Session, event_id: UUID) -> bool:
    e = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not e:
        return False
    db.delete(e)
    db.commit()
    return True


def _cal_dict(e):
    return {"id": str(e.id), "created_at": e.created_at.isoformat() if e.created_at else "",
            "project_id": str(e.project_id), "title": e.title, "event_date": e.event_date,
            "event_time": e.event_time, "end_time": e.end_time, "event_type": e.event_type,
            "color": e.color, "description": e.description, "is_all_day": e.is_all_day,
            "recurrence": e.recurrence, "metadata_json": e.metadata_json}


# ── Day View ──

def get_day_view(db: Session, project_id: UUID, date: str) -> dict:
    plan = get_plan_by_date(db, project_id, date)
    events = get_calendar_events(db, project_id, start_date=date, end_date=date)
    econ_events = get_economic_events(db, project_id, start_date=date, end_date=date)
    review = get_review_by_date(db, project_id, date)
    execs = get_checklist_executions(db, project_id, execution_date=date)
    checklist_completed = any(e.get("is_completed") for e in execs)

    sessions = [
        {"name": "Asia", "start_time": "00:00", "end_time": "08:00", "status": "completed", "is_current": False},
        {"name": "London", "start_time": "08:00", "end_time": "16:00", "status": "active", "is_current": True},
        {"name": "New York", "start_time": "13:00", "end_time": "21:00", "status": "upcoming", "is_current": False},
    ]

    return {
        "date": date,
        "plan": plan,
        "events": events,
        "economic_events": econ_events,
        "checklist_completed": checklist_completed,
        "review": review,
        "sessions": sessions,
    }


# ── Week View ──

def get_week_view(db: Session, project_id: UUID, week_start: str) -> dict:
    start = datetime.strptime(week_start, "%Y-%m-%d")
    days = []
    for i in range(7):
        day = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        days.append(get_day_view(db, project_id, day))

    weekly_goals = get_goals(db, project_id, goal_type="weekly")
    return {
        "week_start": week_start,
        "week_end": (start + timedelta(days=6)).strftime("%Y-%m-%d"),
        "days": days,
        "weekly_goals": weekly_goals,
        "weekly_review": None,
    }


# ── Planning Dashboard ──

def get_planning_dashboard(db: Session, project_id: UUID) -> dict:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_start = (datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())).strftime("%Y-%m-%d")

    today_plan = get_plan_by_date(db, project_id, today)
    active_goals = get_goals(db, project_id, status="active")
    reminders = [r for r in get_reminders(db, project_id) if r["is_active"]]
    today_events = get_calendar_events(db, project_id, start_date=today, end_date=today)
    today_econ = get_economic_events(db, project_id, start_date=today, end_date=today)

    goals_by_type = {}
    for g in active_goals:
        t = g["goal_type"]
        goals_by_type.setdefault(t, []).append(g)

    completed_goals = sum(1 for g in active_goals if g.get("target_value") and g.get("current_value") and g["current_value"] >= g["target_value"])
    total_goals = len(active_goals)

    return {
        "today": today,
        "has_plan": today_plan is not None,
        "plan_status": today_plan["status"] if today_plan else None,
        "active_goals_count": len(active_goals),
        "completed_goals_count": completed_goals,
        "goal_progress": round((completed_goals / total_goals * 100) if total_goals > 0 else 0, 1),
        "goals_by_type": goals_by_type,
        "active_reminders": reminders,
        "today_events": today_econ + today_events,
        "upcoming_sessions": [
            {"name": "London Open", "time": "08:00 UTC"},
            {"name": "New York Open", "time": "13:00 UTC"},
            {"name": "London Close", "time": "16:00 UTC"},
        ],
    }

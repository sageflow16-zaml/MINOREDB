from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services import risk
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


def _safe(db: Session, project_id: UUID, func, *args, **kwargs):
    try:
        return func(db, project_id=project_id, *args, **kwargs)
    except Exception as exc:
        logger.error("Risk query failed for project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load risk data",
        )


@router.get("/dashboard")
def get_risk_dashboard(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_risk_dashboard)


@router.get("/drawdown")
def get_drawdown_timeline(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_drawdown_timeline)


@router.get("/history")
def get_risk_history(
    project_id: UUID,
    days: int = 30,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_risk_history, days=days)


@router.get("/rules")
def get_rules(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_rules)


@router.post("/rules")
def create_rule(
    project_id: UUID,
    data: dict,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    try:
        return risk.create_rule(db, project_id, data)
    except Exception as exc:
        logger.error("Create rule failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create rule")


@router.put("/rules/{rule_id}")
def update_rule(
    project_id: UUID,
    rule_id: UUID,
    data: dict,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    result = risk.update_rule(db, rule_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    return result


@router.delete("/rules/{rule_id}")
def delete_rule(
    project_id: UUID,
    rule_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not risk.delete_rule(db, rule_id):
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "deleted"}


@router.get("/alerts")
def get_alerts(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_alerts)


@router.post("/alerts")
def create_alert(
    project_id: UUID,
    data: dict,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    try:
        return risk.create_alert(db, project_id, data)
    except Exception as exc:
        logger.error("Create alert failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create alert")


@router.post("/alerts/{alert_id}/dismiss")
def dismiss_alert(
    project_id: UUID,
    alert_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if not risk.dismiss_alert(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "dismissed"}


@router.post("/validate")
def validate_trade(
    project_id: UUID,
    data: dict,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.validate_trade, data=data)


@router.post("/position-size")
def calculate_position_size(
    project_id: UUID,
    data: dict,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    try:
        return risk.calculate_position_size(data)
    except Exception as exc:
        logger.error("Position size calc failed: %s", exc)
        raise HTTPException(status_code=500, detail="Calculation failed")


@router.get("/violations")
def get_rule_violations(
    project_id: UUID,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    return _safe(db, project_id, risk.get_rule_violations)

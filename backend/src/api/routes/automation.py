from uuid import UUID
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_project_or_404
from src.models.project import Project
from src.services.automation import AutomationEngine
from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Automation error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ── Schemas ──

class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    nodes: list[dict[str, Any]] | None = None
    connections: list[dict[str, Any]] | None = None
    triggers: list[dict[str, Any]] | None = None
    actions: list[dict[str, Any]] | None = None
    conditions: list[dict[str, Any]] | None = None
    config: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    error_handling: dict[str, Any] | None = None

class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    nodes: list[dict[str, Any]] | None = None
    connections: list[dict[str, Any]] | None = None
    triggers: list[dict[str, Any]] | None = None
    actions: list[dict[str, Any]] | None = None
    conditions: list[dict[str, Any]] | None = None
    config: dict[str, Any] | None = None
    error_handling: dict[str, Any] | None = None

class RuleCreate(BaseModel):
    name: str
    description: str | None = None
    enabled: bool = True
    priority: int = 0
    category: str | None = None
    condition_expression: str | None = None
    conditions: list[dict[str, Any]] | None = None
    actions_config: list[dict[str, Any]] | None = None
    config: dict[str, Any] | None = None
    cooldown_minutes: int | None = 0
    max_triggers_per_day: int | None = None

class RuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None
    priority: int | None = None
    category: str | None = None
    condition_expression: str | None = None
    conditions: list[dict[str, Any]] | None = None
    actions_config: list[dict[str, Any]] | None = None
    config: dict[str, Any] | None = None
    cooldown_minutes: int | None = None
    max_triggers_per_day: int | None = None

class JobCreate(BaseModel):
    name: str
    workflow_id: str | None = None
    job_type: str = "one_time"
    enabled: bool = True
    cron_expression: str | None = None
    timezone: str = "UTC"
    start_at: str | None = None
    end_at: str | None = None
    action_type: str | None = None
    action_config: dict[str, Any] | None = None
    retry_on_failure: bool = True
    max_retries: int = 3
    retry_delay_minutes: int = 5
    priority: int = 0

class JobUpdate(BaseModel):
    name: str | None = None
    workflow_id: str | None = None
    job_type: str | None = None
    enabled: bool | None = None
    cron_expression: str | None = None
    timezone: str | None = None
    start_at: str | None = None
    end_at: str | None = None
    action_type: str | None = None
    action_config: dict[str, Any] | None = None
    retry_on_failure: bool | None = None
    max_retries: int | None = None
    retry_delay_minutes: int | None = None
    priority: int | None = None

class NotificationSend(BaseModel):
    title: str
    message: str | None = None
    type: str = "info"
    channel: str = "in_app"
    source: str | None = None
    source_id: str | None = None
    action_url: str | None = None
    metadata: dict[str, Any] | None = None
    recipient: str | None = None

class ChannelCreate(BaseModel):
    name: str
    channel_type: str
    config: dict[str, Any] = {}
    enabled: bool = True

class ChannelUpdate(BaseModel):
    name: str | None = None
    config: dict[str, Any] | None = None
    enabled: bool | None = None

class ConnectorCreate(BaseModel):
    name: str
    connector_type: str
    config: dict[str, Any] = {}
    enabled: bool = True

class ConnectorUpdate(BaseModel):
    name: str | None = None
    config: dict[str, Any] | None = None
    enabled: bool | None = None

class ReportCreate(BaseModel):
    name: str
    report_type: str
    description: str | None = None
    enabled: bool = True
    config: dict[str, Any] = {}
    format: str = "markdown"
    recipients: list[str] | None = None
    schedule_cron: str | None = None

class ReportUpdate(BaseModel):
    name: str | None = None
    report_type: str | None = None
    description: str | None = None
    enabled: bool | None = None
    config: dict[str, Any] | None = None
    format: str | None = None
    recipients: list[str] | None = None
    schedule_cron: str | None = None

class AIAutomationRequest(BaseModel):
    context: dict[str, Any] | None = None
    report_type: str | None = None
    focus: str | None = None

class RuleEvaluationRequest(BaseModel):
    context: dict[str, Any]

class TriggerExecutionRequest(BaseModel):
    trigger_data: dict[str, Any] | None = None


# ── Dashboard ──

@router.get("/dashboard")
def get_dashboard(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(lambda: engine.get_dashboard)


# ── Workflows ──

@router.get("/workflows")
def list_workflows(
    project_id: UUID,
    status: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_workflows, status, category, limit)

@router.post("/workflows")
def create_workflow(project_id: UUID, data: WorkflowCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_workflow, data.model_dump())

@router.get("/workflows/{workflow_id}")
def get_workflow(project_id: UUID, workflow_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_workflow, workflow_id)

@router.put("/workflows/{workflow_id}")
def update_workflow(project_id: UUID, workflow_id: UUID, data: WorkflowUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_workflow, workflow_id, data.model_dump(exclude_unset=True))

@router.delete("/workflows/{workflow_id}")
def delete_workflow(project_id: UUID, workflow_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_workflow, workflow_id)
    return {"status": "deleted"}

@router.post("/workflows/{workflow_id}/duplicate")
def duplicate_workflow(project_id: UUID, workflow_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.duplicate_workflow, workflow_id)

@router.post("/workflows/{workflow_id}/execute")
def execute_workflow(project_id: UUID, workflow_id: UUID, data: TriggerExecutionRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.execute_workflow, workflow_id, data.trigger_data if data else None)

@router.post("/workflows/{workflow_id}/toggle")
def toggle_workflow(project_id: UUID, workflow_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.toggle_workflow_status, workflow_id)


# ── Workflow Executions ──

@router.get("/executions")
def list_executions(
    project_id: UUID,
    workflow_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_executions, workflow_id, status, limit)

@router.get("/executions/{execution_id}")
def get_execution(project_id: UUID, execution_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_execution, execution_id)


# ── Rules ──

@router.get("/rules")
def list_rules(project_id: UUID, enabled_only: bool = Query(False), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_rules, enabled_only)

@router.post("/rules")
def create_rule(project_id: UUID, data: RuleCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_rule, data.model_dump())

@router.get("/rules/{rule_id}")
def get_rule(project_id: UUID, rule_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_rule, rule_id)

@router.put("/rules/{rule_id}")
def update_rule(project_id: UUID, rule_id: UUID, data: RuleUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_rule, rule_id, data.model_dump(exclude_unset=True))

@router.delete("/rules/{rule_id}")
def delete_rule(project_id: UUID, rule_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_rule, rule_id)
    return {"status": "deleted"}

@router.post("/rules/evaluate")
def evaluate_rules(project_id: UUID, data: RuleEvaluationRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.evaluate_rules, data.context)


# ── Scheduled Jobs ──

@router.get("/jobs")
def list_jobs(project_id: UUID, enabled_only: bool = Query(False), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_jobs, enabled_only)

@router.post("/jobs")
def create_job(project_id: UUID, data: JobCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_job, data.model_dump())

@router.put("/jobs/{job_id}")
def update_job(project_id: UUID, job_id: UUID, data: JobUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_job, job_id, data.model_dump(exclude_unset=True))

@router.delete("/jobs/{job_id}")
def delete_job(project_id: UUID, job_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_job, job_id)
    return {"status": "deleted"}

@router.post("/jobs/{job_id}/execute")
def execute_job(project_id: UUID, job_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.execute_job, job_id)

@router.get("/jobs/{job_id}/executions")
def get_job_executions(project_id: UUID, job_id: UUID, limit: int = Query(50), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_job_executions, job_id, limit)


# ── Notifications ──

@router.get("/notifications")
def list_notifications(
    project_id: UUID,
    unread_only: bool = Query(False),
    limit: int = Query(100),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_notifications, unread_only, limit)

@router.post("/notifications")
def send_notification(project_id: UUID, data: NotificationSend, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.send_notification, data.model_dump())

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(project_id: UUID, notification_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.mark_notification_read, notification_id)

@router.post("/notifications/read-all")
def mark_all_read(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.mark_all_notifications_read)

@router.get("/notifications/unread-count")
def get_unread_count(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return {"count": _safe(engine.get_unread_count)}


# ── Notification Channels ──

@router.get("/channels")
def list_channels(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_channels)

@router.post("/channels")
def create_channel(project_id: UUID, data: ChannelCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_channel, data.model_dump())

@router.put("/channels/{channel_id}")
def update_channel(project_id: UUID, channel_id: UUID, data: ChannelUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_channel, channel_id, data.model_dump(exclude_unset=True))

@router.delete("/channels/{channel_id}")
def delete_channel(project_id: UUID, channel_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_channel, channel_id)
    return {"status": "deleted"}

@router.post("/channels/{channel_id}/verify")
def verify_channel(project_id: UUID, channel_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.verify_channel, channel_id)


# ── AI Automation ──

@router.post("/ai/summarize-trades")
def ai_summarize_trades(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_summarize_trades, data.context if data else None)

@router.post("/ai/review-journal")
def ai_review_journal(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_review_journal, data.context if data else None)

@router.post("/ai/analyze-psychology")
def ai_analyze_psychology(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_analyze_psychology, data.context if data else None)

@router.post("/ai/generate-report")
def ai_generate_report(project_id: UUID, data: AIAutomationRequest, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_generate_report, data.report_type or "performance", data.context)

@router.post("/ai/identify-weaknesses")
def ai_identify_weaknesses(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_identify_weaknesses, data.context if data else None)

@router.post("/ai/suggest-research")
def ai_suggest_research(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_suggest_research, data.context if data else None)

@router.post("/ai/create-daily-plan")
def ai_create_daily_plan(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_create_daily_plan, data.context if data else None)

@router.post("/ai/generate-coaching")
def ai_generate_coaching(project_id: UUID, data: AIAutomationRequest | None = None, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.ai_generate_coaching, data.context if data else None)


# ── Automated Reports ──

@router.get("/reports")
def list_report_configs(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_report_configs)

@router.post("/reports")
def create_report_config(project_id: UUID, data: ReportCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_report_config, data.model_dump())

@router.put("/reports/{report_id}")
def update_report_config(project_id: UUID, report_id: UUID, data: ReportUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_report_config, report_id, data.model_dump(exclude_unset=True))

@router.delete("/reports/{report_id}")
def delete_report_config(project_id: UUID, report_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_report_config, report_id)
    return {"status": "deleted"}

@router.post("/reports/{report_id}/generate")
def generate_report(project_id: UUID, report_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_report, report_id)

@router.post("/reports/generate/daily")
def generate_daily_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_daily_report)

@router.post("/reports/generate/weekly")
def generate_weekly_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_weekly_report)

@router.post("/reports/generate/monthly")
def generate_monthly_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_monthly_report)

@router.post("/reports/generate/performance")
def generate_performance_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_performance_report)

@router.post("/reports/generate/risk")
def generate_risk_report(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.generate_risk_report)


# ── Connectors ──

@router.get("/connectors")
def list_connectors(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_connectors)

@router.post("/connectors")
def create_connector(project_id: UUID, data: ConnectorCreate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_connector, data.model_dump())

@router.put("/connectors/{connector_id}")
def update_connector(project_id: UUID, connector_id: UUID, data: ConnectorUpdate, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.update_connector, connector_id, data.model_dump(exclude_unset=True))

@router.delete("/connectors/{connector_id}")
def delete_connector(project_id: UUID, connector_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    _safe(engine.delete_connector, connector_id)
    return {"status": "deleted"}

@router.post("/connectors/{connector_id}/test")
def test_connector(project_id: UUID, connector_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.test_connector, connector_id)

@router.post("/connectors/{connector_id}/sync")
def sync_connector(project_id: UUID, connector_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.sync_connector, connector_id)


# ── Audit Logs ──

@router.get("/audit")
def list_audit_logs(
    project_id: UUID,
    event_type: str | None = Query(None),
    source: str | None = Query(None),
    limit: int = Query(100),
    project: Project = Depends(get_project_or_404), db: Session = Depends(get_db),
):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_audit_logs, event_type, source, limit)

@router.get("/audit/summary")
def get_audit_summary(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_audit_summary)


# ── Templates ──

@router.get("/templates")
def list_templates(project_id: UUID, category: str | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.list_templates, category)

@router.post("/templates/{template_id}/create")
def create_from_template(project_id: UUID, template_id: str, name: str | None = Query(None), project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.create_from_template, template_id, name)

@router.get("/templates/categories")
def get_template_categories(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_template_categories)


# ── Metadata ──

@router.get("/trigger-types")
def get_trigger_types(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_trigger_types)

@router.get("/action-types")
def get_action_types(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_action_types)

@router.get("/condition-types")
def get_condition_types(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_condition_types)

@router.get("/connector-types")
def get_connector_types(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_connector_types)

@router.get("/report-types")
def get_report_types(project_id: UUID, project: Project = Depends(get_project_or_404), db: Session = Depends(get_db)):
    engine = AutomationEngine(db, project_id)
    return _safe(engine.get_report_types)


# ── Webhook Trigger ──

class WebhookTriggerRequest(BaseModel):
    trigger_data: dict[str, Any] = {}
    secret: str | None = None

@router.post("/webhook/{workflow_id}")
async def webhook_trigger(
    project_id: UUID,
    workflow_id: UUID,
    request: Request,
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    """External webhook endpoint to trigger a workflow execution."""
    engine = AutomationEngine(db, project_id)
    body = await request.json()
    trigger_data = {
        "trigger_type": "webhook",
        "triggered_by": "webhook",
        "payload": body,
        "headers": dict(request.headers),
        "received_at": datetime.utcnow().isoformat(),
    }
    return _safe(engine.execute_workflow, workflow_id, trigger_data)

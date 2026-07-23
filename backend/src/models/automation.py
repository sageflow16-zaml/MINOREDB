from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base
import enum


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotificationType(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    SUCCESS = "success"
    ERROR = "error"


class NotificationChannelType(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    DISCORD = "discord"
    TELEGRAM = "telegram"
    SLACK = "slack"
    WEBHOOK = "webhook"


class JobType(str, enum.Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"


class ConnectorStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class AuditEventType(str, enum.Enum):
    WORKFLOW_RUN = "workflow_run"
    WORKFLOW_CREATED = "workflow_created"
    WORKFLOW_UPDATED = "workflow_updated"
    WORKFLOW_DELETED = "workflow_deleted"
    RULE_TRIGGERED = "rule_triggered"
    NOTIFICATION_SENT = "notification_sent"
    JOB_EXECUTED = "job_executed"
    CONNECTOR_SYNCED = "connector_synced"
    REPORT_GENERATED = "report_generated"
    AI_AUTOMATION = "ai_automation"


class Workflow(Base):
    __tablename__ = "automation_workflow"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WorkflowStatus] = mapped_column(SAEnum(WorkflowStatus, values_callable=lambda x: [e.value for e in x]), default=WorkflowStatus.DRAFT, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    category: Mapped[str | None] = mapped_column(String, nullable=True)

    nodes: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    connections: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    triggers: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    actions: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    conditions: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)
    error_handling: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    template_category: Mapped[str | None] = mapped_column(String, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    last_executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WorkflowExecution(Base):
    __tablename__ = "automation_workflow_execution"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("automation_workflow.id", ondelete="CASCADE"), nullable=False)

    status: Mapped[ExecutionStatus] = mapped_column(SAEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING, nullable=False)
    triggered_by: Mapped[str] = mapped_column(String, nullable=False, default="manual")
    trigger_type: Mapped[str | None] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    nodes_executed: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    results: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    input_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    output_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


class Rule(Base):
    __tablename__ = "automation_rule"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[str | None] = mapped_column(String, nullable=True)

    condition_expression: Mapped[str | None] = mapped_column(Text, nullable=True)
    conditions: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    actions_config: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    trigger_count: Mapped[int] = mapped_column(Integer, default=0)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cooldown_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    max_triggers_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ScheduledJob(Base):
    __tablename__ = "automation_scheduled_job"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("automation_workflow.id", ondelete="SET NULL"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    job_type: Mapped[JobType] = mapped_column(SAEnum(JobType, values_callable=lambda x: [e.value for e in x]), default=JobType.ONE_TIME, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    cron_expression: Mapped[str | None] = mapped_column(String, nullable=True)
    timezone: Mapped[str] = mapped_column(String, default="UTC")
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    action_type: Mapped[str | None] = mapped_column(String, nullable=True)
    action_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    success_runs: Mapped[int] = mapped_column(Integer, default=0)
    failed_runs: Mapped[int] = mapped_column(Integer, default=0)

    retry_on_failure: Mapped[bool] = mapped_column(Boolean, default=True)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    retry_delay_minutes: Mapped[int] = mapped_column(Integer, default=5)
    priority: Mapped[int] = mapped_column(Integer, default=0)


class JobExecution(Base):
    __tablename__ = "automation_job_execution"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("automation_scheduled_job.id", ondelete="CASCADE"), nullable=False)

    status: Mapped[ExecutionStatus] = mapped_column(SAEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


class Notification(Base):
    __tablename__ = "automation_notification"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    notification_type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType, values_callable=lambda x: [e.value for e in x]), default=NotificationType.INFO, nullable=False)
    channel: Mapped[NotificationChannelType] = mapped_column(SAEnum(NotificationChannelType, values_callable=lambda x: [e.value for e in x]), default=NotificationChannelType.IN_APP, nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(SAEnum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), default=ExecutionStatus.PENDING, nullable=False)

    source: Mapped[str | None] = mapped_column(String, nullable=True)
    source_id: Mapped[str | None] = mapped_column(String, nullable=True)
    action_url: Mapped[str | None] = mapped_column(String, nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)

    read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    recipient: Mapped[str | None] = mapped_column(String, nullable=True)


class NotificationChannel(Base):
    __tablename__ = "automation_notification_channel"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    channel_type: Mapped[NotificationChannelType] = mapped_column(SAEnum(NotificationChannelType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "automation_audit_log"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    event_type: Mapped[AuditEventType] = mapped_column(SAEnum(AuditEventType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    source_id: Mapped[str | None] = mapped_column(String, nullable=True)
    actor: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    severity: Mapped[str] = mapped_column(String, default="info")
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)


class Connector(Base):
    __tablename__ = "automation_connector"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    connector_type: Mapped[str] = mapped_column(String, nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[ConnectorStatus] = mapped_column(SAEnum(ConnectorStatus, values_callable=lambda x: [e.value for e in x]), default=ConnectorStatus.PENDING, nullable=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True, default=dict)


class AutomationReport(Base):
    __tablename__ = "automation_report"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    report_type: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    format: Mapped[str] = mapped_column(String, default="markdown")
    recipients: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    schedule_cron: Mapped[str | None] = mapped_column(String, nullable=True)
    last_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_generated_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


class WorkflowTemplate(Base):
    __tablename__ = "automation_workflow_template"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    icon: Mapped[str | None] = mapped_column(String, nullable=True)

    nodes_config: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    connections_config: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    triggers_config: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    actions_config: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)
    conditions_config: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)

    is_built_in: Mapped[bool] = mapped_column(Boolean, default=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)

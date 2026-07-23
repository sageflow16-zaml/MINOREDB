"""add_automation_tables

Revision ID: c9d0e1f2a3b4
Revises: f7a8b9c0d1e2
Create Date: 2026-07-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c9d0e1f2a3b4'
down_revision: str | None = 'f7a8b9c0d1e2'
branch_labels: str | None = None
depends_on: str | None = None


# Define shared enum instances so _on_table_create dedup works via memo
_wf_status = sa.Enum("draft", "active", "paused", "archived", name="workflowstatus")
_exec_status = sa.Enum("pending", "running", "completed", "failed", "cancelled", name="executionstatus")
_notif_type = sa.Enum("info", "warning", "success", "error", name="notificationtype")
_notif_channel = sa.Enum("in_app", "email", "discord", "telegram", "slack", "webhook", name="notificationchanneltype")
_job_type = sa.Enum("one_time", "recurring", name="jobtype")
_conn_status = sa.Enum("connected", "disconnected", "error", "pending", name="connectorstatus")
_audit_type = sa.Enum("workflow_run", "workflow_created", "workflow_updated", "workflow_deleted", "rule_triggered", "notification_sent", "job_executed", "connector_synced", "report_generated", "ai_automation", name="auditeventtype")

def upgrade() -> None:
    # automation_workflow
    op.create_table(
        "automation_workflow",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", _wf_status, nullable=False, server_default=sa.text("'draft'")),
        sa.Column("version", sa.Integer, nullable=False, server_default=sa.text("1")),
        sa.Column("tags", postgresql.JSONB, nullable=True),
        sa.Column("category", sa.String, nullable=True),
        sa.Column("nodes", postgresql.JSONB, nullable=True),
        sa.Column("connections", postgresql.JSONB, nullable=True),
        sa.Column("triggers", postgresql.JSONB, nullable=True),
        sa.Column("actions", postgresql.JSONB, nullable=True),
        sa.Column("conditions", postgresql.JSONB, nullable=True),
        sa.Column("config", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("error_handling", postgresql.JSONB, nullable=True),
        sa.Column("is_template", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("template_category", sa.String, nullable=True),
        sa.Column("usage_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("last_executed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # automation_workflow_execution
    op.create_table(
        "automation_workflow_execution",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("automation_workflow.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", _exec_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("triggered_by", sa.String, nullable=False, server_default=sa.text("'manual'")),
        sa.Column("trigger_type", sa.String, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=True),
        sa.Column("nodes_executed", postgresql.JSONB, nullable=True),
        sa.Column("results", postgresql.JSONB, nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("error_details", postgresql.JSONB, nullable=True),
        sa.Column("input_data", postgresql.JSONB, nullable=True),
        sa.Column("output_data", postgresql.JSONB, nullable=True),
    )

    # automation_rule
    op.create_table(
        "automation_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("priority", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("category", sa.String, nullable=True),
        sa.Column("condition_expression", sa.Text, nullable=True),
        sa.Column("conditions", postgresql.JSONB, nullable=True),
        sa.Column("actions_config", postgresql.JSONB, nullable=True),
        sa.Column("config", postgresql.JSONB, nullable=True),
        sa.Column("trigger_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cooldown_minutes", sa.Integer, nullable=True, server_default=sa.text("0")),
        sa.Column("max_triggers_per_day", sa.Integer, nullable=True),
    )

    # automation_scheduled_job
    op.create_table(
        "automation_scheduled_job",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("automation_workflow.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("job_type", _job_type, nullable=False, server_default=sa.text("'one_time'")),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("cron_expression", sa.String, nullable=True),
        sa.Column("timezone", sa.String, nullable=False, server_default=sa.text("'UTC'")),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("action_type", sa.String, nullable=True),
        sa.Column("action_config", postgresql.JSONB, nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_runs", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("success_runs", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("failed_runs", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("retry_on_failure", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("max_retries", sa.Integer, nullable=False, server_default=sa.text("3")),
        sa.Column("retry_delay_minutes", sa.Integer, nullable=False, server_default=sa.text("5")),
        sa.Column("priority", sa.Integer, nullable=False, server_default=sa.text("0")),
    )

    # automation_job_execution
    op.create_table(
        "automation_job_execution",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("automation_scheduled_job.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", _exec_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("result", postgresql.JSONB, nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("error_details", postgresql.JSONB, nullable=True),
    )

    # automation_notification
    op.create_table(
        "automation_notification",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("notification_type", _notif_type, nullable=False, server_default=sa.text("'info'")),
        sa.Column("channel", _notif_channel, nullable=False, server_default=sa.text("'in_app'")),
        sa.Column("status", _exec_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("source", sa.String, nullable=True),
        sa.Column("source_id", sa.String, nullable=True),
        sa.Column("action_url", sa.String, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("read", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("recipient", sa.String, nullable=True),
    )

    # automation_notification_channel
    op.create_table(
        "automation_notification_channel",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("channel_type", _notif_channel, nullable=False),
        sa.Column("config", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("verified", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text, nullable=True),
    )

    # automation_audit_log
    op.create_table(
        "automation_audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", _audit_type, nullable=False),
        sa.Column("source", sa.String, nullable=True),
        sa.Column("source_id", sa.String, nullable=True),
        sa.Column("actor", sa.String, nullable=True),
        sa.Column("action", sa.String, nullable=True),
        sa.Column("summary", sa.String, nullable=True),
        sa.Column("details", postgresql.JSONB, nullable=True),
        sa.Column("severity", sa.String, nullable=False, server_default=sa.text("'info'")),
        sa.Column("ip_address", sa.String, nullable=True),
    )

    # automation_connector
    op.create_table(
        "automation_connector",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("connector_type", sa.String, nullable=False),
        sa.Column("config", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("status", _conn_status, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # automation_report
    op.create_table(
        "automation_report",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("report_type", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("config", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("format", sa.String, nullable=False, server_default=sa.text("'markdown'")),
        sa.Column("recipients", postgresql.JSONB, nullable=True),
        sa.Column("schedule_cron", sa.String, nullable=True),
        sa.Column("last_generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_generated_result", postgresql.JSONB, nullable=True),
    )

    # automation_workflow_template
    op.create_table(
        "automation_workflow_template",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String, nullable=True),
        sa.Column("tags", postgresql.JSONB, nullable=True),
        sa.Column("icon", sa.String, nullable=True),
        sa.Column("nodes_config", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("connections_config", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("triggers_config", postgresql.JSONB, nullable=True),
        sa.Column("actions_config", postgresql.JSONB, nullable=True),
        sa.Column("conditions_config", postgresql.JSONB, nullable=True),
        sa.Column("is_built_in", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("usage_count", sa.Integer, nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_table("automation_workflow_template")
    op.drop_table("automation_report")
    op.drop_table("automation_connector")
    op.drop_table("automation_audit_log")
    op.drop_table("automation_notification_channel")
    op.drop_table("automation_notification")
    op.drop_table("automation_job_execution")
    op.drop_table("automation_scheduled_job")
    op.drop_table("automation_rule")
    op.drop_table("automation_workflow_execution")
    op.drop_table("automation_workflow")

    _wf_status.drop(op.get_bind(), checkfirst=True)
    _exec_status.drop(op.get_bind(), checkfirst=True)
    _notif_type.drop(op.get_bind(), checkfirst=True)
    _notif_channel.drop(op.get_bind(), checkfirst=True)
    _job_type.drop(op.get_bind(), checkfirst=True)
    _conn_status.drop(op.get_bind(), checkfirst=True)
    _audit_type.drop(op.get_bind(), checkfirst=True)

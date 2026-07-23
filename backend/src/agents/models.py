from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, JSON, ForeignKey, Integer, Text, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import enum

from src.db.session import Base as AgentBase


class AgentTaskStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class AgentExecutionStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class WorkflowStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    archived = "archived"


# ── Agent Task Queue ──


class AgentTask(AgentBase):
    __tablename__ = "agent_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    agent_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    task_type: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    input_data: Mapped[dict | None] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String, default="pending", index=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)

    # Scheduling
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # Chaining — if this task is part of a workflow
    workflow_id: Mapped[str | None] = mapped_column(String, default=None, index=True)
    workflow_step: Mapped[int | None] = mapped_column(Integer, default=None)
    depends_on: Mapped[str | None] = mapped_column(String, default=None)

    # Result
    output_data: Mapped[dict | None] = mapped_column(JSON, default=None)
    error_message: Mapped[str | None] = mapped_column(Text, default=None)
    execution_id: Mapped[str | None] = mapped_column(String, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


# ── Agent Execution Log ──


class AgentExecution(AgentBase):
    __tablename__ = "agent_executions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str | None] = mapped_column(String, default=None, index=True)

    agent_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    task_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="running")

    # Agent output
    reasoning: Mapped[str | None] = mapped_column(Text, default=None)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)
    discoveries: Mapped[dict | None] = mapped_column(JSON, default=list)
    evidence: Mapped[dict | None] = mapped_column(JSON, default=list)
    output_summary: Mapped[str | None] = mapped_column(Text, default=None)
    output_data: Mapped[dict | None] = mapped_column(JSON, default=None)

    # Metrics
    duration_ms: Mapped[float | None] = mapped_column(Float, default=None)
    sources_consulted: Mapped[dict | None] = mapped_column(JSON, default=list)
    memories_created: Mapped[int] = mapped_column(Integer, default=0)

    # Error
    error_message: Mapped[str | None] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)


# ── Agent Workflow ──


class AgentWorkflow(AgentBase):
    __tablename__ = "agent_workflows"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(String, default="draft")

    # Chain definition: list of {agent_name, task_type, input_template, depends_on_step}
    steps: Mapped[dict | None] = mapped_column(JSON, default=list)

    # Schedule / trigger
    trigger_type: Mapped[str | None] = mapped_column(String, default=None)
    trigger_config: Mapped[dict | None] = mapped_column(JSON, default=dict)

    # Stats
    total_runs: Mapped[int] = mapped_column(Integer, default=0)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_run_status: Mapped[str | None] = mapped_column(String, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

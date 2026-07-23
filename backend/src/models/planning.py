from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, DateTime, Boolean, Integer, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class TradingPlan(Base):
    __tablename__ = "trading_plan"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    plan_date: Mapped[str] = mapped_column(String, nullable=False)
    plan_type: Mapped[str] = mapped_column(String, nullable=False, default="daily")
    market_bias: Mapped[str | None] = mapped_column(String, nullable=True)
    watchlist: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    pairs_to_avoid: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    key_levels: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    liquidity_areas: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    expected_scenarios: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    invalidation_levels: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    session_goals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    risk_allocation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class ChecklistTemplate(Base):
    __tablename__ = "checklist_template"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    name: Mapped[str] = mapped_column(String, nullable=False)
    checklist_type: Mapped[str] = mapped_column(String, nullable=False, default="pre_market")
    items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ChecklistExecution(Base):
    __tablename__ = "checklist_execution"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")
    template_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("checklist_template.id", ondelete="CASCADE"), nullable=False)

    execution_date: Mapped[str] = mapped_column(String, nullable=False)
    completed_items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class EconomicEvent(Base):
    __tablename__ = "economic_event"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    event_date: Mapped[str] = mapped_column(String, nullable=False)
    event_time: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str] = mapped_column(String, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False)
    impact_level: Mapped[str] = mapped_column(String, nullable=False, default="low")
    event_name: Mapped[str] = mapped_column(String, nullable=False)
    event_category: Mapped[str | None] = mapped_column(String, nullable=True)
    previous_value: Mapped[str | None] = mapped_column(String, nullable=True)
    forecast_value: Mapped[str | None] = mapped_column(String, nullable=True)
    actual_value: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class DailyReview(Base):
    __tablename__ = "daily_review"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    review_date: Mapped[str] = mapped_column(String, nullable=False)
    daily_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    best_trade: Mapped[str | None] = mapped_column(Text, nullable=True)
    worst_trade: Mapped[str | None] = mapped_column(Text, nullable=True)
    mistakes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    lessons: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    next_improvements: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    discipline_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    adherence_to_plan: Mapped[int | None] = mapped_column(Integer, nullable=True)
    psychology_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Goal(Base):
    __tablename__ = "goal"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal_type: Mapped[str] = mapped_column(String, nullable=False, default="daily")
    target_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[str | None] = mapped_column(String, nullable=True)
    end_date: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    progress_history: Mapped[list | None] = mapped_column(JSONB, nullable=True)


class Reminder(Base):
    __tablename__ = "reminder"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    title: Mapped[str] = mapped_column(String, nullable=False)
    reminder_type: Mapped[str] = mapped_column(String, nullable=False, default="custom")
    reminder_time: Mapped[str] = mapped_column(String, nullable=False)
    reminder_days: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class CalendarEvent(Base):
    __tablename__ = "calendar_event"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True)
    project: Mapped["Project"] = relationship("Project")

    title: Mapped[str] = mapped_column(String, nullable=False)
    event_date: Mapped[str] = mapped_column(String, nullable=False)
    event_time: Mapped[str | None] = mapped_column(String, nullable=True)
    end_time: Mapped[str | None] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False, default="note")
    color: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_all_day: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recurrence: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

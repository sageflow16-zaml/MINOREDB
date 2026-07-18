from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class TradeDebrief(Base):
    __tablename__ = "trade_debrief"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    project: Mapped["Project"] = relationship("Project")
    trade_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("trade.id", ondelete="CASCADE"), nullable=False, unique=True)
    trade: Mapped["Trade"] = relationship("Trade")

    entry_review: Mapped[str | None] = mapped_column(Text, nullable=True)
    execution_review: Mapped[str | None] = mapped_column(Text, nullable=True)
    exit_review: Mapped[str | None] = mapped_column(Text, nullable=True)
    psychology_review: Mapped[str | None] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    mistakes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    improvements: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    overall_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)


class PersonalPattern(Base):
    __tablename__ = "personal_pattern"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    project: Mapped["Project"] = relationship("Project")

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    signature: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    trade_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    win_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    loss_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_rr: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_personal_pattern_project_name"),
    )


class PersonalRule(Base):
    __tablename__ = "personal_rule"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    project: Mapped["Project"] = relationship("Project")

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    evidence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    supporting_stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    versions: Mapped[list["PersonalRuleVersion"]] = relationship("PersonalRuleVersion", back_populates="rule", cascade="all, delete-orphan")


class PersonalRuleVersion(Base):
    __tablename__ = "personal_rule_version"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    rule_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("personal_rule.id", ondelete="CASCADE"), nullable=False)
    rule: Mapped["PersonalRule"] = relationship("PersonalRule", back_populates="versions")

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    change_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class TraderProfile(Base):
    __tablename__ = "trader_profile"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False, unique=True)
    project: Mapped["Project"] = relationship("Project")

    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    trading_habits: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    discipline_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rule_adherence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    performance_trends: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    total_trades_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_debriefs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_patterns: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    approved_rules: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    improvement_suggestions: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class TraderProfileSnapshot(Base):
    __tablename__ = "trader_profile_snapshot"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False)
    project: Mapped["Project"] = relationship("Project")

    snapshot_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    discipline_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rule_adherence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    total_trades_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_debriefs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_patterns: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    approved_rules: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

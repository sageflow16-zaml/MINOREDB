from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Integer, Float, DateTime, Text, JSON, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base


class LearningEvent(Base):
    __tablename__ = "learning_event"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="SUCCESS")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class KnowledgeSnapshot(Base):
    __tablename__ = "knowledge_snapshot"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    total_trades: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_patterns: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_claims: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_concepts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_sources: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_similarities: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_interpretations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    win_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_rr: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    expectancy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    knowledge_growth: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

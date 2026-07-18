from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, Text, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class ResearchSession(Base):
    __tablename__ = "research_session"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    project: Mapped["Project"] = relationship("Project")

    question: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="planning")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)

    tasks: Mapped[list["ResearchTask"]] = relationship(
        "ResearchTask", back_populates="session", cascade="all, delete-orphan"
    )
    report: Mapped["ResearchReport | None"] = relationship(
        "ResearchReport", back_populates="session", cascade="all, delete-orphan", uselist=False
    )


class ResearchTask(Base):
    __tablename__ = "research_task"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("research_session.id", ondelete="CASCADE"),
        nullable=False,
    )
    session: Mapped["ResearchSession"] = relationship(
        "ResearchSession", back_populates="tasks"
    )

    step: Mapped[int] = mapped_column(Integer, nullable=False)
    tool: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ResearchReport(Base):
    __tablename__ = "research_report"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("research_session.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    session: Mapped["ResearchSession"] = relationship(
        "ResearchSession", back_populates="report"
    )

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    findings: Mapped[list | None] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    limitations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    sources: Mapped[list | None] = mapped_column(JSON, nullable=True)

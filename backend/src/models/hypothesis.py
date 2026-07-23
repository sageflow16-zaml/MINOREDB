from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base

class Hypothesis(Base):
    __tablename__ = "hypothesis"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=text("CURRENT_TIMESTAMP"), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=text("CURRENT_TIMESTAMP"), 
        nullable=False
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("project.id", ondelete="CASCADE"), 
        nullable=False,
        index=True,
    )
    project: Mapped["Project"] = relationship("Project")
    research_question_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("research_question.id", ondelete="CASCADE"), 
        nullable=False
    )
    hypothesis_statement: Mapped[str | None] = mapped_column(String, nullable=True)
    variable_specification: Mapped[str | None] = mapped_column(String, nullable=True)
    measurement_specification: Mapped[str | None] = mapped_column(String, nullable=True)
    substantive_departure: Mapped[str | None] = mapped_column(String, nullable=True)

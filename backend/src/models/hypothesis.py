from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base

class Hypothesis(Base):
    __tablename__ = "hypothesis"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
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
    research_question_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("research_question.id"), 
        nullable=True
    )
    hypothesis_statement: Mapped[str | None] = mapped_column(String, nullable=True)
    variable_specification: Mapped[str | None] = mapped_column(String, nullable=True)
    measurement_specification: Mapped[str | None] = mapped_column(String, nullable=True)
    substantive_departure: Mapped[str | None] = mapped_column(String, nullable=True)

from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base

class ResearchQuestion(Base):
    __tablename__ = "research_question"

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
    question_statement: Mapped[str | None] = mapped_column(String, nullable=True)
    inquiry_origin: Mapped[str | None] = mapped_column(String, nullable=True)
    domain_relevance: Mapped[str | None] = mapped_column(String, nullable=True)
    substantive_grounding: Mapped[str | None] = mapped_column(String, nullable=True)

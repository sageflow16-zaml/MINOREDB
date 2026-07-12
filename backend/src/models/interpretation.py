from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base

class Interpretation(Base):
    __tablename__ = "interpretation"

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
    concept_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("concept.id"), 
        nullable=True
    )
    interpretation_statement: Mapped[str | None] = mapped_column(String, nullable=True)
    reasoning_chain: Mapped[str | None] = mapped_column(String, nullable=True)
    interpretation_foundation: Mapped[str | None] = mapped_column(String, nullable=True)

from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.db.session import Base

class ReconsiderationTrigger(Base):
    __tablename__ = "reconsideration_trigger"

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
    interpretation_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("interpretation.id"), 
        nullable=True
    )
    trigger_detail: Mapped[str | None] = mapped_column(String, nullable=True)
    trigger_classification: Mapped[str | None] = mapped_column(String, nullable=True)

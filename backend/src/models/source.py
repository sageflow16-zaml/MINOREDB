from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base

class Source(Base):
    __tablename__ = "source"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("project.id", ondelete="CASCADE"), 
        nullable=False
    )
    project = relationship("Project")
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
    admissibility_status: Mapped[str | None] = mapped_column(String, nullable=True)
    origin_type: Mapped[str | None] = mapped_column(String, nullable=True)
    attribution: Mapped[str | None] = mapped_column(String, nullable=True)
    temporal_reference: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    provenance_confidence: Mapped[str | None] = mapped_column(String, nullable=True)
    source_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    provenance_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)

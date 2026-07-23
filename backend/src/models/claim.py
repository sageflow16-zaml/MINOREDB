from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base

class Claim(Base):
    __tablename__ = "claim"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("project.id", ondelete="CASCADE"), 
        nullable=False,
        index=True,
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
    source_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("source.id", ondelete="SET NULL"), 
        nullable=True,
        index=True,
    )
    verbatim_text: Mapped[str | None] = mapped_column(String, nullable=True)
    source_location: Mapped[str | None] = mapped_column(String, nullable=True)
    semantic_classification: Mapped[str | None] = mapped_column(String, nullable=True)
    paraphrase_representation: Mapped[str | None] = mapped_column(String, nullable=True)
    contextual_boundary: Mapped[str | None] = mapped_column(String, nullable=True)

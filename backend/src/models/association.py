from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base

class Association(Base):
    __tablename__ = "association"

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
    claim_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("claim.id", ondelete="CASCADE"), 
        nullable=False
    )
    concept_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("concept.id", ondelete="CASCADE"), 
        nullable=False
    )
    association_state: Mapped[str | None] = mapped_column(String, nullable=True)
    ambiguity_metric: Mapped[str | None] = mapped_column(String, nullable=True)

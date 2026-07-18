from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base


class KnowledgeNode(Base):
    __tablename__ = "knowledge_node"

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

    type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True, default=1.0)
    occurrences: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("project_id", "type", "name", name="uq_node_project_type_name"),
    )

    edges_from: Mapped[list["KnowledgeEdge"]] = relationship(
        "KnowledgeEdge", back_populates="source_node", foreign_keys="KnowledgeEdge.source_node_id"
    )
    edges_to: Mapped[list["KnowledgeEdge"]] = relationship(
        "KnowledgeEdge", back_populates="target_node", foreign_keys="KnowledgeEdge.target_node_id"
    )


class KnowledgeEdge(Base):
    __tablename__ = "knowledge_edge"

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

    source_node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("knowledge_node.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("knowledge_node.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_node: Mapped["KnowledgeNode"] = relationship(
        "KnowledgeNode", back_populates="edges_from", foreign_keys=[source_node_id]
    )
    target_node: Mapped["KnowledgeNode"] = relationship(
        "KnowledgeNode", back_populates="edges_to", foreign_keys=[target_node_id]
    )

    relationship: Mapped[str] = mapped_column(String, nullable=False, default="CORRELATED")
    strength: Mapped[float | None] = mapped_column(Float, nullable=True, default=1.0)
    occurrences: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)

    __table_args__ = (
        UniqueConstraint(
            "source_node_id", "target_node_id", "relationship",
            name="uq_edge_source_target_rel"
        ),
    )


class KnowledgeGraphSnapshot(Base):
    __tablename__ = "knowledge_graph_snapshot"

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

    total_nodes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_edges: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    most_connected_type: Mapped[str | None] = mapped_column(String, nullable=True)
    highest_confidence_edge_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True
    )
    summary: Mapped[str | None] = mapped_column(String, nullable=True)

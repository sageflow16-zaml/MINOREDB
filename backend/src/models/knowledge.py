from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.session import Base

class KnowledgeCategory(Base):
    __tablename__ = "knowledge_category"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    concepts: Mapped[list["KnowledgeConcept"]] = relationship("KnowledgeConcept", back_populates="category", cascade="all, delete-orphan")

class KnowledgeTag(Base):
    __tablename__ = "knowledge_tag"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    concepts: Mapped[list["KnowledgeConcept"]] = relationship("KnowledgeConcept", secondary="knowledge_concept_tag", back_populates="tags")

class KnowledgeConcept(Base):
    __tablename__ = "knowledge_concept"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    category_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_category.id", ondelete="CASCADE"), nullable=False)
    category: Mapped["KnowledgeCategory"] = relationship("KnowledgeCategory", back_populates="concepts")

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    market_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmations: Mapped[str | None] = mapped_column(Text, nullable=True)
    invalidations: Mapped[str | None] = mapped_column(Text, nullable=True)
    common_mistakes: Mapped[str | None] = mapped_column(Text, nullable=True)
    best_practices: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    reviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("category_id", "slug", name="uq_concept_category_slug"),
    )

    tags: Mapped[list["KnowledgeTag"]] = relationship("KnowledgeTag", secondary="knowledge_concept_tag", back_populates="concepts")
    relationships_outgoing: Mapped[list["KnowledgeRelationship"]] = relationship("KnowledgeRelationship", foreign_keys="KnowledgeRelationship.source_concept_id", back_populates="source_concept", cascade="all, delete-orphan")
    relationships_incoming: Mapped[list["KnowledgeRelationship"]] = relationship("KnowledgeRelationship", foreign_keys="KnowledgeRelationship.target_concept_id", back_populates="target_concept", cascade="all, delete-orphan")
    examples: Mapped[list["KnowledgeExample"]] = relationship("KnowledgeExample", back_populates="concept", cascade="all, delete-orphan")
    references: Mapped[list["KnowledgeReference"]] = relationship("KnowledgeReference", back_populates="concept", cascade="all, delete-orphan")
    revisions: Mapped[list["KnowledgeRevision"]] = relationship("KnowledgeRevision", back_populates="concept", cascade="all, delete-orphan")

class KnowledgeConceptTag(Base):
    __tablename__ = "knowledge_concept_tag"

    concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_tag.id", ondelete="CASCADE"), primary_key=True)

class KnowledgeRelationship(Base):
    __tablename__ = "knowledge_relationship"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    source_concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False)
    target_concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False)
    source_concept: Mapped["KnowledgeConcept"] = relationship("KnowledgeConcept", foreign_keys=[source_concept_id], back_populates="relationships_outgoing")
    target_concept: Mapped["KnowledgeConcept"] = relationship("KnowledgeConcept", foreign_keys=[target_concept_id], back_populates="relationships_incoming")

    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    strength: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("source_concept_id", "target_concept_id", "relationship_type", name="uq_relationship"),
    )

class KnowledgeExample(Base):
    __tablename__ = "knowledge_example"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False)
    concept: Mapped["KnowledgeConcept"] = relationship("KnowledgeConcept", back_populates="examples")

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    market: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pair: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timeframe: Mapped[str | None] = mapped_column(String(20), nullable=True)
    image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

class KnowledgeReference(Base):
    __tablename__ = "knowledge_reference"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False)
    concept: Mapped["KnowledgeConcept"] = relationship("KnowledgeConcept", back_populates="references")

    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    publication: Mapped[str | None] = mapped_column(String(500), nullable=True)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    page_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    section: Mapped[str | None] = mapped_column(String(255), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

class KnowledgeSource(Base):
    __tablename__ = "knowledge_source"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    chunks: Mapped[list["KnowledgeChunk"]] = relationship("KnowledgeChunk", back_populates="source", cascade="all, delete-orphan")

class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunk"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    source_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_source.id", ondelete="CASCADE"), nullable=False)
    source: Mapped["KnowledgeSource"] = relationship("KnowledgeSource", back_populates="chunks")

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("source_id", "chunk_index", name="uq_source_chunk"),
    )

class KnowledgeRevision(Base):
    __tablename__ = "knowledge_revision"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    concept_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False)
    concept: Mapped["KnowledgeConcept"] = relationship("KnowledgeConcept", back_populates="revisions")

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    changes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("concept_id", "version", name="uq_concept_revision"),
    )

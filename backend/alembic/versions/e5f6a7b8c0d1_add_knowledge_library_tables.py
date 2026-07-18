"""add_knowledge_library_tables

Revision ID: e5f6a7b8c0d1
Revises: d4e5f6a7b8c0
Create Date: 2026-07-18 04:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'e5f6a7b8c0d1'
down_revision: str | None = 'd4e5f6a7b8c0'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "knowledge_category",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(100), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_knowledge_category_slug", "knowledge_category", ["slug"], unique=True)

    op.create_table(
        "knowledge_tag",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("color", sa.String(50), nullable=True),
    )
    op.create_index("ix_knowledge_tag_name", "knowledge_tag", ["name"], unique=True)

    op.create_table(
        "knowledge_concept",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_category.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("definition", sa.Text, nullable=True),
        sa.Column("purpose", sa.Text, nullable=True),
        sa.Column("market_context", sa.Text, nullable=True),
        sa.Column("rules", postgresql.JSONB, nullable=True),
        sa.Column("conditions", sa.Text, nullable=True),
        sa.Column("confirmations", sa.Text, nullable=True),
        sa.Column("invalidations", sa.Text, nullable=True),
        sa.Column("common_mistakes", sa.Text, nullable=True),
        sa.Column("best_practices", sa.Text, nullable=True),
        sa.Column("difficulty", sa.String(50), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("reviewed", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_knowledge_concept_slug", "knowledge_concept", ["slug"])
    op.create_unique_constraint("uq_concept_category_slug", "knowledge_concept", ["category_id", "slug"])

    op.create_table(
        "knowledge_concept_tag",
        sa.Column("concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_tag.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "knowledge_relationship",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("source_concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relationship_type", sa.String(100), nullable=False),
        sa.Column("strength", sa.Float, nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
    )
    op.create_unique_constraint("uq_relationship", "knowledge_relationship", ["source_concept_id", "target_concept_id", "relationship_type"])

    op.create_table(
        "knowledge_example",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("market", sa.String(100), nullable=True),
        sa.Column("pair", sa.String(20), nullable=True),
        sa.Column("timeframe", sa.String(20), nullable=True),
        sa.Column("image", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )

    op.create_table(
        "knowledge_reference",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_type", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("publication", sa.String(500), nullable=True),
        sa.Column("url", sa.String(1000), nullable=True),
        sa.Column("page_number", sa.String(50), nullable=True),
        sa.Column("section", sa.String(255), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
    )

    op.create_table(
        "knowledge_source",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("path", sa.String(1000), nullable=True),
        sa.Column("checksum", sa.String(64), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("processed", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "knowledge_chunk",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_source.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", sa.Integer, nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer, nullable=True),
        sa.Column("processed", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )
    op.create_unique_constraint("uq_source_chunk", "knowledge_chunk", ["source_id", "chunk_index"])

    op.create_table(
        "knowledge_revision",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("concept_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_concept.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("changes", postgresql.JSONB, nullable=True),
        sa.Column("approved_by", sa.String(255), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_unique_constraint("uq_concept_revision", "knowledge_revision", ["concept_id", "version"])


def downgrade() -> None:
    op.drop_table("knowledge_revision")
    op.drop_table("knowledge_chunk")
    op.drop_table("knowledge_source")
    op.drop_table("knowledge_reference")
    op.drop_table("knowledge_example")
    op.drop_table("knowledge_relationship")
    op.drop_table("knowledge_concept_tag")
    op.drop_table("knowledge_concept")
    op.drop_table("knowledge_tag")
    op.drop_table("knowledge_category")

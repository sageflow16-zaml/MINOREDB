"""add_trade_import_export_tables

Revision ID: a2b3c4d5e6f7
Revises: 6accec45a876
Create Date: 2026-07-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a2b3c4d5e6f7"
down_revision = "6accec45a876"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trade", sa.Column("commission", sa.Float(), nullable=True))
    op.add_column("trade", sa.Column("swap", sa.Float(), nullable=True))
    op.add_column("trade", sa.Column("broker_name", sa.String(), nullable=True))
    op.add_column("trade", sa.Column("timeframe", sa.String(), nullable=True))
    op.add_column("trade", sa.Column("open_time", sa.DateTime(timezone=True), nullable=True))
    op.add_column("trade", sa.Column("close_time", sa.DateTime(timezone=True), nullable=True))
    op.add_column("trade", sa.Column("tags", postgresql.JSONB(), nullable=True))
    op.create_table(
        "trade_import",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("format", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("total_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("imported_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("skipped_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("preview_data", postgresql.JSONB(), nullable=True),
        sa.Column("error_rows", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table("trade_import")
    op.drop_column("trade", "tags")
    op.drop_column("trade", "close_time")
    op.drop_column("trade", "open_time")
    op.drop_column("trade", "timeframe")
    op.drop_column("trade", "broker_name")
    op.drop_column("trade", "swap")
    op.drop_column("trade", "commission")

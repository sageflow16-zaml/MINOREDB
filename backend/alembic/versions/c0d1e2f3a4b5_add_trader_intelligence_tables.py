"""add_trader_intelligence_tables

Revision ID: c0d1e2f3a4b5
Revises: e5f6a7b8c0d1
Create Date: 2026-07-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c0d1e2f3a4b5'
down_revision: str | None = 'e5f6a7b8c0d1'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "trade_debrief",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trade_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trade.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("entry_review", sa.Text, nullable=True),
        sa.Column("execution_review", sa.Text, nullable=True),
        sa.Column("exit_review", sa.Text, nullable=True),
        sa.Column("psychology_review", sa.Text, nullable=True),
        sa.Column("lessons_learned", postgresql.JSONB, nullable=True),
        sa.Column("strengths", postgresql.JSONB, nullable=True),
        sa.Column("weaknesses", postgresql.JSONB, nullable=True),
        sa.Column("mistakes", postgresql.JSONB, nullable=True),
        sa.Column("improvements", postgresql.JSONB, nullable=True),
        sa.Column("overall_rating", sa.Integer, nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
    )

    op.create_table(
        "personal_pattern",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("signature", postgresql.JSONB, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("trade_ids", postgresql.JSONB, nullable=True),
        sa.Column("occurrence_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("win_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("loss_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("total_pnl", sa.Float, nullable=True),
        sa.Column("avg_rr", sa.Float, nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )
    op.create_unique_constraint("uq_personal_pattern_project_name", "personal_pattern", ["project_id", "name"])

    op.create_table(
        "personal_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("version", sa.Integer, nullable=False, server_default=sa.text("1")),
        sa.Column("evidence", postgresql.JSONB, nullable=True),
        sa.Column("supporting_stats", postgresql.JSONB, nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
    )

    op.create_table(
        "personal_rule_version",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("personal_rule.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("evidence", postgresql.JSONB, nullable=True),
        sa.Column("change_notes", sa.Text, nullable=True),
    )

    op.create_table(
        "trader_profile",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("strengths", postgresql.JSONB, nullable=True),
        sa.Column("weaknesses", postgresql.JSONB, nullable=True),
        sa.Column("trading_habits", postgresql.JSONB, nullable=True),
        sa.Column("discipline_score", sa.Float, nullable=True),
        sa.Column("rule_adherence", postgresql.JSONB, nullable=True),
        sa.Column("performance_trends", postgresql.JSONB, nullable=True),
        sa.Column("total_trades_analyzed", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("total_debriefs", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("active_patterns", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("approved_rules", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("improvement_suggestions", postgresql.JSONB, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )

    op.create_table(
        "trader_profile_snapshot",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("snapshot_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("strengths", postgresql.JSONB, nullable=True),
        sa.Column("weaknesses", postgresql.JSONB, nullable=True),
        sa.Column("discipline_score", sa.Float, nullable=True),
        sa.Column("rule_adherence", postgresql.JSONB, nullable=True),
        sa.Column("total_trades_analyzed", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("total_debriefs", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("active_patterns", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("approved_rules", sa.Integer, nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_table("trader_profile_snapshot")
    op.drop_table("trader_profile")
    op.drop_table("personal_rule_version")
    op.drop_table("personal_rule")
    op.drop_table("personal_pattern")
    op.drop_table("trade_debrief")

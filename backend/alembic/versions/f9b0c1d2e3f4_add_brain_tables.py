"""add_brain_tables

Revision ID: f9b0c1d2e3f4
Revises: f8a9b0c1d2e3
Create Date: 2026-07-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f9b0c1d2e3f4"
down_revision = "f8a9b0c1d2e3"
branch_labels = None
depends_on = None


def upgrade():
    # Trader DNA
    op.create_table(
        "trader_dna",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("trading_style", sa.String(), nullable=True),
        sa.Column("preferred_session", sa.String(), nullable=True),
        sa.Column("preferred_markets", sa.JSON(), nullable=True),
        sa.Column("preferred_rr", sa.Float(), nullable=True),
        sa.Column("preferred_timeframes", sa.JSON(), nullable=True),
        sa.Column("best_models", sa.JSON(), nullable=True),
        sa.Column("worst_models", sa.JSON(), nullable=True),
        sa.Column("best_timeframe", sa.String(), nullable=True),
        sa.Column("worst_timeframe", sa.String(), nullable=True),
        sa.Column("best_holding_time", sa.Integer(), nullable=True),
        sa.Column("best_execution_window", sa.String(), nullable=True),
        sa.Column("risk_behavior", sa.String(), nullable=True),
        sa.Column("discipline_score", sa.Float(), nullable=True),
        sa.Column("psychology_score", sa.Float(), nullable=True),
        sa.Column("patience_index", sa.Float(), nullable=True),
        sa.Column("learning_progress", sa.JSON(), nullable=True),
        sa.Column("mistake_frequency", sa.Float(), nullable=True),
        sa.Column("mistake_trend", sa.JSON(), nullable=True),
        sa.Column("improvement_timeline", sa.JSON(), nullable=True),
        sa.Column("dna_summary", sa.JSON(), nullable=True),
        sa.Column("raw_insights", sa.JSON(), nullable=True),
        sa.Column("total_trades_analyzed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_updated", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trader_dna_project", "trader_dna", ["project_id"])

    # Brain Memories
    op.create_table(
        "brain_memories",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("memory_type", sa.String(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("content", sa.JSON(), nullable=True),
        sa.Column("text_content", sa.Text(), nullable=True),
        sa.Column("importance", sa.String(), nullable=True, server_default="medium"),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("source_entity_type", sa.String(), nullable=True),
        sa.Column("source_entity_id", sa.String(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_memories_project", "brain_memories", ["project_id"])
    op.create_index("ix_brain_memories_type", "brain_memories", ["memory_type"])

    # Brain Decisions
    op.create_table(
        "brain_decisions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("context_snapshot", sa.JSON(), nullable=True),
        sa.Column("reasoning_steps", sa.JSON(), nullable=True),
        sa.Column("evidence_sources", sa.JSON(), nullable=True),
        sa.Column("scores", sa.JSON(), nullable=True),
        sa.Column("verdict", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("actual_outcome", sa.String(), nullable=True),
        sa.Column("user_feedback", sa.Text(), nullable=True),
        sa.Column("learning_result", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_decisions_project", "brain_decisions", ["project_id"])

    # Learning Observations
    op.create_table(
        "brain_observations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("observation_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("related_entities", sa.JSON(), nullable=True),
        sa.Column("is_actionable", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("is_dismissed", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_observations_project", "brain_observations", ["project_id"])
    op.create_index("ix_brain_observations_type", "brain_observations", ["observation_type"])

    # Personal Insights
    op.create_table(
        "brain_insights",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("impact", sa.String(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("supporting_data", sa.JSON(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("is_dismissed", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_insights_project", "brain_insights", ["project_id"])
    op.create_index("ix_brain_insights_category", "brain_insights", ["category"])

    # Brain Coaching
    op.create_table(
        "brain_coaching",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("coaching_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=True),
        sa.Column("weaknesses", sa.JSON(), nullable=True),
        sa.Column("observations", sa.JSON(), nullable=True),
        sa.Column("action_items", sa.JSON(), nullable=True),
        sa.Column("metrics_snapshot", sa.JSON(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brain_coaching_project", "brain_coaching", ["project_id"])
    op.create_index("ix_brain_coaching_type", "brain_coaching", ["coaching_type"])


def downgrade():
    op.drop_table("brain_coaching")
    op.drop_table("brain_insights")
    op.drop_table("brain_observations")
    op.drop_table("brain_decisions")
    op.drop_table("brain_memories")
    op.drop_table("trader_dna")

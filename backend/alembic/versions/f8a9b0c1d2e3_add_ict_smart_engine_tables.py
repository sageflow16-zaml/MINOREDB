"""add_ict_smart_engine_tables

Revision ID: f8a9b0c1d2e3
Revises: f7a8b9c0d1e2
Create Date: 2026-07-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f8a9b0c1d2e3"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade():
    # ICT Structure
    op.create_table(
        "ict_structure",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("structure_type", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("strength_score", sa.Float(), server_default="0"),
        sa.Column("confidence_score", sa.Float(), server_default="0"),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "symbol", "timeframe", "bar_index", "structure_type",
                            name="uq_ict_structure"),
    )
    op.create_index(op.f("ix_ict_structure_project_id"), "ict_structure", ["project_id"])
    op.create_index(op.f("ix_ict_structure_symbol"), "ict_structure", ["symbol"])
    op.create_index(op.f("ix_ict_structure_structure_type"), "ict_structure", ["structure_type"])
    op.create_index(op.f("ix_ict_structure_timestamp"), "ict_structure", ["timestamp"])

    # ICT Event
    op.create_table(
        "ict_event",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("direction", sa.String(), nullable=True),
        sa.Column("strength_score", sa.Float(), server_default="0"),
        sa.Column("confidence_score", sa.Float(), server_default="0"),
        sa.Column("structure_id_from", sa.String(), nullable=True),
        sa.Column("structure_id_to", sa.String(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_event_project_id"), "ict_event", ["project_id"])
    op.create_index(op.f("ix_ict_event_symbol"), "ict_event", ["symbol"])
    op.create_index(op.f("ix_ict_event_event_type"), "ict_event", ["event_type"])
    op.create_index(op.f("ix_ict_event_timestamp"), "ict_event", ["timestamp"])

    # FVG
    op.create_table(
        "ict_fvg",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("fvg_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="untouched"),
        sa.Column("top_price", sa.Float(), nullable=False),
        sa.Column("bottom_price", sa.Float(), nullable=False),
        sa.Column("gap_size", sa.Float(), nullable=False),
        sa.Column("midpoint", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("filled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("filled_price", sa.Float(), nullable=True),
        sa.Column("freshness_score", sa.Float(), server_default="0"),
        sa.Column("reaction_strength", sa.Float(), server_default="0"),
        sa.Column("probability_score", sa.Float(), server_default="0"),
        sa.Column("parent_fvg_id", sa.String(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_fvg_project_id"), "ict_fvg", ["project_id"])
    op.create_index(op.f("ix_ict_fvg_symbol"), "ict_fvg", ["symbol"])
    op.create_index(op.f("ix_ict_fvg_fvg_type"), "ict_fvg", ["fvg_type"])
    op.create_index(op.f("ix_ict_fvg_timestamp"), "ict_fvg", ["timestamp"])

    # Order Block
    op.create_table(
        "ict_order_block",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("block_type", sa.String(), nullable=False),
        sa.Column("top_price", sa.Float(), nullable=False),
        sa.Column("bottom_price", sa.Float(), nullable=False),
        sa.Column("midpoint", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("is_mitigated", sa.Boolean(), server_default="false"),
        sa.Column("touch_count", sa.Integer(), server_default="0"),
        sa.Column("reaction_strength", sa.Float(), server_default="0"),
        sa.Column("validity_score", sa.Float(), server_default="0"),
        sa.Column("quality_score", sa.Float(), server_default="0"),
        sa.Column("parent_block_id", sa.String(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_order_block_project_id"), "ict_order_block", ["project_id"])
    op.create_index(op.f("ix_ict_order_block_symbol"), "ict_order_block", ["symbol"])
    op.create_index(op.f("ix_ict_order_block_block_type"), "ict_order_block", ["block_type"])
    op.create_index(op.f("ix_ict_order_block_timestamp"), "ict_order_block", ["timestamp"])

    # Liquidity Zone
    op.create_table(
        "ict_liquidity_zone",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("liquidity_type", sa.String(), nullable=False),
        sa.Column("top_price", sa.Float(), nullable=False),
        sa.Column("bottom_price", sa.Float(), nullable=False),
        sa.Column("peak_price", sa.Float(), server_default="0"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("is_swept", sa.Boolean(), server_default="false"),
        sa.Column("sweep_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sweep_price", sa.Float(), nullable=True),
        sa.Column("strength_score", sa.Float(), server_default="0"),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_liquidity_zone_project_id"), "ict_liquidity_zone", ["project_id"])
    op.create_index(op.f("ix_ict_liquidity_zone_symbol"), "ict_liquidity_zone", ["symbol"])
    op.create_index(op.f("ix_ict_liquidity_zone_liquidity_type"), "ict_liquidity_zone", ["liquidity_type"])
    op.create_index(op.f("ix_ict_liquidity_zone_timestamp"), "ict_liquidity_zone", ["timestamp"])

    # ICT Setup
    op.create_table(
        "ict_setup",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("timeframe", sa.String(), nullable=False),
        sa.Column("model_type", sa.String(), nullable=False),
        sa.Column("direction", sa.String(), nullable=False),
        sa.Column("entry_price_min", sa.Float(), nullable=True),
        sa.Column("entry_price_max", sa.Float(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("risk_reward_ratio", sa.Float(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bar_index", sa.Integer(), nullable=False),
        sa.Column("structure_score", sa.Float(), server_default="0"),
        sa.Column("liquidity_score", sa.Float(), server_default="0"),
        sa.Column("fvg_score", sa.Float(), server_default="0"),
        sa.Column("order_block_score", sa.Float(), server_default="0"),
        sa.Column("risk_score", sa.Float(), server_default="0"),
        sa.Column("session_score", sa.Float(), server_default="0"),
        sa.Column("confluence_score", sa.Float(), server_default="0"),
        sa.Column("overall_quality", sa.Float(), server_default="0"),
        sa.Column("execution_status", sa.String(), nullable=False, server_default="wait"),
        sa.Column("execution_reasoning", sa.String(), nullable=True),
        sa.Column("fvg_ids", postgresql.JSONB(), nullable=True),
        sa.Column("order_block_ids", postgresql.JSONB(), nullable=True),
        sa.Column("liquidity_zone_ids", postgresql.JSONB(), nullable=True),
        sa.Column("structure_ids", postgresql.JSONB(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_setup_project_id"), "ict_setup", ["project_id"])
    op.create_index(op.f("ix_ict_setup_symbol"), "ict_setup", ["symbol"])
    op.create_index(op.f("ix_ict_setup_model_type"), "ict_setup", ["model_type"])
    op.create_index(op.f("ix_ict_setup_timestamp"), "ict_setup", ["timestamp"])

    # ICT Session
    op.create_table(
        "ict_session",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("date", sa.String(), nullable=False),
        sa.Column("session_type", sa.String(), nullable=False),
        sa.Column("open_price", sa.Float(), nullable=False),
        sa.Column("high_price", sa.Float(), nullable=False),
        sa.Column("low_price", sa.Float(), nullable=False),
        sa.Column("close_price", sa.Float(), nullable=False),
        sa.Column("range", sa.Float(), nullable=False),
        sa.Column("direction", sa.String(), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "symbol", "date", "session_type",
                            name="uq_ict_session"),
    )
    op.create_index(op.f("ix_ict_session_project_id"), "ict_session", ["project_id"])
    op.create_index(op.f("ix_ict_session_symbol"), "ict_session", ["symbol"])

    # ICT Market Bias
    op.create_table(
        "ict_market_bias",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("snapshot_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("weekly_bias", sa.String(), nullable=True),
        sa.Column("daily_bias", sa.String(), nullable=True),
        sa.Column("h4_bias", sa.String(), nullable=True),
        sa.Column("h1_bias", sa.String(), nullable=True),
        sa.Column("m15_bias", sa.String(), nullable=True),
        sa.Column("htf_bias", sa.String(), nullable=True),
        sa.Column("ltf_confirmation", sa.String(), nullable=True),
        sa.Column("confluence_score", sa.Float(), server_default="0"),
        sa.Column("current_price", sa.Float(), nullable=True),
        sa.Column("premium_discount_status", sa.String(), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_market_bias_project_id"), "ict_market_bias", ["project_id"])
    op.create_index(op.f("ix_ict_market_bias_symbol"), "ict_market_bias", ["symbol"])
    op.create_index(op.f("ix_ict_market_bias_snapshot_time"), "ict_market_bias", ["snapshot_time"])

    # ICT Execution Signal
    op.create_table(
        "ict_execution_signal",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("setup_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="wait"),
        sa.Column("direction", sa.String(), nullable=False),
        sa.Column("entry_price", sa.Float(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("risk_amount", sa.Float(), nullable=True),
        sa.Column("reasoning", sa.String(), nullable=True),
        sa.Column("structure_context", postgresql.JSONB(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("executed", sa.Boolean(), server_default="false"),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["setup_id"], ["ict_setup.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ict_execution_signal_project_id"), "ict_execution_signal", ["project_id"])
    op.create_index(op.f("ix_ict_execution_signal_symbol"), "ict_execution_signal", ["symbol"])
    op.create_index(op.f("ix_ict_execution_signal_timestamp"), "ict_execution_signal", ["timestamp"])


def downgrade():
    op.drop_table("ict_execution_signal")
    op.drop_table("ict_market_bias")
    op.drop_table("ict_session")
    op.drop_table("ict_setup")
    op.drop_table("ict_liquidity_zone")
    op.drop_table("ict_order_block")
    op.drop_table("ict_fvg")
    op.drop_table("ict_event")
    op.drop_table("ict_structure")

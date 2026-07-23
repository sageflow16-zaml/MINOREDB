"""add_broker_integration_tables

Revision ID: d2e3f4a5b6c7
Revises: d0e1f2a3b4c5
Create Date: 2026-07-20 14:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'd2e3f4a5b6c7'
down_revision: str | None = 'd0e1f2a3b4c5'
branch_labels: str | None = None
depends_on: str | None = 'a0b1c2d3e4f5'


def upgrade() -> None:
    # broker_connection_new
    op.create_table(
        "broker_connection_new",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("credentials_encrypted", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("config", postgresql.JSONB, nullable=True),
        sa.Column("permissions", postgresql.JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_error", sa.Text(), nullable=True),
    )
    op.create_index("ix_broker_connection_project", "broker_connection_new", ["project_id"])

    # broker_account
    op.create_table(
        "broker_account",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("account_type", sa.String(), nullable=True),
        sa.Column("currency", sa.String(), nullable=False, server_default=sa.text("'USD'")),
        sa.Column("leverage", sa.Integer(), nullable=True),
        sa.Column("balance", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("equity", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("open_pl", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("used_margin", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("free_margin", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("margin_level", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_account_connection", "broker_account", ["connection_id"])
    op.create_index("ix_broker_account_external", "broker_account", ["connection_id", "external_id"])

    # sync_history_new
    op.create_table(
        "sync_history_new",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_account.id", ondelete="SET NULL"), nullable=True),
        sa.Column("sync_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("items_synced", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_failed", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_created", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_updated", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_duplicates", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("details", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_sync_history_connection", "sync_history_new", ["connection_id"])

    # broker_log
    op.create_table(
        "broker_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("level", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("details", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_log_connection", "broker_log", ["connection_id"])

    # broker_health
    op.create_table(
        "broker_health",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_reachable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("latency_ms", sa.Float(), nullable=True),
        sa.Column("last_check_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uptime_percentage", sa.Float(), nullable=True),
        sa.Column("details", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_health_connection", "broker_health", ["connection_id"])

    # imported_trade
    op.create_table(
        "imported_trade",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("strategy_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("strategy.id", ondelete="SET NULL"), nullable=True),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("trade_type", sa.String(), nullable=False),
        sa.Column("volume", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("open_price", sa.Float(), nullable=True),
        sa.Column("close_price", sa.Float(), nullable=True),
        sa.Column("open_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("close_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("profit", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("commission", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("swap", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("magic_number", sa.Integer(), nullable=True),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("is_duplicate", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("import_hash", sa.String(), nullable=False, unique=True),
        sa.Column("raw_data", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_imported_trade_connection", "imported_trade", ["connection_id"])
    op.create_index("ix_imported_trade_account", "imported_trade", ["account_id"])
    op.create_index("ix_imported_trade_external", "imported_trade", ["connection_id", "external_id"])

    # broker_position
    op.create_table(
        "broker_position",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("position_type", sa.String(), nullable=False),
        sa.Column("volume", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("open_price", sa.Float(), nullable=False),
        sa.Column("current_price", sa.Float(), nullable=True),
        sa.Column("open_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("profit", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("commission", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("swap", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("stop_loss", sa.Float(), nullable=True),
        sa.Column("take_profit", sa.Float(), nullable=True),
        sa.Column("magic_number", sa.Integer(), nullable=True),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column("raw_data", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_position_connection", "broker_position", ["connection_id"])
    op.create_index("ix_broker_position_account", "broker_position", ["account_id"])

    # broker_order
    op.create_table(
        "broker_order",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("symbol", sa.String(), nullable=False),
        sa.Column("order_type", sa.String(), nullable=False),
        sa.Column("order_status", sa.String(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("volume", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("stop_price", sa.Float(), nullable=True),
        sa.Column("created_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expiration", sa.DateTime(timezone=True), nullable=True),
        sa.Column("comment", sa.String(), nullable=True),
        sa.Column("raw_data", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_order_connection", "broker_order", ["connection_id"])
    op.create_index("ix_broker_order_account", "broker_order", ["account_id"])

    # broker_analytics
    op.create_table(
        "broker_analytics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_connection_new.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_trades", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_profit", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_commission", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_swap", sa.Float(), nullable=False, server_default=sa.text("0")),
        sa.Column("avg_spread", sa.Float(), nullable=True),
        sa.Column("avg_execution_ms", sa.Float(), nullable=True),
        sa.Column("avg_slippage", sa.Float(), nullable=True),
        sa.Column("rejected_orders", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("latency_avg_ms", sa.Float(), nullable=True),
        sa.Column("uptime_pct", sa.Float(), nullable=True),
        sa.Column("error_rate", sa.Float(), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )
    op.create_index("ix_broker_analytics_connection", "broker_analytics", ["connection_id"])


def downgrade() -> None:
    op.drop_table("broker_analytics")
    op.drop_table("broker_order")
    op.drop_table("broker_position")
    op.drop_table("imported_trade")
    op.drop_table("broker_health")
    op.drop_table("broker_log")
    op.drop_table("sync_history_new")
    op.drop_table("broker_account")
    op.drop_table("broker_connection_new")

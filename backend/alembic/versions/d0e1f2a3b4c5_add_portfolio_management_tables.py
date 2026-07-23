"""add_portfolio_management_tables

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-07-20 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'd0e1f2a3b4c5'
down_revision: str | None = 'c9d0e1f2a3b4'
branch_labels: str | None = None
depends_on: str | None = None


_account_type = sa.Enum("personal", "prop_firm", "evaluation", "live", "demo", name="accounttype")
_account_status = sa.Enum("active", "archived", "closed", "suspended", "pending", name="accountstatus")
_broker_platform = sa.Enum("mt4", "mt5", "ctrader", "tradingview", "ninjatrader", "tradestation", "ibkr", "custom", name="brokerplatform")
_execution_model = sa.Enum("market", "limit", "stop", "dma", "stp", "ecn", name="executionmodel")
_commission_model = sa.Enum("per_lot", "per_trade", "per_share", "per_contract", "none", name="commissionmodel")
_allocation_type = sa.Enum("fixed", "percentage", "target", "risk_budget", name="allocationtype")
_transfer_type = sa.Enum("internal", "external", "funding", "withdrawal", name="transfertype")
_goal_status = sa.Enum("active", "completed", "at_risk", "failed", "paused", name="goalstatus")
_goal_metric = sa.Enum("portfolio_growth", "account_growth", "monthly_profit", "annual_return", "max_drawdown", "risk_consistency", "win_rate", "profit_factor", "expectancy", name="goalmetric")
_rule_severity = sa.Enum("critical", "high", "medium", "low", name="ruleseverity")

def upgrade() -> None:
    # broker_profile
    op.create_table(
        "broker_profile",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("broker_name", sa.String, nullable=False),
        sa.Column("server", sa.String, nullable=True),
        sa.Column("platform", _broker_platform, nullable=False),
        sa.Column("account_number", sa.String, nullable=True),
        sa.Column("base_currency", sa.String, nullable=False, server_default=sa.text("'USD'")),
        sa.Column("spread_profile", sa.String, nullable=True),
        sa.Column("commission_model", _commission_model, nullable=False, server_default=sa.text("'none'")),
        sa.Column("commission_rate", sa.Float, nullable=True),
        sa.Column("swap_long", sa.Float, nullable=True),
        sa.Column("swap_short", sa.Float, nullable=True),
        sa.Column("execution_model", _execution_model, nullable=False, server_default=sa.text("'market'")),
        sa.Column("trading_costs", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )

    # account
    op.create_table(
        "account",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("broker_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("broker_profile.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("account_number", sa.String, nullable=True),
        sa.Column("account_type", _account_type, nullable=False, server_default=sa.text("'personal'")),
        sa.Column("status", _account_status, nullable=False, server_default=sa.text("'active'")),
        sa.Column("currency", sa.String, nullable=False, server_default=sa.text("'USD'")),
        sa.Column("leverage", sa.Integer, nullable=True),
        sa.Column("initial_balance", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("current_balance", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("current_equity", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("open_pnl", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("used_margin", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("free_margin", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("margin_level", sa.Float, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("tags", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # account_group
    op.create_table(
        "account_group",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("color", sa.String, nullable=True),
        sa.Column("account_ids", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
    )

    # funding_history
    op.create_table(
        "funding_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String, nullable=False),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("currency", sa.String, nullable=False, server_default=sa.text("'USD'")),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("reference", sa.String, nullable=True),
        sa.Column("balance_after", sa.Float, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # balance_history
    op.create_table(
        "balance_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("balance", sa.Float, nullable=False),
        sa.Column("source", sa.String, nullable=True),
    )

    # equity_history
    op.create_table(
        "equity_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("equity", sa.Float, nullable=False),
        sa.Column("balance", sa.Float, nullable=False),
        sa.Column("source", sa.String, nullable=True),
    )

    # portfolio_allocation
    op.create_table(
        "portfolio_allocation",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("allocation_type", _allocation_type, nullable=False),
        sa.Column("entity_type", sa.String, nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_name", sa.String, nullable=True),
        sa.Column("target_percentage", sa.Float, nullable=True),
        sa.Column("current_percentage", sa.Float, nullable=True),
        sa.Column("target_amount", sa.Float, nullable=True),
        sa.Column("current_amount", sa.Float, nullable=True),
        sa.Column("risk_budget", sa.Float, nullable=True),
        sa.Column("max_allocation", sa.Float, nullable=True),
        sa.Column("min_allocation", sa.Float, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("rebalance_frequency", sa.String, nullable=True),
        sa.Column("last_rebalanced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )

    # transfer
    op.create_table(
        "transfer",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("transfer_type", _transfer_type, nullable=False),
        sa.Column("from_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="SET NULL"), nullable=True),
        sa.Column("to_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("currency", sa.String, nullable=False, server_default=sa.text("'USD'")),
        sa.Column("converted_amount", sa.Float, nullable=True),
        sa.Column("exchange_rate", sa.Float, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("reference", sa.String, nullable=True),
        sa.Column("status", sa.String, nullable=False, server_default=sa.text("'completed'")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # portfolio_goal
    op.create_table(
        "portfolio_goal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("metric", _goal_metric, nullable=False),
        sa.Column("target_value", sa.Float, nullable=False),
        sa.Column("current_value", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("start_value", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("status", _goal_status, nullable=False, server_default=sa.text("'active'")),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("progress", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("category", sa.String, nullable=True),
        sa.Column("tags", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("is_portfolio_goal", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )

    # account_health
    op.create_table(
        "account_health",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("margin_usage", sa.Float, nullable=True),
        sa.Column("drawdown_current", sa.Float, nullable=True),
        sa.Column("drawdown_limit", sa.Float, nullable=True),
        sa.Column("daily_loss_current", sa.Float, nullable=True),
        sa.Column("daily_loss_limit", sa.Float, nullable=True),
        sa.Column("trailing_drawdown", sa.Float, nullable=True),
        sa.Column("trailing_drawdown_limit", sa.Float, nullable=True),
        sa.Column("max_loss", sa.Float, nullable=True),
        sa.Column("max_loss_limit", sa.Float, nullable=True),
        sa.Column("max_daily_loss", sa.Float, nullable=True),
        sa.Column("max_daily_loss_limit", sa.Float, nullable=True),
        sa.Column("violation_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("last_violation_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("health_score", sa.Float, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # account_rule
    op.create_table(
        "account_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_type", sa.String, nullable=False),
        sa.Column("rule_name", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("severity", _rule_severity, nullable=False, server_default=sa.text("'medium'")),
        sa.Column("threshold_value", sa.Float, nullable=True),
        sa.Column("current_value", sa.Float, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("is_violated", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )

    # account_note
    op.create_table(
        "account_note",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("account.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("category", sa.String, nullable=True),
        sa.Column("pinned", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )

    # portfolio_snapshot
    op.create_table(
        "portfolio_snapshot",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_balance", sa.Float, nullable=False),
        sa.Column("total_equity", sa.Float, nullable=False),
        sa.Column("total_open_pnl", sa.Float, nullable=False),
        sa.Column("total_used_margin", sa.Float, nullable=False),
        sa.Column("total_free_margin", sa.Float, nullable=False),
        sa.Column("daily_pnl", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("weekly_pnl", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("monthly_pnl", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("total_deposits", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("total_withdrawals", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("account_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("active_account_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("snapshot_breakdown", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("portfolio_snapshot")
    op.drop_table("account_note")
    op.drop_table("account_rule")
    op.drop_table("account_health")
    op.drop_table("portfolio_goal")
    op.drop_table("transfer")
    op.drop_table("portfolio_allocation")
    op.drop_table("equity_history")
    op.drop_table("balance_history")
    op.drop_table("funding_history")
    op.drop_table("account_group")
    op.drop_table("account")
    op.drop_table("broker_profile")

    _account_type.drop(op.get_bind(), checkfirst=True)
    _account_status.drop(op.get_bind(), checkfirst=True)
    _broker_platform.drop(op.get_bind(), checkfirst=True)
    _execution_model.drop(op.get_bind(), checkfirst=True)
    _commission_model.drop(op.get_bind(), checkfirst=True)
    _allocation_type.drop(op.get_bind(), checkfirst=True)
    _transfer_type.drop(op.get_bind(), checkfirst=True)
    _goal_status.drop(op.get_bind(), checkfirst=True)
    _goal_metric.drop(op.get_bind(), checkfirst=True)
    _rule_severity.drop(op.get_bind(), checkfirst=True)

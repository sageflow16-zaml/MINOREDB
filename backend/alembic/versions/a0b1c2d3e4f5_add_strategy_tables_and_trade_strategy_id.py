"""add_strategy_tables_and_trade_strategy_id

Revision ID: a0b1c2d3e4f5
Revises: f7a8b9c0d1e2
Create Date: 2026-07-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'a0b1c2d3e4f5'
down_revision: str | None = 'f7a8b9c0d1e2'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # Create strategy table
    op.create_table(
        'strategy',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),

        sa.Column('name', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('market', sa.String(), nullable=True),
        sa.Column('instrument_types', postgresql.JSONB, nullable=True),
        sa.Column('timeframes', postgresql.JSONB, nullable=True),
        sa.Column('version', sa.String(), nullable=True, server_default='1.0.0'),
        sa.Column('status', sa.String(), nullable=True, server_default='Draft'),

        sa.Column('market_bias', sa.Text(), nullable=True),
        sa.Column('entry_conditions', postgresql.JSONB, nullable=True),
        sa.Column('confirmation_rules', postgresql.JSONB, nullable=True),
        sa.Column('invalidation_rules', postgresql.JSONB, nullable=True),
        sa.Column('exit_rules', postgresql.JSONB, nullable=True),
        sa.Column('risk_rules', postgresql.JSONB, nullable=True),

        sa.Column('entry_model', sa.String(), nullable=True),
        sa.Column('stop_loss_model', sa.String(), nullable=True),
        sa.Column('take_profit_model', sa.String(), nullable=True),
        sa.Column('partial_close_rules', postgresql.JSONB, nullable=True),
        sa.Column('trade_management_rules', postgresql.JSONB, nullable=True),

        sa.Column('preferred_sessions', postgresql.JSONB, nullable=True),
        sa.Column('preferred_market_conditions', sa.Text(), nullable=True),
        sa.Column('volatility_requirements', sa.String(), nullable=True),
        sa.Column('news_restrictions', sa.Text(), nullable=True),

        sa.Column('required_mindset', sa.Text(), nullable=True),
        sa.Column('discipline_rules', postgresql.JSONB, nullable=True),
        sa.Column('common_mistakes', postgresql.JSONB, nullable=True),
        sa.Column('things_to_avoid', postgresql.JSONB, nullable=True),

        sa.Column('checklist_items', postgresql.JSONB, nullable=True),
        sa.Column('documentation', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSONB, nullable=True),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('change_log', postgresql.JSONB, nullable=True),
    )
    op.create_index('ix_strategy_project_id', 'strategy', ['project_id'])
    op.create_index('ix_strategy_status', 'strategy', ['status'])
    op.create_index('ix_strategy_category', 'strategy', ['category'])

    # Create strategy_version table
    op.create_table(
        'strategy_version',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('strategy_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('strategy.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),

        sa.Column('version', sa.String(), nullable=True),
        sa.Column('change_log', sa.Text(), nullable=True),
        sa.Column('snapshot', postgresql.JSONB, nullable=True),
        sa.Column('author', sa.String(), nullable=True),
    )
    op.create_index('ix_strategy_version_strategy_id', 'strategy_version', ['strategy_id'])

    # Add strategy_id to trade table
    op.add_column(
        'trade',
        sa.Column('strategy_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('strategy.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_trade_strategy_id', 'trade', ['strategy_id'])


def downgrade() -> None:
    op.drop_index('ix_trade_strategy_id', table_name='trade')
    op.drop_column('trade', 'strategy_id')
    op.drop_index('ix_strategy_version_strategy_id', table_name='strategy_version')
    op.drop_table('strategy_version')
    op.drop_index('ix_strategy_category', table_name='strategy')
    op.drop_index('ix_strategy_status', table_name='strategy')
    op.drop_index('ix_strategy_project_id', table_name='strategy')
    op.drop_table('strategy')

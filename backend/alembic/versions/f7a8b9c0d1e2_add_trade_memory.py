"""add_trade_memory

Revision ID: f7a8b9c0d1e2
Revises: f6a7b8c9d0e1
Create Date: 2026-07-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'f7a8b9c0d1e2'
down_revision: str | None = 'f6a7b8c9d0e1'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        'trade_memory',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),
        sa.Column('trade_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('trade.id', ondelete='CASCADE'), nullable=False, unique=True),

        sa.Column('pair', sa.String(), nullable=True),
        sa.Column('direction', sa.String(), nullable=True),
        sa.Column('session', sa.String(), nullable=True),
        sa.Column('weekly_bias', sa.String(), nullable=True),
        sa.Column('daily_bias', sa.String(), nullable=True),
        sa.Column('h4_bias', sa.String(), nullable=True),
        sa.Column('market_phase', sa.String(), nullable=True),
        sa.Column('market_trend', sa.String(), nullable=True),
        sa.Column('entry_model', sa.String(), nullable=True),
        sa.Column('liquidity_type', sa.String(), nullable=True),
        sa.Column('execution_model', sa.String(), nullable=True),

        sa.Column('risk_percent', sa.Float(), nullable=True),
        sa.Column('rr', sa.Float(), nullable=True),
        sa.Column('pnl', sa.Float(), nullable=True),
        sa.Column('result', sa.String(), nullable=True),

        sa.Column('strengths', postgresql.JSON(), nullable=True),
        sa.Column('weaknesses', postgresql.JSON(), nullable=True),
        sa.Column('mistakes', postgresql.JSON(), nullable=True),
        sa.Column('lessons', postgresql.JSON(), nullable=True),
        sa.Column('tags', postgresql.JSON(), nullable=True),

        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('pattern_match', sa.Float(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),

        sa.Column('summary', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('trade_memory')

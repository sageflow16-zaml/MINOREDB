"""add_knowledge_rule

Revision ID: a1b2c3d4e5f6
Revises: f7a8b9c0d1e2
Create Date: 2026-07-18 01:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'a1b2c3d4e5f6'
down_revision: str | None = 'f7a8b9c0d1e2'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        'knowledge_rule',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('rule_type', sa.String(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('occurrences', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('wins', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('losses', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('win_rate', sa.Float(), nullable=True),
        sa.Column('avg_rr', sa.Float(), nullable=True),
        sa.Column('expectancy', sa.Float(), nullable=True),
        sa.Column('signature', sa.String(), nullable=True),
    )
    op.create_index('ix_knowledge_rule_project_id', 'knowledge_rule', ['project_id'])
    op.create_index('ix_knowledge_rule_signature', 'knowledge_rule', ['signature'])
    op.create_index('ix_knowledge_rule_confidence', 'knowledge_rule', ['confidence'])

    op.add_column(
        'trade_memory',
        sa.Column('knowledge_rule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('knowledge_rule.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_trade_memory_knowledge_rule_id', 'trade_memory', ['knowledge_rule_id'])


def downgrade() -> None:
    op.drop_index('ix_trade_memory_knowledge_rule_id', table_name='trade_memory')
    op.drop_column('trade_memory', 'knowledge_rule_id')
    op.drop_index('ix_knowledge_rule_confidence', table_name='knowledge_rule')
    op.drop_index('ix_knowledge_rule_signature', table_name='knowledge_rule')
    op.drop_index('ix_knowledge_rule_project_id', table_name='knowledge_rule')
    op.drop_table('knowledge_rule')

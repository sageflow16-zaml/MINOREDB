"""add_pattern_tables

Revision ID: b8a7e04a00cd
Revises: 7e1ed8025973
Create Date: 2026-07-17 17:12:20.547927

"""
from alembic import op
import sqlalchemy as sa


revision: str = 'b8a7e04a00cd'
down_revision: str | None = '7e1ed8025973'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table('pattern',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('signature', sa.JSON(), nullable=False),
    sa.Column('total_occurrences', sa.Integer(), nullable=False),
    sa.Column('wins', sa.Integer(), nullable=False),
    sa.Column('losses', sa.Integer(), nullable=False),
    sa.Column('breakevens', sa.Integer(), nullable=False),
    sa.Column('win_rate', sa.Float(), nullable=False),
    sa.Column('average_rr', sa.Float(), nullable=False),
    sa.Column('expectancy', sa.Float(), nullable=False),
    sa.Column('profit_factor', sa.Float(), nullable=False),
    sa.Column('average_duration', sa.Float(), nullable=True),
    sa.Column('avg_win', sa.Float(), nullable=False),
    sa.Column('avg_loss', sa.Float(), nullable=False),
    sa.Column('confidence_score', sa.Float(), nullable=False),
    sa.Column('first_seen', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('pattern_trade',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('pattern_id', sa.UUID(), nullable=False),
    sa.Column('trade_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['pattern_id'], ['pattern.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['trade_id'], ['trade.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('pattern_trade')
    op.drop_table('pattern')
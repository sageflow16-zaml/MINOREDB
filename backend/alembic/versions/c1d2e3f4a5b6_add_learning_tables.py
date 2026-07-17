"""add_learning_tables

Revision ID: c1d2e3f4a5b6
Revises: b8a7e04a00cd
Create Date: 2026-07-17 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision: str = 'c1d2e3f4a5b6'
down_revision: str | None = 'b8a7e04a00cd'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table('learning_event',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('event_type', sa.String(), nullable=False),
    sa.Column('entity_type', sa.String(), nullable=True),
    sa.Column('entity_id', sa.String(), nullable=True),
    sa.Column('duration_ms', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('summary', sa.Text(), nullable=True),
    sa.Column('metadata_json', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_learning_event_project_id', 'learning_event', ['project_id'])
    op.create_index('ix_learning_event_created_at', 'learning_event', ['created_at'])
    op.create_index('ix_learning_event_event_type', 'learning_event', ['event_type'])

    op.create_table('knowledge_snapshot',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('total_trades', sa.Integer(), nullable=False),
    sa.Column('total_patterns', sa.Integer(), nullable=False),
    sa.Column('total_claims', sa.Integer(), nullable=False),
    sa.Column('total_concepts', sa.Integer(), nullable=False),
    sa.Column('total_sources', sa.Integer(), nullable=False),
    sa.Column('total_similarities', sa.Integer(), nullable=False),
    sa.Column('total_interpretations', sa.Integer(), nullable=False),
    sa.Column('win_rate', sa.Float(), nullable=False),
    sa.Column('avg_rr', sa.Float(), nullable=False),
    sa.Column('expectancy', sa.Float(), nullable=False),
    sa.Column('knowledge_growth', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_knowledge_snapshot_project_id', 'knowledge_snapshot', ['project_id'])
    op.create_index('ix_knowledge_snapshot_created_at', 'knowledge_snapshot', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_knowledge_snapshot_created_at')
    op.drop_index('ix_knowledge_snapshot_project_id')
    op.drop_table('knowledge_snapshot')
    op.drop_index('ix_learning_event_event_type')
    op.drop_index('ix_learning_event_created_at')
    op.drop_index('ix_learning_event_project_id')
    op.drop_table('learning_event')

"""add_replay_workspace_tables

Revision ID: b0c1d2e3f4a5
Revises: a0b1c2d3e4f5
Create Date: 2026-07-19 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b0c1d2e3f4a5'
down_revision: str | None = 'a0b1c2d3e4f5'
branch_labels: str | None = None
depends_on: str | None = 'd4e5f6a7b8c0'


def upgrade() -> None:
    # Replay annotations
    op.create_table(
        'replay_annotation',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('replay_session.id', ondelete='CASCADE'), nullable=False),
        sa.Column('candle_index', sa.Integer(), nullable=False),
        sa.Column('annotation_type', sa.String(), nullable=False),
        sa.Column('content', postgresql.JSONB, nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('label', sa.String(), nullable=True),
    )
    op.create_index('ix_replay_annotation_session', 'replay_annotation', ['session_id'])

    # Replay timeline events
    op.create_table(
        'replay_timeline_event',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('replay_session.id', ondelete='CASCADE'), nullable=False),
        sa.Column('candle_index', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
    )
    op.create_index('ix_replay_timeline_event_session', 'replay_timeline_event', ['session_id'])

    # Replay review
    op.create_table(
        'replay_review',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('replay_session.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('went_well', sa.Text(), nullable=True),
        sa.Column('went_wrong', sa.Text(), nullable=True),
        sa.Column('rule_violations', sa.Text(), nullable=True),
        sa.Column('execution_quality', sa.String(), nullable=True),
        sa.Column('risk_management', sa.String(), nullable=True),
        sa.Column('psychology', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('trade_grade', sa.String(), nullable=True),
        sa.Column('discipline_score', sa.Float(), nullable=True),
        sa.Column('completed_checklist', postgresql.JSONB, nullable=True),
        sa.Column('missed_checklist', postgresql.JSONB, nullable=True),
        sa.Column('rule_compliance', sa.Float(), nullable=True),
    )
    op.create_index('ix_replay_review_session', 'replay_review', ['session_id'])

    # Replay mistakes
    op.create_table(
        'replay_mistake',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('replay_session.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mistake_type', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('candle_index', sa.Integer(), nullable=True),
        sa.Column('preventable', sa.Boolean(), nullable=True),
        sa.Column('recommendation', sa.Text(), nullable=True),
    )
    op.create_index('ix_replay_mistake_session', 'replay_mistake', ['session_id'])

    # Replay screenshots
    op.create_table(
        'replay_screenshot',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('replay_session.id', ondelete='CASCADE'), nullable=False),
        sa.Column('candle_index', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('caption', sa.Text(), nullable=True),
    )
    op.create_index('ix_replay_screenshot_session', 'replay_screenshot', ['session_id'])


def downgrade() -> None:
    op.drop_table('replay_screenshot')
    op.drop_table('replay_mistake')
    op.drop_table('replay_review')
    op.drop_table('replay_timeline_event')
    op.drop_table('replay_annotation')

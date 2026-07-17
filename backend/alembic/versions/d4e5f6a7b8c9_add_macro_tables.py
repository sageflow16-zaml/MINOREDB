"""add_macro_tables

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-07-17 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: str | None = 'c1d2e3f4a5b6'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        'macro_event',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('provider', sa.String(), nullable=False, index=True),
        sa.Column('event_name', sa.String(), nullable=False, index=True),
        sa.Column('country', sa.String(), nullable=False, server_default='US'),
        sa.Column('currency', sa.String(), nullable=False, server_default='USD'),
        sa.Column('category', sa.String(), nullable=False, server_default='general'),
        sa.Column('importance', sa.String(), nullable=False, server_default='medium'),
        sa.Column('actual', sa.Float(), nullable=True),
        sa.Column('forecast', sa.Float(), nullable=True),
        sa.Column('previous', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(), nullable=False, server_default=''),
        sa.Column('release_time', sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    op.create_table(
        'market_snapshot',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('dxy', sa.Float(), nullable=True),
        sa.Column('us02y', sa.Float(), nullable=True),
        sa.Column('us10y', sa.Float(), nullable=True),
        sa.Column('yield_curve', sa.Float(), nullable=True),
        sa.Column('sp500', sa.Float(), nullable=True),
        sa.Column('nasdaq', sa.Float(), nullable=True),
        sa.Column('gold', sa.Float(), nullable=True),
        sa.Column('oil', sa.Float(), nullable=True),
        sa.Column('vix', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('market_snapshot')
    op.drop_table('macro_event')

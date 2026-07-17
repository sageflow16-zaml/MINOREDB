
"""add_market_structure

Revision ID: 40e318894d4f
Revises: 36ad6123b471
Create Date: 2026-07-17 15:02:06.632233

"""
from alembic import op
import sqlalchemy as sa


revision: str = '40e318894d4f'
down_revision: str | None = '36ad6123b471'
branch_labels: str | None = None
depends_on: str | None = None

def upgrade() -> None:
    op.create_table('market_structure',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('trade_id', sa.UUID(), nullable=True),
        sa.Column('date', sa.Date(), nullable=True),
        sa.Column('pair', sa.String(), nullable=True),
        sa.Column('timeframe', sa.String(), nullable=True),
        sa.Column('weekly_bias', sa.String(), nullable=True),
        sa.Column('daily_bias', sa.String(), nullable=True),
        sa.Column('h4_bias', sa.String(), nullable=True),
        sa.Column('market_phase', sa.String(), nullable=True),
        sa.Column('trend', sa.String(), nullable=True),
        sa.Column('premium_discount', sa.String(), nullable=True),
        sa.Column('external_liquidity', sa.String(), nullable=True),
        sa.Column('internal_liquidity', sa.String(), nullable=True),
        sa.Column('equal_highs', sa.String(), nullable=True),
        sa.Column('equal_lows', sa.String(), nullable=True),
        sa.Column('buy_side_liquidity', sa.String(), nullable=True),
        sa.Column('sell_side_liquidity', sa.String(), nullable=True),
        sa.Column('bos', sa.String(), nullable=True),
        sa.Column('mss', sa.String(), nullable=True),
        sa.Column('choch', sa.String(), nullable=True),
        sa.Column('order_block', sa.String(), nullable=True),
        sa.Column('breaker', sa.String(), nullable=True),
        sa.Column('mitigation', sa.String(), nullable=True),
        sa.Column('fvg', sa.String(), nullable=True),
        sa.Column('ifvg', sa.String(), nullable=True),
        sa.Column('asian_high', sa.Float(), nullable=True),
        sa.Column('asian_low', sa.Float(), nullable=True),
        sa.Column('london_open', sa.Float(), nullable=True),
        sa.Column('newyork_open', sa.Float(), nullable=True),
        sa.Column('london_killzone', sa.String(), nullable=True),
        sa.Column('newyork_killzone', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trade_id'], ['trade.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('trade', sa.Column('market_structure_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_trade_market_structure_id', 'trade', 'market_structure',
        ['market_structure_id'], ['id'],
        ondelete='SET NULL',
    )

def downgrade() -> None:
    op.drop_constraint('fk_trade_market_structure_id', 'trade', type_='foreignkey')
    op.drop_column('trade', 'market_structure_id')
    op.drop_table('market_structure')

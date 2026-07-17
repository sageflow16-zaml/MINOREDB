
"""add_trade_model

Revision ID: 36ad6123b471
Revises: 47a2bc90e0c1
Create Date: 2026-07-17 14:27:22.549703

"""
from alembic import op
import sqlalchemy as sa


revision: str = '36ad6123b471'
down_revision: str | None = '47a2bc90e0c1'
branch_labels: str | None = None
depends_on: str | None = None

def upgrade() -> None:
    op.create_table('trade',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('pair', sa.String(), nullable=True),
    sa.Column('direction', sa.String(), nullable=True),
    sa.Column('entry_price', sa.Float(), nullable=True),
    sa.Column('stop_loss', sa.Float(), nullable=True),
    sa.Column('take_profit', sa.Float(), nullable=True),
    sa.Column('exit_price', sa.Float(), nullable=True),
    sa.Column('position_size', sa.Float(), nullable=True),
    sa.Column('risk_percent', sa.Float(), nullable=True),
    sa.Column('rr', sa.Float(), nullable=True),
    sa.Column('pnl', sa.Float(), nullable=True),
    sa.Column('result', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('weekly_bias', sa.String(), nullable=True),
    sa.Column('daily_bias', sa.String(), nullable=True),
    sa.Column('h4_bias', sa.String(), nullable=True),
    sa.Column('liquidity_sweep', sa.String(), nullable=True),
    sa.Column('bos', sa.String(), nullable=True),
    sa.Column('mss', sa.String(), nullable=True),
    sa.Column('order_block', sa.String(), nullable=True),
    sa.Column('fvg', sa.String(), nullable=True),
    sa.Column('asian_session', sa.String(), nullable=True),
    sa.Column('london_session', sa.String(), nullable=True),
    sa.Column('newyork_session', sa.String(), nullable=True),
    sa.Column('dxy', sa.String(), nullable=True),
    sa.Column('us10y', sa.String(), nullable=True),
    sa.Column('us02y', sa.String(), nullable=True),
    sa.Column('news_event', sa.String(), nullable=True),
    sa.Column('emotion', sa.String(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('before_image', sa.String(), nullable=True),
    sa.Column('after_image', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('trade')

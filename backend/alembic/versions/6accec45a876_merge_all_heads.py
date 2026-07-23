
"""merge_all_heads

Revision ID: 6accec45a876
Revises: d1e2f3a4b5c6, d2e3f4a5b6c7, b0c1d2e3f4a5, a0b1c2d3e4f6
Create Date: 2026-07-21 15:45:13.251433

"""
from alembic import op
import sqlalchemy as sa


revision: str = '6accec45a876'
down_revision: str | None = ('d1e2f3a4b5c6', 'd2e3f4a5b6c7', 'b0c1d2e3f4a5', 'a0b1c2d3e4f6')
branch_labels: str | None = None
depends_on: str | None = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

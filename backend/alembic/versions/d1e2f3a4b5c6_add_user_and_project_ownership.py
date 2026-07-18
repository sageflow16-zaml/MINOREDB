"""add_user_and_project_ownership

Revision ID: d1e2f3a4b5c6
Revises: c0d1e2f3a4b5
Create Date: 2026-07-18 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd1e2f3a4b5c6'
down_revision: str | None = 'c0d1e2f3a4b5'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table('user',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)

    op.add_column('project',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(op.f('ix_project_user_id'), 'project', ['user_id'])
    op.create_foreign_key('fk_project_user_id', 'project', 'user', ['user_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('fk_project_user_id', 'project', type_='foreignkey')
    op.drop_index(op.f('ix_project_user_id'), table_name='project')
    op.drop_column('project', 'user_id')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')

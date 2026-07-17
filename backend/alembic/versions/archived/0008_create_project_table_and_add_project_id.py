"""create_project_table_and_add_project_id

Revision ID: 0008_create_project_table_and_add_project_id
Revises: 0007_production_hardening
Create Date: 2026-07-13 03:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

# revision identifiers, used by Alembic.
revision = '0008_create_project_table_and_add_project_id'
down_revision = '0007_production_hardening'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create project table
    op.create_table(
        'project',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('status', sa.String(), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )

    # 2. Add project_id to target tables
    target_tables = [
        'source', 'claim', 'concept', 'interpretation', 
        'conflict', 'research_question', 'hypothesis', 
        'association', 'reconsideration_trigger'
    ]
    
    # Create default project
    default_project_id = uuid.uuid4()
    op.execute(
        f"INSERT INTO project (id, name, description) VALUES ('{default_project_id}', 'Default Project', 'Default migration project')"
    )

    for table in target_tables:
        # Add nullable column first
        op.add_column(table, sa.Column('project_id', UUID(as_uuid=True), nullable=True))
        
        # Backfill
        op.execute(f"UPDATE {table} SET project_id = '{default_project_id}'")
        
        # Add foreign key and set not null
        op.alter_column(table, 'project_id', nullable=False)
        op.create_foreign_key(f'fk_{table}_project_id', table, 'project', ['project_id'], ['id'], ondelete='CASCADE')
        op.create_index(f'ix_{table}_project_id', table, ['project_id'])

def downgrade():
    # Reverse operations
    target_tables = [
        'source', 'claim', 'concept', 'interpretation', 
        'conflict', 'research_question', 'hypothesis', 
        'association', 'reconsideration_trigger'
    ]
    for table in target_tables:
        op.drop_index(f'ix_{table}_project_id', table_name=table)
        op.drop_constraint(f'fk_{table}_project_id', table, type_='foreignkey')
        op.drop_column(table, 'project_id')
    op.drop_table('project')

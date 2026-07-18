"""add_knowledge_graph

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-18 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b2c3d4e5f6a7'
down_revision: str | None = 'a1b2c3d4e5f6'
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        'knowledge_node',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True, server_default=sa.text('1.0')),
        sa.Column('occurrences', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.UniqueConstraint('project_id', 'type', 'name', name='uq_node_project_type_name'),
    )
    op.create_index('ix_knowledge_node_type', 'knowledge_node', ['type'])
    op.create_index('ix_knowledge_node_project_id', 'knowledge_node', ['project_id'])

    op.create_table(
        'knowledge_edge',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_node_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('knowledge_node.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_node_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('knowledge_node.id', ondelete='CASCADE'), nullable=False),
        sa.Column('relationship', sa.String(), nullable=False, server_default=sa.text("'CORRELATED'")),
        sa.Column('strength', sa.Float(), nullable=True, server_default=sa.text('1.0')),
        sa.Column('occurrences', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('confidence', sa.Float(), nullable=True, server_default=sa.text('0.0')),
        sa.UniqueConstraint('source_node_id', 'target_node_id', 'relationship', name='uq_edge_source_target_rel'),
    )
    op.create_index('ix_knowledge_edge_project_id', 'knowledge_edge', ['project_id'])

    op.create_table(
        'knowledge_graph_snapshot',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('project.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_nodes', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('total_edges', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('most_connected_type', sa.String(), nullable=True),
        sa.Column('highest_confidence_edge_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('summary', sa.String(), nullable=True),
    )
    op.create_index('ix_knowledge_graph_snapshot_project_id', 'knowledge_graph_snapshot', ['project_id'])


def downgrade() -> None:
    op.drop_index('ix_knowledge_graph_snapshot_project_id', table_name='knowledge_graph_snapshot')
    op.drop_table('knowledge_graph_snapshot')
    op.drop_index('ix_knowledge_edge_project_id', table_name='knowledge_edge')
    op.drop_table('knowledge_edge')
    op.drop_index('ix_knowledge_node_project_id', table_name='knowledge_node')
    op.drop_index('ix_knowledge_node_type', table_name='knowledge_node')
    op.drop_table('knowledge_node')

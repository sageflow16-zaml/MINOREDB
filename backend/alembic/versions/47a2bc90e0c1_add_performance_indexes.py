"""add_performance_indexes

Revision ID: 47a2bc90e0c1
Revises: 46e1ad79d1fb
Create Date: 2026-07-15 16:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision: str = '47a2bc90e0c1'
down_revision: str | None = '46e1ad79d1fb'
branch_labels: str | None = None
depends_on: str | None = None


# (table, column) pairs that are filtered/joined on constantly and had no index.
FK_INDEXES = [
    ('source', 'project_id'),
    ('claim', 'project_id'),
    ('claim', 'source_id'),
    ('concept', 'project_id'),
    ('concept', 'conceptual_term'),
    ('association', 'project_id'),
    ('association', 'claim_id'),
    ('association', 'concept_id'),
    ('conflict', 'project_id'),
    ('interpretation', 'project_id'),
    ('interpretation', 'concept_id'),
    ('research_question', 'project_id'),
    ('research_question', 'conflict_id'),
    ('hypothesis', 'project_id'),
    ('hypothesis', 'research_question_id'),
    ('claim_conflict', 'project_id'),
    ('claim_conflict', 'claim_id'),
    ('claim_conflict', 'conflict_id'),
    ('reconsideration_trigger', 'project_id'),
    ('reconsideration_trigger', 'interpretation_id'),
]


def upgrade() -> None:
    for table, column in FK_INDEXES:
        op.create_index(f'ix_{table}_{column}', table, [column])


def downgrade() -> None:
    for table, column in FK_INDEXES:
        op.drop_index(f'ix_{table}_{column}', table_name=table)
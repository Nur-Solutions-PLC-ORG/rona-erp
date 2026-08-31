"""Add lifecycle metadata to knowledge documents.

Revision ID: 20260820_0002
Revises: 20260815_0001
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0002"
down_revision: str | None = "20260815_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("knowledge_documents", sa.Column("version", sa.Integer(), nullable=True))
    op.add_column("knowledge_documents", sa.Column("status", sa.String(length=20), nullable=True))
    op.add_column("knowledge_documents", sa.Column("effective_from", sa.DateTime(timezone=True), nullable=True))
    op.add_column("knowledge_documents", sa.Column("effective_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("knowledge_documents", sa.Column("source_ref", sa.String(length=300), nullable=True))
    op.execute("UPDATE knowledge_documents SET version = 1 WHERE version IS NULL")
    op.execute("UPDATE knowledge_documents SET status = 'approved' WHERE status IS NULL")
    with op.batch_alter_table("knowledge_documents") as batch_op:
        batch_op.alter_column("version", existing_type=sa.Integer(), nullable=False, server_default="1")
        batch_op.alter_column("status", existing_type=sa.String(length=20), nullable=False, server_default="approved")
        batch_op.create_index("ix_knowledge_documents_status", ["status"])


def downgrade() -> None:
    with op.batch_alter_table("knowledge_documents") as batch_op:
        batch_op.drop_index("ix_knowledge_documents_status")
        batch_op.drop_column("source_ref")
        batch_op.drop_column("effective_until")
        batch_op.drop_column("effective_from")
        batch_op.drop_column("status")
        batch_op.drop_column("version")

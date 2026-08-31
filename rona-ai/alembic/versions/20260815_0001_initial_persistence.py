
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260815_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "report_jobs",
        sa.Column("report_id", sa.String(length=80), nullable=False),
        sa.Column("tenant_id", sa.String(length=120), nullable=False),
        sa.Column("requested_by", sa.String(length=120), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("export_format", sa.String(length=20), nullable=False),
        sa.Column("period_label", sa.String(length=160), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("filename", sa.String(length=180), nullable=True),
        sa.Column("storage_key", sa.String(length=300), nullable=True),
        sa.Column("byte_size", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("report_id"),
    )
    op.create_index("ix_report_jobs_tenant_id", "report_jobs", ["tenant_id"])
    op.create_index("ix_report_jobs_status", "report_jobs", ["status"])
    op.create_index("ix_report_jobs_next_attempt_at", "report_jobs", ["next_attempt_at"])

    op.create_table(
        "knowledge_documents",
        sa.Column("doc_id", sa.String(length=100), nullable=False),
        sa.Column("tenant_id", sa.String(length=120), nullable=True),
        sa.Column("domain", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=250), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("tags_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("doc_id"),
    )
    op.create_index(
        "ix_knowledge_documents_tenant_id",
        "knowledge_documents",
        ["tenant_id"],
    )
    op.create_index("ix_knowledge_documents_domain", "knowledge_documents", ["domain"])


def downgrade() -> None:
    op.drop_index("ix_knowledge_documents_domain", table_name="knowledge_documents")
    op.drop_index("ix_knowledge_documents_tenant_id", table_name="knowledge_documents")
    op.drop_table("knowledge_documents")

    op.drop_index("ix_report_jobs_next_attempt_at", table_name="report_jobs")
    op.drop_index("ix_report_jobs_status", table_name="report_jobs")
    op.drop_index("ix_report_jobs_tenant_id", table_name="report_jobs")
    op.drop_table("report_jobs")

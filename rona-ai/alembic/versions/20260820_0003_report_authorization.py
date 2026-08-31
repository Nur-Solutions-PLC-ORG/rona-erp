"""Persist report authorization snapshots.

Revision ID: 20260820_0003
Revises: 20260820_0002
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0003"
down_revision: str | None = "20260820_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "report_jobs",
        sa.Column("authorized_domains_json", sa.Text(), nullable=True),
    )
    # Existing report files were created without a trustworthy permission
    # snapshot. The invalid sentinel intentionally fails DataDomain parsing in
    # the download guard, keeping legacy files inaccessible rather than guessing
    # which current role should be allowed to read their historical contents.
    op.execute(
        "UPDATE report_jobs SET authorized_domains_json = "
        "'[\"__legacy_authorization_unknown__\"]' WHERE authorized_domains_json IS NULL"
    )
    with op.batch_alter_table("report_jobs") as batch_op:
        batch_op.alter_column(
            "authorized_domains_json",
            existing_type=sa.Text(),
            nullable=False,
            server_default="[]",
        )


def downgrade() -> None:
    with op.batch_alter_table("report_jobs") as batch_op:
        batch_op.drop_column("authorized_domains_json")

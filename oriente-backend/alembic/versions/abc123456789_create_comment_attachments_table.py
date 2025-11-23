"""create comment_attachments table

Revision ID: abc123456789
Revises: d6f990f1ddc7
Create Date: 2025-11-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123456789'
down_revision: Union[str, None] = 'd6f990f1ddc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create comment_attachments table
    op.create_table('comment_attachments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('file_size', sa.BigInteger(), nullable=False),
    sa.Column('mime_type', sa.String(length=100), nullable=False),
    sa.Column('comment_id', sa.Integer(), nullable=False),
    sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comment_attachments_id'), 'comment_attachments', ['id'], unique=False)
    op.create_index(op.f('ix_comment_attachments_comment_id'), 'comment_attachments', ['comment_id'], unique=False)


def downgrade() -> None:
    # Drop comment_attachments table
    op.drop_index(op.f('ix_comment_attachments_comment_id'), table_name='comment_attachments')
    op.drop_index(op.f('ix_comment_attachments_id'), table_name='comment_attachments')
    op.drop_table('comment_attachments')

"""create chat_message_attachments table

Revision ID: def987654321
Revises: abc123456789
Create Date: 2025-11-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'def987654321'
down_revision: Union[str, None] = 'abc123456789'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create chat_message_attachments table
    op.create_table('chat_message_attachments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('file_size', sa.BigInteger(), nullable=False),
    sa.Column('mime_type', sa.String(length=100), nullable=False),
    sa.Column('message_id', sa.Integer(), nullable=False),
    sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['message_id'], ['chat_messages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_message_attachments_id'), 'chat_message_attachments', ['id'], unique=False)
    op.create_index(op.f('ix_chat_message_attachments_message_id'), 'chat_message_attachments', ['message_id'], unique=False)


def downgrade() -> None:
    # Drop chat_message_attachments table
    op.drop_index(op.f('ix_chat_message_attachments_message_id'), table_name='chat_message_attachments')
    op.drop_index(op.f('ix_chat_message_attachments_id'), table_name='chat_message_attachments')
    op.drop_table('chat_message_attachments')

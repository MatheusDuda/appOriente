"""remove tags tables

Revision ID: e7a1234b5678
Revises: d6f990f1ddc7
Create Date: 2025-01-22 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7a1234b5678'
down_revision = 'd6f990f1ddc7'
branch_labels = None
depends_on = None


def upgrade():
    # Drop card_tags association table first (due to foreign keys)
    op.drop_table('card_tags')

    # Drop tags table
    op.drop_index('ix_tags_id', table_name='tags')
    op.drop_table('tags')


def downgrade():
    # Recreate tags table
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tags_id', 'tags', ['id'], unique=False)

    # Recreate card_tags association table
    op.create_table('card_tags',
        sa.Column('card_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('card_id', 'tag_id')
    )

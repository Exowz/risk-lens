"""add locale to user_preferences

Revision ID: 10f9ad754ed7
Revises: cd590eb40e4c
Create Date: 2026-03-25 01:52:15.239720

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '10f9ad754ed7'
down_revision: Union[str, Sequence[str], None] = 'cd590eb40e4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'user_preferences',
        sa.Column('locale', sa.String(length=5), nullable=False, server_default='fr'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_preferences', 'locale')

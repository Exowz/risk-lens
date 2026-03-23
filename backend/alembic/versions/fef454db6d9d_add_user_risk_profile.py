"""add user_risk_profile

Revision ID: fef454db6d9d
Revises: ad2543a95b48
Create Date: 2026-03-23 21:58:47.566934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fef454db6d9d'
down_revision: Union[str, Sequence[str], None] = 'ad2543a95b48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('user_risk_profile',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('horizon', sa.String(length=20), nullable=False),
    sa.Column('loss_tolerance', sa.String(length=20), nullable=False),
    sa.Column('objective', sa.String(length=20), nullable=False),
    sa.Column('experience', sa.String(length=20), nullable=False),
    sa.Column('profile_name', sa.String(length=100), nullable=False),
    sa.Column('risk_score', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_risk_profile_user_id'), 'user_risk_profile', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_risk_profile_user_id'), table_name='user_risk_profile')
    op.drop_table('user_risk_profile')

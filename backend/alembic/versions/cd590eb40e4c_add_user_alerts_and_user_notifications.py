"""add user_alerts and user_notifications

Revision ID: cd590eb40e4c
Revises: 4e0be14a42b0
Create Date: 2026-03-24 20:09:17.627566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd590eb40e4c'
down_revision: Union[str, Sequence[str], None] = '4e0be14a42b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('user_alerts',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('portfolio_id', sa.String(length=36), nullable=False),
    sa.Column('metric', sa.String(length=50), nullable=False),
    sa.Column('threshold', sa.Float(), nullable=False),
    sa.Column('direction', sa.String(length=10), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_alerts_user_id'), 'user_alerts', ['user_id'], unique=False)
    op.create_table('user_notifications',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('alert_id', sa.String(length=36), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('read', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['alert_id'], ['user_alerts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_notifications_user_id'), 'user_notifications', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_notifications_user_id'), table_name='user_notifications')
    op.drop_table('user_notifications')
    op.drop_index(op.f('ix_user_alerts_user_id'), table_name='user_alerts')
    op.drop_table('user_alerts')

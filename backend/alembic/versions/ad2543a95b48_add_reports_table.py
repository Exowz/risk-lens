"""add reports table

Revision ID: ad2543a95b48
Revises: 477bdc0e6d7e
Create Date: 2026-03-22 23:43:57.080849

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad2543a95b48'
down_revision: Union[str, Sequence[str], None] = '477bdc0e6d7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('reports',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('portfolio_id', sa.String(length=36), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_portfolio_id'), 'reports', ['portfolio_id'], unique=False)
    op.create_index(op.f('ix_reports_user_id'), 'reports', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_reports_user_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_portfolio_id'), table_name='reports')
    op.drop_table('reports')

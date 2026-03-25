"""
SQLAlchemy model for user preferences.

Stores persistent user settings: display mode and Monte Carlo simulation count.

Depends on: core/database.py, models/user.py
Used by: api/v1/profile.py
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="beginner"
    )
    monte_carlo_simulations: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10000
    )
    locale: Mapped[str] = mapped_column(
        String(5), nullable=False, default="fr"
    )

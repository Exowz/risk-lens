"""
SQLAlchemy model for user risk profile.

Stores the results of the Risk Profiler Express onboarding questionnaire
and the AI-generated risk profile.

Depends on: core/database.py, models/user.py
Used by: api/v1/profile.py
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserRiskProfile(Base):
    __tablename__ = "user_risk_profile"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    horizon: Mapped[str] = mapped_column(String(20), nullable=False)
    loss_tolerance: Mapped[str] = mapped_column(String(20), nullable=False)
    objective: Mapped[str] = mapped_column(String(20), nullable=False)
    experience: Mapped[str] = mapped_column(String(20), nullable=False)
    profile_name: Mapped[str] = mapped_column(String(100), nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

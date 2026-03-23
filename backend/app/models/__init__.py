"""
SQLAlchemy ORM models.

All models must be imported here so Alembic can discover them
for autogenerate migrations.
"""

from app.models.calculation_cache import CalculationCache
from app.models.portfolio import Asset, Portfolio
from app.models.report import Report
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app.models.user_risk_profile import UserRiskProfile

__all__ = ["User", "Portfolio", "Asset", "CalculationCache", "Report", "UserRiskProfile", "UserPreferences"]

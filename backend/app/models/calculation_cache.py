"""
SQLAlchemy model for caching heavy computation results.

Cache key = sha256(portfolio_id + sorted(asset_weights) + params)
Cache TTL = 3600 seconds (1 hour)

Used by risk_engine, montecarlo_engine, markowitz_engine, stress_engine
to avoid recomputing results within the TTL window.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CalculationCache(Base):
    __tablename__ = "calculation_cache"

    cache_key: Mapped[str] = mapped_column(
        String(64), primary_key=True
    )
    result_json: Mapped[str] = mapped_column(Text, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    def __repr__(self) -> str:
        return f"<CalculationCache key={self.cache_key[:16]}... expires={self.expires_at}>"

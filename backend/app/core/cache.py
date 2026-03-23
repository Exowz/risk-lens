"""
Shared calculation cache utilities.

Provides get/store functions using PostgreSQL UPSERT (INSERT ON CONFLICT)
to avoid UniqueViolationError under concurrent requests.

Depends on: models/calculation_cache.py, sqlalchemy
Used by: api/v1/risk.py, api/v1/markowitz.py, api/v1/stress.py
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calculation_cache import CalculationCache

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 3600  # 1 hour


def build_cache_key(prefix: str, *parts: str) -> str:
    """Build a SHA-256 cache key from a prefix and variable parts."""
    raw = ":".join([prefix, *parts])
    return hashlib.sha256(raw.encode()).hexdigest()


async def get_cached_result(db: AsyncSession, cache_key: str) -> dict | None:
    """
    Check the calculation cache for a valid (non-expired) entry.

    Returns:
        Parsed JSON dict if cache hit, None otherwise.
    """
    result = await db.execute(
        select(CalculationCache).where(CalculationCache.cache_key == cache_key)
    )
    cached = result.scalar_one_or_none()

    if cached is None:
        return None

    if cached.expires_at < datetime.now(timezone.utc):
        await db.delete(cached)
        return None

    logger.info("Cache hit: %s", cache_key[:16])
    return json.loads(cached.result_json)


async def store_cached_result(
    db: AsyncSession, cache_key: str, result: dict
) -> None:
    """
    Store a computation result in the cache using UPSERT.

    Uses INSERT ... ON CONFLICT (cache_key) DO UPDATE to avoid
    UniqueViolationError under concurrent requests.
    """
    expires = datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS)
    stmt = pg_insert(CalculationCache).values(
        cache_key=cache_key,
        result_json=json.dumps(result),
        computed_at=datetime.now(timezone.utc),
        expires_at=expires,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["cache_key"],
        set_={
            "result_json": stmt.excluded.result_json,
            "computed_at": stmt.excluded.computed_at,
            "expires_at": stmt.excluded.expires_at,
        },
    )
    await db.execute(stmt)

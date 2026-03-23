"""
Stress testing router.

Endpoints:
    POST /stress/run -- Run historical crisis stress tests for a portfolio

Checks calculation_cache before computing (1h TTL).
Heavy computation lives in services/stress_engine.py.

Depends on: schemas/stress.py, services/stress_engine.py,
            services/market_data.py, models/portfolio.py, core/cache.py
Used by: Frontend TanStack Query hooks
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import build_cache_key, get_cached_result, store_cached_result
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.user import User
from app.schemas.explain import ExplainStressRequest, ExplanationResponse
from app.schemas.stress import StressTestRequest, StressTestResponse
from app.services.explain_service import explain_stress_result
from app.services.market_data import get_historical_prices
from app.services.stress_engine import run_stress_test

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stress", tags=["stress"])


def _cache_key(portfolio_id: str, period: str) -> str:
    """Build a deterministic cache key."""
    raw = f"stress:{portfolio_id}:" + json.dumps(
        {"period": period}, sort_keys=True
    )
    return build_cache_key(raw)


@router.post("/run", response_model=StressTestResponse)
async def stress_test(
    request: StressTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StressTestResponse:
    """Run historical crisis stress tests for a portfolio."""
    # Load portfolio
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == request.portfolio_id, Portfolio.user_id == current_user.id)
        .options(selectinload(Portfolio.assets))
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{request.portfolio_id}' not found",
        )

    if len(portfolio.assets) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Stress testing requires at least 2 assets",
        )

    # Check cache
    cache_key = _cache_key(portfolio.id, request.period)
    cached = await get_cached_result(db, cache_key)
    if cached:
        return StressTestResponse(**cached, from_cache=True)

    # Fetch price data — use "max" period to cover all crisis date ranges
    tickers = [a.ticker for a in portfolio.assets]
    prices = await get_historical_prices(tickers, request.period)

    # Build current weights
    current_weights = {a.ticker: a.weight for a in portfolio.assets}

    # Compute stress test
    stress_result = run_stress_test(prices, current_weights)

    # Cache result
    await store_cached_result(
        db, cache_key, stress_result.model_dump(exclude={"from_cache"})
    )

    logger.info(
        "Stress test completed: portfolio=%s scenarios=%d",
        portfolio.id,
        len(stress_result.scenarios),
    )
    return stress_result


@router.post("/explain-result", response_model=ExplanationResponse)
async def get_stress_explanation(
    request: ExplainStressRequest,
    current_user: User = Depends(get_current_user),
) -> ExplanationResponse:
    """Generate an AI explanation for stress test results."""
    try:
        text = await explain_stress_result(
            mode=request.mode,
            scenarios=[s.model_dump() for s in request.scenarios],
        )
        return ExplanationResponse(explanation=text)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e

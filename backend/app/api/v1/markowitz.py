"""
Markowitz efficient frontier router.

Endpoints:
    POST /markowitz/frontier -- Compute the efficient frontier for a portfolio

Checks calculation_cache before computing (1h TTL).
Heavy computation lives in services/markowitz_engine.py.

Depends on: schemas/markowitz.py, services/markowitz_engine.py,
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
from app.schemas.explain import (
    ExplainMarkowitzPointRequest,
    ExplainMarkowitzRequest,
    ExplanationResponse,
    MarkowitzPointExplanationResponse,
)
from app.schemas.markowitz import MarkowitzRequest, MarkowitzResponse
from app.services.explain_service import explain_markowitz_point, explain_markowitz_position
from app.services.market_data import get_historical_prices
from app.services.markowitz_engine import compute_efficient_frontier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/markowitz", tags=["markowitz"])


def _cache_key(portfolio_id: str, n_points: int, period: str) -> str:
    """Build a deterministic cache key."""
    raw = f"markowitz:{portfolio_id}:" + json.dumps(
        {"n_points": n_points, "period": period}, sort_keys=True
    )
    return build_cache_key(raw)


@router.post("/frontier", response_model=MarkowitzResponse)
async def compute_frontier(
    request: MarkowitzRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MarkowitzResponse:
    """Compute the efficient frontier for a portfolio's assets."""
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
            detail="Markowitz optimization requires at least 2 assets",
        )

    # Check cache
    cache_key = _cache_key(portfolio.id, request.n_points, request.period)
    cached = await get_cached_result(db, cache_key)
    if cached:
        return MarkowitzResponse(**cached, from_cache=True)

    # Fetch price data
    tickers = [a.ticker for a in portfolio.assets]
    prices = await get_historical_prices(tickers, request.period)

    # Build current weights dict
    current_weights = {a.ticker: a.weight for a in portfolio.assets}

    # Compute frontier
    frontier_result = compute_efficient_frontier(
        prices, current_weights, request.n_points
    )

    # Cache result
    await store_cached_result(
        db, cache_key, frontier_result.model_dump(exclude={"from_cache"})
    )

    logger.info(
        "Markowitz frontier computed: portfolio=%s points=%d",
        portfolio.id,
        len(frontier_result.frontier_points),
    )
    return frontier_result


@router.post("/explain-position", response_model=ExplanationResponse)
async def get_markowitz_explanation(
    request: ExplainMarkowitzRequest,
    current_user: User = Depends(get_current_user),
) -> ExplanationResponse:
    """Generate an AI explanation for the portfolio's position on the frontier."""
    try:
        text = await explain_markowitz_position(
            mode=request.mode,
            current_sharpe=request.current_sharpe,
            current_volatility=request.current_volatility,
            current_return=request.current_return,
            max_sharpe_ratio=request.max_sharpe_ratio,
            max_sharpe_volatility=request.max_sharpe_volatility,
            max_sharpe_return=request.max_sharpe_return,
            min_variance_volatility=request.min_variance_volatility,
        )
        return ExplanationResponse(explanation=text)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e


@router.post("/explain", response_model=MarkowitzPointExplanationResponse)
async def explain_markowitz_point_endpoint(
    request: ExplainMarkowitzPointRequest,
    current_user: User = Depends(get_current_user),
) -> MarkowitzPointExplanationResponse:
    """Portefeuille Bavard — contextual AI explanation for a frontier point."""
    try:
        result = await explain_markowitz_point(
            mode=request.mode,
            point_type=request.point_type,
            volatility=request.volatility,
            expected_return=request.expected_return,
            weights=request.weights,
        )
        return MarkowitzPointExplanationResponse(**result)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e

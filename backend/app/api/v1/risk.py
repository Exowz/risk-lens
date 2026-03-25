"""
Risk calculation router.

Endpoints:
    POST /risk/var        -- Value at Risk (historical or parametric)
    POST /risk/cvar       -- Conditional VaR (Expected Shortfall)
    POST /risk/montecarlo -- Monte Carlo simulation (GBM)
    POST /risk/summary    -- Aggregated risk summary

All endpoints check calculation_cache before computing.
Heavy computation lives in services/ — routers only orchestrate.

Depends on: schemas/risk.py, services/risk_engine.py, services/montecarlo_engine.py,
            services/market_data.py, models/portfolio.py, models/calculation_cache.py
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
    ExplainDistributionRequest,
    ExplainMetricRequest,
    ExplainMonteCarloRequest,
    ExplanationResponse,
)
from app.schemas.risk import (
    CVaRResponse,
    MonteCarloRequest,
    MonteCarloResponse,
    RiskSummaryRequest,
    RiskSummaryResponse,
    SimulateRequest,
    VaRRequest,
    VaRResponse,
)
from app.services.explain_service import explain_distribution, explain_metric, explain_montecarlo
from app.services.market_data import get_portfolio_returns
from app.services.montecarlo_engine import run_monte_carlo
from app.services.risk_engine import calculate_cvar, calculate_var, get_risk_summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/risk", tags=["risk"])


def _cache_key(prefix: str, portfolio_id: str, **params: object) -> str:
    """Build a deterministic cache key."""
    raw = f"{prefix}:{portfolio_id}:" + json.dumps(params, sort_keys=True)
    return build_cache_key(raw)


# ── Portfolio loader ──


async def _load_portfolio(
    portfolio_id: str,
    user_id: str,
    db: AsyncSession,
) -> Portfolio:
    """Load a portfolio with assets, raise 404 if not found."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id, Portfolio.user_id == user_id)
        .options(selectinload(Portfolio.assets))
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{portfolio_id}' not found",
        )
    return portfolio


# ── Endpoints ──


@router.post("/var", response_model=VaRResponse)
async def compute_var(
    request: VaRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VaRResponse:
    """Calculate Value at Risk for a portfolio."""
    portfolio = await _load_portfolio(request.portfolio_id, current_user.id, db)

    cache_key = _cache_key(
        "var",
        portfolio.id,
        confidence=request.confidence_level,
        method=request.method,
        period=request.period,
    )

    cached = await get_cached_result(db, cache_key)
    if cached:
        return VaRResponse(**cached, from_cache=True)

    tickers = [a.ticker for a in portfolio.assets]
    weights = [a.weight for a in portfolio.assets]
    returns = await get_portfolio_returns(tickers, weights, request.period)

    result = calculate_var(returns, request.confidence_level, request.method, request.period)
    await store_cached_result(db, cache_key, result.model_dump(exclude={"from_cache"}))

    logger.info(
        "VaR computed: portfolio=%s method=%s confidence=%.2f",
        portfolio.id,
        request.method,
        request.confidence_level,
    )
    return result


@router.post("/cvar", response_model=CVaRResponse)
async def compute_cvar(
    request: VaRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CVaRResponse:
    """Calculate Conditional VaR (Expected Shortfall) for a portfolio."""
    portfolio = await _load_portfolio(request.portfolio_id, current_user.id, db)

    cache_key = _cache_key(
        "cvar",
        portfolio.id,
        confidence=request.confidence_level,
        method=request.method,
        period=request.period,
    )

    cached = await get_cached_result(db, cache_key)
    if cached:
        return CVaRResponse(**cached, from_cache=True)

    tickers = [a.ticker for a in portfolio.assets]
    weights = [a.weight for a in portfolio.assets]
    returns = await get_portfolio_returns(tickers, weights, request.period)

    result = calculate_cvar(returns, request.confidence_level, request.method, request.period)
    await store_cached_result(db, cache_key, result.model_dump(exclude={"from_cache"}))

    logger.info(
        "CVaR computed: portfolio=%s confidence=%.2f",
        portfolio.id,
        request.confidence_level,
    )
    return result


@router.post("/montecarlo", response_model=MonteCarloResponse)
async def compute_montecarlo(
    request: MonteCarloRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MonteCarloResponse:
    """Run Monte Carlo simulation for a portfolio."""
    portfolio = await _load_portfolio(request.portfolio_id, current_user.id, db)

    cache_key = _cache_key(
        "montecarlo",
        portfolio.id,
        n_sim=request.n_simulations,
        n_days=request.n_days,
        period=request.period,
    )

    cached = await get_cached_result(db, cache_key)

    tickers = [a.ticker for a in portfolio.assets]
    weights = [a.weight for a in portfolio.assets]
    returns = await get_portfolio_returns(tickers, weights, request.period)

    if cached:
        # Cache stores summary stats only (no paths/final_values — too large).
        # Re-run simulation to get paths for charting, but reuse cached stats.
        fresh = run_monte_carlo(returns, request.n_simulations, request.n_days)
        cached["sample_paths"] = fresh.sample_paths
        cached["final_values"] = fresh.final_values
        return MonteCarloResponse(**cached, from_cache=True)

    result = run_monte_carlo(returns, request.n_simulations, request.n_days)

    # Cache summary stats only (paths are too large for DB storage)
    cache_data = result.model_dump(exclude={"from_cache", "sample_paths", "final_values"})
    await store_cached_result(db, cache_key, cache_data)

    logger.info(
        "Monte Carlo computed: portfolio=%s sims=%d days=%d",
        portfolio.id,
        request.n_simulations,
        request.n_days,
    )
    return result


@router.post("/summary", response_model=RiskSummaryResponse)
async def compute_risk_summary(
    request: RiskSummaryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RiskSummaryResponse:
    """Get aggregated risk summary for a portfolio."""
    portfolio = await _load_portfolio(request.portfolio_id, current_user.id, db)

    cache_key = _cache_key(
        "risk_summary",
        portfolio.id,
        period=request.period,
    )

    cached = await get_cached_result(db, cache_key)
    if cached:
        return RiskSummaryResponse(**cached, from_cache=True)

    tickers = [a.ticker for a in portfolio.assets]
    weights = [a.weight for a in portfolio.assets]
    returns = await get_portfolio_returns(tickers, weights, request.period)

    result = get_risk_summary(returns, request.period)
    await store_cached_result(db, cache_key, result.model_dump(exclude={"from_cache"}))

    logger.info("Risk summary computed: portfolio=%s", portfolio.id)
    return result


# ── Simulation endpoint (no portfolio required) ──


@router.post("/simulate", response_model=RiskSummaryResponse)
async def simulate_risk(
    request: SimulateRequest,
    current_user: User = Depends(get_current_user),
) -> RiskSummaryResponse:
    """Calculate risk summary for arbitrary tickers/weights (no cache)."""
    if len(request.tickers) != len(request.weights):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="tickers and weights must have the same length",
        )

    returns = await get_portfolio_returns(
        request.tickers, request.weights, request.period
    )
    result = get_risk_summary(returns, request.period)

    logger.info(
        "Risk simulation: tickers=%s",
        ",".join(request.tickers),
    )
    return result


# ── AI Explanation endpoints ──


@router.post("/explain-montecarlo", response_model=ExplanationResponse)
async def get_montecarlo_explanation(
    request: ExplainMonteCarloRequest,
    current_user: User = Depends(get_current_user),
) -> ExplanationResponse:
    """Generate an AI explanation for Monte Carlo simulation results."""
    try:
        text = await explain_montecarlo(
            mode=request.mode,
            mean_final_value=request.mean_final_value,
            var_95=request.var_95,
            probability_of_loss=request.probability_of_loss,
            n_simulations=request.n_simulations,
            n_days=request.n_days,
            locale=request.locale,
        )
        return ExplanationResponse(explanation=text)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.post("/explain-distribution", response_model=ExplanationResponse)
async def get_distribution_explanation(
    request: ExplainDistributionRequest,
    current_user: User = Depends(get_current_user),
) -> ExplanationResponse:
    """Generate an AI explanation for the loss distribution histogram."""
    try:
        text = await explain_distribution(
            mode=request.mode,
            var_95=request.var_95,
            mean_final_value=request.mean_final_value,
            std_final_value=request.std_final_value,
            percentile_5=request.percentile_5,
            percentile_95=request.percentile_95,
            locale=request.locale,
        )
        return ExplanationResponse(explanation=text)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e


@router.post("/explain-metric", response_model=ExplanationResponse)
async def get_metric_explanation(
    request: ExplainMetricRequest,
    current_user: User = Depends(get_current_user),
) -> ExplanationResponse:
    """Generate an AI explanation for a single financial metric."""
    try:
        text = await explain_metric(
            metric_name=request.metric_name,
            metric_value=request.metric_value,
            mode=request.mode,
            context=request.context,
            locale=request.locale,
        )
        return ExplanationResponse(explanation=text)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e

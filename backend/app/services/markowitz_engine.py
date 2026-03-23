"""
Markowitz efficient frontier engine using PyPortfolioOpt.

Computes the efficient frontier curve, minimum variance portfolio,
maximum Sharpe ratio portfolio, and the current portfolio's position.

Depends on: pypfopt, pandas, numpy
Used by: api/v1/markowitz.py (router calls this after cache check)
"""

import logging

import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models

from app.schemas.markowitz import (
    FrontierPoint,
    MarkowitzResponse,
    PortfolioPoint,
    PortfolioWeights,
)

logger = logging.getLogger(__name__)


def compute_efficient_frontier(
    prices: pd.DataFrame,
    current_weights: dict[str, float],
    n_points: int = 100,
) -> MarkowitzResponse:
    """
    Compute the efficient frontier and optimal portfolios.

    Args:
        prices: DataFrame of historical adjusted close prices (tickers as columns)
        current_weights: Dict of ticker -> weight for the current portfolio
        n_points: Number of points to sample along the frontier

    Returns:
        MarkowitzResponse with frontier curve, min variance, max Sharpe,
        and current portfolio position
    """
    # Expected returns and covariance matrix
    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.sample_cov(prices)

    # ── Min variance portfolio ──
    ef_min = EfficientFrontier(mu, S)
    ef_min.min_volatility()
    min_var_weights = ef_min.clean_weights()
    min_var_perf = ef_min.portfolio_performance(verbose=False)
    # portfolio_performance returns (expected_return, volatility, sharpe)

    min_variance = PortfolioWeights(
        weights={k: round(v, 6) for k, v in min_var_weights.items() if v > 1e-6},
        expected_return=round(float(min_var_perf[0]), 6),
        volatility=round(float(min_var_perf[1]), 6),
        sharpe_ratio=round(float(min_var_perf[2]), 4),
    )

    # ── Max Sharpe portfolio ──
    ef_sharpe = EfficientFrontier(mu, S)
    ef_sharpe.max_sharpe()
    max_sharpe_weights = ef_sharpe.clean_weights()
    max_sharpe_perf = ef_sharpe.portfolio_performance(verbose=False)

    max_sharpe = PortfolioWeights(
        weights={k: round(v, 6) for k, v in max_sharpe_weights.items() if v > 1e-6},
        expected_return=round(float(max_sharpe_perf[0]), 6),
        volatility=round(float(max_sharpe_perf[1]), 6),
        sharpe_ratio=round(float(max_sharpe_perf[2]), 4),
    )

    # ── Efficient frontier curve ──
    # Sample target returns between min variance return and a bit above max sharpe return
    min_ret = min_var_perf[0]
    max_ret = max(max_sharpe_perf[0], min_ret + 0.01)
    target_returns = np.linspace(float(min_ret), float(max_ret) * 1.1, n_points)

    frontier_points: list[FrontierPoint] = []
    for target in target_returns:
        try:
            ef = EfficientFrontier(mu, S)
            ef.efficient_return(float(target))
            perf = ef.portfolio_performance(verbose=False)
            frontier_points.append(
                FrontierPoint(
                    volatility=round(float(perf[1]), 6),
                    expected_return=round(float(perf[0]), 6),
                )
            )
        except Exception:
            # Some target returns may be infeasible — skip them
            continue

    # ── Current portfolio position ──
    # Ensure weights are aligned with price columns
    w = np.array([current_weights.get(ticker, 0.0) for ticker in prices.columns])
    mu_arr = mu.values
    current_ret = float(w @ mu_arr)
    current_vol = float(np.sqrt(w @ S.values @ w))
    current_sharpe = current_ret / current_vol if current_vol > 0 else 0.0

    current_portfolio = PortfolioPoint(
        volatility=round(current_vol, 6),
        expected_return=round(current_ret, 6),
        sharpe_ratio=round(current_sharpe, 4),
    )

    logger.info(
        "Efficient frontier computed: %d points, min_var_vol=%.4f, max_sharpe_sr=%.4f",
        len(frontier_points),
        min_variance.volatility,
        max_sharpe.sharpe_ratio,
    )

    return MarkowitzResponse(
        frontier_points=frontier_points,
        min_variance=min_variance,
        max_sharpe=max_sharpe,
        current_portfolio=current_portfolio,
    )

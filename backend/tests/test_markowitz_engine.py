"""
Tests for markowitz_engine.py — efficient frontier computation.

Covers: frontier shape, weights sum to 1, min variance has lower vol
than max sharpe, current portfolio point.
"""

import numpy as np
import pandas as pd
import pytest

from app.services.markowitz_engine import compute_efficient_frontier


@pytest.fixture
def sample_prices() -> pd.DataFrame:
    """Generate synthetic correlated price data for 3 assets over 500 days."""
    rng = np.random.default_rng(42)
    n_days = 500

    # Simulate correlated daily returns
    mean_returns = [0.0005, 0.0003, 0.0008]
    cov_matrix = [
        [0.0004, 0.0001, 0.0002],
        [0.0001, 0.0003, 0.00005],
        [0.0002, 0.00005, 0.0006],
    ]
    daily_returns = rng.multivariate_normal(mean_returns, cov_matrix, n_days)

    # Build prices from cumulative returns
    prices = np.exp(np.cumsum(daily_returns, axis=0)) * 100
    dates = pd.date_range("2022-01-01", periods=n_days, freq="B")

    return pd.DataFrame(prices, index=dates, columns=["AAPL", "MSFT", "GOOGL"])


@pytest.fixture
def current_weights() -> dict[str, float]:
    return {"AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.3}


class TestComputeEfficientFrontier:
    def test_frontier_has_points(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights, n_points=50)
        assert len(result.frontier_points) > 0, "Frontier should have points"
        assert len(result.frontier_points) <= 50

    def test_frontier_points_ordered(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights, n_points=50)
        returns = [p.expected_return for p in result.frontier_points]
        # Returns should be roughly increasing (frontier is sampled by target return)
        assert returns[-1] >= returns[0], "Last point should have higher return than first"

    def test_min_variance_weights_sum_to_one(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        total = sum(result.min_variance.weights.values())
        assert abs(total - 1.0) < 0.01, f"Min variance weights should sum to ~1.0, got {total}"

    def test_max_sharpe_weights_sum_to_one(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        total = sum(result.max_sharpe.weights.values())
        assert abs(total - 1.0) < 0.01, f"Max Sharpe weights should sum to ~1.0, got {total}"

    def test_min_variance_lower_vol(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        assert result.min_variance.volatility <= result.max_sharpe.volatility, (
            "Min variance portfolio should have lower or equal volatility than max Sharpe"
        )

    def test_max_sharpe_positive(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        # With positive mean returns, Sharpe should be positive
        assert result.max_sharpe.sharpe_ratio > 0

    def test_current_portfolio_point(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        assert result.current_portfolio.volatility > 0
        assert result.current_portfolio.sharpe_ratio != 0

    def test_weights_only_include_nonzero(
        self, sample_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        result = compute_efficient_frontier(sample_prices, current_weights)
        for w in result.min_variance.weights.values():
            assert w > 0, "Cleaned weights should only include positive values"

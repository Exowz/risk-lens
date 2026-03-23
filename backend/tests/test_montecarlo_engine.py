"""
Tests for montecarlo_engine.py — GBM Monte Carlo simulation.

Covers: output shape, mean trajectory, probability of loss,
sample paths, and edge cases.
"""

import numpy as np
import pytest

from app.services.montecarlo_engine import run_monte_carlo


# ── Fixtures ──


@pytest.fixture
def sample_returns() -> np.ndarray:
    """Simulated daily returns ~ N(0.0003, 0.015) over 500 days."""
    rng = np.random.default_rng(42)
    return rng.normal(0.0003, 0.015, 500)


# ── Tests ──


class TestRunMonteCarlo:
    def test_output_shape(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=1000, n_days=252)
        assert result.n_simulations == 1000
        assert result.n_days == 252
        assert len(result.sample_paths) == 100, "Should return 100 sample paths"
        assert len(result.sample_paths[0]) == 253, "Each path has n_days + 1 points (incl. initial)"
        assert len(result.final_values) == 1000

    def test_initial_value(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=500, n_days=100)
        for path in result.sample_paths:
            assert path[0] == pytest.approx(1.0, abs=1e-6), "All paths start at 1.0"

    def test_final_values_positive(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=1000, n_days=252)
        assert all(v > 0 for v in result.final_values), "GBM paths are always positive"

    def test_mean_near_expected(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=10_000, n_days=252)
        # With slightly positive drift, mean should be near or above 1.0
        assert result.mean_final_value > 0.5, "Mean should be reasonable"
        assert result.mean_final_value < 3.0, "Mean should be reasonable"

    def test_percentiles_ordered(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=5000, n_days=252)
        assert result.percentile_5 < result.median_final_value
        assert result.median_final_value < result.percentile_95

    def test_probability_of_loss_range(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=5000, n_days=252)
        assert 0.0 <= result.probability_of_loss <= 1.0

    def test_var_95_negative(self, sample_returns: np.ndarray) -> None:
        result = run_monte_carlo(sample_returns, n_simulations=5000, n_days=252)
        # var_95 is the 5th percentile of returns — can be positive or negative
        # but it should be less than the mean return
        assert result.var_95 < result.mean_final_value - 1.0

    def test_small_simulation(self, sample_returns: np.ndarray) -> None:
        """Ensure it works with minimum parameters."""
        result = run_monte_carlo(sample_returns, n_simulations=100, n_days=21)
        assert result.n_simulations == 100
        assert result.n_days == 21
        assert len(result.final_values) == 100

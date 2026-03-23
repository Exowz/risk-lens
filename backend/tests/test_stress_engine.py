"""
Tests for stress_engine.py — historical crisis scenario stress tests.

Covers: drawdown is negative, total_return is typed, recovery_days is int or None,
scenario metrics correctness, optimised comparison.
"""

import numpy as np
import pandas as pd
import pytest

from app.services.stress_engine import (
    SCENARIOS,
    _compute_scenario_metrics,
    run_stress_test,
)


@pytest.fixture
def long_history_prices() -> pd.DataFrame:
    """Generate synthetic price data spanning 2007–2023 for 3 assets."""
    rng = np.random.default_rng(42)

    # Business days from 2007 to 2023
    dates = pd.date_range("2007-01-02", "2023-12-31", freq="B")
    n_days = len(dates)

    # Simulate correlated daily returns
    mean_returns = [0.0003, 0.0002, 0.0004]
    cov_matrix = [
        [0.0004, 0.0001, 0.0002],
        [0.0001, 0.0003, 0.00005],
        [0.0002, 0.00005, 0.0006],
    ]
    daily_returns = rng.multivariate_normal(mean_returns, cov_matrix, n_days)

    # Build prices from cumulative returns
    prices = np.exp(np.cumsum(daily_returns, axis=0)) * 100

    return pd.DataFrame(prices, index=dates, columns=["AAPL", "MSFT", "GOOGL"])


@pytest.fixture
def current_weights() -> dict[str, float]:
    return {"AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.3}


class TestScenarioMetrics:
    def test_drawdown_is_negative_or_zero(
        self, long_history_prices: pd.DataFrame
    ) -> None:
        """Max drawdown should always be <= 0."""
        weights = np.array([0.4, 0.3, 0.3])
        for scenario in SCENARIOS:
            _, max_dd, _ = _compute_scenario_metrics(
                long_history_prices, weights, scenario.start_date, scenario.end_date,
            )
            assert max_dd <= 0.0, (
                f"{scenario.name}: drawdown should be <= 0, got {max_dd}"
            )

    def test_total_return_is_float(
        self, long_history_prices: pd.DataFrame
    ) -> None:
        """total_return should be a float."""
        weights = np.array([0.4, 0.3, 0.3])
        for scenario in SCENARIOS:
            total_return, _, _ = _compute_scenario_metrics(
                long_history_prices, weights, scenario.start_date, scenario.end_date,
            )
            assert isinstance(total_return, float)

    def test_recovery_days_is_int_or_none(
        self, long_history_prices: pd.DataFrame
    ) -> None:
        """recovery_days should be int or None."""
        weights = np.array([0.4, 0.3, 0.3])
        for scenario in SCENARIOS:
            _, _, recovery = _compute_scenario_metrics(
                long_history_prices, weights, scenario.start_date, scenario.end_date,
            )
            assert recovery is None or isinstance(recovery, int)

    def test_empty_date_range_returns_zeros(
        self, long_history_prices: pd.DataFrame
    ) -> None:
        """A date range with no data should return 0/0/None."""
        weights = np.array([0.4, 0.3, 0.3])
        total_return, max_dd, recovery = _compute_scenario_metrics(
            long_history_prices, weights, "1900-01-01", "1900-12-31",
        )
        assert total_return == 0.0
        assert max_dd == 0.0
        assert recovery is None

    def test_positive_return_implies_recovery(self) -> None:
        """If total_return > 0, the portfolio recovered — recovery_days must not be None."""
        # Construct prices that dip then recover: 100 -> 90 -> 80 -> 95 -> 105
        dates = pd.bdate_range("2020-02-01", periods=5)
        prices = pd.DataFrame(
            {"A": [100.0, 90.0, 80.0, 95.0, 105.0], "B": [100.0, 92.0, 85.0, 96.0, 106.0]},
            index=dates,
        )
        weights = np.array([0.5, 0.5])

        total_return, max_dd, recovery = _compute_scenario_metrics(
            prices, weights, "2020-02-01", "2020-02-07",
        )

        assert total_return > 0, "Total return should be positive"
        assert max_dd < 0, "There should be a drawdown"
        assert recovery is not None, "Portfolio recovered, recovery_days should not be None"
        assert recovery > 0, "Recovery should take at least 1 day"

    def test_recovery_days_positive_when_recovered(self) -> None:
        """recovery_days should be > 0 (not 0) when the portfolio recovers after a dip."""
        dates = pd.bdate_range("2020-02-01", periods=4)
        prices = pd.DataFrame(
            {"A": [100.0, 80.0, 90.0, 101.0]},
            index=dates,
        )
        weights = np.array([1.0])

        _, _, recovery = _compute_scenario_metrics(
            prices, weights, "2020-02-01", "2020-02-06",
        )

        assert recovery is not None
        assert recovery >= 1


class TestRunStressTest:
    def test_returns_all_scenarios(
        self, long_history_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        """Should return results for all 3 crisis scenarios."""
        result = run_stress_test(long_history_prices, current_weights)
        assert len(result.scenarios) == 3
        assert len(result.comparisons) == 3

    def test_scenario_names_match(
        self, long_history_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        """Scenario names should match the hard-coded definitions."""
        result = run_stress_test(long_history_prices, current_weights)
        expected_names = {s.name for s in SCENARIOS}
        actual_names = {s.scenario_name for s in result.scenarios}
        assert actual_names == expected_names

    def test_comparison_drawdowns_are_negative(
        self, long_history_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        """Both current and optimised drawdowns should be <= 0."""
        result = run_stress_test(long_history_prices, current_weights)
        for comp in result.comparisons:
            assert comp.current_drawdown <= 0.0
            assert comp.optimized_drawdown <= 0.0

    def test_response_model_serializable(
        self, long_history_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        """Result should be serializable to dict (Pydantic model)."""
        result = run_stress_test(long_history_prices, current_weights)
        data = result.model_dump()
        assert "scenarios" in data
        assert "comparisons" in data
        assert "from_cache" in data

    def test_from_cache_defaults_false(
        self, long_history_prices: pd.DataFrame, current_weights: dict[str, float]
    ) -> None:
        """from_cache should default to False."""
        result = run_stress_test(long_history_prices, current_weights)
        assert result.from_cache is False

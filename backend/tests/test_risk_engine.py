"""
Tests for risk_engine.py — VaR, CVaR, and risk summary.

Covers: historical VaR, parametric VaR, CVaR, edge cases,
and the aggregated risk summary.
"""

import numpy as np
import pytest

from app.services.risk_engine import calculate_cvar, calculate_var, get_risk_summary


# ── Fixtures ──


@pytest.fixture
def normal_returns() -> np.ndarray:
    """Simulated daily returns ~ N(-0.001, 0.02) over 500 days."""
    rng = np.random.default_rng(42)
    return rng.normal(-0.001, 0.02, 500)


@pytest.fixture
def constant_returns() -> np.ndarray:
    """Edge case: all returns are the same value."""
    return np.full(100, 0.001)


# ── VaR Tests ──


class TestCalculateVaR:
    def test_historical_95(self, normal_returns: np.ndarray) -> None:
        result = calculate_var(normal_returns, confidence_level=0.95, method="historical")
        assert result.var < 0, "95% VaR should be negative (a loss)"
        assert result.confidence_level == 0.95
        assert result.method == "historical"
        assert result.n_observations == 500

    def test_historical_99(self, normal_returns: np.ndarray) -> None:
        result_99 = calculate_var(normal_returns, confidence_level=0.99, method="historical")
        result_95 = calculate_var(normal_returns, confidence_level=0.95, method="historical")
        assert result_99.var < result_95.var, "99% VaR should be more negative than 95%"

    def test_parametric_95(self, normal_returns: np.ndarray) -> None:
        result = calculate_var(normal_returns, confidence_level=0.95, method="parametric")
        assert result.var < 0
        assert result.method == "parametric"

    def test_parametric_vs_historical_same_ballpark(
        self, normal_returns: np.ndarray
    ) -> None:
        hist = calculate_var(normal_returns, 0.95, "historical")
        para = calculate_var(normal_returns, 0.95, "parametric")
        # For normally distributed returns, both methods should give similar results
        assert abs(hist.var - para.var) < 0.02, "Methods should be roughly similar for normal data"

    def test_constant_returns(self, constant_returns: np.ndarray) -> None:
        result = calculate_var(constant_returns, 0.95, "historical")
        assert result.var == pytest.approx(0.001, abs=1e-6), "VaR of constant returns = that constant"


# ── CVaR Tests ──


class TestCalculateCVaR:
    def test_cvar_worse_than_var(self, normal_returns: np.ndarray) -> None:
        result = calculate_cvar(normal_returns, confidence_level=0.95, method="historical")
        assert result.cvar <= result.var, "CVaR should always be <= VaR (more negative)"

    def test_cvar_99(self, normal_returns: np.ndarray) -> None:
        result = calculate_cvar(normal_returns, confidence_level=0.99, method="historical")
        assert result.cvar < 0
        assert result.confidence_level == 0.99

    def test_cvar_parametric(self, normal_returns: np.ndarray) -> None:
        result = calculate_cvar(normal_returns, confidence_level=0.95, method="parametric")
        assert result.cvar <= result.var


# ── Risk Summary Tests ──


class TestGetRiskSummary:
    def test_summary_fields(self, normal_returns: np.ndarray) -> None:
        result = get_risk_summary(normal_returns)
        assert result.var_95_historical < 0
        assert result.var_99_historical < result.var_95_historical
        assert result.cvar_95 <= result.var_95_historical
        assert result.cvar_99 <= result.var_99_historical
        assert result.annualized_volatility > 0
        assert result.n_observations == 500

    def test_sharpe_ratio_sign(self, normal_returns: np.ndarray) -> None:
        result = get_risk_summary(normal_returns)
        # With negative mean returns, Sharpe should be negative
        assert result.sharpe_ratio < 0

    def test_positive_returns_sharpe(self) -> None:
        rng = np.random.default_rng(42)
        positive_returns = rng.normal(0.001, 0.01, 500)
        result = get_risk_summary(positive_returns)
        assert result.sharpe_ratio > 0, "Positive mean returns -> positive Sharpe"

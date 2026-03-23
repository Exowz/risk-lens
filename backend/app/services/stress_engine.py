"""
Stress testing engine — historical crisis scenarios.

Computes portfolio performance during three hard-coded crisis periods:
  - crisis_2008: 2008-09-01 to 2009-03-31 (Global Financial Crisis)
  - covid_2020:  2020-02-01 to 2020-04-30 (COVID-19 crash)
  - rates_2022:  2022-01-01 to 2022-10-31 (Rate hiking cycle)

For each scenario, computes:
  - total_return:   cumulative return over the period
  - max_drawdown:   maximum peak-to-trough decline
  - recovery_days:  trading days from trough back to pre-trough peak (or None)

Also computes the same metrics for a Markowitz max-Sharpe optimised portfolio
for drawdown comparison.

Depends on: numpy, pandas, pypfopt
Used by: api/v1/stress.py (router calls this after cache check)
"""

import logging
from dataclasses import dataclass

import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models

from app.schemas.stress import ScenarioComparison, ScenarioResult, StressTestResponse

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CrisisScenario:
    """Definition of a historical crisis period."""

    name: str
    start_date: str
    end_date: str


SCENARIOS: list[CrisisScenario] = [
    CrisisScenario("Financial Crisis 2008", "2008-09-01", "2009-03-31"),
    CrisisScenario("COVID-19 2020", "2020-02-01", "2020-04-30"),
    CrisisScenario("Rate Hikes 2022", "2022-01-01", "2022-10-31"),
]


def _compute_scenario_metrics(
    prices: pd.DataFrame,
    weights: np.ndarray,
    start_date: str,
    end_date: str,
) -> tuple[float, float, int | None]:
    """
    Compute total_return, max_drawdown, and recovery_days for a weighted
    portfolio over a specific date range.

    Args:
        prices: Full historical price DataFrame (all dates)
        weights: Array of portfolio weights aligned with prices.columns
        start_date: Scenario start date string
        end_date: Scenario end date string

    Returns:
        Tuple of (total_return, max_drawdown, recovery_days)
    """
    # Slice to scenario window (inclusive)
    mask = (prices.index >= start_date) & (prices.index <= end_date)
    scenario_prices = prices.loc[mask]

    if scenario_prices.empty or len(scenario_prices) < 2:
        return 0.0, 0.0, None

    # Compute weighted portfolio value series (base = 1.0)
    daily_returns = scenario_prices.pct_change().dropna()
    portfolio_returns = daily_returns.to_numpy() @ weights

    # Prepend initial value of 1.0 so the series starts at the investment date
    portfolio_value = np.concatenate(
        [[1.0], np.cumprod(1.0 + portfolio_returns)]
    )

    # Total return
    total_return = float(portfolio_value[-1] - 1.0)

    # Max drawdown: peak-to-trough
    cumulative_max = np.maximum.accumulate(portfolio_value)
    drawdowns = (portfolio_value - cumulative_max) / cumulative_max
    max_drawdown = float(np.min(drawdowns))

    # Recovery days: trading days from trough to recover to pre-trough peak
    trough_idx = int(np.argmin(drawdowns))
    recovery_days: int | None = None

    # Check values strictly *after* the trough for recovery
    if trough_idx < len(portfolio_value) - 1:
        post_trough = portfolio_value[trough_idx + 1 :]
        peak_at_trough = cumulative_max[trough_idx]
        recovered = np.where(post_trough >= peak_at_trough)[0]
        if len(recovered) > 0:
            # +1 because recovery_days counts from the day after the trough
            recovery_days = int(recovered[0]) + 1

    return total_return, max_drawdown, recovery_days


def _compute_max_sharpe_weights(
    prices: pd.DataFrame,
    before_date: str,
) -> np.ndarray:
    """
    Compute max-Sharpe optimal weights using PyPortfolioOpt.

    Uses only price data *before* the given date to avoid look-ahead bias.

    Args:
        prices: Full historical price DataFrame
        before_date: Only use data strictly before this date for estimation

    Returns:
        numpy array of optimal weights aligned with prices.columns
    """
    pre_crisis = prices.loc[prices.index < before_date]

    if len(pre_crisis) < 30:
        raise ValueError("Not enough pre-crisis data for optimisation")

    logger.info(
        "Max-Sharpe optimisation: using %d days of data before %s",
        len(pre_crisis),
        before_date,
    )

    mu = expected_returns.mean_historical_return(pre_crisis)
    S = risk_models.sample_cov(pre_crisis)

    ef = EfficientFrontier(mu, S)
    ef.max_sharpe()
    clean = ef.clean_weights()

    nonzero = {k: round(v, 4) for k, v in clean.items() if v > 1e-4}
    logger.info("Max-Sharpe weights (before %s): %s", before_date, nonzero)

    return np.array([clean.get(ticker, 0.0) for ticker in prices.columns])


def run_stress_test(
    prices: pd.DataFrame,
    current_weights: dict[str, float],
) -> StressTestResponse:
    """
    Run stress tests across all crisis scenarios.

    Computes performance metrics for the current portfolio and the
    max-Sharpe optimised portfolio for each scenario.

    Args:
        prices: Historical adjusted close prices (tickers as columns, dates as index)
        current_weights: Dict of ticker -> weight for the current portfolio

    Returns:
        StressTestResponse with scenario results and comparisons
    """
    # Build weights array aligned with price columns
    tickers = list(prices.columns)
    w_current = np.array([current_weights.get(t, 0.0) for t in tickers])

    scenarios: list[ScenarioResult] = []
    comparisons: list[ScenarioComparison] = []

    for scenario in SCENARIOS:
        # Current portfolio metrics
        total_return, max_dd, recovery = _compute_scenario_metrics(
            prices, w_current, scenario.start_date, scenario.end_date,
        )

        scenarios.append(
            ScenarioResult(
                scenario_name=scenario.name,
                start_date=scenario.start_date,
                end_date=scenario.end_date,
                total_return=round(total_return, 6),
                max_drawdown=round(max_dd, 6),
                recovery_days=recovery,
            )
        )

        # Compute max-Sharpe weights using only pre-crisis data (no look-ahead bias)
        try:
            w_optimized = _compute_max_sharpe_weights(prices, scenario.start_date)
        except Exception:
            logger.warning(
                "Could not compute pre-crisis max-Sharpe weights for %s; using current",
                scenario.name,
            )
            w_optimized = w_current

        # Optimised portfolio drawdown for comparison
        _, opt_dd, _ = _compute_scenario_metrics(
            prices, w_optimized, scenario.start_date, scenario.end_date,
        )

        comparisons.append(
            ScenarioComparison(
                scenario_name=scenario.name,
                current_drawdown=round(max_dd, 6),
                optimized_drawdown=round(opt_dd, 6),
            )
        )

    logger.info(
        "Stress test completed: %d scenarios evaluated",
        len(scenarios),
    )

    return StressTestResponse(
        scenarios=scenarios,
        comparisons=comparisons,
    )

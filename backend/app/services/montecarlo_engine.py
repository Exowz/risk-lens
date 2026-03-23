"""
Monte Carlo simulation engine using Geometric Brownian Motion (GBM).

Simulates n_simulations portfolio paths over n_days trading days.
Returns summary statistics and a sample of paths for charting.

GBM formula:
    S(t+dt) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    where Z ~ N(0, 1)

Depends on: numpy
Used by: api/v1/risk.py (router calls this after cache check)
"""

import numpy as np

from app.schemas.risk import MonteCarloResponse


def run_monte_carlo(
    returns: np.ndarray,
    n_simulations: int = 10_000,
    n_days: int = 252,
    initial_value: float = 1.0,
) -> MonteCarloResponse:
    """
    Run Monte Carlo simulation of portfolio value using GBM.

    Args:
        returns: Historical daily portfolio returns for parameter estimation
        n_simulations: Number of simulation paths (100–50,000)
        n_days: Trading days to simulate forward (21–504)
        initial_value: Starting portfolio value (normalized to 1.0)

    Returns:
        MonteCarloResponse with summary statistics, sample paths,
        and all final values for distribution charting
    """
    # Estimate GBM parameters from historical returns
    mu = float(np.mean(returns))
    sigma = float(np.std(returns, ddof=1))
    dt = 1.0 / 252.0

    # Drift and diffusion per step
    drift = (mu - 0.5 * sigma**2) * dt
    diffusion = sigma * np.sqrt(dt)

    # Generate random shocks: shape (n_simulations, n_days)
    rng = np.random.default_rng()
    z = rng.standard_normal((n_simulations, n_days))

    # Log returns for each step
    log_returns = drift + diffusion * z

    # Cumulative log returns → price paths
    # paths shape: (n_simulations, n_days + 1) including initial value
    cumulative = np.cumsum(log_returns, axis=1)
    paths = initial_value * np.exp(
        np.column_stack([np.zeros(n_simulations), cumulative])
    )

    # Final values
    final_values = paths[:, -1]

    # Summary statistics
    mean_final = float(np.mean(final_values))
    median_final = float(np.median(final_values))
    std_final = float(np.std(final_values, ddof=1))
    p5 = float(np.percentile(final_values, 5))
    p95 = float(np.percentile(final_values, 95))

    # VaR from simulation: 5th percentile of returns (loss relative to initial)
    sim_returns = (final_values - initial_value) / initial_value
    var_95 = float(np.percentile(sim_returns, 5))

    # Probability of loss
    prob_loss = float(np.mean(final_values < initial_value))

    # Sample 100 paths evenly spaced for charting
    sample_indices = np.linspace(0, n_simulations - 1, 100, dtype=int)
    sample_paths = paths[sample_indices].tolist()

    # Round final values for JSON serialization
    final_values_list = [round(float(v), 6) for v in final_values]

    return MonteCarloResponse(
        mean_final_value=round(mean_final, 6),
        median_final_value=round(median_final, 6),
        std_final_value=round(std_final, 6),
        percentile_5=round(p5, 6),
        percentile_95=round(p95, 6),
        var_95=round(var_95, 6),
        probability_of_loss=round(prob_loss, 4),
        n_simulations=n_simulations,
        n_days=n_days,
        sample_paths=sample_paths,
        final_values=final_values_list,
    )

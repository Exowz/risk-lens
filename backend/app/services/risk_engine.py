"""
Risk calculation engine — VaR, CVaR, and risk summary.

All functions are pure computation (no DB access). They accept numpy arrays
of portfolio returns and scalar parameters, and return typed results.

Formulas:
    VaR historical:  np.percentile(returns, (1 - confidence) * 100)
    VaR parametric:  mu - z_score * sigma  (normal assumption)
    CVaR:            mean of returns <= VaR threshold

Depends on: numpy, scipy
Used by: api/v1/risk.py (routers call these after cache check)
"""

import numpy as np
from scipy import stats

from app.schemas.risk import CVaRResponse, RiskSummaryResponse, VaRResponse


def calculate_var(
    returns: np.ndarray,
    confidence_level: float = 0.95,
    method: str = "historical",
    period: str = "2y",
) -> VaRResponse:
    """
    Calculate Value at Risk for a portfolio.

    Args:
        returns: Daily portfolio returns array (n_days,)
        confidence_level: 0.90–0.99
        method: "historical" (percentile) or "parametric" (normal)
        period: Data period label for response metadata

    Returns:
        VaRResponse with var value (negative = loss)
    """
    if method == "historical":
        var_value = float(np.percentile(returns, (1 - confidence_level) * 100))
    else:
        mu = float(np.mean(returns))
        sigma = float(np.std(returns, ddof=1))
        z_score = stats.norm.ppf(1 - confidence_level)
        var_value = mu + z_score * sigma  # z_score is negative, so this gives a loss

    return VaRResponse(
        var=round(var_value, 8),
        confidence_level=confidence_level,
        method=method,  # type: ignore[arg-type]
        period=period,
        n_observations=len(returns),
    )


def calculate_cvar(
    returns: np.ndarray,
    confidence_level: float = 0.95,
    method: str = "historical",
    period: str = "2y",
) -> CVaRResponse:
    """
    Calculate Conditional VaR (Expected Shortfall).

    CVaR is the expected loss given that the loss exceeds VaR.
    Always worse (more negative) than VaR.

    Args:
        returns: Daily portfolio returns array
        confidence_level: 0.90–0.99
        method: "historical" or "parametric"
        period: Data period label

    Returns:
        CVaRResponse with cvar and var values
    """
    var_result = calculate_var(returns, confidence_level, method, period)
    var_threshold = var_result.var

    # CVaR = mean of returns that fall below (or equal to) the VaR threshold
    tail_returns = returns[returns <= var_threshold]

    if len(tail_returns) == 0:
        # Edge case: no returns below VaR (very small sample)
        cvar_value = var_threshold
    else:
        cvar_value = float(np.mean(tail_returns))

    return CVaRResponse(
        cvar=round(cvar_value, 8),
        var=var_result.var,
        confidence_level=confidence_level,
        method=method,  # type: ignore[arg-type]
        period=period,
        n_observations=len(returns),
    )


def get_risk_summary(
    returns: np.ndarray,
    period: str = "2y",
) -> RiskSummaryResponse:
    """
    Compute an aggregated risk summary for a portfolio.

    Includes VaR/CVaR at 95% and 99% (both methods), plus
    annualized return, volatility, and Sharpe ratio.

    Args:
        returns: Daily portfolio returns array
        period: Data period label

    Returns:
        RiskSummaryResponse with all risk metrics
    """
    n_obs = len(returns)
    trading_days = 252

    # Annualized metrics
    ann_return = float(np.mean(returns) * trading_days)
    ann_vol = float(np.std(returns, ddof=1) * np.sqrt(trading_days))
    sharpe = ann_return / ann_vol if ann_vol > 0 else 0.0

    # VaR at both confidence levels and methods
    var_95_h = calculate_var(returns, 0.95, "historical", period)
    var_99_h = calculate_var(returns, 0.99, "historical", period)
    var_95_p = calculate_var(returns, 0.95, "parametric", period)
    var_99_p = calculate_var(returns, 0.99, "parametric", period)

    # CVaR
    cvar_95 = calculate_cvar(returns, 0.95, "historical", period)
    cvar_99 = calculate_cvar(returns, 0.99, "historical", period)

    return RiskSummaryResponse(
        var_95_historical=var_95_h.var,
        var_99_historical=var_99_h.var,
        var_95_parametric=var_95_p.var,
        var_99_parametric=var_99_p.var,
        cvar_95=cvar_95.cvar,
        cvar_99=cvar_99.cvar,
        annualized_return=round(ann_return, 6),
        annualized_volatility=round(ann_vol, 6),
        sharpe_ratio=round(sharpe, 4),
        n_observations=n_obs,
        period=period,
    )

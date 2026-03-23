"""
Pydantic v2 schemas for risk calculation endpoints.

Covers VaR (historical + parametric), CVaR, Monte Carlo simulation,
and aggregated risk summary.

Depends on: pydantic
Used by: api/v1/risk.py
"""

from typing import Literal

from pydantic import BaseModel, Field


# ── Requests ──


class VaRRequest(BaseModel):
    """Request body for VaR / CVaR calculation."""

    portfolio_id: str = Field(description="Portfolio UUID")
    confidence_level: float = Field(
        default=0.95,
        ge=0.90,
        le=0.99,
        description="Confidence level (0.90–0.99)",
    )
    method: Literal["historical", "parametric"] = Field(
        default="historical",
        description="VaR calculation method",
    )
    period: str = Field(
        default="2y",
        description="Historical data period (yfinance format)",
    )


class MonteCarloRequest(BaseModel):
    """Request body for Monte Carlo simulation."""

    portfolio_id: str = Field(description="Portfolio UUID")
    n_simulations: int = Field(
        default=10_000,
        ge=100,
        le=50_000,
        description="Number of simulation paths",
    )
    n_days: int = Field(
        default=252,
        ge=21,
        le=504,
        description="Trading days to simulate",
    )
    period: str = Field(
        default="2y",
        description="Historical data period for parameter estimation",
    )


class RiskSummaryRequest(BaseModel):
    """Request body for aggregated risk summary."""

    portfolio_id: str = Field(description="Portfolio UUID")
    period: str = Field(default="2y", description="Historical data period")


# ── Responses ──


class VaRResponse(BaseModel):
    """VaR calculation result."""

    var: float = Field(description="Value at Risk (negative = loss)")
    confidence_level: float
    method: Literal["historical", "parametric"]
    period: str
    n_observations: int = Field(description="Number of return observations used")
    from_cache: bool = False


class CVaRResponse(BaseModel):
    """CVaR (Expected Shortfall) calculation result."""

    cvar: float = Field(description="Conditional VaR (mean of losses beyond VaR)")
    var: float = Field(description="Corresponding VaR threshold")
    confidence_level: float
    method: Literal["historical", "parametric"]
    period: str
    n_observations: int
    from_cache: bool = False


class MonteCarloResponse(BaseModel):
    """Monte Carlo simulation result with summary statistics."""

    mean_final_value: float = Field(description="Mean portfolio value at horizon")
    median_final_value: float
    std_final_value: float
    percentile_5: float = Field(description="5th percentile (worst-case)")
    percentile_95: float = Field(description="95th percentile (best-case)")
    var_95: float = Field(description="95% VaR from simulation")
    probability_of_loss: float = Field(description="P(final_value < initial)")
    n_simulations: int
    n_days: int
    sample_paths: list[list[float]] = Field(
        description="Sample of 100 simulation paths for charting"
    )
    final_values: list[float] = Field(
        description="All final portfolio values for distribution chart"
    )
    from_cache: bool = False


class RiskSummaryResponse(BaseModel):
    """Aggregated risk summary for a portfolio."""

    var_95_historical: float
    var_99_historical: float
    var_95_parametric: float
    var_99_parametric: float
    cvar_95: float
    cvar_99: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float = Field(description="Sharpe ratio (risk-free rate = 0)")
    n_observations: int
    period: str
    from_cache: bool = False
